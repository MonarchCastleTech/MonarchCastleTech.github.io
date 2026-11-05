import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeCalendar,normalizeGermany,normalizeUS} from './lib/election-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'static/sdcofa/election/feeds');
await fs.mkdir(out,{recursive:true});
const now=new Date().toISOString(),today=now.slice(0,10);
async function get(url){
  const r=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'MonarchCastleElectionAtlas/1.0 (+https://monarchcastle.com/sdcofa/election/)','Accept':'application/json'}});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function calendar(){
  const base='https://elekt.io/elekt/api/v1';
  const c=await get(base+'/countries'),rows=[];
  for(const phase of ['upcoming','campaign']){
    const first=await get(`${base}/elections?phase=${phase}&per_page=100&page=1`),batch=[...first.data];
    if(!Number.isInteger(first.meta?.pages)||first.meta.pages>30)throw new Error('Invalid calendar pagination');
    for(let page=2;page<=first.meta.pages;page++){const d=await get(`${base}/elections?phase=${phase}&per_page=100&page=${page}`);batch.push(...d.data);}
    if(batch.length!==first.meta.total)throw new Error('Calendar pagination incomplete');
    rows.push(...batch);
  }
  return {...normalizeCalendar(c.data,rows),credit:'elekt · official sources, Wikidata and Wikipedia',license:'https://creativecommons.org/licenses/by-sa/4.0/',licenseName:'CC BY-SA 4.0 / CC0; see source records',sourceUrl:'https://elekt.io/',api:base+'/elections?phase=upcoming',scope:'National elections and referendums in the upstream feed; countries and territories. Not an exhaustive record of local elections.'};
}
async function us(){
  const base='https://www.electionwrld.com/api/v1/polls?limit=500';
  const first=await get(base),rows=[...first.polls];
  if(!Number.isInteger(first.count)||first.count>15000)throw new Error('Unexpected US pagination');
  for(let offset=500;offset<first.count;offset+=500){const d=await get(base+`&offset=${offset}`);rows.push(...d.polls);}
  if(rows.length!==first.count)throw new Error('Incomplete US pagination');
  return {...normalizeUS(rows,today),sourceUrl:'https://www.electionwrld.com/developers',api:base,scope:'Published 2026 US polls. Race and fieldwork dates identify which election each poll concerns.'};
}
const jobs=[['calendar',calendar],['germany',async()=>({...normalizeGermany(await get('https://api.dawum.de/'),today),sourceUrl:'https://dawum.de/API/',api:'https://api.dawum.de/',scope:'Federal and state voting intention polls from the last 180 days.'})],['us',us]];
const status=await Promise.all(jobs.map(async([id,fn])=>{
  try{const data={...await fn(),fetchedAt:now};await fs.writeFile(path.join(out,id+'.json'),JSON.stringify(data));console.log(`${id}: refreshed ${data.elections?.length??data.polls?.length} records`);return{id,status:'ok',lastSuccess:now};}
  catch(e){
    let saved=null;try{saved=JSON.parse(await fs.readFile(path.join(out,id+'.json'),'utf8'));}catch{}
    // A scheduled build starts from Git, so recover a newer deployed snapshot before falling back to the bundled one.
    try{
      const r=await fetch(`https://monarchcastletech.github.io/sdcofa/election/feeds/${id}.json`,{signal:AbortSignal.timeout(10000),cache:'no-cache'});
      if(r.ok){const prior=await r.json();if(prior.fetchedAt&&Array.isArray(prior[id==='calendar'?'elections':'polls'])&&(!saved||prior.fetchedAt>saved.fetchedAt)){saved=prior;await fs.writeFile(path.join(out,id+'.json'),JSON.stringify(saved));}}
    }catch{}
    console.warn(`${id}: refresh failed (${e.message}); ${saved?'retaining dated snapshot':'no snapshot'}`);
    return{id,status:saved?'cached':'unavailable',lastSuccess:saved?.fetchedAt||null,error:e.message};
  }
}));
await fs.writeFile(path.join(out,'status.json'),JSON.stringify({checkedAt:now,sources:status}));
if(status.some(s=>s.status==='unavailable'))process.exitCode=1;
