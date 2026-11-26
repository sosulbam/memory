// 암송 시험 문제 순서·골고루 출제 (#400, 개인판 utils/testOrder.js 와 같은 규칙)
// 순서: 5 → 8 → 60 → 180 → DEP 242 → 나머지. 등불 암송 팩 이름(5확신·DEP 242)과 기본판·영어판 이름을 같은 자리로.
// 같은 묶음 안은 뽑힌 순서 그대로
const GROUP_RANK = {
  '5확신': 0, '5구절': 0, 'The 5 Assurances': 0,
  '8구절': 1, '8 Verses': 1,
  '60구절': 2, 'TMS': 2,
  '180구절': 3, 'TMS180': 3,
  'DEP 242': 4, 'DEP': 4, 'DEP 8package': 4,
};

export const groupRank = (verse) => {
  const r = GROUP_RANK[String(verse?.카테고리 || '').trim()];
  return r === undefined ? 5 : r;
};

export const sortByGroup = (questions) =>
  questions.map((q, i) => [q, i]).sort((a, b) => groupRank(a[0]) - groupRank(b[0]) || a[1] - b[1]).map(([q]) => q);

// 골고루 출제: 범위를 구절 번호순으로 n칸으로 나눠 칸마다 하나씩 무작위 (200구절·20문제 → 10구절씩 끊어 그 안에서 하나)
const byNumber = (a, b) => (Number(a.번호) || 0) - (Number(b.번호) || 0);
const chunkBounds = (len, n, i) => [Math.floor((i * len) / n), Math.floor(((i + 1) * len) / n)];

export const pickSpread = (pool, n) => {
  const sorted = [...pool].sort(byNumber);
  const count = Math.min(n, sorted.length);
  const picked = [];
  for (let i = 0; i < count; i++) {
    const [from, to] = chunkBounds(sorted.length, count, i);
    picked.push(sorted[from + Math.floor(Math.random() * (to - from))]);
  }
  return picked;
};

// [다시 출제] 때 바뀌는 문제가 속한 칸의 후보만 — 칸에 남은 게 없으면 null(호출하는 쪽이 범위 전체에서 뽑는다)
export const sameChunkCandidates = (poolVerses, n, removedId, candidates) => {
  const sorted = [...poolVerses].sort(byNumber);
  const pos = sorted.findIndex(v => v.id === removedId);
  if (pos < 0 || !n) return null;
  const chunk = Math.min(n - 1, Math.floor((pos * n) / sorted.length));
  const [from, to] = chunkBounds(sorted.length, n, chunk);
  const ids = new Set(sorted.slice(from, to).map(v => v.id));
  const inChunk = candidates.filter(v => ids.has(v.id));
  return inChunk.length ? inChunk : null;
};
