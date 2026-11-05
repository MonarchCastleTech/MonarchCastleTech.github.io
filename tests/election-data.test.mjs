import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCalendar,normalizeGermany,normalizeUS,preciseDate} from '../scripts/lib/election-data.mjs';
test('expected years and months never become countdown dates',()=>{
  for(const precision of ['year','month','unknown'])assert.equal(preciseDate({date:'2028-01-01',precision,status:'scheduled',evidence:'confirmed'}),false);
  assert.equal(preciseDate({date:'2027-02-01',precision:'day',status:'tentative',evidence:'confirmed'}),false);
  assert.equal(preciseDate({date:'2027-02-01',precision:'day',status:'scheduled',evidence:'unsupported'}),false);
  assert.equal(preciseDate({date:'2027-02-01',precision:'day',status:'scheduled',evidence:'confirmed'}),true);
  assert.equal(preciseDate({date:'2027-02-01',precision:'day',status:'snap',evidence:'confirmed'}),true);
});
test('calendar keeps campaign elections, unknown dates, and indirect institutional votes',()=>{
  const countries=Array.from({length:150},(_,i)=>({iso3:'C'+i,name:'Country '+i}));
  const elections=Array.from({length:100},(_,i)=>({slug:'e'+i,iso3:'C'+i,scope:'national',name:'2028 Election',held_on:null,date_precision:'year',date_status:'expected',phase:'campaign',electing_body:'Parliament'}));
  const d=normalizeCalendar(countries,[...elections,elections[0],{...elections[0],slug:'local',scope:'local'}]);
  assert.equal(d.elections.length,100);assert.equal(d.elections[0].date,null);assert.equal(d.elections[0].year,'2028');assert.equal(d.elections[0].phase,'campaign');assert.equal(d.elections[0].indirect,true);
});
test('German polling excludes future and old publications and preserves missing sample size',()=>{
  const s={Parliament_ID:0,Institute_ID:1,Date:'2026-11-01',Results:{1:30,2:25},Surveyed_Persons:'',Survey_Period:{Date_Start:'2026-10-28',Date_End:'2026-10-31'}};
  const d=normalizeGermany({Parliaments:{0:{Name:'Bundestag'}},Parties:{1:{Shortcut:'A'},2:{Shortcut:'B'}},Institutes:{1:{Name:'Institute'}},Surveys:{a:s,b:{...s,Date:'2027-01-01'},c:{...s,Date:'2025-01-01'}}},'2026-11-05');
  assert.equal(d.polls.length,1);assert.equal(d.polls[0].n,null);assert.equal(d.polls[0].end,'2026-10-31');assert.match(d.license,/odbl/);
});
test('US polling rejects backwards dates, future fieldwork and invalid percentages',()=>{
  const p={id:'x',race:'generic',end:'2026-11-01',results:[{candidate:'A',pct:45},{candidate:'B',pct:42},{candidate:'Bad',pct:101}]};
  const rows=Array.from({length:10},(_,i)=>({...p,id:String(i)}));rows[0].dates_backwards=true;rows[1].end='2027-01-01';
  const d=normalizeUS(rows,'2026-11-05');assert.equal(d.polls.length,8);assert.equal(d.polls[0].results.length,2);
});
test('known upstream Sudan/South Sudan country conflicts are quarantined',()=>{
  const countries=Array.from({length:150},(_,i)=>({iso3:i===0?'SDN':'C'+i,name:'Country '+i}));
  const elections=Array.from({length:100},(_,i)=>({slug:'e'+i,iso3:i===0?'SDN':'C'+i,scope:'national',name:i===0?'2026 South Sudanese general election':'2028 Election'}));
  const d=normalizeCalendar(countries,elections);assert.equal(d.elections.length,99);assert.equal(d.excludedRecords.length,1);
});
