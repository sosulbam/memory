// src/utils/refFormat.js
// 장절 약어를 암송 카드처럼 풀어 쓴다: "요1:1,14" → "요한복음 1:1, 14", "창26:12-13" → "창세기 26:12-13"
// 영어 장절이나 형식이 다른 값은 그대로 둔다.
import { BIBLE_BOOKS } from '../constants';

// 데이터에 쓰인 약어 중 BIBLE_BOOKS 에 없는 것 (2026-11 전수 확인: 렘애 1건)
const EXTRA_BOOKS = { '렘애': '예레미야애가' };

export const formatRefFull = (ref) => {
  const s = String(ref || '').trim();
  const m = s.match(/^([1-3]?[가-힣]+)\s*(\d+)\s*:\s*(.+)$/);
  if (!m) return s;
  const book = BIBLE_BOOKS[m[1]] || EXTRA_BOOKS[m[1]] || m[1];
  const verses = m[3].replace(/\s*,\s*/g, ', ').replace(/\s*-\s*/g, '-');
  return `${book} ${m[2]}:${verses}`;
};
