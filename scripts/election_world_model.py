"""SDCofA continuation model. Only preceding elections enter each historical test."""
import math, unicodedata
from collections import defaultdict

VERSION = 'sdcofa-continuity-1.1'
WEIGHTS = [0.0, 0.15, 0.3, 0.5]

def identity(country, name):
    text = ''.join(c for c in unicodedata.normalize('NFKD', name).lower() if c.isalnum() and not unicodedata.combining(c))
    aliases = {
      'DEU': {'christiandemocraticunion':'union','christiansocialunion':'union','cdu':'union','csu':'union','cducsu':'union','socialdemocraticparty':'spd','socialdemocraticpartyofgermany':'spd','alliance90thegreens':'greens','bundnis90diegrunen':'greens','grune':'greens','alternativeforgermany':'afd','dielinke':'linke','christiandemocraticunionchristiansocialunion':'union'},
      'TUR': {'justiceanddevelopmentpartyakparti':'akp','justiceanddevelopmentparty':'akp','adaletvekalkinmapartisi':'akp','akparti':'akp','republicanpeoplesparty':'chp','cumhuriyethalkpartisi':'chp','nationalistmovementparty':'mhp','milliyetcihareketpartisi':'mhp'},
      'USA': {'republicanparty':'republican','democraticparty':'democratic'},
    }
    return aliases.get(country, {}).get(text, text)

def display_name(country, key, label):
    return {'DEU':{'union':'CDU/CSU','spd':'Social Democratic Party (SPD)'},'TUR':{'chp':"Republican People's Party",'mhp':'Nationalist Movement Party','akp':'Justice and Development Party'}}.get(country,{}).get(key,label)

def predict(previous, weight=0.0):
    latest=previous[-1]['shares']; older=previous[-2]['shares'] if len(previous)>1 else latest
    values={k:max(0.0,v+weight*(v-older.get(k,0))) for k,v in latest.items()}
    total=sum(values.values())
    return {k:100*v/total for k,v in values.items()} if total else {}

def score(predicted, actual):
    keys=set(predicted)|set(actual)
    return sum(abs(predicted.get(k,0)-actual.get(k,0)) for k in keys)/2

def winner(values):
    return max(values,key=values.get) if values else None

def source_family(e):
    # Party labels are not a verified cross-provider identity crosswalk.
    if e.get('provider'):return e['provider']
    if e['id'].startswith('parlgov-'):return 'parlgov'
    if 'elekt.io/' in e.get('source',''):return 'elekt'
    return 'curated'

def backtest(history):
    groups=defaultdict(list)
    for e in history: groups[(e['country'],e['kind'],source_family(e))].append(e)
    trials=[]
    for key, series in groups.items():
        series.sort(key=lambda e:e['date'])
        for i in range(2,len(series)):
            target=series[i]
            if target['date']<'1990-01-01':continue
            prior=[e for e in series[:i] if e['date']<target['date']]
            if len(prior)<2:continue
            choices={str(w):predict(prior,w) for w in WEIGHTS}
            trials.append({'country':key[0],'kind':key[1],'sourceFamily':key[2],'date':target['date'],'election':target['id'],'inputThrough':prior[-1]['date'],'actualLeader':winner(target['shares']),'actual':target['shares'],'labels':{k:v for e in prior for k,v in e['labels'].items()},'actualLabels':target['labels'],'choices':choices,'losses':{w:score(p,target['shares']) for w,p in choices.items()}})
    trials.sort(key=lambda r:(r['date'],r['country']))
    past=[]; results=[]
    # All elections on the same date use the same prior training set.
    dates=defaultdict(list)
    for t in trials:dates[t['date']].append(t)
    for date,batch in sorted(dates.items()):
        trained=[t for t in past if t['date']<date]
        chosen=min(WEIGHTS,key=lambda w:sum(t['losses'][str(w)] for t in trained)/len(trained)) if len(trained)>=30 else 0.0
        for t in batch:
            p=t['choices'][str(chosen)]; leader=winner(p)
            results.append({k:t[k] for k in ['country','kind','sourceFamily','date','election','inputThrough','actualLeader']}|{'predictedLeader':leader,'predictedName':display_name(t['country'],leader,t['labels'].get(leader,leader)),'actualName':display_name(t['country'],t['actualLeader'],t['actualLabels'].get(t['actualLeader'],t['actualLeader'])),'correct':leader==t['actualLeader'],'error':round(t['losses'][str(chosen)],3),'baselineError':round(t['losses']['0.0'],3),'baselineCorrect':winner(t['choices']['0.0'])==t['actualLeader'],'weight':chosen,'trainingTrials':len(trained),'trainingThrough':trained[-1]['date'] if trained else None,'leaderError':round(abs(p[leader]-t['actual'].get(leader,0)),3)})
        past.extend(batch)
    current=min(WEIGHTS,key=lambda w:sum(t['losses'][str(w)] for t in trials)/len(trials)) if trials else 0.0
    return results,current

def metrics(trials):
    if not trials:return {'trials':0,'accuracy':None,'meanError':None,'baselineAccuracy':None,'baselineMeanError':None,'errorBand':None}
    errors=sorted(t['leaderError'] for t in trials)
    return {'trials':len(trials),'accuracy':round(100*sum(t['correct'] for t in trials)/len(trials),1),'meanError':round(sum(t['error'] for t in trials)/len(trials),2),'baselineAccuracy':round(100*sum(t['baselineCorrect'] for t in trials)/len(trials),1),'baselineMeanError':round(sum(t['baselineError'] for t in trials)/len(trials),2),'errorBand':round(errors[min(len(errors)-1,math.ceil(.9*len(errors))-1)],2),'countries':len(set(t['country'] for t in trials)),'from':min(t['date'] for t in trials),'through':max(t['date'] for t in trials)}

def forecast(series, weight, validation):
    series=sorted(series,key=lambda r:r['date']); values=predict(series,weight)
    labels={k:display_name(series[-1]['country'],k,v) for e in series for k,v in e['labels'].items()}
    ranked=sorted(values.items(),key=lambda x:-x[1])
    return {'leader':labels[ranked[0][0]],'leaderId':ranked[0][0],'estimates':[{'id':k,'name':labels[k],'value':round(v,2),'low':round(max(0,v-(validation.get('errorBand') or 15)),2),'high':round(min(100,v+(validation.get('errorBand') or 15)),2)} for k,v in ranked[:8]],'historyCount':len(series),'inputThrough':series[-1]['date'],'inputs':[{'id':e['id'],'date':e['date'],'source':e['source'],'citation':e.get('citation')} for e in series[-3:]],'momentumWeight':weight,'validation':validation,'target':('Largest share of reported parliamentary seats; not government control' if series[-1]['kind']=='parliamentary-seats' else 'Party/bloc with the largest national vote share; not seats or government control'),'intervalMeaning':'Range uses the retrospective 90th-percentile absolute leader-share error; not a calibrated probability interval.'}
