export function forecastInputs(feed, now = new Date()) {
  const cutoff=new Date(+now-30*864e5).toISOString().slice(0,10),today=now.toISOString().slice(0,10),items=[];
  for(const group of feed.groups){
    const recent=feed.polls.filter(p=>p.group===group.id&&(p.end||p.published)>=cutoff&&p.published<=today);
    const latestByInstitute=[...new Map(recent.slice().sort((a,b)=>b.published.localeCompare(a.published)).map(p=>[p.pollster,p]).reverse()).values()];
    if(latestByInstitute.length<3)continue;
    const sums=new Map();for(const p of latestByInstitute)for(const r of p.results){if(/Sonstige|Other/i.test(r.name))continue;const v=sums.get(r.name)||[];v.push(r.pct);sums.set(r.name,v);}
    const shares=[...sums].filter(([,v])=>v.length===latestByInstitute.length).map(([name,v])=>({name,share:Math.round(v.reduce((a,b)=>a+b,0)/v.length*100)/100})).sort((a,b)=>b.share-a.share);
    if(shares.length<2)continue;
    items.push({id:'de-'+group.id,country:'DEU',race:group.name,type:'forecast',target:group.id==='0'?'Largest national vote share if held today':'Largest state vote share if held today',condition:'If this election were held today',eligible:shares[0].share-shares[1].share>=2,leader:shares[0].name,shares,pollCount:latestByInstitute.length,asOf:latestByInstitute.map(p=>p.end||p.published).sort().at(-1),source:'https://dawum.de/API/',pollIds:latestByInstitute.map(p=>p.id),method:'Unweighted mean of the latest poll per institute published within thirty days. Descriptive input to AI analysis; no calibrated win probabilities.',limitations:'Conditional vote-share scenario. Not a prediction of seat control, coalition formation, or the eventual election-day result.'});
  }
  return items.sort((a,b)=>(a.id==='de-0'?-1:b.id==='de-0'?1:b.asOf.localeCompare(a.asOf))).slice(0,8);
}
export function callInput(race,now=new Date()) {
  const reason=message=>({id:race.slug,country:'USA',race:race.seat_label,type:'result_call',eligible:false,reason:message});
  if(!['senate','governor'].includes(race.office_kind))return reason('Electoral rule is outside current call coverage.');
  if(['US-AK','US-ME','US-LA','US-GA','US-VT'].includes(race.region))return reason('Ranked-choice, runoff or special-rule jurisdiction is not covered by this call policy.');
  if(!['partial','provisional','final','certified'].includes(race.results_status))return reason('No reported result.');
  const age=+now-Date.parse(race.results_as_of);if(!Number.isFinite(age)||age>48*36e5||age< -5*60e3)return reason('Result timestamp is missing, stale or in the future.');
  if(!Number.isFinite(race.pct_counted)||race.pct_counted<99||race.pct_counted>100)return reason('Reporting estimate is below the call threshold.');
  const registry=race.candidates||[];
  // The source registry also contains primary entrants; declared/withdrawn entries without votes are not the general-election ballot.
  const candidates=registry.filter(c=>Number.isInteger(c.votes)||!['declared','withdrawn'].includes(c.status));
  if(candidates.length<2||race.candidate_count!==registry.length||candidates.some(c=>!Number.isInteger(c.votes)||c.votes<0))return reason('Complete candidate vote totals are unavailable.');
  const official=candidates.every(c=>(c.provenance?.votes||[]).some(p=>p.source?.kind==='official'&&Number(p.value)===c.votes));
  if(!official||!/^https:\/\//.test(race.results_source_url||''))return reason('Traceable official-source vote evidence is missing.');
  const total=candidates.reduce((sum,c)=>sum+c.votes,0);if(total<1000)return reason('Reported vote volume is insufficient.');
  const ranked=candidates.map(c=>({id:c.id,name:c.name,party:c.party,votes:c.votes,share:Math.round(c.votes/total*10000)/100})).sort((a,b)=>b.votes-a.votes),margin=ranked[0].share-ranked[1].share;
  if(ranked[0].share<=50||margin<5)return reason('The race remains too close for this conservative call policy.');
  return {id:race.slug,country:'USA',race:race.seat_label+' · '+(race.office_kind==='senate'?'US Senate':'Governor'),type:'result_call',eligible:true,leader:ranked[0].name,candidates:ranked,reporting:race.pct_counted,margin:Math.round(margin*100)/100,asOf:race.results_as_of,source:race.results_source_url,sourceRecord:'https://elekt.io/elekt/api/v1/contests/'+race.slug,resultStatus:race.results_status,method:'Reported share above half, lead at least five percentage points, reporting estimate at least ninety-nine percent, fresh timestamp and official-source provenance for all candidate totals. AI may withhold an eligible call.',limitations:'SDCofA projection based on reported returns via elekt. Reporting estimates and returns can change. This is not official certification.'};
}
export function validateAIItem(input, output){
  if(!input.eligible||output?.choice!=='project'||output.winner!==input.leader)return null;
  if(typeof output.reason!=='string'||output.reason.length<15||output.reason.length>450||/\d|\b(?:percent|probability|chance|certain|certainty|guaranteed)\b/i.test(output.reason))return null;
  return {...input,winner:input.leader,analysis:output.reason,confidence:input.type==='forecast'?(output.confidence==='medium'?'medium':'low'):'call policy passed',status:'projected'};
}
