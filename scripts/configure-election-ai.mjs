// Run locally with a key on stdin. Nothing is written to the checkout or shell history.
import readline from 'node:readline';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
const rl=readline.createInterface({input:process.stdin,terminal:false});
console.log('Ready for OpenRouter key on stdin (input is hidden).');
const key=await new Promise(resolve=>rl.once('line',line=>{rl.close();if(process.stdin.isTTY)process.stdin.setRawMode(false);resolve(line.trim());}));
if(!key.startsWith('sk-or-'))throw Error('Expected an OpenRouter key on stdin');
const gh=process.env.GH_CLI_PATH||(process.platform==='win32'&&existsSync('C:/Program Files/GitHub CLI/gh.exe')?'C:/Program Files/GitHub CLI/gh.exe':'gh');
const cliEnv={...process.env};
const identity=spawnSync(gh,['api','user','--jq','.login'],{encoding:'utf8',env:cliEnv,windowsHide:true});
if(identity.stdout?.trim()!=='akgularda')throw Error('GitHub CLI must be authenticated as akgularda: '+(identity.error?.code||identity.stderr?.slice(0,300)||identity.stdout));
const secret=spawnSync(gh,['secret','set','OPENROUTER_API_KEY','--repo','MonarchCastleTech/MonarchCastleTech.github.io'],{input:key,encoding:'utf8',env:cliEnv,windowsHide:true});
if(secret.status!==0)throw Error('GitHub secret configuration failed: '+(secret.error?.code||secret.stderr?.slice(0,500)));
console.log('OpenRouter key saved as an encrypted GitHub Actions secret.');
const run=spawnSync(process.execPath,['scripts/sync-election-ai.mjs'],{env:{...process.env,OPENROUTER_API_KEY:key},stdio:['ignore','inherit','inherit'],windowsHide:true});
process.exitCode=run.status??1;
