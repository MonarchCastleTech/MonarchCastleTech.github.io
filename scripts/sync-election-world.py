"""Free national-result ingestion and reproducible chronological backtesting."""
import concurrent.futures, datetime, hashlib, json, os, sys, time, urllib.request, csv, io
from pathlib import Path
from collections import defaultdict, Counter
from election_world_model import source_family, identity, backtest, forecast, metrics, VERSION
from election_external_history import supplements

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'static/sdcofa/election/feeds'
CACHE=ROOT/'.cache/election-world';CACHE.mkdir(parents=True,exist_ok=True)
TODAY=datetime.date.today().isoformat();NOW=datetime.datetime.now(datetime.timezone.utc).isoformat()
BASE='https://elekt.io/elekt/api/v1'

def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'MonarchCastle-SDCofA/2.0 (+https://monarchcastle.com/sdcofa/election/)','Accept':'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=35) as r:return json.load(r)
        except Exception:
            if attempt==2:raise
            time.sleep(attempt+1)

def normalize(e):
    if e.get('scope')!='national' or e.get('indirect') or e.get('electing_body') or e.get('kind') not in ['presidential','parliamentary','general']:return None
    if e.get('iso3')=='SDN' and 'South Sudan' in e.get('name',''):return None
    if not e.get('held_on') or e['held_on']>TODAY:return None
    if any(s in (e.get('office') or '').lower() for s in ['senate','upper chamber','council of the nation']):return None
    kind='presidential' if e['kind']=='presidential' else 'parliamentary'
    contestants=e.get('contestants',[])
    usable_votes=[c for c in contestants if isinstance(c.get('vote_share'),(int,float))]
    use_seats=kind=='parliamentary' and len(usable_votes)<2
    seat_total=sum(c.get('seats') or 0 for c in contestants if isinstance(c.get('seats'),(int,float)))
    if use_seats:
        if seat_total<=0:return None
        kind='parliamentary-seats'
    shares=defaultdict(float);labels={};sources=set();total=0
    for c in contestants:
        value=100*c['seats']/seat_total if use_seats and isinstance(c.get('seats'),(int,float)) else c.get('vote_share') if not use_seats else None
        label=c.get('party') or c.get('label')
        if not label or not isinstance(value,(int,float)) or value<0 or value>100:continue
        if label.lower() in ['independent','independents','nonpartisan','non-partisan','no party affiliation']:
            label=(c['candidate']+' alignment (historical)') if c.get('candidate') else 'Independents (aggregate)'
        if label.lower() in ['other parties','others','no party']:continue
        key=identity(e['iso3'],label);shares[key]+=value;labels[key]=label;total+=value
        for records in c.get('provenance',{}).values():
            for r in records:
                u=r.get('source',{}).get('url')
                if u and u.startswith('https://'):sources.add(u)
    if len(shares)<2 or max(shares.values(),default=0)>100 or not 65<=total<=102:return None
    if max(shares.values())<100-total:return None
    # Preserve unrepresented votes as a residual, not as a named candidate.
    if total<99.9:shares['__unmodelled__']=max(0,100-total);labels['__unmodelled__']='Other / unmodelled field'
    return {'id':e['slug'],'country':e['iso3'],'kind':kind,'date':e['held_on'],'round':e.get('round',1),'cycle':e.get('group_key') or e['slug'],'shares':dict(shares),'labels':labels,'source':BASE+'/elections/'+e['slug'],'citation':sorted(sources)[:4],'verified':e.get('last_verified_at')}

def main():
    calendar=json.loads((OUT/'calendar.json').read_text(encoding='utf-8'))
    old={}
    try:old=json.loads((OUT/'history.json').read_text(encoding='utf-8'))
    except Exception:pass
    try:
        deployed=get('https://monarchcastletech.github.io/sdcofa/election/feeds/history.json')
        if deployed.get('fetchedAt','')>old.get('fetchedAt',''):old=deployed
    except Exception:pass
    first=get(BASE+'/elections?per_page=100&page=1');index=first['data']
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for d in pool.map(lambda i:get(BASE+'/elections?per_page=100&page='+str(i)),range(2,first['meta']['pages']+1)):index.extend(d['data'])
    if len(index)!=first['meta']['total']:raise ValueError('Incomplete historical pagination')
    eligible=[e for e in index if e.get('scope')=='national' and e.get('kind') in ['presidential','parliamentary','general'] and e.get('results_status')=='final' and e.get('held_on') and e['held_on']<=TODAY and not e.get('indirect')]
    same_normalizer=old.get('normalizerVersion')=='world-2'
    cached={r['id']:r for r in old.get('records',[])} if same_normalizer else {};skipped=old.get('skippedRevisions',{}) if same_normalizer else {};failures=[]
    def load(e):
        saved=cached.get(e['slug'])
        if saved and saved.get('verified')==e.get('last_verified_at'):return saved
        if e['slug'] in skipped and skipped[e['slug']]==e.get('last_verified_at'):return None
        f=CACHE/(e['slug']+'.json')
        try:
            data=json.loads(f.read_text(encoding='utf-8')) if f.exists() else None
            if not data or data.get('last_verified_at')!=e.get('last_verified_at'):
                data=get(BASE+'/elections/'+e['slug'])['data'];f.write_text(json.dumps(data),encoding='utf-8')
            v=normalize(data)
            if v is None:skipped[e['slug']]=e.get('last_verified_at')
            return v
        except Exception as ex:failures.append({'id':e['slug'],'error':str(ex)});return saved
    records=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for i,row in enumerate(pool.map(load,eligible),1):
            if row:records.append(row)
            if i%50==0:print('Historical records processed:',i,flush=True)
    # A runoff is one election cycle; do not train on its first round as if it were a separate election.
    cycles={}
    for r in records:
        key=(r['country'],r['kind'],r['cycle'])
        if key not in cycles or r['date']>cycles[key]['date']:cycles[key]=r
    records=sorted(cycles.values(),key=lambda r:(r['date'],r['country']))
    # Longer parliamentary series: ParlGov's publisher explicitly licenses the data CC0.
    pg_url='https://www.parlgov.org/data/parlgov-development_csv-utf-8/view_election.csv'
    pg_file=CACHE/'parlgov-election.csv'
    if not pg_file.exists():
        with urllib.request.urlopen(pg_url,timeout=45) as response:pg_file.write_bytes(response.read())
    pg_groups={}
    for row in csv.DictReader(io.StringIO(pg_file.read_text(encoding='utf-8-sig'))):
        if row['election_type']!='parliament' or not '1945-01-01'<=row['election_date']<=TODAY:continue
        label=row['party_name_english'] or row['party_name'];short=row['party_name_short']
        if short in ['none','no-seat','one-seat'] or not row['vote_share']:continue
        value=float(row['vote_share'])
        if not 0<=value<=100:continue
        key=(row['country_name_short'],row['election_date']);group=pg_groups.setdefault(key,{'id':'parlgov-'+row['election_id'],'country':key[0],'kind':'parliamentary','date':key[1],'cycle':'parlgov-'+row['election_id'],'shares':{},'labels':{},'source':pg_url,'citation':['https://www.parlgov.org/data-info/'],'verified':'ParlGov development 2023-11-04'})
        party=identity(key[0],label);group['shares'][party]=group['shares'].get(party,0)+value;group['labels'][party]=label
    supplementary=[]
    for r in pg_groups.values():
        total=sum(r['shares'].values())
        if len(r['shares'])<2 or not 80<=total<=102:continue
        if total<99.9:r['shares']['__unmodelled__']=100-total;r['labels']['__unmodelled__']='Other / unmodelled field'
        supplementary.append(r)
    pg_dates={(r['country'],r['date']) for r in supplementary}
    records=[r for r in records if r['kind']!='parliamentary' or (r['country'],r['date']) not in pg_dates]
    records=[r for r in records if not (r['country']=='FRA' and r['kind']=='parliamentary' and any(p['country']=='FRA' and abs((datetime.date.fromisoformat(p['date'])-datetime.date.fromisoformat(r['date'])).days)<=28 for p in supplementary))]
    records=sorted(records+supplementary,key=lambda r:(r['date'],r['country']))
    if len(records)<100:raise ValueError('Too few usable historical records')
    extra=[r for r in old.get('records',[]) if r.get('provider') in ['eg20','ppeg25','meco','pk24']] if old.get('externalDataVersion')==4 else supplements(CACHE,TODAY)
    # ParlGov remains the coherent source for its multi-decade series; PPEG and MECo extend newer/gap countries.
    preferred={(r['country'],r['date']) for r in records if r['id'].startswith('parlgov-')}
    priorities={'eg20':1,'ppeg25':2,'ppeg25pres':2,'meco':3,'pk24':3};chosen={}
    for r in extra:
        if (r['country'],r['date']) in preferred:continue
        key=(r['country'],r['date'],r['kind'])
        if key not in chosen or priorities[r['provider']]>priorities[chosen[key]['provider']]:chosen[key]=r
    existing={(r['country'],r['date'],r['kind']) for r in records}
    records.extend(r for k,r in chosen.items() if k not in existing)
    supplement=json.loads((ROOT/'scripts/data/turkiye-presidential.json').read_text(encoding='utf-8'))
    records=[r for r in records if not (r['country']=='TUR' and r['kind']=='presidential')]+supplement
    z=json.loads((ROOT/'scripts/data/zambia-president-2021.json').read_text(encoding='utf-8'))
    assert sum(z['partyVotes'].values())==z['validVotes']
    z['shares']={identity('ZMB',k):v/z['validVotes']*100 for k,v in z.pop('partyVotes').items()};z['labels']={k:k.upper() for k in z['shares']};z['cycle']=z['id'];z['labels']['upnd']='United Party for National Development';z['labels']['pf']='Patriotic Front'
    records=[r for r in records if not(r['country']=='ZMB' and r['kind']=='presidential' and r['date']=='2021-08-12')]+[z]
    records.sort(key=lambda r:(r['date'],r['country']))
    trials,weight=backtest(records);overall=metrics(trials)
    countries=[]
    # Additional electoral jurisdictions in the licensed histories, without a claim about sovereign status.
    extras=[{'code':'TWN','iso2':'TW','name':'Taiwan','region':'East Asia & Pacific','capital':'Taipei'}, {'code':'AIA','iso2':'AI','name':'Anguilla','region':'Latin America & Caribbean','capital':'The Valley'}, {'code':'CYP_NO','iso2':None,'name':'Northern Cyprus','region':'Europe & Central Asia','capital':'North Nicosia'}, {'code':'SML','iso2':None,'name':'Somaliland','region':'Sub-Saharan Africa','capital':'Hargeisa'}]
    existing_codes={c['code'] for c in calendar['countries']}
    calendar['countries'].extend(c for c in extras if c['code'] not in existing_codes)
    for c in calendar['countries']:
        history=[e for e in records if e['country']==c['code']];races=[]
        for kind in ['presidential','parliamentary','parliamentary-seats']:
            series=[e for e in history if e['kind']==kind]
            if not series:continue
            family=source_family(max(series,key=lambda e:e['date']))
            series=[e for e in series if source_family(e)==family]
            local=metrics([t for t in trials if t['country']==c['code'] and t['kind']==kind and t['sourceFamily']==family]);validation=local if local['trials']>=5 else overall
            v=forecast(series,weight,validation);v.update({'kind':kind,'localValidation':local,'status':'model' if len(series)>=2 and local['trials']>=1 else 'baseline','asOf':NOW,'sourceFamily':family})
            v['ageYears']=round((datetime.date.fromisoformat(TODAY)-datetime.date.fromisoformat(v['inputThrough'])).days/365.25,1)
            if v['ageYears']>10:v['status']='stale'
            latest_known=max((e['held_on'] for e in index if e['iso3']==c['code'] and e.get('scope')=='national' and e.get('held_on') and e['held_on']<=TODAY and not e.get('indirect') and not e.get('electing_body') and not any(s in (e.get('office') or '').lower() for s in ['senate','upper chamber','council of the nation']) and ((kind=='presidential' and e['kind']=='presidential') or (kind.startswith('parliamentary') and e['kind'] in ['parliamentary','general']))),default=None)
            if latest_known and (datetime.date.fromisoformat(latest_known)-datetime.date.fromisoformat(v['inputThrough'])).days>60:
                v['status']='outdated';v['latestKnownElection']=latest_known;v['coverageNote']='A newer held election is listed but comparable numerical returns are not ingested. This is a historical baseline, not a current winner call.'
            races.append(v)
        countries.append({**c,'races':races,'status':'available' if races else 'unavailable','reason':None if races else 'No comparable competitive national vote-share series in the free source. Institutional, indirect and single-field contests are not given invented winners.'})
    turkey=next(c for c in countries if c['code']=='TUR')
    turkey['scenario']={'id':'tur-2028-erdogan-win','year':2028,'type':'scenario','winner':'Recep Tayyip Erdoğan','headline':'Erdoğan wins.','label':'PRESET SCENARIO · NOT A FORECAST','assumptions':['Assumes Recep Tayyip Erdoğan is a candidate in 2028.','Assumes Erdoğan wins the presidential election.','Winner is fixed by the scenario; no model probability is estimated.'],'dateStatus':'Expected year; official date and ballot must be confirmed.','source':'https://www.ysk.gov.tr/'}
    info={'version':VERSION,'generatedAt':NOW,'source':'https://elekt.io/','historyRecords':len(records),'historyCountries':len(set(r['country'] for r in records)),'profileCountries':len(countries),'modelCountries':sum(any(r['status']=='model' for r in c['races']) for c in countries),'baselineCountries':sum(bool(c['races']) for c in countries),'weight':weight,'validation':overall,'limitations':['Historical outcomes are reconstructed from current source records, not archived pre-election vintages.','This is a historical continuation/momentum model, not a calibrated winner-probability system.','Provider series are evaluated separately; unverified cross-provider party identities are not joined.','Parliamentary targets are largest vote shares, not seat or government control.','Candidates and political parties can change. Historical labels identify blocs rather than certified future nominees.','One result yields only a descriptive baseline; sparse and stale data are labelled.','The Türkiye 2028 Erdoğan-win view is an explicit preset scenario, excluded from model validation.'],'sources':[{'name':'ParlGov','url':'https://www.parlgov.org/data-info/','license':'CC0 1.0; Doring, Quaas, Hesse and Manow (2023), ParlGov development version.'},{'name':'elekt','url':'https://elekt.io/','license':'CC0 / CC BY-SA 4.0 and original source terms; per-election provenance retained.'}],'failures':failures}
    info['sources'].extend([
        {'name':'Elections Global 2.0','url':'https://doi.org/10.7910/DVN/OGOURC','license':'CC0 1.0'},
        {'name':'PPEG 2025','url':'https://doi.org/10.7910/DVN/5OAH7P','license':'CC0 1.0'},
        {'name':'Malaysia MECo','url':'https://github.com/Thevesh/paper-meco-results','license':'CC0 1.0'},
        {'name':'Gallup Pakistan / Open Data Pakistan','url':'https://opendata.com.pk/dataset/pakistan-general-elections-1970-2024','license':'Creative Commons Attribution; publisher does not specify version'},
        {'name':'Lighton Phiri / University of Zambia DataLab','url':'https://zenodo.org/records/21709654','license':'CC BY 4.0'},
        {'name':'Türkiye presidential results','url':'https://www.ysk.gov.tr/','license':'Official election returns; source citations retained per record'}
    ])
    (OUT/'history.json').write_text(json.dumps({'fetchedAt':NOW,'normalizerVersion':'world-2','externalDataVersion':4,'records':records,'skippedRevisions':skipped,'license':'Source-specific terms; see sources and individual record metadata','sources':info['sources'],'attribution':'elekt and research providers; original sources linked per record'},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (OUT/'world-model.json').write_text(json.dumps({'meta':info,'countries':countries},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (OUT/'validation.json').write_text(json.dumps({'meta':info,'trials':trials},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print('World model:',len(countries),'profiles;',len(records),'elections;',overall['trials'],'chronological tests;',info['baselineCountries'],'countries with numerical coverage',flush=True)

if __name__=='__main__':
    try:main()
    except Exception as e:
        print('World model refresh failed:',type(e).__name__,str(e),file=sys.stderr)
        target=OUT/'world-model.json'
        if target.exists():
            d=json.loads(target.read_text(encoding='utf-8'));d['meta']['refreshError']=str(e);d['meta']['checkedAt']=NOW;target.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        else:raise
