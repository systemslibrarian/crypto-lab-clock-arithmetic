import {clock} from './clock';
export function strip(n:bigint,walk:bigint[]=[]){const set=new Set(walk);let html='<div class="residue-strip" role="list" tabindex="0" aria-label="Residue strip">';for(let i=0n;i<n;i++)html+=`<span role="listitem" class="residue ${set.has(i)?'visited':''}">${i}</span>`;return html+'</div>';}
export function diagram(n:bigint,walk:bigint[]=[]){return n<=24n?clock(n,walk):strip(n,walk);}
