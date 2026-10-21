import {mod,modulus} from './mod';
export function gcd(a:bigint,b:bigint):bigint{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;}
export function gcdSteps(a:bigint,b:bigint){a=a<0n?-a:a;b=b<0n?-b:b;const rows:{a:bigint;b:bigint;q:bigint;r:bigint}[]=[];while(b){const q=a/b,r=a%b;rows.push({a,b,q,r});[a,b]=[b,r];}return {g:a,rows};}
export function egcdTable(a:bigint,n:bigint){modulus(n);let r0=a<0n?-a:a,r1=n,s0=a<0n?-1n:1n,s1=0n,t0=0n,t1=1n;const rows=[{q:null as bigint|null,r:r0,s:s0,t:t0,check:s0*a+t0*n},{q:null as bigint|null,r:r1,s:s1,t:t1,check:s1*a+t1*n}];while(r1){const q=r0/r1,r=r0-q*r1,s=s0-q*s1,t=t0-q*t1;rows.push({q,r,s,t,check:s*a+t*n});[r0,r1]=[r1,r];[s0,s1]=[s1,s];[t0,t1]=[t1,t];}return {g:r0,s:s0,t:t0,rows};}
export function inverse(a:bigint,n:bigint):{kind:'inverse';value:bigint;g:bigint;s:bigint;t:bigint}|{kind:'none';g:bigint}{const {g,s,t}=egcdTable(a,n);if(g>1n)return {kind:'none',g};return {kind:'inverse',value:mod(s,n),g,s,t};}
