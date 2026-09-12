// @ts-nocheck
import { mkEls, snapArr, keepDone, snapGraph, nbrs } from './algorithms.js';
import { DEF_VALS } from './lessons.js';

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

export { BUGS, brokenBubble, brokenBinary, brokenInsertion, brokenBfs };
