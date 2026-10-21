import {gcd} from './euclid';import {modulus} from './mod';
export function factor(n:bigint):{p:bigint;e:bigint}[]{if(n<1n||n>1000000000000n)throw Error('Factorisation budget is 1 ≤ n ≤ 10¹².');const out:{p:bigint;e:bigint}[]=[];for(let p=2n;p*p<=n;p=p===2n?3n:p+2n){let e=0n;while(n%p===0n){n/=p;e++;}if(e)out.push({p,e});}if(n>1n)out.push({p:n,e:1n});return out;}
export function phiByFactor(n:bigint):bigint{if(n===1n)return 1n;modulus(n);return factor(n).reduce((v,{p,e})=>v*p**(e-1n)*(p-1n),1n);}
export function phiByCount(n:bigint):{value:bigint;units:bigint[]}{modulus(n,1000000n);const units:bigint[]=[];let value=0n;for(let a=1n;a<n;a++)if(gcd(a,n)===1n){units.push(a);value++;}return {value,units};}
export function divisors(n:bigint):bigint[]{const out:bigint[]=[];for(let d=1n;d*d<=n;d++)if(n%d===0n){out.push(d);if(d*d!==n)out.push(n/d);}return out.sort((a,b)=>a<b?-1:a>b?1:0);}
export function isPrime(n:bigint):boolean{if(n<2n)return false;for(let d=2n;d*d<=n;d++)if(n%d===0n)return false;return true;}
