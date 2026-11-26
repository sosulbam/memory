// 장절에서 절 수 세기 — 「사58:9-12」 4, 「요1:1,14」 2, 「요6:38-39(상)」 2, 「Acts 2:42.47」 2. 못 읽으면 null
export const countVerses = (ref) => {
  const s = String(ref || '').replace(/\([^)]*\)/g, '').trim();
  const m = s.match(/(\d+)\s*:\s*([\d\s,.\-–~상하ab]+)$/i);
  if (!m) return null;
  const parts = m[2].split(/[,.]/).map(p => p.replace(/[상하ab\s]/gi, '')).filter(Boolean);
  if (!parts.length) return null;
  return parts.reduce((sum, p) => {
    const [a, b] = p.split(/[-–~]/).map(Number);
    return sum + (b >= a ? b - a + 1 : 1);
  }, 0);
};

// 시험에서 「긴 구절」로 미리 알리는 기준: 3절 이상이거나 본문 150자 이상(전체 구절의 약 1할)
export const LONG_VERSE_COUNT = 3;
export const LONG_BODY_CHARS = 150;
export const isLongVerse = (verse) =>
  (countVerses(verse?.장절) || 1) >= LONG_VERSE_COUNT || String(verse?.본문 || '').length >= LONG_BODY_CHARS;
