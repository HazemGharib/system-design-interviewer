import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const glossary = JSON.parse(readFileSync(join(root, 'src/data/glossary.json'), 'utf8'));
const cheatsheet = JSON.parse(readFileSync(join(root, 'src/data/cheatsheet.json'), 'utf8'));

const aliases = [];
for (const term of glossary.terms) {
  aliases.push({ id: term.id, needle: term.name.en.toLowerCase() });
  aliases.push({ id: term.id, needle: term.id.replace(/-/g, ' ') });
}
// Extra common phrases
const extras = [
  ['write-back', 'write-behind'],
  ['write back', 'write-behind'],
  ['cache aside', 'cache-aside'],
  ['write through', 'write-through'],
  ['read through', 'read-through'],
  ['consistent hashing', 'consistent-hashing'],
  ['circuit breaker', 'circuit-breaker'],
  ['token bucket', 'token-bucket'],
  ['leaky bucket', 'leaky-bucket'],
  ['load shedding', 'load-shedding'],
  ['dead letter', 'dlq'],
  ['dead-letter', 'dlq'],
  ['event sourcing', 'event-sourcing'],
  ['event-driven', 'event-driven'],
  ['pub/sub', 'pub-sub'],
  ['pub-sub', 'pub-sub'],
  ['long polling', 'long-polling'],
  ['server-sent events', 'sse'],
  ['presigned', 'presigned-url'],
  ['object storage', 'object-storage'],
  ['blob storage', 'object-storage'],
  ['read replica', 'read-replica'],
  ['fan-out on write', 'fan-out-write'],
  ['fan-out on read', 'fan-out-read'],
  ['write-time fan-out', 'fan-out-write'],
  ['read-time fan-out', 'fan-out-read'],
  ['feature flag', 'feature-flags'],
  ['blue-green', 'blue-green'],
  ['api gateway', 'api-gateway'],
  ['service mesh', 'service-mesh'],
  ['strangler', 'strangler-fig'],
  ['anti-corruption', 'anti-corruption-layer'],
  ['vector clock', 'vector-clock'],
  ['bloom filter', 'bloom-filter'],
  ['inverted index', 'inverted-index'],
  ['materialized view', 'materialized-view'],
  ['rate limit', 'rate-limiting'],
  ['exponential backoff', 'retry-backoff'],
  ['load balancer', 'load-balancer'],
  ['geo-dns', 'geo-dns'],
  ['multi-region', 'multi-region'],
  ['end-to-end encryption', 'e2ee'],
  ['e2ee', 'e2ee'],
  ['hyperloglog', 'hyperloglog'],
  ['count-min', 'count-min-sketch'],
  ['mapreduce', 'mapreduce'],
  ['lambda architecture', 'lambda-architecture'],
  ['kappa', 'lambda-architecture'],
  ['base62', 'base62'],
  ['snowflake', 'snowflake-id'],
  ['ticket server', 'ticket-server'],
  ['distributed lock', 'distributed-lock'],
  ['leader election', 'leader-election'],
  ['write-ahead', 'wal'],
  ['lsm', 'lsm'],
  ['cqrs', 'cqrs'],
  ['saga', 'saga'],
  ['outbox', 'outbox'],
  ['inbox', 'inbox'],
  ['idempoten', 'idempotency'],
  ['quorum', 'quorum'],
  ['cap ', 'cap'],
  ['pacelc', 'pacelc'],
  ['eventual consistency', 'eventual-consistency'],
  ['strong consistency', 'strong-consistency'],
  ['websocket', 'websocket'],
  ['webhook', 'webhook'],
  ['cdn', 'cdn'],
  ['ttl', 'ttl'],
  ['lru', 'eviction-lru'],
  ['lfu', 'eviction-lfu'],
  ['sharding', 'sharding'],
  ['partition', 'sharding'],
  ['bulkhead', 'bulkhead'],
  ['backpressure', 'backpressure'],
  ['fallback', 'fallback'],
  ['canary', 'canary'],
  ['observability', 'observability'],
  ['slo', 'slo'],
  ['rpo', 'rpo-rto'],
  ['rto', 'rpo-rto'],
  ['geohash', 'geohash'],
  ['scatter-gather', 'scatter-gather'],
  ['competing consumer', 'competing-consumers'],
  ['priority queue', 'priority-queue'],
  ['claim check', 'claim-check'],
  ['multipart', 'multipart-upload'],
  ['denormaliz', 'denormalization'],
  ['polyglot', 'polyglot-persistence'],
  ['serverless', 'serverless'],
  ['multi-tenan', 'multi-tenancy'],
  ['zero-downtime', 'zero-downtime-migration'],
  ['gossip', 'gossip'],
  ['heartbeat', 'heartbeat'],
  ['raft', 'consensus-raft'],
  ['paxos', 'consensus-raft'],
  ['crdt', 'crdt'],
  ['kafka', 'kafka'],
  ['2pc', 'two-phase-commit'],
];
for (const [needle, id] of extras) aliases.push({ id, needle });

aliases.sort((a, b) => b.needle.length - a.needle.length);
const valid = new Set(glossary.terms.map(t => t.id));

function findTerms(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const a of aliases) {
    if (!valid.has(a.id)) continue;
    if (lower.includes(a.needle)) found.add(a.id);
  }
  return [...found];
}

for (const cat of cheatsheet.categories) {
  for (const entry of cat.entries) {
    const blob = [entry.problem.en, entry.patterns.en, entry.when.en, entry.tradeoffs.en, entry.example.en, ...(entry.tags || [])].join(' ');
    entry.termIds = findTerms(blob);
  }
}

writeFileSync(join(root, 'src/data/cheatsheet.json'), JSON.stringify(cheatsheet, null, 2) + '\n');
const all = new Set(cheatsheet.categories.flatMap(c => c.entries.flatMap(e => e.termIds || [])));
console.log('linked term ids used in cheatsheet:', all.size);
console.log('entries with zero links:', cheatsheet.categories.flatMap(c => c.entries).filter(e => !(e.termIds || []).length).map(e => e.id));
