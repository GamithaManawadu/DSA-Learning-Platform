// @ts-nocheck
import { EXTRA_LESSONS } from './extra.js';
import { rnd, bubble, selection, insertion, quick, merge, linearSearch, binarySearch,
  stackDemo, queueDemo, hashDemo, bstInsert, traversal, bfs, dfs, dijkstra } from './algorithms.js';

const DEF_VALS = () => rnd(9,8,95);

const L = {
  bubble:{t:'Bubble sort',time:'O(n²)',space:'O(1)',
    idea:'Repeatedly compare neighbours and swap them if they are the wrong way round. After each pass the largest remaining value has floated to the end.',
    build:()=>bubble(DEF_VALS()),
    code:['for i in range(n - 1):','  for j in range(n - 1 - i):','    if a[j] > a[j+1]:','      a[j], a[j+1] = a[j+1], a[j]','  # largest value is now at the end'],
    uses:[
      ['Teaching and interviews','It is the standard first example of a nested loop, and interviewers use it to check you can reason about why n² work is n².'],
      ['Tiny embedded arrays','On a microcontroller sorting ten sensor readings, simplicity and zero extra memory matter more than the growth rate.'],
      ['Checking "is this already sorted"','Add a swapped flag and one clean pass becomes an O(n) test that a list is in order. That flag is the only version worth shipping.']],
    quiz:[
      {q:'Why does the inner loop get shorter each pass?',o:['The list gets shorter','The end of the list is already sorted','To save memory'],a:1,
       why:'Each pass parks one more value permanently at the end, so there is no point comparing it again.'},
      {q:'What does one complete pass guarantee?',o:['The whole list is sorted','The largest remaining value is at the end','The smallest value is at the front'],a:1,
       why:'A pass only carries the biggest value it meets all the way right. Everything else has merely moved closer to where it belongs.'},
      {q:'You hand this exact code an already-sorted list. What happens?',o:['It stops after one pass','It still runs every comparison','It reverses the list'],a:1,
       why:'There is no early exit in this version. Adding a swapped flag lets it stop after one pass with no swaps, which makes the best case O(n).'},
      {q:'Would you ship bubble sort in production code?',o:['Yes, it is the fastest option','No, use the language library sort; bubble sort is for learning','Only for graphs'],a:1,
       why:'Every mainstream language ships a heavily optimised sort. Writing your own is a bug risk with no upside.'}]},

  selection:{t:'Selection sort',time:'O(n²)',space:'O(1)',
    idea:'Scan the unsorted part for the smallest value and swap it into the next position. It does many comparisons but very few swaps.',
    build:()=>selection(DEF_VALS()),
    code:['for i in range(n):','  m = i','  for j in range(i + 1, n):','    if a[j] < a[m]:','      m = j','  a[i], a[m] = a[m], a[i]'],
    uses:[
      ['Flash and EEPROM storage','Writes physically wear out the chip. Selection sort does at most n writes, far fewer than bubble or insertion sort.'],
      ['Small fixed buffers in firmware','No heap, no recursion, no extra array. The whole algorithm fits in a few lines with predictable cost.'],
      ['A profiling baseline','Its cost is identical for every input, which makes it a useful control when measuring how much other sorts benefit from real data.']],
    quiz:[
      {q:'An already-sorted list is given to selection sort. What happens?',o:['It finishes instantly','It still does every comparison','It crashes'],a:1,
       why:'Selection sort has no early exit. It always scans the whole remaining list, so the work is the same for any input.'},
      {q:'How many swaps does it perform on a list of n values?',o:['About n','About n²','None'],a:0,
       why:'One swap per position at most. That is the one thing selection sort is genuinely good at.'},
      {q:'Where does that low swap count actually matter?',o:['When comparisons are expensive','When writing data is expensive','When memory is plentiful'],a:1,
       why:'On storage with limited write cycles, or when each record is large and copying it is costly, fewer writes beats fewer comparisons.'},
      {q:'Two records have equal sort keys. Does selection sort keep their original order?',o:['Yes, always','No, the long-range swap can jump one past the other','Only for numbers'],a:1,
       why:'It is not stable. The swap moves a value across the whole unsorted region, which can reorder equal keys.'}]},

  insertion:{t:'Insertion sort',time:'O(n²), O(n) if nearly sorted',space:'O(1)',
    idea:'Exactly how people sort a hand of cards: take the next card and slide it left until it sits in the right spot.',
    build:()=>insertion(DEF_VALS()),
    code:['for i in range(1, n):','  key = a[i]','  j = i - 1','  while j >= 0 and a[j] > key:','    a[j+1] = a[j]','    j -= 1','  a[j+1] = key'],
    uses:[
      ['Inside real library sorts','Timsort in Python and Java, and introsort in C++, switch to insertion sort once a piece is small, because it genuinely beats the clever sorts there.'],
      ['Streaming and online data','When records arrive one at a time and the collection must stay sorted, each arrival is a single insertion rather than a full re-sort.'],
      ['Nearly ordered event logs','Timestamps that arrive slightly out of order are cheap to fix, because each record only moves a position or two.']],
    quiz:[
      {q:'Which input makes insertion sort fastest?',o:['Reversed','Random','Almost sorted'],a:2,
       why:'If each card is already close to its place, the while loop stops after one comparison, giving roughly n steps in total.'},
      {q:'What is the while loop actually doing?',o:['Finding the smallest value','Shifting larger values right to open a gap','Splitting the list in half'],a:1,
       why:'It slides everything bigger than the key one place right, which creates the hole the key drops into.'},
      {q:'Why do production sorting libraries still contain insertion sort?',o:['For pieces under a few dozen items inside a bigger sort','Because it is the fastest overall','Because it uses no comparisons'],a:0,
       why:'For small inputs its low overhead wins, so hybrid sorts hand off to it once partitions get small.'},
      {q:'Data arrives one item at a time and must stay sorted after every arrival. Best fit?',o:['Insertion sort','Merge sort','Selection sort'],a:0,
       why:'It is an online algorithm: it can absorb a new item without touching the work it already did.'}]},

  merge:{t:'Merge sort',time:'O(n log n)',space:'O(n)',
    idea:'Split the list in half until every piece has one value, then merge pieces back together in order. Merging two sorted lists is easy: keep taking the smaller front value.',
    build:()=>merge(DEF_VALS()),
    code:['def merge_sort(lo, hi):','  if hi - lo <= 1: return','  mid = (lo + hi) // 2','  merge_sort(lo, mid); merge_sort(mid, hi)','  # merge the two sorted halves back in'],
    uses:[
      ['Sorting data larger than memory','Databases and GNU sort split input into sorted chunks on disk, then merge the chunks in one streaming pass. This is external sorting.'],
      ['Sort-merge joins','A query engine joining two large tables sorts both sides once, then walks them together instead of doing repeated lookups.'],
      ['Stable sorts in language runtimes','Python and Java promise stability, which their merge-based Timsort delivers. Sort by date, then by name, and the date order survives inside each name.']],
    quiz:[
      {q:'Where does the log n in O(n log n) come from?',o:['The number of swaps','The number of times you can halve the list','The size of the output'],a:1,
       why:'Halving repeatedly gives about log₂(n) levels, and each level does about n work to merge.'},
      {q:'Why does merge sort need O(n) extra space?',o:['To store the recursion','Because merging writes results into a second buffer','To count comparisons'],a:1,
       why:'You cannot merge two halves in place cheaply, so the merged run is built in a scratch buffer and copied back.'},
      {q:'A 50 GB file must be sorted on a machine with 8 GB of RAM. What fits?',o:['Quick sort held entirely in memory','Merge sort over sorted chunks written to disk','Binary search'],a:1,
       why:'Merging only needs the front of each chunk in memory at once, so the data can stream from disk.'},
      {q:'Merge sort is stable. Why does that matter in production?',o:['It never crashes','Records with equal keys keep their earlier order','It uses less memory'],a:1,
       why:'Stability is what lets you sort by one field and then another and keep both orderings meaningful.'}]},

  quick:{t:'Quick sort',time:'O(n log n) average, O(n²) worst',space:'O(log n)',
    idea:'Pick a pivot, move everything smaller to its left and everything larger to its right. The pivot is then final, and each side is solved the same way.',
    build:()=>quick(DEF_VALS()),
    code:['def quick_sort(lo, hi):','  if lo >= hi: return','  pivot = a[hi]','  i = lo','  for j in range(lo, hi):','    if a[j] < pivot: swap(i, j); i += 1','  swap(i, hi)   # pivot lands here','  quick_sort(lo, i-1); quick_sort(i+1, hi)'],
    uses:[
      ['The default in-memory sort','C++ std::sort is introsort: quick sort, falling back to heap sort if recursion goes too deep and to insertion sort for small pieces.'],
      ['Percentiles and p99 latency','Quickselect is the same partition step with only one side recursed. It finds the k-th value without sorting the rest, which is how you get a median or a 99th percentile cheaply.'],
      ['Cache-friendly bulk work','Partitioning moves data within one array, so the CPU cache stays warm. That constant-factor win is why it often beats merge sort in practice.']],
    quiz:[
      {q:'When does quick sort degrade to O(n²)?',o:['When the pivot is always the smallest or largest value','When the list is large','When there are duplicates'],a:0,
       why:'A worst-case pivot peels off one value at a time, so you get n levels instead of log n.'},
      {q:'What does the partition step guarantee about the pivot?',o:['It is the smallest value','It is sitting in its final sorted position','It is the median'],a:1,
       why:'Everything smaller is left of it and everything larger is right of it, so no later step can move it.'},
      {q:'How do real implementations avoid the worst case?',o:['Sorting the list twice','Choosing the pivot randomly or as the median of three','Allocating more memory'],a:1,
       why:'A randomised or median-of-three pivot makes an adversarial input astronomically unlikely, which also blocks a denial-of-service attack that feeds you a worst case on purpose.'},
      {q:'Both are O(n log n) on average. Why is quick sort often faster than merge sort?',o:['It sorts in place and uses cache well','It makes fewer comparisons','It is stable'],a:0,
       why:'No scratch buffer, no copying back, and sequential access within one array.'}]},

  linear:{t:'Linear search',time:'O(n)',space:'O(1)',
    idea:'Check each value from the start until you find the target. It works on any list, sorted or not.',
    build:()=>linearSearch(DEF_VALS()),
    code:['for i in range(n):','  if a[i] == target:','    return i','return -1'],
    uses:[
      ['Full table scans','When a query filters on a column with no index, the database reads every row. Most "why is this query slow" investigations end here.'],
      ['Small collections','Scanning a ten-item config list beats building a hash map for it, because setup cost dominates at that size.'],
      ['Streaming through text','Tools that read a log line by line looking for a pattern are doing linear search, and cannot do better without an index.']],
    quiz:[
      {q:'On a list of 1,000,000 values, how many checks might linear search need?',o:['About 20','About 1,000','Up to 1,000,000'],a:2,
       why:'If the target sits last, or is missing, every single value has to be checked.'},
      {q:'Does linear search require the data to be sorted?',o:['Yes','No'],a:1,
       why:'That is its one real advantage: it works on anything you can iterate, in any order.'},
      {q:'When is linear search the right choice?',o:['On huge sorted datasets','On small collections, or unsorted ones you only read once','Never'],a:1,
       why:'Below a few dozen items the constant costs of hashing or sorting outweigh the scan.'},
      {q:'Your query filters on a column with no index. What is the engine doing?',o:['A binary search','A full scan, which is a linear search','A hash lookup'],a:1,
       why:'Adding an index is how you replace that O(n) scan with an O(log n) or O(1) lookup.'}]},

  binary:{t:'Binary search',time:'O(log n)',space:'O(1)',
    idea:'On a sorted list, check the middle value. It tells you which half the target must be in, so half the list disappears every step.',
    build:()=>binarySearch(DEF_VALS()),
    code:['lo, hi = 0, n - 1','while lo <= hi:','  mid = (lo + hi) // 2','  if a[mid] == target: return mid','  if a[mid] < target: lo = mid + 1','  else: hi = mid - 1','return -1'],
    uses:[
      ['Index lookups','A database index walk ends with a binary search inside a page of sorted keys. This is what an index actually buys you.'],
      ['git bisect','Finding which of 1,000 commits broke the build takes about 10 checks instead of 1,000. Same idea, applied to history.'],
      ['Binary search on the answer','Questions like "what is the smallest worker count that keeps latency under 200 ms" are solved by guessing, testing, and halving the range.']],
    quiz:[
      {q:'A sorted list has 1,000,000 values. Roughly how many checks does binary search need?',o:['About 20','About 1,000','About 500,000'],a:0,
       why:'Halving 1,000,000 down to 1 takes about log₂(1,000,000) ≈ 20 steps. That is the whole point of sorting first.'},
      {q:'What must be true before you can use it?',o:['The data is sorted on the key you are searching','The values are unique','The values are numbers'],a:0,
       why:'Without ordering, the middle value tells you nothing about which side the target is on.'},
      {q:'Why is mid sometimes written as lo + (hi - lo) // 2?',o:['It is faster','It avoids integer overflow when lo + hi exceeds the int limit','It handles empty lists'],a:1,
       why:'A real bug in Java and in the JDK binary search for years. In fixed-width integer languages, lo + hi can wrap negative.'},
      {q:'You sort a list once and then search it a million times. Was sorting worth it?',o:['Yes, the sort cost is paid once and every search drops from n to log n','No, sorting always costs more','Only if the list is small'],a:0,
       why:'This trade-off is exactly why databases maintain indexes despite the cost of keeping them updated.'}]},

  stack:{t:'Stacks',time:'O(1) push and pop',space:'O(n)',
    idea:'A pile where you only touch the top. The last thing you put in is the first thing you get out.',
    build:stackDemo,
    code:['push(x):  items.append(x)','pop():    return items.pop()','peek():   return items[-1]'],
    uses:[
      ['The call stack','Every function call pushes a frame, every return pops one. A stack trace in an error report is literally that stack printed out.'],
      ['Undo, redo and browser history','The most recent action is the first one reversed, which is the definition of a stack.'],
      ['Parsers and compilers','Matching brackets in JSON, HTML or source code, and evaluating expressions, are all stack problems.']],
    quiz:[
      {q:'Which of these is a stack?',o:['A queue at a bank','The undo history in an editor','A printer job list'],a:1,
       why:'Undo reverses your most recent action first, which is exactly last in, first out.'},
      {q:'What is a stack overflow error telling you?',o:['The disk is full','Nested calls went so deep the call stack ran out of room','A hash collision occurred'],a:1,
       why:'Usually runaway recursion with a missing or wrong base case. The fix is in your termination condition, not the stack size.'},
      {q:'What do push and pop cost?',o:['O(1)','O(n)','O(log n)'],a:0,
       why:'Both touch only the top, so cost does not grow with size. That is why stacks are used in hot paths.'},
      {q:'You are validating that every bracket in a JSON file is closed correctly. What do you reach for?',o:['A queue','A stack','A binary tree'],a:1,
       why:'Push each opening bracket, and on a closing bracket pop and check it matches. Empty at the end means balanced.'}]},

  queue:{t:'Queues',time:'O(1) enqueue and dequeue',space:'O(n)',
    idea:'A line. You join at the back and leave from the front, so the order is preserved.',
    build:queueDemo,
    code:['enqueue(x):  items.append(x)','dequeue():   return items.pop(0)','peek():      return items[0]'],
    uses:[
      ['Message brokers and task queues','Kafka, RabbitMQ, SQS, Celery and Sidekiq hand work to consumers in order, so producers never wait for slow work to finish.'],
      ['Load smoothing','A queue in front of a service absorbs traffic bursts and lets a fixed pool of workers drain them at a steady rate instead of falling over.'],
      ['Thread pools','Worker threads pull the next job from a shared queue. That is how most web servers schedule requests.']],
    quiz:[
      {q:'Which algorithm on this site depends on a queue?',o:['Binary search','Breadth-first search','Quick sort'],a:1,
       why:'BFS uses a queue to hold the frontier, which is what makes it explore in rings rather than diving deep.'},
      {q:'A service receives more requests than it can process instantly. What keeps it alive?',o:['A stack of requests','A queue that workers pull from','Dropping the newest request'],a:1,
       why:'Queueing decouples arrival rate from service rate. Watching queue depth grow is also your earliest signal that you are under-provisioned.'},
      {q:'In a message broker, the ordering guarantee within a partition is essentially:',o:['Last in, first out','First in, first out','Unordered'],a:1,
       why:'Consumers see messages in the order producers wrote them, which is what lets you rebuild state by replaying the log.'},
      {q:'Why is using a plain Python list with pop(0) a poor queue?',o:['It removes the wrong item','Every remaining item shifts left, making it O(n)','It is not readable'],a:1,
       why:'Use collections.deque, or a proper queue type. This exact mistake turns an O(1) operation into an O(n) one inside a loop.'}]},

  hashmap:{t:'Hash maps',time:'O(1) average lookup',space:'O(n)',
    idea:'Turn the key itself into an address. A hash function converts the key to a bucket number, so you jump straight to the right bucket instead of searching.',
    build:hashDemo,
    code:['def hash(key):','  return sum(ord(c) for c in key) % size','','def put(key, value):','  buckets[hash(key)].append((key, value))','','def get(key):','  for k, v in buckets[hash(key)]:','    if k == key: return v'],
    uses:[
      ['Caches','Redis, Memcached and every in-process cache are key-to-value stores built on this, which is why a cache hit costs almost nothing.'],
      ['Deduplication and counting','Unique visitors, duplicate event filtering, word counts: build a hash set or map over IDs and each item costs one lookup.'],
      ['Hash joins and routing','A query engine builds a hash map of the smaller table and joins in one pass; load balancers and shard routers map a key to a destination the same way.']],
    quiz:[
      {q:'Two different keys hash to the same bucket. What is that called?',o:['A collision','An overflow','A rehash'],a:0,
       why:'Collisions are normal and are handled by keeping a small list inside the bucket, or by probing for another slot.'},
      {q:'What is the average cost of a lookup?',o:['O(1)','O(log n)','O(n)'],a:0,
       why:'Hashing the key is constant work and the bucket holds only a few entries, so cost does not grow with the size of the map.'},
      {q:'Why does iterating a hash map not give you sorted keys?',o:['Hashing deliberately scrambles the key order','It loses data','It sorts by insertion time'],a:0,
       why:'Order comes from the hash values, not the keys. If you need sorted iteration or range queries, you need a tree, not a hash map.'},
      {q:'What is the worst case for a hash map lookup, and when does it matter?',o:['O(n), if every key collides into one bucket','O(log n), always','There is no worst case'],a:0,
       why:'An attacker who can predict your hash function can craft keys that all collide and stall the server. Real runtimes defend against this with randomised hash seeds.'}]},

  'bst-insert':{t:'Binary search trees',time:'O(log n) if balanced',space:'O(n)',
    idea:'Every node keeps smaller values on its left and larger values on its right. Searching means walking down one path and ignoring half the tree at each step.',
    build:bstInsert,
    code:['def insert(node, value):','  if node is None: return Node(value)','  if value < node.value:','    node.left = insert(node.left, value)','  else:','    node.right = insert(node.right, value)','  return node'],
    uses:[
      ['Ordered maps in standard libraries','Java TreeMap and C++ std::map are balanced trees. That is why their keys iterate in sorted order while a hash map\u2019s do not.'],
      ['Database indexes','B-trees are the disk-shaped version of this idea: keep keys ordered so a lookup walks one short path instead of scanning the table.'],
      ['Range queries and leaderboards','"Scores between 900 and 1000" or "orders in the last hour" need ordering. A hash map cannot answer them at all.']],
    quiz:[
      {q:'You insert 10, 20, 30, 40, 50 in that order. What shape is the tree?',o:['Balanced and shallow','One long chain to the right','Two even halves'],a:1,
       why:'Sorted input makes every value go right, giving a chain that behaves like a list. That is exactly the problem AVL and red-black trees fix.'},
      {q:'A balanced tree holds 1,000,000 nodes. How many steps to find one?',o:['About 20','About 1,000','1,000,000'],a:0,
       why:'Each comparison discards half the remaining tree, so the cost is the height, roughly log₂(n).'},
      {q:'What does a balanced tree give you that a hash map does not?',o:['Faster single-key lookups','Ordered iteration and range queries','Less memory'],a:1,
       why:'Hash maps win on a single lookup. Trees win the moment you need "next", "previous", "between" or sorted output.'},
      {q:'Why do databases use B-trees on disk rather than plain binary search trees?',o:['A B-tree node holds many keys, matching one disk page read','Binary trees cannot store text','B-trees are unordered'],a:0,
       why:'Disk reads are the expensive part, so you want each read to eliminate as much as possible. A wide node does that; a two-way branch wastes the read.'}]},

  'tree-pre':{t:'Pre-order traversal',time:'O(n)',space:'O(h)',
    idea:'Visit the node first, then its left subtree, then its right. Useful for copying a tree or printing its structure.',
    build:()=>traversal('pre'),
    code:['def pre_order(node):','  if node is None: return','  visit(node)','  pre_order(node.left)','  pre_order(node.right)'],
    uses:[
      ['Serialising a tree','Writing a DOM, a JSON document or a directory listing parent-first means a reader can rebuild it top down.'],
      ['Deep copies','Create the node, then create its children. Any clone of a nested structure follows this order.'],
      ['Rendering nested UI','A component tree is laid out parent before child, which is pre-order by another name.']],
    quiz:[
      {q:'What is the only difference between pre, in and post-order?',o:['The direction of travel','Where the visit line sits','Whether recursion is used'],a:1,
       why:'The walk is identical. Moving the visit before, between or after the two recursive calls is the whole difference.'},
      {q:'You want to write a tree to a file so it can be rebuilt by inserting values in the same order. Which traversal?',o:['Pre-order','In-order','Post-order'],a:0,
       why:'The root comes out first, so replaying the sequence into an empty tree recreates the same shape. In-order would give you sorted input and a degenerate chain.'},
      {q:'Run pre-order over a file system. What gets printed first?',o:['A folder, then what is inside it','The deepest file','Only files'],a:0,
       why:'Parent before children is exactly what tools like tree and recursive directory listings show.'},
      {q:'What does any full traversal cost for n nodes?',o:['O(n)','O(log n)','O(n²)'],a:0,
       why:'Every node is visited exactly once, no matter the order. The order affects meaning, not cost.'}]},

  'tree-in':{t:'In-order traversal',time:'O(n)',space:'O(h)',
    idea:'Visit the left subtree, then the node, then the right subtree. On a binary search tree this produces the values in sorted order.',
    build:()=>traversal('in'),
    code:['def in_order(node):','  if node is None: return','  in_order(node.left)','  visit(node)','  in_order(node.right)'],
    uses:[
      ['Ordered iteration','Walking an index in order to return sorted results without paying to sort them again.'],
      ['Range scans','A BETWEEN query finds the start key, then walks in order until it passes the end key, touching only the matching rows.'],
      ['Validating a search tree','If an in-order walk is not ascending, the ordering rule has been broken somewhere. It is the standard correctness check.']],
    quiz:[
      {q:'In-order traversal of a binary search tree gives you what?',o:['The values in sorted order','The tree height','The shortest path'],a:0,
       why:'Left is always smaller and right is always larger, so left, node, right reads the values in ascending order.'},
      {q:'The tree is not a binary search tree. Does in-order still produce sorted output?',o:['Yes','No, the sorted output comes from the ordering rule, not the traversal'],a:1,
       why:'The traversal only defines when you visit. Sortedness is a property the tree either has or does not.'},
      {q:'"All users aged between 30 and 40" over an ordered index is served by:',o:['An in-order walk bounded by the range','A pre-order walk','Hashing the age'],a:0,
       why:'You seek to 30, then walk forward until you pass 40, reading only matching rows instead of scanning the table.'},
      {q:'Iterating a Java TreeMap or C++ std::map gives keys in what order?',o:['Insertion order','Sorted order','Unspecified order'],a:1,
       why:'Both are balanced search trees, and iteration is an in-order walk. A HashMap gives you no such promise.'}]},

  'tree-post':{t:'Post-order traversal',time:'O(n)',space:'O(h)',
    idea:'Visit both subtrees first and the node last. This is what you want when children must be handled before their parent, such as deleting a tree.',
    build:()=>traversal('post'),
    code:['def post_order(node):','  if node is None: return','  post_order(node.left)','  post_order(node.right)','  visit(node)'],
    uses:[
      ['Freeing memory and deleting trees','Children must be released before the parent, or you lose the only pointers to them and leak.'],
      ['Aggregating upward','Folder sizes in du, rolled-up totals in reports, and cost estimates in query planners all need child results before the parent can be computed.'],
      ['Expression evaluation','Post-order output is reverse Polish notation, which is how calculators and many virtual machines evaluate expressions.']],
    quiz:[
      {q:'Why is post-order the right choice for freeing a tree from memory?',o:['It is faster','Children are released before their parent','It uses no recursion'],a:1,
       why:'If you freed the parent first you would lose the pointers to the children and never reach them.'},
      {q:'A tool computes the total size of every folder. Which traversal does it need?',o:['Post-order, because a folder total needs its children first','Pre-order','Any order works'],a:0,
       why:'The parent value is a function of the child values, so children must be finished before the parent is computed.'},
      {q:'Evaluating the expression tree for (2 + 3) * 4 follows which order?',o:['Post-order, the same order as reverse Polish notation','In-order','Pre-order'],a:0,
       why:'You need both operands computed before you can apply the operator above them.'},
      {q:'In post-order, when is the root visited?',o:['First','Last','In the middle'],a:1,
       why:'Everything beneath it must finish first, which is what makes it useful for bottom-up work.'}]},

  bfs:{t:'Breadth-first search',time:'O(V + E)',space:'O(V)',
    idea:'Explore outward in rings using a queue: all neighbours first, then their neighbours. On an unweighted graph this finds the fewest hops.',
    build:bfs,
    code:['queue = [start]; seen = {start}','while queue:','  node = queue.pop(0)','  for nb in neighbours(node):','    # check each neighbour','    if nb in seen: continue','    seen.add(nb); queue.append(nb)'],
    uses:[
      ['Shortest hops on unweighted graphs','Degrees of separation on a social network, fewest moves in a puzzle, shortest route through a maze where every step costs the same.'],
      ['Crawling breadth-first','Covering a site level by level so you get broad coverage early, rather than disappearing down one branch.'],
      ['Propagation and blast radius','Modelling how a cache invalidation, an outage or a config change spreads outward through connected services.']],
    quiz:[
      {q:'Why does BFS mark nodes as seen when adding them to the queue?',o:['To count them','To stop the same node being queued twice','To sort them'],a:1,
       why:'Graphs have cycles. Without the seen set you would revisit nodes forever.'},
      {q:'On an unweighted graph, what does BFS find?',o:['The path with the fewest hops','The cheapest path by weight','The longest path'],a:0,
       why:'Nodes come off the queue in order of distance from the start, so the first time you reach a node is by a shortest path.'},
      {q:'"Friends of friends" and degrees of separation are computed with:',o:['BFS outward from your node, level by level','DFS','Sorting the user table'],a:0,
       why:'Each BFS level is exactly one degree of separation, so you stop at whatever depth you need.'},
      {q:'Your graph has weighted edges representing travel time. Does BFS still give the best route?',o:['Yes','No, fewest hops is not the same as lowest cost'],a:1,
       why:'Three fast hops can beat one slow one. Weighted costs are what Dijkstra exists for.'}]},

  dfs:{t:'Depth-first search',time:'O(V + E)',space:'O(V)',
    idea:'Follow one path as far as it goes, then back up and try the next branch. Same code as BFS but with a stack, or with recursion.',
    build:dfs,
    code:['def dfs(node):','  seen.add(node); visit(node)','  for nb in neighbours(node):','    if nb not in seen:','      dfs(nb)'],
    uses:[
      ['Build and dependency ordering','Make, webpack, Bazel and CI pipelines run a topological sort built on DFS so dependencies are finished before what needs them.'],
      ['Cycle detection','Circular imports, dependency loops in package managers and deadlock cycles are all found by noticing you reached a node still on the current path.'],
      ['Garbage collection and file walks','Marking every object reachable from the roots, or recursing through a directory tree, are both DFS.']],
    quiz:[
      {q:'What structure does recursion secretly use in DFS?',o:['A queue','The call stack','A hash map'],a:1,
       why:'Each recursive call is pushed and popped by the runtime, which is why DFS backtracks the way it does.'},
      {q:'A build tool must compile dependencies before the modules that import them. That ordering comes from:',o:['Topological sort, built on DFS','BFS','Binary search'],a:0,
       why:'Finishing a node only after all its dependencies finish gives you a valid build order for free.'},
      {q:'Your bundler reports a circular import. How was it found?',o:['Cycle detection during a DFS of the module graph','Sorting the filenames','Hashing the file contents'],a:0,
       why:'Meeting a node that is still open on the current path means the path loops back on itself.'},
      {q:'Your graph is very deep, such as a linked structure a million nodes long. What is the risk with recursive DFS?',o:['It runs out of stack space and crashes','It returns the wrong answer','It becomes O(n²)'],a:0,
       why:'Rewrite it with an explicit stack. This is a real production failure mode, not a theoretical one.'}]},

  dijkstra:{t:"Dijkstra's shortest path",time:'O(E log V)',space:'O(V)',
    idea:'Always expand the cheapest node you have reached so far. Because you never expand anything cheaper later, its distance is final once chosen.',
    build:dijkstra,
    code:['dist = {v: inf for v in graph}; dist[start] = 0','while unvisited:','  u = unvisited node with smallest dist','  for v, w in neighbours(u):','    if dist[u] + w < dist[v]:','      dist[v] = dist[u] + w','  mark u visited'],
    uses:[
      ['Navigation and routing','Edge cost is travel time, so the best route is rarely the one with the fewest turns. Production map engines extend this with A* and precomputed shortcuts.'],
      ['Network routing protocols','OSPF builds a map of link costs across a network and runs Dijkstra to choose paths, recomputing when a link goes down.'],
      ['Cost-aware selection','Picking the cheapest chain of hops when each step has a price, a latency or a bandwidth limit, such as CDN or inter-region routing.']],
    quiz:[
      {q:'Why does Dijkstra fail with negative edge weights?',o:['The graph becomes cyclic','A later cheaper route could undercut an already finalised node','Distances overflow'],a:1,
       why:'The algorithm assumes distances only grow as you expand. A negative edge breaks that, which is why Bellman-Ford exists.'},
      {q:'What separates Dijkstra from BFS?',o:['Dijkstra accounts for edge weights; BFS only counts hops','Dijkstra is faster','BFS handles weights better'],a:0,
       why:'If every edge weight were 1, Dijkstra would visit nodes in the same order BFS does.'},
      {q:'Once a node is chosen as the cheapest unvisited one, what is true of its distance?',o:['It is final and will not improve','It may still drop later','It is only an estimate'],a:0,
       why:'Any other route to it would have to pass through a node that is already more expensive, so it cannot be cheaper.'},
      {q:'Why do map applications use A* rather than plain Dijkstra?',o:['A* adds an estimate of remaining distance so the search heads toward the destination','Dijkstra gives wrong answers','A* needs no graph'],a:0,
       why:'Dijkstra expands in all directions equally. A straight-line estimate steers the work toward the goal and cuts the nodes explored dramatically.'}]}
};

Object.assign(L, EXTRA_LESSONS);

export { L, DEF_VALS };
