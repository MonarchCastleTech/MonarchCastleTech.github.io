import test from 'node:test';
import assert from 'node:assert/strict';
import {forecastInputs,callInput,validateAIItem} from '../scripts/lib/election-projections.mjs';
const now=new Date('2026-11-05T20:00:00Z');
function race(overrides={}){return {slug:'race',region:'US-NC',seat_label:'North Carolina',office_kind:'senate',candidate_count:2,pct_counted:99.8,results_as_of:'2026-11-05T19:00:00Z',results_status:'provisional',results_source_url:'https://elections.example.gov/',candidates:[{id:'a',name:'Candidate A',votes:60000,provenance:{votes:[{value:'60000',source:{kind:'official'}}]}},{id:'b',name:'Candidate B',votes:40000,provenance:{votes:[{value:'40000',source:{kind:'official'}}]}}],...overrides};}
test('result calls require fresh, traceable, sufficiently complete returns',()=>{
  assert.equal(callInput(race(),now).eligible,true);
  assert.equal(callInput(race({pct_counted:90}),now).eligible,false);
  assert.equal(callInput(race({results_as_of:'2026-11-01T00:00:00Z'}),now).eligible,false);
  assert.equal(callInput(race({region:'US-AK'}),now).eligible,false);
  assert.equal(callInput(race({candidate_count:3}),now).eligible,false);
  const noEvidence=race();noEvidence.candidates[0].provenance={};assert.equal(callInput(noEvidence,now).eligible,false);
  const primary=race();primary.candidate_count=3;primary.candidates.push({id:'primary',name:'Primary entrant',status:'declared',votes:null});assert.equal(callInput(primary,now).eligible,true);
  primary.candidates[2].status='nominee';assert.equal(callInput(primary,now).eligible,false);
});
test('AI cannot invent a winner, project outside the evidence gate, or add win probabilities',()=>{
  const input=callInput(race(),now),decision={choice:'project',winner:'Candidate A',reason:'The reported majority and substantial lead support a provisional call.'};
  assert.ok(validateAIItem(input,decision));assert.equal(validateAIItem(input,{...decision,winner:'Herz'}),null);assert.equal(validateAIItem({...input,eligible:false},decision),null);assert.equal(validateAIItem(input,{...decision,reason:'Candidate A has a 99% chance.'}),null);
});
test('forecasts use one latest poll per institute and require independent recent coverage',()=>{
  const poll=(id,pollster,date,a)=>({id,pollster,group:'0',published:date,end:date,results:[{name:'A',pct:a},{name:'B',pct:25},{name:'Sonstige',pct:10}]});
  const feed={groups:[{id:'0',name:'Bundestag'}],polls:[poll('new','One','2026-11-04',40),poll('old','One','2026-10-20',20),poll('two','Two','2026-11-03',40),poll('three','Three','2026-11-02',40),poll('stale','Four','2025-01-01',50)]};
  const inputs=forecastInputs(feed,now);assert.equal(inputs.length,1);assert.equal(inputs[0].pollCount,3);assert.equal(inputs[0].shares[0].share,40);assert.equal(inputs[0].leader,'A');assert.match(inputs[0].condition,/held today/);assert.ok(!inputs[0].pollIds.includes('old'));assert.ok(!inputs[0].shares.some(s=>s.name==='Sonstige'));
});
