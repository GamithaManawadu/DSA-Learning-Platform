// @ts-nocheck
import { GNODES, GEDGES } from '../engine/algorithms.js';

let stage=null;
let linearVertical=false;
export function setStage(el, vertical){ stage=el; linearVertical=!!vertical; }
let mounted={kind:null,map:{},extra:null};

function mountFrames(frames){
  const k=frames[0].kind; stage.innerHTML=''; mounted={kind:k,map:{},extra:null};
  if(k==='array'){
    const field=document.createElement('div'); field.className='field'; stage.appendChild(field);
    const n=frames[0].order.length;
    const W=Math.max(34,Math.min(64,(stage.clientWidth-36)/n));
    const maxV=Math.max(...Object.values(frames[0].vals));
    frames[0].order.forEach(id=>{
      const v=frames[0].vals[id];
      const d=document.createElement('div'); d.className='cell';
      d.style.width=(W-8)+'px'; d.style.height=(34+(v/maxV)*150)+'px';
      d.innerHTML='<span>'+v+'</span>'; field.appendChild(d); mounted.map[id]=d;
    });
    const idxRow=[], ptrRow=[];
    for(let i=0;i<n;i++){
      const s=document.createElement('div'); s.className='idx'; s.textContent=i;
      s.style.width=(W-8)+'px'; s.style.left=(i*W+4)+'px'; field.appendChild(s); idxRow.push(s);
    }
    mounted.extra={field,W,idxRow,ptrRow,n};
  }
  else if(k==='linear'){
    const box=document.createElement('div'); box.className='lin'; stage.appendChild(box);
    mounted.extra={box,vertical:frames.some(f=>f.line===undefined)};
  }
  else if(k==='buckets'){
    const box=document.createElement('div'); box.className='buckets'; stage.appendChild(box);
    mounted.extra={box};
  }
  else if(k==='grid'){
    const box=document.createElement('div'); box.className='gridwrap'; stage.appendChild(box);
    mounted.extra={box};
  }
  else if(k==='chain'){
    const box=document.createElement('div'); box.className='chain'; stage.appendChild(box);
    mounted.extra={box};
  }
  else if(k==='tree'||k==='graph'){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','canvas'); svg.setAttribute('viewBox','0 0 580 280');
    stage.appendChild(svg); mounted.extra={svg,edges:{},nodes:{},labels:{}};
    if(k==='graph'){
      GEDGES.forEach(([u,v,w])=>{
        const [x1,y1]=GNODES[u],[x2,y2]=GNODES[v];
        const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
        ln.setAttribute('class','edge'); ln.setAttribute('x1',x1);ln.setAttribute('y1',y1);
        ln.setAttribute('x2',x2);ln.setAttribute('y2',y2); svg.appendChild(ln);
        mounted.extra.edges[u+v]=ln; mounted.extra.edges[v+u]=ln;
        const t=document.createElementNS('http://www.w3.org/2000/svg','text');
        t.setAttribute('class','wlabel'); t.setAttribute('x',(x1+x2)/2); t.setAttribute('y',(y1+y2)/2-6);
        t.setAttribute('text-anchor','middle'); t.textContent=w; svg.appendChild(t);
      });
      Object.entries(GNODES).forEach(([k2,[x,y]])=>{
        const g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('class','node');
        g.innerHTML=`<circle cx="${x}" cy="${y}" r="22"></circle><text x="${x}" y="${y}">${k2}</text>`;
        svg.appendChild(g); mounted.extra.nodes[k2]=g;
        const d=document.createElementNS('http://www.w3.org/2000/svg','text');
        d.setAttribute('class','dlabel'); d.setAttribute('x',x); d.setAttribute('y',y+36);
        d.setAttribute('text-anchor','middle'); svg.appendChild(d); mounted.extra.labels[k2]=d;
      });
    } else {
      /* A node can appear late (BST insert) or move (heap sift, AVL rotation), so
         mount from every node seen in any frame and let draw() place them. */
      const seen=new Map();
      frames.forEach(fr=>(fr.nodes||[]).forEach(n=>{ if(!seen.has(n.id)) seen.set(n.id,n); }));
      const all=[...seen.values()];
      all.forEach(n=>{
        const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
        ln.setAttribute('class','edge tree hide');
        mounted.extra.svg.appendChild(ln); mounted.extra.edges[n.id]=ln;
      });
      all.forEach(n=>{
        const g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('class','node hide');
        g.innerHTML=`<circle cx="${n.x}" cy="${n.y}" r="21"></circle><text x="${n.x}" y="${n.y}">${n.v}</text>`;
        svg.appendChild(g); mounted.extra.nodes[n.id]=g;
      });
    }
  }
}

function draw(f){
  if(f.kind==='array'){
    const {W,field}=mounted.extra;
    f.order.forEach((id,i)=>{
      const d=mounted.map[id];
      d.style.left=(i*W+4)+'px';
      d.className='cell'+(f.roles[id]?' r-'+f.roles[id]:'');
    });
    field.querySelectorAll('.ptr').forEach(p=>p.remove());
    f.ptrs.forEach((p,k)=>{
      const el=document.createElement('div'); el.className='ptr';
      el.innerHTML=p.l+'<i>▼</i>'; el.style.width=(W-8)+'px'; el.style.left=(p.i*W+4)+'px';
      el.style.top=(k*30)+'px'; field.appendChild(el);
    });
  }
  else if(f.kind==='linear'){
    const {box}=mounted.extra; const vert=linearVertical;
    const live=new Set(f.items.map(i=>i.id));
    Object.entries(mounted.map).forEach(([id,el])=>{ if(!live.has(id)) el.classList.add('gone'); });
    f.items.forEach((it,i)=>{
      let el=mounted.map[it.id];
      if(!el){ el=document.createElement('div'); el.className='tile'; el.textContent=it.v; box.appendChild(el); mounted.map[it.id]=el; }
      el.classList.remove('gone');
      if(vert){ el.style.left='40px'; el.style.top=(190-i*52)+'px'; }
      else { el.style.left=(30+i*76)+'px'; el.style.top='96px'; }
      el.className='tile'+(f.roles[it.id]?' r-'+f.roles[it.id]:'');
    });
    box.querySelectorAll('.tag').forEach(t=>t.remove());
    const tag=(txt,l,t)=>{const e=document.createElement('div');e.className='tag';e.textContent=txt;e.style.left=l;e.style.top=t;box.appendChild(e);};
    if(vert){ tag('top of the stack','120px',(f.items.length?190-(f.items.length-1)*52+14:190)+'px'); tag('bottom','120px','204px'); }
    else if(f.items.length){ tag('front (out)','30px','70px'); tag('back (in)',(30+(f.items.length-1)*76)+'px','156px'); }
  }
  else if(f.kind==='buckets'){
    const {box}=mounted.extra; box.innerHTML='';
    box.style.gridTemplateColumns='repeat('+f.buckets.length+',minmax(0,1fr))';
    f.buckets.forEach((b,i)=>{
      const d=document.createElement('div'); d.className='bk'+(i===f.on?' on':'');
      const label=f.labels?f.labels[i]:i;
      d.innerHTML='<h4>'+label+'</h4>'+b.map(pr=>
        `<div class="pair${f.hit===pr.k?' hit':''}">${pr.v===''||pr.v===undefined?pr.k:pr.k+'<br>'+pr.v}</div>`).join('');
      box.appendChild(d);
    });
  }
  else if(f.kind==='grid'){
    const {box}=mounted.extra;
    box.innerHTML='<table class="dpgrid"><tbody>'+
      (f.cols?'<tr><th></th>'+f.cols.map(c=>`<th>${c}</th>`).join('')+'</tr>':'')+
      f.rows.map(r=>'<tr><th>'+r.label+'</th>'+
        r.cells.map(c=>`<td class="${c.role||''}">${c.t===undefined?'':c.t}</td>`).join('')+'</tr>').join('')+
      '</tbody></table>';
  }
  else if(f.kind==='chain'){
    const {box}=mounted.extra;
    box.innerHTML=f.nodes.map(n=>
      `<span class="cnode ${n.role||''}"><b>${n.v}</b><i>${n.id}</i></span>`).join('<span class="arrow">\u2192</span>')+
      (f.nodes.length?'<span class="arrow">\u2192</span>':'')+'<span class="cnull">null</span>';
  }
  else if(f.kind==='tree'){
    const {nodes,edges}=mounted.extra;
    const byId=Object.fromEntries(f.nodes.map(n=>[n.id,n]));
    f.nodes.forEach(n=>{
      const g=nodes[n.id]; if(!g) return;
      const on=f.present.includes(n.id);
      g.setAttribute('class','node'+(on?'':' hide')+(f.cur===n.id?' cur':'')+(f.seen.includes(n.id)?' seen':''));
      const c=g.firstChild, t=g.lastChild;
      c.setAttribute('cx',n.x); c.setAttribute('cy',n.y);
      t.setAttribute('x',n.x);  t.setAttribute('y',n.y);
      t.textContent=n.v;
      const ln=edges[n.id]; if(!ln) return;
      const par=n.parent?byId[n.parent]:null;
      if(par && on && f.present.includes(par.id)){
        ln.setAttribute('class','edge tree');
        ln.setAttribute('x1',par.x); ln.setAttribute('y1',par.y);
        ln.setAttribute('x2',n.x);   ln.setAttribute('y2',n.y);
      } else ln.setAttribute('class','edge tree hide');
    });
  }
  else if(f.kind==='graph'){
    const {nodes,edges,labels}=mounted.extra;
    Object.entries(nodes).forEach(([k,g])=>{
      g.setAttribute('class','node'+(f.cur===k?' cur':'')+(f.seen.includes(k)&&f.cur!==k?' seen':'')+(f.frontier.includes(k)&&f.cur!==k&&!f.seen.includes(k)?' frontier':''));
      labels[k].textContent = f.dist ? (f.dist[k]===Infinity?'∞':f.dist[k]) : '';
    });
    Object.values(edges).forEach(e=>e.setAttribute('class','edge'));
    if(f.edge && edges[f.edge[0]+f.edge[1]]) edges[f.edge[0]+f.edge[1]].setAttribute('class','edge on');
  }
}

/* ============================================================
   5. STANDARD LIBRARY — what you actually type at work
   ============================================================ */
const SORT_CALLS=[
  ['Python','sorted(xs)  |  xs.sort()','Timsort. Stable. Give it key=lambda r: r.age to sort objects.'],
  ['Java','Collections.sort(list)  |  Arrays.sort(arr)','Timsort for objects, dual-pivot quicksort for primitives.'],
  ['JavaScript','arr.sort((a, b) => a - b)','Without the comparator it sorts as text, so 10 comes before 9.'],
  ['C++','std::sort(v.begin(), v.end())','Introsort. Use std::stable_sort when ties must keep their order.']];

const STDLIB={
  bubble:{calls:SORT_CALLS,costs:[['Library sort','O(n log n)'],['Your bubble sort','O(n²)']],
    gotcha:'There is no situation in ordinary application code where hand-written bubble sort is the right call.'},
  selection:{calls:SORT_CALLS,costs:[['Library sort','O(n log n)'],['Your selection sort','O(n²)']],
    gotcha:'If you truly need to minimise writes, say so in a comment, because the next reader will assume this is a mistake.'},
  insertion:{calls:SORT_CALLS,costs:[['Library sort','O(n log n)'],['Insertion on nearly sorted data','close to O(n)']],
    gotcha:'Library sorts already detect nearly-sorted input. Timsort finds existing sorted runs and reuses them, so you rarely beat it by hand.'},
  merge:{calls:SORT_CALLS,costs:[['Library sort','O(n log n)'],['Merging k sorted sources','O(n log k) with a heap']],
    gotcha:'To merge many sorted streams use a heap: Python heapq.merge, Java PriorityQueue, C++ std::priority_queue.'},
  quick:{calls:SORT_CALLS.concat([['Python','statistics.median(xs)','For a median specifically, do not sort by hand.']]),
    costs:[['Library sort','O(n log n)'],['Select k-th (quickselect)','O(n) average']],
    gotcha:'C++ has std::nth_element for exactly the quickselect job. Most other languages make you sort, which is fine below a few hundred thousand items.'},
  linear:{calls:[['Python','x in xs  |  next(r for r in xs if r.id == k)','in on a list is a scan; in on a set is a hash lookup.'],
      ['Java','list.contains(x)','O(n) on ArrayList, O(1) on HashSet.'],
      ['JavaScript','arr.includes(x)  |  arr.find(fn)','Both scan. A Set or Map does not.'],
      ['C++','std::find(v.begin(), v.end(), x)','Returns an iterator, compare it against v.end().']],
    costs:[['Scan a list','O(n)'],['Hash set lookup','O(1)']],
    gotcha:'A scan inside a loop over the same data is the most common accidental O(n²) in real code. If you see in or contains inside a loop, reach for a set.'},
  binary:{calls:[['Python','bisect.bisect_left(xs, x)  |  bisect.insort(xs, x)','Standard library, already correct. Do not hand-roll it.'],
      ['Java','Collections.binarySearch(list, key)','Negative return encodes the insertion point.'],
      ['JavaScript','—','No built-in. This is one of the few you may legitimately write yourself.'],
      ['C++','std::lower_bound(v.begin(), v.end(), x)','Returns the first element not less than x.']],
    costs:[['Binary search','O(log n)'],['Keeping a list sorted on insert','O(n) per insert']],
    gotcha:'bisect_left and lower_bound give you the insertion point, which is more useful than a plain found or not found. Use them for range boundaries.'},
  stack:{calls:[['Python','xs.append(x)  |  xs.pop()','A plain list is already a perfectly good stack.'],
      ['Java','Deque<T> s = new ArrayDeque<>(); s.push(x); s.pop();','Do not use the legacy Stack class, it is synchronised and slow.'],
      ['JavaScript','arr.push(x)  |  arr.pop()','Both O(1).'],
      ['C++','std::stack<T>','Wraps a deque.']],
    costs:[['push / pop / peek','O(1)']],
    gotcha:'Recursion is a stack you did not declare. If depth might reach the tens of thousands, convert it to an explicit stack before it crashes in production.'},
  queue:{calls:[['Python','from collections import deque; q.append(x); q.popleft()','Never use list.pop(0).'],
      ['Java','Deque<T> q = new ArrayDeque<>(); q.add(x); q.poll();','Use LinkedBlockingQueue across threads.'],
      ['JavaScript','—','arr.shift() is O(n). For big queues keep a head index or use a library deque.'],
      ['C++','std::queue<T>','Wraps a deque.']],
    costs:[['deque append / popleft','O(1)'],['list.pop(0) or arr.shift()','O(n)']],
    gotcha:'This is the single most common silent performance bug for beginners. Popping the front of an array shifts every remaining element.'},
  hashmap:{calls:[['Python','d = {}  |  s = set()  |  collections.Counter(xs)','Counter is a hash map built for tallying.'],
      ['Java','new HashMap<>()  |  new HashSet<>()','Override equals and hashCode together on key classes or lookups silently fail.'],
      ['JavaScript','new Map()  |  new Set()','Prefer Map over a plain object for non-string keys and for size.'],
      ['C++','std::unordered_map  |  std::unordered_set','std::map is the ordered tree, not the hash map. Easy to pick the wrong one.']],
    costs:[['get / put / contains','O(1) average'],['Iteration order','not sorted, and not guaranteed stable']],
    gotcha:'A mutable object used as a key is a trap. Change a field after inserting and the entry becomes unreachable, because it now hashes to a different bucket.'},
  'bst-insert':{calls:[['Python','sortedcontainers.SortedDict (third party)','Python has no ordered map in the standard library, which surprises people.'],
      ['Java','new TreeMap<>()  |  new TreeSet<>()','Red-black tree. Gives firstKey, headMap, tailMap, subMap.'],
      ['JavaScript','—','No ordered map. Sort keys, or use a library.'],
      ['C++','std::map  |  std::set','Red-black tree, sorted iteration, lower_bound built in.']],
    costs:[['get / put','O(log n)'],['Range query','O(log n + k) for k results'],['Sorted iteration','O(n), no sorting needed']],
    gotcha:'Reach for a tree map only when you need order. For plain lookups a hash map is faster and simpler, and choosing the tree by default costs you performance for nothing.'},
  'tree-pre':{calls:[['Any language','recursion, or an explicit stack','Push the node, then push its children in reverse so the left child comes off first.']],
    costs:[['Full traversal','O(n)'],['Extra space','O(h), the height of the tree']],
    gotcha:'On an unbalanced tree the height can be n, so recursive traversal on user-supplied data is a stack overflow waiting to happen.'},
  'tree-in':{calls:[['Java','treeMap.entrySet()  |  treeMap.subMap(lo, hi)','Iteration is an in-order walk, which is why it comes out sorted.'],
      ['C++','for (auto& kv : map)  |  map.lower_bound(k)','Same guarantee.'],
      ['SQL','ORDER BY col, with an index on col','The database walks the index instead of sorting.']],
    costs:[['Full traversal','O(n)'],['Range walk','O(log n + k)']],
    gotcha:'If your ORDER BY matches an existing index, the sort disappears from the query plan. If it does not, the database sorts every matching row, sometimes on disk.'},
  'tree-post':{calls:[['Any language','recursion, children before the node','Or two stacks, if you must do it iteratively.']],
    costs:[['Full traversal','O(n)'],['Extra space','O(h)']],
    gotcha:'Any bottom-up aggregate is post-order: folder sizes, rolled-up totals, dependency cost estimates. If a parent value depends on child values, this is your order.'},
  bfs:{calls:[['Python','from collections import deque; q = deque([start])','Plus a set for seen.'],
      ['Java','ArrayDeque for the queue, HashSet for seen',''],
      ['Libraries','networkx.shortest_path (Python), JGraphT (Java)','Use a graph library before writing your own for anything non-trivial.']],
    costs:[['BFS','O(V + E)'],['Space','O(V) for the queue and seen set']],
    gotcha:'Mark nodes seen when you enqueue them, not when you dequeue them. Marking on dequeue lets the same node enter the queue several times and quietly doubles the work.'},
  dfs:{calls:[['Python','recursion, or an explicit list as a stack','sys.setrecursionlimit is a warning sign, not a fix.'],
      ['Libraries','networkx.topological_sort, networkx.simple_cycles','Cycle detection and topological sort are already written.']],
    costs:[['DFS','O(V + E)'],['Recursion depth','up to O(V)']],
    gotcha:'Python defaults to about 1000 recursion frames. A graph deeper than that crashes, and graphs built from user data get deep in ways you did not plan for.'},
  dijkstra:{calls:[['Python','heapq for the priority queue, or networkx.dijkstra_path','heapq is a min-heap of tuples: (distance, node).'],
      ['Java','PriorityQueue with a comparator on distance',''],
      ['C++','std::priority_queue, with negated costs for a min-heap','Or use greater<> as the comparator.']],
    costs:[['With a heap','O(E log V)'],['Scanning for the minimum instead','O(V²)']],
    gotcha:'The version shown here scans for the cheapest node, which is O(V²). Real implementations use a priority queue. On a sparse graph that is the difference between usable and not.'}
};

/* ============================================================
   6. PRACTICE — write it, then diff against the reference
   ============================================================ */
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

/* ============================================================
   7. COMPLEXITY LAB — count, do not assume
   ============================================================ */
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

/* ============================================================
   8. DEBUG GALLERY — broken code, find the fault by stepping
   ============================================================ */
function brokenBubble(vals){
  const a=mkEls(vals), n=a.length, f=[], roles={};
  f.push(snapArr(a,roles,'This is bubble sort with one character changed. Step to the end and check the result.',0,[],[]));
  for(let i=0;i<n-1;i++){
    for(let j=0;j<n-2-i;j++){
      keepDone(roles); roles[a[j].id]='cmp'; roles[a[j+1].id]='cmp';
      f.push(snapArr(a,roles,`Compare ${a[j].v} and ${a[j+1].v}.`,1,[{l:'j',i:j}],[['j reaches',n-3-i]]));
      if(a[j].v>a[j+1].v){ roles[a[j].id]='mov'; roles[a[j+1].id]='mov'; [a[j],a[j+1]]=[a[j+1],a[j]];
        f.push(snapArr(a,roles,'Swap.',2,[{l:'j',i:j}],[])); }
    }
    keepDone(roles);
    f.push(snapArr(a,roles,`End of pass ${i+1}. Watch which position the j pointer never reached.`,1,[],[]));
  }
  const out=a.map(e=>e.v), ok=out.every((v,i)=>i===0||out[i-1]<=v);
  f.push(snapArr(a,roles,ok?'This run happens to come out sorted. Press "New input" and try again, because the fault is intermittent.':'<b>The result is not sorted.</b> The last pair was never compared on any pass.',1,[],[]));
  return f;
}
function brokenBinary(vals){
  const a=mkEls([...vals].sort((p,q)=>p-q)), f=[], roles={};
  const target=Math.min(...vals)-1;   // smaller than everything, so the faulty branch is the one taken
  let lo=0,hi=a.length-1,guard=0;
  const shade=()=>{ keepDone(roles); a.forEach((e,i)=>{ if(i<lo||i>hi) roles[e.id]='out'; }); };
  shade();
  f.push(snapArr(a,roles,`Searching for <b>${target}</b>, which is not in the array. A correct binary search reports -1 after about four checks.`,0,[{l:'lo',i:lo},{l:'hi',i:hi}],[['target',target]]));
  while(lo<=hi && guard<24){
    guard++;
    const mid=(lo+hi)>>1; shade(); roles[a[mid].id]='cmp';
    f.push(snapArr(a,roles,`Check position ${mid}.`,2,[{l:'lo',i:lo},{l:'mid',i:mid},{l:'hi',i:hi}],[['lo',lo],['hi',hi],['loop count',guard]]));
    if(a[mid].v===target) break;
    if(a[mid].v<target){ lo=mid+1; shade();
      f.push(snapArr(a,roles,'Too small, so search the right half.',3,[{l:'lo',i:lo},{l:'hi',i:hi}],[['lo',lo],['hi',hi],['loop count',guard]])); }
    else { hi=mid; shade();
      f.push(snapArr(a,roles,'Too big, so search the left half.',4,[{l:'lo',i:lo},{l:'hi',i:hi}],[['lo',lo],['hi',hi],['loop count',guard]])); }
  }
  f.push(snapArr(a,roles,'<b>Stopped after 24 iterations.</b> lo and hi stopped moving, so the loop condition can never become false. In production this pins a CPU core at 100 percent.',2,[{l:'lo',i:lo},{l:'hi',i:hi}],[['lo',lo],['hi',hi]]));
  return f;
}
function brokenInsertion(vals){
  const a=mkEls(vals), n=a.length, f=[], roles={};
  roles[a[0].id]='done';
  f.push(snapArr(a,roles,'Insertion sort with the comparison the wrong way round. Watch which direction values travel.',0,[],[]));
  for(let i=1;i<n;i++){
    let j=i-1; keepDone(roles); roles[a[i].id]='cmp';
    f.push(snapArr(a,roles,`Pick up <b>${a[i].v}</b>.`,1,[{l:'key',i}],[]));
    while(j>=0 && a[j].v<a[j+1].v){
      keepDone(roles); roles[a[j].id]='mov'; roles[a[j+1].id]='mov';
      [a[j],a[j+1]]=[a[j+1],a[j]];
      f.push(snapArr(a,roles,`The left value is smaller, so they swap.`,3,[{l:'j',i:j}],[]));
      j--;
    }
    keepDone(roles);
    f.push(snapArr(a,roles,`Placed.`,5,[],[]));
  }
  f.push(snapArr(a,roles,'<b>The output is sorted, but descending.</b> Everything else about the algorithm is correct.',3,[],[]));
  return f;
}
function brokenBfs(){
  const f=[], seen=new Set(), q=['A'], out=[]; let guard=0;
  f.push(snapGraph(null,seen,q,null,null,out,'This BFS never records which nodes it has already seen. Watch the queue.',0,[['queue','A']]));
  while(q.length && guard<26){
    guard++;
    const u=q.shift(); out.push(u);
    f.push(snapGraph(u,seen,q,null,null,out,`Visit <b>${u}</b>.`,2,[['queue',q.join(', ')||'empty'],['visits so far',out.length]]));
    for(const [v] of nbrs(u)){
      q.push(v);
      f.push(snapGraph(u,seen,q,[u,v],null,out,`Add ${v} to the queue.`,4,[['queue',q.join(', ')],['queue length',q.length]]));
    }
  }
  f.push(snapGraph(null,seen,q,null,null,out,`<b>Stopped after 26 steps.</b> The queue is still ${q.length} long and growing. Visit order so far: ${out.join(' ')}.`,2,[['queue length',q.length]]));
  return f;
}

const BUGS=[
 {id:'bug-bubble',t:'Bubble sort that sometimes works',time:'O(n²)',space:'O(1)',
  idea:'One character in the inner loop bound is wrong. The code runs, produces output, and passes many tests. Step to the end and watch the rightmost pair.',
  build:()=>brokenBubble(DEF_VALS()),
  code:['for i in range(n - 1):','  for j in range(n - 2 - i):','    if a[j] > a[j+1]:','      swap(a[j], a[j+1])'],
  q:{q:'What is the fault?',o:['The swap is backwards','The inner loop stops one position early, so the last pair is never compared','The outer loop runs too many times'],a:1,
     why:'The bound should be n - 1 - i. Because it is n - 2 - i, the final pair in each pass is skipped. Small or lucky inputs still come out sorted, which is exactly what makes an off-by-one dangerous: it passes your tests and fails on a customer.'}},
 {id:'bug-binary',t:'Binary search that never returns',time:'never terminates',space:'O(1)',
  idea:'The target is deliberately not in the array. A correct binary search reports -1 after about four checks. Watch lo and hi in the panel below.',
  build:()=>brokenBinary(DEF_VALS()),
  code:['while lo <= hi:','  mid = (lo + hi) // 2','  if a[mid] == target: return mid','  if a[mid] < target: lo = mid + 1','  else: hi = mid          # should be mid - 1','return -1'],
  q:{q:'Why does the loop never end?',o:['The array is not sorted','hi = mid can leave lo and hi unchanged, so the range stops shrinking','mid is computed wrongly'],a:1,
     why:'When hi = lo + 1, mid rounds down to lo. Setting hi = mid puts hi back where it already was, so the next iteration is identical. The range must shrink every time, which is what mid - 1 guarantees. This exact shape is a common cause of a process pinned at 100 percent CPU.'}},
 {id:'bug-insertion',t:'Insertion sort with a flipped comparison',time:'O(n²)',space:'O(1)',
  idea:'The algorithm is structurally correct and terminates cleanly. Only the comparison operator is wrong. Look at the finished output rather than the process.',
  build:()=>brokenInsertion(DEF_VALS()),
  code:['for i in range(1, n):','  key = a[i]','  j = i - 1','  while j >= 0 and a[j] < key:   # should be >','    shift a[j] right','    j -= 1','  place key'],
  q:{q:'What does this bug produce?',o:['A crash','A correctly sorted list in descending order','A list with duplicated values'],a:1,
     why:'Reversing the comparison reverses the sort. It is harmless in isolation and catastrophic when something downstream assumes ascending order, such as a binary search over the result. Bugs that produce plausible-looking output survive far longer than bugs that crash.'}},
 {id:'bug-bfs',t:'Breadth-first search with no seen set',time:'never terminates',space:'unbounded',
  idea:'Neighbours are queued without checking whether they were already visited. Watch the queue length in the panel below rather than the picture.',
  build:brokenBfs,
  code:['queue = [start]','while queue:','  node = queue.pop(0)','  visit(node)','  for nb in neighbours(node):','    queue.append(nb)   # no seen check'],
  q:{q:'What goes wrong on a graph with cycles?',o:['Some nodes are never visited','Nodes are queued again every time they are reached, so the queue grows without limit','The order comes out reversed'],a:1,
     why:'A and B are neighbours of each other, so each keeps re-adding the other. The queue grows faster than it drains and the process eventually runs out of memory. On a tree this code works perfectly, which is why the bug survives testing on simple data and dies on real data.'}}
];

/* ============================================================
   9. DRILLS — choosing under realistic constraints
   ============================================================ */
const DRILLS=[
 {q:'You store 50 million session tokens. You need to check "is this token valid" on every request, and expire old ones.',
  o:['A sorted array with binary search','A hash set, with expiry handled separately','A linked list'],a:1,
  why:'Membership checks are the hot path and you never need the tokens in order, so hashing wins. Expiry is a separate concern, usually a time-to-live in the store itself rather than something your data structure handles.'},
 {q:'A leaderboard needs "top 10" and "what rank is player X" on every page load, with scores updating constantly.',
  o:['A hash map from player to score','An ordered structure keyed by score, such as a sorted set','Re-sort an array after every score change'],a:1,
  why:'A hash map cannot answer ranking questions without scanning everyone. Re-sorting on every update is O(n log n) per change. An ordered structure gives you top-k and rank directly, which is exactly why Redis ships a sorted set type.'},
 {q:'A 2 GB CSV must be sorted by timestamp on a laptop with 16 GB of RAM.',
  o:['Load it and call the library sort','Write an external merge sort','Insert every row into a database first'],a:0,
  why:'It fits in memory with room to spare, so the boring answer is correct. External sorting is for data that genuinely does not fit. Reaching for the sophisticated tool when the simple one works is its own kind of mistake.'},
 {q:'Same file, but it is now 200 GB and the machine still has 16 GB.',
  o:['Load it and call the library sort','Sort chunks to disk and merge them, or use a tool that already does','Use a faster comparison function'],a:1,
  why:'Nothing about your comparison function matters if the data cannot be loaded. This is the external sort case, and command-line sort already implements it, so you probably do not write it yourself.'},
 {q:'Your API is slow. Profiling shows one endpoint calls list.contains(id) inside a loop over another list.',
  o:['Add a cache in front of the endpoint','Convert the inner list to a set before the loop','Add more server instances'],a:1,
  why:'That pattern is O(n × m). Building a set once makes it O(n + m), often a hundredfold improvement for three lines of change. Caching or scaling hides the problem and keeps paying for it.'},
 {q:'You need the median response time from 10 million recorded latencies, once per minute.',
  o:['Sort all 10 million and take the middle','Quickselect, or a percentile estimator such as t-digest','Keep a running average'],a:1,
  why:'An average is not a median and hides the tail entirely. Full sorting does far more work than the question requires. Selection gets the exact answer in linear time, and streaming estimators get a close answer in constant memory.'},
 {q:'An autocomplete box must suggest all products starting with the typed prefix.',
  o:['A hash map keyed by product name','A sorted structure, where a prefix is a contiguous range','Scan all products on each keystroke'],a:1,
  why:'Hashing destroys the relationship between similar keys, so a hash map cannot find "everything starting with cam". In sorted order those entries sit together, so the query becomes a range walk. A trie is the specialised version of the same idea.'},
 {q:'A job scheduler must always run the highest-priority waiting job next.',
  o:['A queue','A priority queue, that is, a heap','A sorted list, re-sorted on every insert'],a:1,
  why:'A plain queue gives you arrival order, not priority. Re-sorting on every insert is O(n log n) per job. A heap gives you insert and extract-highest in O(log n), which is what every scheduler and every Dijkstra implementation uses.'},
 {q:'You are deduplicating 100 million log lines and cannot fit them all in memory.',
  o:['A hash set of every line','Sort the file, then drop adjacent duplicates','Compare every line to every other line'],a:1,
  why:'Once sorted, duplicates are neighbours, so one pass removes them and sorting can spill to disk. A hash set of everything is the in-memory answer and here it does not fit. A Bloom filter is the third option when an approximate answer is acceptable.'},
 {q:'Your recursive directory walker crashes with a stack overflow on a customer machine.',
  o:['Increase the recursion limit','Rewrite it with an explicit stack','Catch the exception and continue'],a:1,
  why:'Raising the limit moves the failure rather than removing it, and the next customer has a deeper tree. An explicit stack uses the heap, which is far larger, and makes the depth a visible variable you can bound.'},
 {q:'Two services each hold a lock the other is waiting for. Nothing progresses.',
  o:['A deadlock, which is a cycle in the wait-for graph','A race condition','A memory leak'],a:0,
  why:'Detection is cycle detection over a graph of who waits for whom, which is the DFS check you have already seen. Prevention is usually a fixed lock ordering, which makes a cycle impossible by construction.'},
 {q:'A social feature needs "people within two connections of you" for a user with 900 friends.',
  o:['BFS to depth 2','DFS across the whole graph',"Dijkstra's algorithm"],a:0,
  why:'BFS levels are degrees of separation, so you simply stop after level two. DFS would wander far away before finishing anything nearby, and Dijkstra solves weighted costs, which is a question nobody asked here.'},
 {q:'A delivery route must minimise fuel cost, where each road segment has a different cost.',
  o:['BFS, because it finds the shortest path',"Dijkstra, or A* if you have a distance estimate",'Sort the roads by cost and take the cheapest ones'],a:1,
  why:'BFS minimises the number of segments, which is not the same as minimising cost. Weighted edges are precisely the case Dijkstra exists for. Greedily grabbing cheap roads gives you a minimum spanning tree, which answers a different question.'},
 {q:'A configuration object is used as a key in a hash map, then one of its fields is changed.',
  o:['Nothing, hash maps handle this','The entry becomes unreachable because the key now hashes elsewhere','The map re-sorts itself'],a:1,
  why:'The entry still occupies its original bucket, but lookups now compute a different bucket and find nothing. The map reports the key as absent while still holding it. Use immutable keys; several languages enforce this and the ones that do not make this bug easy to write.'},
 {q:'A queue between your producer and consumer has been growing steadily for an hour.',
  o:['Increase the queue size','Add consumers, or reduce the work each message needs','Restart the producer'],a:1,
  why:'A growing queue means arrival rate exceeds service rate. A bigger buffer only delays the failure while making the eventual latency worse. Either serve faster or accept less, and the queue depth graph is your earliest warning of both.'},
 {q:'A query filtering on status and ordering by created_at is slow on a 20 million row table.',
  o:['Add an index covering the filter and the sort order','Add more memory to the database','Split the query in two'],a:0,
  why:'Without a matching index the engine scans every row and then sorts the survivors, sometimes spilling to disk. An index that matches both the filter and the ordering removes the scan and the sort together, which is usually the difference between seconds and milliseconds.'},
 {q:'You must keep a rolling list of the 100 most recent events in memory, cheaply.',
  o:['A list you truncate after every append','A fixed-size ring buffer, or a deque with a max length','A sorted set by timestamp'],a:1,
  why:'Truncating copies the list every time. A ring buffer or bounded deque makes both the append and the eviction O(1) with no allocation, which is why logging and metrics libraries use them.'},
 {q:'An interviewer asks you to find whether any two numbers in a list sum to a target.',
  o:['Check every pair','Put each number in a hash set and look for target minus current','Sort the list first, always'],a:1,
  why:'Checking every pair is O(n²). One pass with a hash set is O(n) and is the answer they are listening for. Sorting with two pointers is also valid at O(n log n), and is the better answer if you are told you cannot use extra memory.'}
];

export { mountFrames, draw };
