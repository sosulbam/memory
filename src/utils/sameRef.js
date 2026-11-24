// 같은 장절 모아 보기 (#354) — 정규구절(5·8·60·180·DEP 242, 영어판 포함) 안에서 장절이 완전히 같은 구절끼리 묶는다.
// 공백만 무시하고 비교한다(요3:16 과 요3:16-17 은 다르게). 정규 밖(약속60·찬양60·OYO 등)은 넣지 않는다.
// 그때의 구절 데이터로 계산한다 — 구절을 고치거나 팩을 넣고 빼면 묶음도 따라 바뀐다.
// 카테고리 이름: 기본판 5구절·DEP 8package, 등불 암송 팩 5확신·DEP 242 (팩 이름 lamp/packs). 뒤 공백은 trim
const SERIES_RANK = {
  '5구절': 0, '5확신': 0, 'The 5 Assurances': 0,
  '8구절': 1, '8 Verses': 1,
  '60구절': 2, 'TMS': 2,
  '180구절': 3, 'TMS180': 3,
  'DEP': 4, 'DEP 8package': 4, 'DEP 242': 4,
};

const catOf = (v) => String(v?.카테고리 || '').trim();
export const isRegularVerse = (v) => SERIES_RANK[catOf(v)] !== undefined;
const seriesRank = (v) => SERIES_RANK[catOf(v)] ?? 9;

export const normRef = (ref) => String(ref || '').replace(/\s+/g, '');

const byRank = (a, b) => seriesRank(a) - seriesRank(b) || (Number(a.번호) || 0) - (Number(b.번호) || 0);

// 장절 → 같은 장절 구절들(2개 이상인 것만, 시리즈 순 5→8→60→180→DEP)
export const buildSameRefIndex = (verses) => {
  const map = new Map();
  (verses || []).forEach((v) => {
    if (!isRegularVerse(v)) return;
    const key = normRef(v.장절);
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(v);
  });
  const index = new Map();
  map.forEach((list, key) => { if (list.length > 1) index.set(key, [...list].sort(byRank)); });
  return index;
};

// 지금 구절의 묶음 (정규가 아니거나 같은 장절이 없으면 null)
export const sameRefGroupOf = (index, verse) =>
  (verse && isRegularVerse(verse) ? index.get(normRef(verse.장절)) || null : null);

// 본문이 서로 다른가 (공백만 무시)
export const bodiesDiffer = (group) => new Set((group || []).map((v) => normRef(v.본문))).size > 1;
