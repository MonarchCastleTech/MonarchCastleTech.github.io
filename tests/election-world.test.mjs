import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
test('historical projection and chronological holdout invariants',()=>{
  const r=spawnSync(process.platform==='win32'?'python':'python3',['tests/test_election_world.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
});
test('public country stage uses model records and contains no polling desk',()=>{
  const html=fs.readFileSync(new URL('../static/sdcofa/election/index.html',import.meta.url),'utf8');
  assert.match(html,/country-map/);assert.match(html,/country-dock/);assert.match(html,/validation-panel/);
  assert.doesNotMatch(html,/polls-panel|poll-country|poll-group|Voting intention/);
});
