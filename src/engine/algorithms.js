// @ts-nocheck
const rnd = (n, lo, hi) => Array.from({length:n}, () => lo + Math.floor(Math.random()*(hi-lo+1)));
const mkEls = vals => vals.map((v,i)=>({id:'e'+i+'_'+v, v}));

function snapArr(a, roles, note, line, ptrs, watch){
  return {kind:'array', order:a.map(e=>e.id), vals:Object.fromEntries(a.map(e=>[e.id,e.v])),
          roles:{...roles}, note, line, ptrs:(ptrs||[]).map(p=>({...p})), watch:watch||[]};
}
function keepDone(roles){ for(const k in roles) if(roles[k]!=='done') delete roles[k]; }

/* ---------- array algorithms ---------- */

function bubble(vals){
  const a = mkEls(vals), n = a.length, f = [], roles = {}; let cmp=0, sw=0;
  const w = ()=>[['comparisons',cmp],['swaps',sw]];
  f.push(snapArr(a,roles,'Nothing is sorted yet. Bubble sort walks through the list again and again, swapping neighbours that are out of order.',0,[],w()));
  for(let i=0;i<n-1;i++){
    for(let j=0;j<n-1-i;j++){
      keepDone(roles); roles[a[j].id]='cmp'; roles[a[j+1].id]='cmp'; cmp++;
      const p=[{l:'j',i:j}];
      f.push(snapArr(a,roles,`Compare <b>${a[j].v}</b> and <b>${a[j+1].v}</b>.`,2,p,w()));
      if(a[j].v>a[j+1].v){
        roles[a[j].id]='mov'; roles[a[j+1].id]='mov'; sw++;
        [a[j],a[j+1]]=[a[j+1],a[j]];
        f.push(snapArr(a,roles,`The left one is bigger, so they swap places.`,3,p,w()));
      } else {
        f.push(snapArr(a,roles,`Already in order. Leave them and move right.`,2,p,w()));
      }
    }
    keepDone(roles); roles[a[n-1-i].id]='done';
    f.push(snapArr(a,roles,`The biggest value left, <b>${a[n-1-i].v}</b>, has bubbled to the end. It never moves again.`,4,[],w()));
  }
  roles[a[0].id]='done';
  f.push(snapArr(a,roles,`Sorted, after ${cmp} comparisons and ${sw} swaps.`,4,[],w()));
  return f;
}

function selection(vals){
  const a = mkEls(vals), n = a.length, f = [], roles = {}; let cmp=0, sw=0;
  const w = ()=>[['comparisons',cmp],['swaps',sw]];
  f.push(snapArr(a,roles,'Selection sort finds the smallest value, puts it first, then repeats on the rest.',0,[],w()));
  for(let i=0;i<n;i++){
    let m=i; keepDone(roles); roles[a[m].id]='pivot';
    f.push(snapArr(a,roles,`Assume <b>${a[m].v}</b> is the smallest of what is left.`,1,[{l:'i',i}],w()));
    for(let j=i+1;j<n;j++){
      keepDone(roles); roles[a[m].id]='pivot'; roles[a[j].id]='cmp'; cmp++;
      f.push(snapArr(a,roles,`Is <b>${a[j].v}</b> smaller than <b>${a[m].v}</b>?`,3,[{l:'i',i},{l:'j',i:j}],w()));
      if(a[j].v<a[m].v){ m=j; keepDone(roles); roles[a[m].id]='pivot';
        f.push(snapArr(a,roles,`Yes. <b>${a[m].v}</b> is the new smallest so far.`,4,[{l:'i',i},{l:'j',i:j}],w())); }
    }
    if(m!==i){ keepDone(roles); roles[a[i].id]='mov'; roles[a[m].id]='mov'; sw++;
      [a[i],a[m]]=[a[m],a[i]];
      f.push(snapArr(a,roles,`Swap the smallest value into position ${i}.`,5,[{l:'i',i}],w())); }
    keepDone(roles); roles[a[i].id]='done';
    f.push(snapArr(a,roles,`Position ${i} is finished.`,5,[],w()));
  }
  f.push(snapArr(a,roles,`Sorted. Notice it always does the same ${cmp} comparisons, no matter the input.`,5,[],w()));
  return f;
}

function insertion(vals){
  const a = mkEls(vals), n = a.length, f = [], roles = {}; let cmp=0, mv=0;
  const w = ()=>[['comparisons',cmp],['shifts',mv]];
  roles[a[0].id]='done';
  f.push(snapArr(a,roles,'Treat the first card as an already-sorted hand. Pick up each next card and slide it into place.',0,[],w()));
  for(let i=1;i<n;i++){
    let j=i-1; keepDone(roles); roles[a[i].id]='cmp';
    f.push(snapArr(a,roles,`Pick up <b>${a[i].v}</b>.`,1,[{l:'key',i}],w()));
    while(j>=0 && a[j].v>a[j+1].v){
      cmp++; mv++;
      keepDone(roles); roles[a[j].id]='mov'; roles[a[j+1].id]='mov';
      [a[j],a[j+1]]=[a[j+1],a[j]];
      f.push(snapArr(a,roles,`<b>${a[j+1].v}</b> is bigger, so it shifts right and the card slides left.`,4,[{l:'j',i:j}],w()));
      j--;
    }
    if(j>=0) cmp++;
    keepDone(roles); for(let k=0;k<=i;k++) roles[a[k].id]='done';
    f.push(snapArr(a,roles,`The first ${i+1} values are in order among themselves.`,6,[],w()));
  }
  f.push(snapArr(a,roles,`Sorted. Nearly-sorted input makes this very fast: the while loop barely runs.`,6,[],w()));
  return f;
}

function quick(vals){
  const a = mkEls(vals), f = [], roles = {}; let cmp=0, sw=0;
  const w = ()=>[['comparisons',cmp],['swaps',sw]];
  const mark = (lo,hi)=>{ keepDone(roles); for(let k=lo;k<=hi;k++) if(roles[a[k].id]!=='done') roles[a[k].id]='range'; };
  f.push(snapArr(a,roles,'Quick sort picks a pivot, pushes everything smaller to its left, then repeats on each side.',0,[],w()));
  (function qs(lo,hi){
    if(lo>=hi){ if(lo===hi){ keepDone(roles); roles[a[lo].id]='done';
      f.push(snapArr(a,roles,`A single value is already in place.`,1,[],w())); } return; }
    const pv=a[hi].v; mark(lo,hi); roles[a[hi].id]='pivot';
    f.push(snapArr(a,roles,`Work on positions ${lo} to ${hi}. The pivot is <b>${pv}</b>.`,2,[{l:'pivot',i:hi}],w()));
    let i=lo;
    for(let j=lo;j<hi;j++){
      mark(lo,hi); roles[a[hi].id]='pivot'; roles[a[j].id]='cmp'; cmp++;
      f.push(snapArr(a,roles,`Is <b>${a[j].v}</b> smaller than the pivot <b>${pv}</b>?`,5,[{l:'j',i:j},{l:'i',i}],w()));
      if(a[j].v<pv){
        if(i!==j){ sw++; [a[i],a[j]]=[a[j],a[i]]; }
        mark(lo,hi); roles[a[hi].id]='pivot'; roles[a[i].id]='mov';
        f.push(snapArr(a,roles,`Yes, so it moves to the left group.`,5,[{l:'i',i:i+1}],w()));
        i++;
      }
    }
    sw++; [a[i],a[hi]]=[a[hi],a[i]];
    keepDone(roles); roles[a[i].id]='done';
    f.push(snapArr(a,roles,`Drop the pivot between the two groups. <b>${pv}</b> is now in its final position.`,6,[],w()));
    qs(lo,i-1); qs(i+1,hi);
  })(0,a.length-1);
  keepDone(roles); a.forEach(e=>roles[e.id]='done');
  f.push(snapArr(a,roles,`Sorted with ${cmp} comparisons.`,7,[],w()));
  return f;
}

function merge(vals){
  const a = mkEls(vals), f = [], roles = {}; let writes=0;
  const w = ()=>[['writes',writes]];
  const mark = (lo,hi)=>{ keepDone(roles); for(let k=lo;k<hi;k++) roles[a[k].id]='range'; };
  f.push(snapArr(a,roles,'Merge sort splits the list in half over and over, then merges the sorted halves back together.',0,[],w()));
  (function ms(lo,hi){
    if(hi-lo<=1) return;
    const mid=(lo+hi)>>1;
    mark(lo,hi);
    f.push(snapArr(a,roles,`Split positions ${lo}–${hi-1} into two halves at ${mid}.`,2,[{l:'mid',i:mid}],w()));
    ms(lo,mid); ms(mid,hi);
    const L=a.slice(lo,mid), R=a.slice(mid,hi), out=[];
    let x=0,y=0;
    while(x<L.length||y<R.length){
      if(y>=R.length || (x<L.length && L[x].v<=R[y].v)) out.push(L[x++]); else out.push(R[y++]);
    }
    for(let k=0;k<out.length;k++){
      a[lo+k]=out[k]; writes++;
      mark(lo,hi); roles[a[lo+k].id]='mov';
      f.push(snapArr(a,roles,`Take the smaller front value, <b>${out[k].v}</b>, and write it into position ${lo+k}.`,4,[],w()));
    }
    mark(lo,hi);
    f.push(snapArr(a,roles,`Positions ${lo}–${hi-1} are now sorted as a block.`,4,[],w()));
  })(0,a.length);
  a.forEach(e=>roles[e.id]='done');
  f.push(snapArr(a,roles,`Sorted. The splitting depth is about log₂(n), and each level touches every value once.`,4,[],w()));
  return f;
}

function linearSearch(vals){
  const a=mkEls(vals), f=[], roles={};
  const target=a[Math.floor(a.length/2)+Math.floor(Math.random()*Math.ceil(a.length/2))].v; let looks=0;
  const w=()=>[['target',target],['values checked',looks]];
  f.push(snapArr(a,roles,`Looking for <b>${target}</b>. Linear search just checks every box from the left.`,0,[],w()));
  for(let i=0;i<a.length;i++){
    keepDone(roles); roles[a[i].id]='cmp'; looks++;
    f.push(snapArr(a,roles,`Is position ${i} equal to ${target}?`,1,[{l:'i',i}],w()));
    if(a[i].v===target){
      roles[a[i].id]='found';
      f.push(snapArr(a,roles,`Found it at position ${i} after ${looks} checks.`,2,[{l:'i',i}],w()));
      return f;
    }
  }
  return f;
}

function binarySearch(vals){
  const sorted=[...vals].sort((p,q)=>p-q);
  const a=mkEls(sorted), f=[], roles={};
  let lo=0, hi=a.length-1, looks=0;
  const firstMid=(lo+hi)>>1;
  let ti=Math.floor(Math.random()*a.length);
  if(ti===firstMid) ti=(ti+1+Math.floor(Math.random()*2))%a.length;
  const target=a[ti].v;
  const w=()=>[['target',target],['values checked',looks],['range size',Math.max(0,hi-lo+1)]];
  const shade=()=>{ keepDone(roles); a.forEach((e,i)=>{ if(i<lo||i>hi) roles[e.id]='out'; }); };
  shade();
  f.push(snapArr(a,roles,`The list must be sorted first. Looking for <b>${target}</b>.`,0,[{l:'lo',i:lo},{l:'hi',i:hi}],w()));
  while(lo<=hi){
    const mid=(lo+hi)>>1; looks++;
    shade(); roles[a[mid].id]='cmp';
    f.push(snapArr(a,roles,`Check the middle of the range, position ${mid}.`,2,[{l:'lo',i:lo},{l:'mid',i:mid},{l:'hi',i:hi}],w()));
    if(a[mid].v===target){
      shade(); roles[a[mid].id]='found';
      f.push(snapArr(a,roles,`Found <b>${target}</b> after only ${looks} checks. Each check threw away half the remaining values.`,3,[{l:'mid',i:mid}],w()));
      return f;
    }
    if(a[mid].v<target){
      lo=mid+1; shade();
      f.push(snapArr(a,roles,`<b>${a[mid].v}</b> is too small, so everything to its left is out. Search the right half.`,4,[{l:'lo',i:lo},{l:'hi',i:hi}],w()));
    } else {
      hi=mid-1; shade();
      f.push(snapArr(a,roles,`<b>${a[mid].v}</b> is too big, so everything to its right is out. Search the left half.`,5,[{l:'lo',i:lo},{l:'hi',i:hi}],w()));
    }
  }
  return f;
}

/* ---------- stack & queue ---------- */

function snapLin(items, roles, note, line, tags, watch){
  return {kind:'linear', items:items.map(o=>({...o})), roles:{...roles}, note, line, tags:tags||[], watch:watch||[]};
}
function stackDemo(){
  const f=[], roles={}; let items=[], n=0;
  const script=[['push',3],['push',7],['push',5],['peek'],['pop'],['push',9],['pop'],['pop']];
  const w=()=>[['size',items.length],['top',items.length?items[items.length-1].v:'empty']];
  f.push(snapLin(items,roles,'A stack is a pile. You can only touch the top of it.',0,[],w()));
  for(const [op,v] of script){
    if(op==='push'){
      items=[...items,{id:'s'+(n++),v}];
      const r={}; r[items[items.length-1].id]='mov';
      f.push(snapLin(items,r,`push(${v}) puts <b>${v}</b> on top of the pile.`,0,[],w()));
    } else if(op==='peek'){
      const r={}; r[items[items.length-1].id]='cmp';
      f.push(snapLin(items,r,`peek() reads the top value, <b>${items[items.length-1].v}</b>, without removing it.`,2,[],w()));
    } else {
      const top=items[items.length-1];
      const r={}; r[top.id]='mov';
      f.push(snapLin(items,r,`pop() takes <b>${top.v}</b> off the top. The value that went in last comes out first.`,1,[],w()));
      items=items.slice(0,-1);
      f.push(snapLin(items,{},`<b>${top.v}</b> is gone.`,1,[],w()));
    }
  }
  f.push(snapLin(items,{},'Last in, first out. Undo buttons and function calls work exactly like this.',0,[],w()));
  return f;
}
function queueDemo(){
  const f=[]; let items=[], n=0;
  const script=[['enq',3],['enq',7],['enq',5],['deq'],['enq',9],['deq'],['deq']];
  const w=()=>[['size',items.length],['front',items.length?items[0].v:'empty']];
  f.push(snapLin(items,{},'A queue is a line of people. You join at the back and leave from the front.',0,[],w()));
  for(const [op,v] of script){
    if(op==='enq'){
      items=[...items,{id:'q'+(n++),v}];
      const r={}; r[items[items.length-1].id]='mov';
      f.push(snapLin(items,r,`enqueue(${v}) adds <b>${v}</b> at the back.`,0,[],w()));
    } else {
      const front=items[0]; const r={}; r[front.id]='mov';
      f.push(snapLin(items,r,`dequeue() removes <b>${front.v}</b> from the front. First in, first out.`,1,[],w()));
      items=items.slice(1);
      f.push(snapLin(items,{},`Everyone shuffles forward.`,1,[],w()));
    }
  }
  f.push(snapLin(items,{},'First in, first out. Printers, message buffers and breadth-first search all use queues.',0,[],w()));
  return f;
}

/* ---------- hash map ---------- */
function hashDemo(){
  const SIZE=7, f=[];
  const H = k => [...k].reduce((s,c)=>s+c.charCodeAt(0),0)%SIZE;
  const buckets = Array.from({length:SIZE},()=>[]);
  const snap=(note,line,on,hit,watch)=>({kind:'buckets',buckets:buckets.map(b=>b.map(p=>({...p}))),on,hit,note,line,watch:watch||[]});
  const data=[['kiwi',12],['tui',5],['moa',0],['kea',9],['weka',3]];
  f.push(snap('A hash map turns a key into a bucket number, so lookups skip the searching.',0,-1,null,[['buckets',SIZE]]));
  for(const [k,v] of data){
    const i=H(k);
    f.push(snap(`hash("${k}") adds up the letter codes and takes the remainder: bucket <b>${i}</b>.`,0,i,null,[['key',k],['bucket',i]]));
    buckets[i].push({k,v});
    f.push(snap(`Store the pair in bucket ${i}. No scanning needed later.`,3,i,null,[['key',k],['bucket',i]]));
  }
  const want='kea', wi=H(want);
  f.push(snap(`Now look up "${want}". Hash it again to get bucket <b>${wi}</b>.`,4,wi,null,[['key',want],['bucket',wi]]));
  f.push(snap(`Only that one bucket is checked, so the value is found in roughly constant time.`,6,wi,want,[['key',want],['value',buckets[wi].find(p=>p.k===want).v]]));
  const clash=buckets.findIndex(b=>b.length>1);
  if(clash>=0) f.push(snap(`Bucket ${clash} holds more than one pair. That is a collision, and it is handled by keeping a small list inside the bucket.`,3,clash,null,[['collisions',1]]));
  return f;
}

/* ---------- trees ---------- */
const TREE_VALUES=[50,30,70,20,40,60,80];
function buildTree(vals){
  let root=null, id=0;
  const nodes={};
  const ins=(node,v,parent)=>{
    if(!node){ const nd={id:'n'+(id++),v,left:null,right:null,parent}; nodes[nd.id]=nd; return nd; }
    if(v<node.v) node.left=ins(node.left,v,node.id); else node.right=ins(node.right,v,node.id);
    return node;
  };
  for(const v of vals) root=ins(root,v,null);
  // layout: x from in-order index, y from depth
  let k=0;
  (function walk(n,d){ if(!n) return; walk(n.left,d+1); n.x=60+ (k++)*88; n.y=34+d*68; walk(n.right,d+1); })(root,0);
  return {root,nodes};
}
function snapTree(t,present,cur,seen,out,note,line,watch){
  return {kind:'tree',nodes:Object.values(t.nodes).map(n=>({id:n.id,v:n.v,x:n.x,y:n.y,parent:n.parent})),
          present:[...present],cur,seen:[...seen],out:[...out],note,line,watch:watch||[]};
}
function bstInsert(){
  const t=buildTree(TREE_VALUES), f=[], present=new Set(), byVal={};
  Object.values(t.nodes).forEach(n=>byVal[n.v]=n);
  f.push(snapTree(t,present,null,[],[],'A binary search tree keeps a rule: everything on the left is smaller, everything on the right is bigger.',0,[]));
  for(const v of TREE_VALUES){
    let cur=t.root, steps=0;
    while(cur && cur.v!==v){
      if(present.has(cur.id)){
        f.push(snapTree(t,present,cur.id,[],[],`Insert <b>${v}</b>: compare with ${cur.v}. ${v<cur.v?'Smaller, go left.':'Bigger, go right.'}`,v<cur.v?2:3,[['value',v],['comparisons',++steps]]));
      }
      cur = v<cur.v ? cur.left : cur.right;
    }
    present.add(byVal[v].id);
    f.push(snapTree(t,present,byVal[v].id,[],[],`Empty spot found, so <b>${v}</b> is planted here.`,1,[['value',v],['comparisons',steps]]));
  }
  f.push(snapTree(t,present,null,[],[],'Because of the ordering rule, finding any value means walking down one path instead of scanning everything.',4,[['height',3]]));
  return f;
}
function traversal(mode){
  const t=buildTree(TREE_VALUES), f=[], all=new Set(Object.keys(t.nodes)), seen=[], out=[];
  const names={pre:'Pre-order',in:'In-order',post:'Post-order'};
  const where={pre:'before',in:'between',post:'after'};
  f.push(snapTree(t,all,null,seen,out,`${names[mode]} traversal visits a node <b>${where[mode]}</b> its children. Only the position of "visit" changes.`,0,[]));
  (function walk(n){
    if(!n) return;
    f.push(snapTree(t,all,n.id,seen,out,`Arrive at ${n.v}.`,1,[['output',out.join(', ')||'—']]));
    if(mode==='pre'){ out.push(n.v); seen.push(n.id);
      f.push(snapTree(t,all,n.id,seen,out,`Visit <b>${n.v}</b> now, then handle its children.`,2,[['output',out.join(', ')]])); }
    walk(n.left);
    if(mode==='in'){ out.push(n.v); seen.push(n.id);
      f.push(snapTree(t,all,n.id,seen,out,`Left side is done, so visit <b>${n.v}</b>, then go right.`,3,[['output',out.join(', ')]])); }
    walk(n.right);
    if(mode==='post'){ out.push(n.v); seen.push(n.id);
      f.push(snapTree(t,all,n.id,seen,out,`Both children are finished, so visit <b>${n.v}</b> last.`,4,[['output',out.join(', ')]])); }
  })(t.root);
  const extra = mode==='in' ? ' Notice the output came out in sorted order. That is what the ordering rule buys you.' : '';
  f.push(snapTree(t,all,null,seen,out,`Done: ${out.join(', ')}.${extra}`,4,[['output',out.join(', ')]]));
  return f;
}

/* ---------- graphs ---------- */
const GNODES={A:[60,130],B:[180,50],C:[180,210],D:[310,110],E:[310,225],F:[440,60],G:[450,200]};
const GEDGES=[['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2],['D','F',6],['E','F',3],['E','G',7],['F','G',1]];
const nbrs = u => GEDGES.filter(e=>e[0]===u||e[1]===u).map(e=>[e[0]===u?e[1]:e[0], e[2]]).sort((a,b)=>a[0]<b[0]?-1:1);
function snapGraph(cur,seen,frontier,edge,dist,out,note,line,watch){
  return {kind:'graph',cur,seen:[...seen],frontier:[...frontier],edge,dist:dist?{...dist}:null,out:[...out],note,line,watch:watch||[]};
}
function bfs(){
  const f=[], seen=new Set(['A']), q=['A'], out=[];
  f.push(snapGraph(null,seen,q,null,null,out,'Breadth-first search explores in rings: everything one step away, then everything two steps away.',0,[['queue','A']]));
  while(q.length){
    const u=q.shift(); out.push(u); 
    f.push(snapGraph(u,seen,q,null,null,out,`Take <b>${u}</b> from the front of the queue and visit it.`,2,[['queue',q.join(', ')||'empty'],['visited',out.join(', ')]]));
    for(const [v] of nbrs(u)){
      f.push(snapGraph(u,seen,q,[u,v],null,out,`Look at the neighbour ${v}.`,4,[['queue',q.join(', ')||'empty']]));
      if(!seen.has(v)){ seen.add(v); q.push(v);
        f.push(snapGraph(u,seen,q,[u,v],null,out,`${v} is new, so mark it seen and add it to the back of the queue.`,6,[['queue',q.join(', ')]]));
      } else {
        f.push(snapGraph(u,seen,q,[u,v],null,out,`${v} was already seen. Skip it, or you would loop forever.`,5,[['queue',q.join(', ')||'empty']]));
      }
    }
  }
  f.push(snapGraph(null,seen,[],null,null,out,`Visit order: ${out.join(' → ')}. On an unweighted graph this also gives the shortest number of hops from A.`,2,[['visited',out.join(', ')]]));
  return f;
}
function dfs(){
  const f=[], seen=new Set(), out=[];
  f.push(snapGraph(null,seen,[],null,null,out,'Depth-first search goes as deep as it can down one path before backing up.',0,[]));
  (function go(u,from){
    seen.add(u); out.push(u);
    f.push(snapGraph(u,seen,[],from?[from,u]:null,null,out,`Walk into <b>${u}</b> and mark it seen.`,1,[['path so far',out.join(' → ')]]));
    for(const [v] of nbrs(u)){
      if(!seen.has(v)){
        f.push(snapGraph(u,seen,[],[u,v],null,out,`${v} is unseen, so dive into it before trying anything else.`,4,[['path so far',out.join(' → ')]]));
        go(v,u);
        f.push(snapGraph(u,seen,[],null,null,out,`Nothing left down that branch, so back up to ${u}.`,4,[['path so far',out.join(' → ')]]));
      }
    }
  })('A',null);
  f.push(snapGraph(null,seen,[],null,null,out,`Visit order: ${out.join(' → ')}. Swap the queue in BFS for a stack and you get this.`,1,[['visited',out.join(', ')]]));
  return f;
}
function dijkstra(){
  const f=[], dist={}, seen=new Set(), out=[];
  Object.keys(GNODES).forEach(k=>dist[k]=Infinity); dist.A=0;
  const show=()=>Object.entries(dist).map(([k,v])=>`${k}:${v===Infinity?'∞':v}`).join('  ');
  f.push(snapGraph(null,seen,[],null,dist,out,'Dijkstra finds the cheapest route, not the fewest hops. Start with every distance unknown except A at 0.',0,[['distances',show()]]));
  while(seen.size<Object.keys(GNODES).length){
    let u=null;
    for(const k of Object.keys(GNODES)) if(!seen.has(k) && (u===null||dist[k]<dist[u])) u=k;
    if(dist[u]===Infinity) break;
    f.push(snapGraph(u,seen,[],null,dist,out,`The cheapest unvisited node is <b>${u}</b> at ${dist[u]}. Once picked, that distance can never improve.`,2,[['distances',show()]]));
    for(const [v,w] of nbrs(u)){
      if(seen.has(v)) continue;
      const alt=dist[u]+w;
      if(alt<dist[v]){
        f.push(snapGraph(u,seen,[],[u,v],dist,out,`Going to ${v} through ${u} costs ${dist[u]} + ${w} = <b>${alt}</b>, better than ${dist[v]===Infinity?'unknown':dist[v]}.`,4,[['distances',show()]]));
        dist[v]=alt;
        f.push(snapGraph(u,seen,[],[u,v],dist,out,`Update ${v} to ${alt}.`,5,[['distances',show()]]));
      } else {
        f.push(snapGraph(u,seen,[],[u,v],dist,out,`Going to ${v} through ${u} costs ${alt}, which is no better than ${dist[v]}. Leave it.`,4,[['distances',show()]]));
      }
    }
    seen.add(u); out.push(u);
    f.push(snapGraph(null,seen,[],null,dist,out,`${u} is finalised.`,6,[['distances',show()]]));
  }
  f.push(snapGraph(null,seen,[],null,dist,out,`Shortest distances from A: ${show()}.`,6,[['distances',show()]]));
  return f;
}

export { rnd, mkEls, snapArr, keepDone, snapLin, snapTree, snapGraph, buildTree, traversal, bubble, selection, insertion, quick, merge, linearSearch, binarySearch, stackDemo, queueDemo, hashDemo, bstInsert, bfs, dfs, dijkstra, nbrs, GNODES, GEDGES, TREE_VALUES };
