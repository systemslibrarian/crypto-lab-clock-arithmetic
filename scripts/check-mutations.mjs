// Mutations run only on a committed, clean source baseline. Each is built, killed,
// restored byte-for-byte, rebuilt and tested green before the next begins.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'); process.chdir(root);
const config = process.env.PLAYWRIGHT_CONFIG;
const browser = title => ['npx', ['playwright','test','e2e/claims.spec.ts','--project=chromium','--grep',title,'--workers=1','--retries=0',...(config ? ['--config',config] : [])]];
const build = ['npm',['run','build']];
const run = ([cmd,args]) => spawnSync(cmd,args,{cwd:root,encoding:'utf8',env:{...process.env,CI:'1'}});
const pass = (cmd,label) => { const r=run(cmd); if(r.status!==0) throw Error(`${label}\n${r.stdout}\n${r.stderr}`); return r; };
const hash = () => { const h=createHash('sha256'); const walk=d=>{for(const e of readdirSync(d,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=join(d,e.name); if(e.isDirectory())walk(p);else {h.update(p);h.update(readFileSync(p));}}};walk('dist');return h.digest('hex'); };
const cases = [
  [
    "wrong Bezout coefficient",
    "src/nt/euclid.ts",
    "s=s0-q*s1",
    "s=s0+q*s1",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "Bézout every",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "unreduced inverse",
    "src/nt/euclid.ts",
    "value:mod(s,n)",
    "value:s+mod(0n,n)",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "Bézout every",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "phi multiplies by p",
    "src/nt/phi.ts",
    "*(p-1n)",
    "*p",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "Phi drawn units",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "order asserted as phi",
    "src/nt/order.ts",
    "return {order:k,walk",
    "return {order:phiByFactor(n),walk",
    [
      "npx",
      [
        "vitest",
        "run",
        "src/nt/core.test.ts",
        "-t",
        "Subgroups, composite"
      ]
    ]
  ],
  [
    "generator checks only factor2",
    "src/nt/cyclic.ts",
    "factor(p-1n).map",
    "factor(p-1n).filter(({p:q})=>q===2n).map",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "Generators, subgroups",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "CRT omits compatibility",
    "src/nt/crt.ts",
    "if(delta%g!==0n)",
    "if(g===0n)",
    [
      "npx",
      [
        "vitest",
        "run",
        "src/nt/core.test.ts",
        "-t",
        "CRT Sunzi"
      ]
    ]
  ],
  [
    "CRT product instead of lcm",
    "src/nt/crt.ts",
    "nextMod=m/g*n",
    "nextMod=m*n",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "CRT substitutes",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "search space hardcoded2",
    "src/nt/toyDh.ts",
    "size:BigInt(members.length)",
    "size:2n",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "Generators, subgroups",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "gcd2 falsely invertible",
    "src/nt/euclid.ts",
    "if(g>1n)",
    "if(g>2n)",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "No inverse gcd2",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "Euler uses n minus1",
    "src/ui/act4.ts",
    "euler=pow(A,phi,n)",
    "euler=pow(A,n-1n,n)",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "Euler composite",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "negative claim deleted",
    "src/ui/act4.ts",
    "Euler’s identity holding for a base says nothing about how long its cycle is",
    "This base has a short cycle",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "Euler negative claim",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ],
  [
    "fixture Euler verdict broken",
    "src/ui/act4.ts",
    "check('euler',euler===1n",
    "check('euler',euler!==1n",
    [
      "npx",
      [
        "playwright",
        "test",
        "e2e/claims.spec.ts",
        "--project=chromium",
        "--grep",
        "Euler negative claim",
        "--workers=1",
        "--retries=0"
      ]
    ]
  ]
];
for(const c of cases)if(c[4][1].includes('--grep')&&config)c[4][1].push('--config',config);
const dirty=spawnSync('git',['diff','--exit-code','--',...new Set(cases.map(x=>x[1]))],{encoding:'utf8'});
if(dirty.status!==0)throw Error('Commit the source baseline before mutation checks.');
pass(build,'baseline build');const baseline=hash();const evidence=[];
mkdirSync('mutation-logs',{recursive:true});
for(const [name,file,before,after,command] of cases){
 pass(command,`${name}: baseline test`);
 const original=readFileSync(file,'utf8');if(original.split(before).length!==2)throw Error(`${name}: expected one mutation site`);
 let mutant;
 try{
  writeFileSync(file,original.replace(before,after));
  const diff=spawnSync('git',['diff','--',file],{encoding:'utf8'}).stdout;if(!diff.trim())throw Error(`${name}: empty diff`);
  pass(build,`${name}: mutant build`); mutant=hash();if(mutant===baseline)throw Error(`${name}: bundle did not move`);
  const r=run(command);writeFileSync(`mutation-logs/${name.replaceAll(' ','-')}.log`,r.stdout+r.stderr);
  if(r.status===0 || !/expect\(|AssertionError|Error: expect/.test(r.stdout+r.stderr))throw Error(`${name}: no assertion kill\n${r.stdout}\n${r.stderr}`);
  evidence.push({name,sourceDiff:diff,baseline,mutant,namedTest:command[1].includes('--grep') ? command[1][command[1].indexOf('--grep')+1] : command[1].at(-1),assertionFailure:true,retries:0});
 }finally{writeFileSync(file,original);pass(build,`${name}: restore build`);if(hash()!==baseline)throw Error(`${name}: restored hash differs`);pass(command,`${name}: restored test`);}
 evidence.at(-1).restoredGreen=true;console.log(`${name}: killed; exact artifact restored; owning test green`);
}
writeFileSync('mutation-evidence.json',JSON.stringify(evidence,null,2)+'\n');
