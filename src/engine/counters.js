// @ts-nocheck
const COUNTERS={
  bubble(v){ const a=[...v]; let c=0; for(let i=0;i<a.length-1;i++) for(let j=0;j<a.length-1-i;j++){ c++;
    if(a[j]>a[j+1]){ const t=a[j];a[j]=a[j+1];a[j+1]=t; } } return c; },
  selection(v){ const a=[...v]; let c=0; for(let i=0;i<a.length;i++){ let m=i;
    for(let j=i+1;j<a.length;j++){ c++; if(a[j]<a[m]) m=j; } const t=a[i];a[i]=a[m];a[m]=t; } return c; },
  insertion(v){ const a=[...v]; let c=0; for(let i=1;i<a.length;i++){ const k=a[i]; let j=i-1;
    while(j>=0){ c++; if(a[j]<=k) break; a[j+1]=a[j]; j--; } a[j+1]=k; } return c; },
  merge(v){ let c=0; const a=[...v];
    (function ms(lo,hi){ if(hi-lo<=1) return; const mid=(lo+hi)>>1; ms(lo,mid); ms(mid,hi);
      const L=a.slice(lo,mid),R=a.slice(mid,hi); let x=0,y=0,k=lo;
      while(x<L.length&&y<R.length){ c++; a[k++]= L[x]<=R[y] ? L[x++] : R[y++]; }
      while(x<L.length) a[k++]=L[x++]; while(y<R.length) a[k++]=R[y++]; })(0,a.length);
    return c; },
  quick(v){ const a=[...v]; let c=0;
    (function qs(lo,hi){ if(lo>=hi) return; const p=a[hi]; let i=lo;
      for(let j=lo;j<hi;j++){ c++; if(a[j]<p){ const t=a[i];a[i]=a[j];a[j]=t; i++; } }
      const t=a[i];a[i]=a[hi];a[hi]=t; qs(lo,i-1); qs(i+1,hi); })(0,a.length-1);
    return c; },
  linear(v){ const t=v[Math.floor(Math.random()*v.length)]; let c=0;
    for(let i=0;i<v.length;i++){ c++; if(v[i]===t) break; } return c; },
  binary(v){ const a=[...v].sort((p,q)=>p-q); const t=a[Math.floor(Math.random()*a.length)];
    let lo=0,hi=a.length-1,c=0; while(lo<=hi){ c++; const m=(lo+hi)>>1;
      if(a[m]===t) break; if(a[m]<t) lo=m+1; else hi=m-1; } return c; }
};
const LAB_COLOURS={bubble:'#D6455B',selection:'#E9A23B',insertion:'#6E4FD8',merge:'#158F7E',quick:'#2B3A8C',linear:'#8B95A5',binary:'#0E7C86'};

export { COUNTERS, LAB_COLOURS };
