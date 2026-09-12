// @ts-nocheck
import { EXTRA_PRACTICE } from './extra.js';
class Tape{
  constructor(vals){ this.a=[...vals]; this.ops=[]; this.t0=Date.now(); }
  _guard(){ if(this.ops.length>300000) throw new Error('Too many operations. This usually means a loop that never ends.');
            if(Date.now()-this.t0>3000) throw new Error('Still running after 3 seconds. Check your loop condition.'); }
  get length(){ return this.a.length; }
  get(i){ this._guard(); this.ops.push('get '+i); return this.a[i]; }
  set(i,v){ this._guard(); this.ops.push('set '+i+'='+v); this.a[i]=v; }
  swap(i,j){ this._guard(); this.ops.push('swap '+i+','+j); const t=this.a[i]; this.a[i]=this.a[j]; this.a[j]=t; }
}

const PRACTICE={
  bubble:{sig:'sort(a)',brief:'Sort the array in ascending order using bubble sort. Use a.get(i), a.swap(i, j) and a.length.',
    starter:'function sort(a) {\n  for (let i = 0; i < a.length - 1; i++) {\n    for (let j = 0; j < a.length - 1 - i; j++) {\n      // compare a.get(j) with a.get(j + 1) and swap if needed\n    }\n  }\n}',
    ref(a){ for(let i=0;i<a.length-1;i++) for(let j=0;j<a.length-1-i;j++) if(a.get(j)>a.get(j+1)) a.swap(j,j+1); },
    check:'sorted'},
  selection:{sig:'sort(a)',brief:'Sort ascending by repeatedly finding the smallest remaining value and swapping it into place.',
    starter:'function sort(a) {\n  for (let i = 0; i < a.length; i++) {\n    let m = i;\n    // scan from i + 1 for something smaller than a.get(m)\n    if (m !== i) a.swap(i, m);\n  }\n}',
    ref(a){ for(let i=0;i<a.length;i++){ let m=i; for(let j=i+1;j<a.length;j++) if(a.get(j)<a.get(m)) m=j; if(m!==i) a.swap(i,m); } },
    check:'sorted'},
  insertion:{sig:'sort(a)',brief:'Sort ascending by taking each value and sliding it left into position. Use a.get and a.set.',
    starter:'function sort(a) {\n  for (let i = 1; i < a.length; i++) {\n    const key = a.get(i);\n    let j = i - 1;\n    // shift larger values right, then drop key into the gap\n    a.set(j + 1, key);\n  }\n}',
    ref(a){ for(let i=1;i<a.length;i++){ const key=a.get(i); let j=i-1;
      while(j>=0 && a.get(j)>key){ a.set(j+1,a.get(j)); j--; } a.set(j+1,key); } },
    check:'sorted'},
  quick:{sig:'sort(a)',brief:'Sort ascending with quick sort. Partition around the last value of each range, then recurse on both sides.',
    starter:'function sort(a) {\n  function qs(lo, hi) {\n    if (lo >= hi) return;\n    const pivot = a.get(hi);\n    let i = lo;\n    // move everything smaller than pivot to the left of i\n    a.swap(i, hi);\n    qs(lo, i - 1); qs(i + 1, hi);\n  }\n  qs(0, a.length - 1);\n}',
    ref(a){ (function qs(lo,hi){ if(lo>=hi) return; const p=a.get(hi); let i=lo;
      for(let j=lo;j<hi;j++) if(a.get(j)<p){ if(i!==j) a.swap(i,j); i++; }
      a.swap(i,hi); qs(lo,i-1); qs(i+1,hi); })(0,a.length-1); },
    check:'sorted'},
  merge:{sig:'sort(a)',brief:'Sort ascending with merge sort. You may use ordinary JavaScript arrays for the temporary halves.',
    starter:'function sort(a) {\n  function ms(lo, hi) {\n    if (hi - lo <= 1) return;\n    const mid = (lo + hi) >> 1;\n    ms(lo, mid); ms(mid, hi);\n    // read both halves with a.get, merge them, write back with a.set\n  }\n  ms(0, a.length);\n}',
    ref(a){ (function ms(lo,hi){ if(hi-lo<=1) return; const mid=(lo+hi)>>1; ms(lo,mid); ms(mid,hi);
      const L=[],R=[]; for(let i=lo;i<mid;i++) L.push(a.get(i)); for(let i=mid;i<hi;i++) R.push(a.get(i));
      let x=0,y=0,k=lo;
      while(x<L.length||y<R.length){ if(y>=R.length||(x<L.length&&L[x]<=R[y])) a.set(k++,L[x++]); else a.set(k++,R[y++]); }
    })(0,a.length); },
    check:'sorted'},
  linear:{sig:'search(a, target)',brief:'Return the index of target, or -1 if it is not there. Do not assume the array is sorted.',
    starter:'function search(a, target) {\n  for (let i = 0; i < a.length; i++) {\n    // return i when you find it\n  }\n  return -1;\n}',
    ref(a,t){ for(let i=0;i<a.length;i++) if(a.get(i)===t) return i; return -1; },
    check:'index'},
  binary:{sig:'search(a, target)',brief:'The array is already sorted. Return the index of target, or -1. Halve the range each step.',
    starter:'function search(a, target) {\n  let lo = 0, hi = a.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    // compare a.get(mid) with target and move lo or hi\n  }\n  return -1;\n}',
    ref(a,t){ let lo=0,hi=a.length-1; while(lo<=hi){ const m=(lo+hi)>>1; const v=a.get(m);
      if(v===t) return m; if(v<t) lo=m+1; else hi=m-1; } return -1; },
    check:'index',sorted:true},
  'tree-in':{sig:'inorder(node)',brief:'Return an array of values from an in-order walk. Each node is { v, left, right }, and a missing child is null.',
    starter:'function inorder(node) {\n  const out = [];\n  function walk(n) {\n    if (n === null) return;\n    // left, then n.v, then right\n  }\n  walk(node);\n  return out;\n}',
    check:'tree'},
  bfs:{sig:'bfs(start, neighbours)',brief:'Return the visit order as an array of node names. neighbours(u) gives u\u2019s neighbours, already in alphabetical order.',
    starter:'function bfs(start, neighbours) {\n  const order = [], queue = [start], seen = new Set([start]);\n  while (queue.length) {\n    const node = queue.shift();\n    // visit node, then queue any unseen neighbours\n  }\n  return order;\n}',
    check:'bfs'}
};

Object.assign(PRACTICE, EXTRA_PRACTICE);

export { Tape, PRACTICE };
