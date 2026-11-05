"""CC0 research supplements. Do not infer missing percentages or invent dates."""
import csv, datetime, io, math, re, urllib.request
from collections import defaultdict
from election_world_model import identity

DATASETS={
 'eg20':('https://dataverse.harvard.edu/api/access/datafile/3754546?format=original','https://doi.org/10.7910/DVN/OGOURC'),
 'ppeg25':('https://dataverse.harvard.edu/api/access/datafile/13185579?format=original','https://doi.org/10.7910/DVN/5OAH7P'),
 'ppeg25pres':('https://dataverse.harvard.edu/api/access/datafile/13185581?format=original','https://doi.org/10.7910/DVN/5OAH7P'),
 'meco':('https://raw.githubusercontent.com/Thevesh/paper-meco-results/main/data/consol_ballots.csv','https://github.com/Thevesh/paper-meco-results'),
 'pk24':('https://opendata.com.pk/dataset/31ed67e7-b1b1-4eb3-a115-92184a24abc9/resource/9e385875-efa0-4f58-aa8c-c2bac028b086/download/gallup-pakistan-elections-database-1970-2024-national-assembly.csv','https://opendata.com.pk/dataset/pakistan-general-elections-1970-2024'),
}

def number(value):
    try:
        n=float(value)
        return n if math.isfinite(n) and n>=0 else None
    except (TypeError,ValueError):return None

def full_date(value):
    value=str(value).strip().replace('.','-')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',value):return None
    try:return datetime.date.fromisoformat(value).isoformat()
    except ValueError:return None

def csv_rows(provider,cache):
    p=cache/(provider+'.csv')
    if not p.exists():
        request=urllib.request.Request(DATASETS[provider][0],headers={'User-Agent':'Mozilla/5.0 (compatible; MonarchCastleElectionAtlas/2.0)'})
        with urllib.request.urlopen(request,timeout=60) as response:p.write_bytes(response.read())
    return list(csv.DictReader(io.StringIO(p.read_text(encoding='utf-8-sig'))))

def record(provider,country,date,shares,labels,kind='parliamentary'):
    total=sum(shares.values())
    if len(shares)<2 or not 80<=total<=102 or max(shares.values())>100:return None
    if max(shares.values())<100-total:return None
    values=dict(shares);names=dict(labels)
    if total<99.9:values['__unmodelled__']=100-total;names['__unmodelled__']='Other / unmodelled field'
    id=f'{provider}-{country}-{date}-{kind}'
    return {'id':id,'country':country,'kind':kind,'date':date,'cycle':id,'shares':values,'labels':names,'source':DATASETS[provider][1],'citation':[DATASETS[provider][0]],'provider':provider,'verified':provider+' fixed release','sourceLicense':'CC0 1.0' if provider!='pk24' else 'Creative Commons Attribution; version unspecified'}

def supplements(cache,today):
    result=[]
    groups={}
    for row in csv_rows('eg20',cache):
        date=full_date(row.get('election_date'))
        if row.get('data')=='script' or row.get('midterm_election')=='1' or row.get('constitutional_assembly')=='1' or not date or not '1990-01-01'<=date<=today:continue
        c=row['country'];label=row.get('party') or row.get('source_party_1');value=number(row.get('vote_share'))
        if not label or value is None or value>100:continue
        key=(c,date);g=groups.setdefault(key,({},{}));party=identity(c,label);g[0][party]=g[0].get(party,0)+value;g[1][party]=label
    for (c,date),(values,labels) in groups.items():
        r=record('eg20',c,date,values,labels)
        if r:result.append(r)
    groups={}
    for row in csv_rows('ppeg25',cache):
        date=full_date(row.get('edate'))
        if not date or date>today or date<'1990-01-01' or str(row.get('estimate','')).lower()=='yes':continue
        # Mixed-member systems require explicit tier harmonisation; ParlGov supplies these instead.
        if str(row.get('mmm','')).lower() in ['1','true','yes']:continue
        value=number(row.get('v_share'));label=row.get('pname_en') or row.get('pname_or')
        if value is None or value>1 or not label:continue
        c=row['iso3c'];g=groups.setdefault((c,date),({},{}));party=identity(c,label);g[0][party]=g[0].get(party,0)+100*value;g[1][party]=label
    for (c,date),(values,labels) in groups.items():
        r=record('ppeg25',c,date,values,labels)
        if r:result.append(r)
    # PPEG presidential party joins fail a source audit (Armenia 2013).
    # Keep this entire supplement quarantined until identities are verified.
    # Malaysia: parliamentary contests only. GE15 includes a delayed constituency poll.
    groups={};seat_sets=defaultdict(set)
    for row in csv_rows('meco',cache):
        date=full_date(row.get('date'));e=row.get('election','')
        if e not in ['GE-14','GE-15'] or not row.get('seat','').startswith('P.') or not date or date>today:continue
        votes=number(row.get('votes'));label=row.get('party')
        if votes is None or not label:continue
        g=groups.setdefault(e,{'votes':defaultdict(float),'labels':{},'date':date});party=identity('MYS',label);g['votes'][party]+=votes;g['labels'][party]=label;g['date']=max(date,g['date']);seat_sets[e].add(row['seat'])
    for e,g in groups.items():
        if len(seat_sets[e])!=222:continue
        total=sum(g['votes'].values());r=record('meco','MYS',g['date'],{k:100*v/total for k,v in g['votes'].items()},g['labels'])
        if r:result.append(r)
    # National Assembly candidate totals; do not reclassify recorded independents as a party.
    pk_dates={'1988':'1988-11-16','1990':'1990-10-24','1993':'1993-10-06','1997':'1997-02-03','2002':'2002-10-10','2008':'2008-02-18','2013':'2013-05-11','2018':'2018-07-25','2024':'2024-02-08'}
    groups={}
    for row in csv_rows('pk24',cache):
        year=str(row.get('Year','')).strip().removesuffix('.0')
        if year not in pk_dates:continue
        value=number(str(row.get('Votes','')).replace(',',''));label=row.get('Party')
        if value is None or not label:continue
        g=groups.setdefault(year,{'votes':defaultdict(float),'labels':{}});key=identity('PAK',label);g['votes'][key]+=value;g['labels'][key]=label
    for year,g in groups.items():
        total=sum(g['votes'].values())
        if total<=0:continue
        r=record('pk24','PAK',pk_dates[year],{k:100*v/total for k,v in g['votes'].items()},g['labels'])
        if r:r['sourceLicense']='Creative Commons Attribution, version not specified by publisher';r['attribution']='Gallup Pakistan / Open Data Pakistan; Election Commission of Pakistan compilation';result.append(r)
    return result
