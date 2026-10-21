import {mod,modulus,pow} from './mod';import {factor,isPrime} from './phi';import {orderByWalk} from './order';
export function primeGroup(p:bigint):void{modulus(p,10000n);if(!isPrime(p))throw Error('Generator search requires a prime p, checked by exact trial division. Use act 4 for composite moduli.');}
export function isGenerator(g:bigint,p:bigint){primeGroup(p);g=mod(g,p);const checks=factor(p-1n).map(({p:q})=>({q,value:pow(g,(p-1n)/q,p)}));return {generator:g!==0n&&checks.every(c=>c.value!==1n),checks};}
export function generators(p:bigint):bigint[]{primeGroup(p);const out:bigint[]=[];for(let g=1n;g<p;g++)if(isGenerator(g,p).generator)out.push(g);return out;}
export function subgroup(d:bigint,p:bigint):{base:bigint;members:bigint[]}{primeGroup(p);if(d<1n||(p-1n)%d!==0n)throw Error('Subgroup order must divide p−1.');const root=generators(p)[0],base=pow(root,(p-1n)/d,p);return {base,members:orderByWalk(base,p).walk};}
// [extension] point: decompose ℤₙ* into a product of cyclic groups.
