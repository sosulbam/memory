// 이미 받아 둔 구절 데이터를 한 번만 고친다(#409).
// 기본 구절 파일·암송 팩을 고쳐도 이미 쓰던 사람의 기기엔 옛 내용이 남아 있어서, 앱을 열 때 고유 번호(id)로 찾아 고친다.
// - 고칠 곳이 아직 옛 값(from)일 때만 바꾼다 — 사용자가 직접 옮겨 둔 구절은 건드리지 않는다
// - 구절 데이터의 소카테고리만 바꾼다. 복습 기록·오답·차수·태그는 id 로 따로 저장돼 있어 그대로 남는다
// - 한 번 돌린 고침은 이 기기에 표시해 다시 돌리지 않는다(나중에 사용자가 되돌려도 다시 옮기지 않게)
import { VERSE_FIXES_KEY } from '../constants';

export const VERSE_FIXES = [
  {
    // DEP 242 「6. 증거」 끝의 두 구절은 원문상 「6. 증거 (다리예화)」 1·2번째
    id: '409-dep-bridge',
    ids: ['20240924165003-426', '20240924165003-427', 'pk-dep242-172', 'pk-dep242-173'],
    field: '소카테고리',
    from: '6. 증거',
    to: '6. 증거 (다리예화)',
  },
];

const readDone = () => {
  try {
    const v = JSON.parse(localStorage.getItem(VERSE_FIXES_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
};

const writeDone = (done) => {
  try { localStorage.setItem(VERSE_FIXES_KEY, JSON.stringify(done)); } catch (e) { /* 저장 못 해도 다음에 같은 조건으로 다시 볼 뿐 */ }
};

// 고친 목록과 바뀐 구절 수를 돌려준다. 바뀐 게 없으면 같은 배열을 그대로 돌려준다
export const applyVerseFixes = (verses) => {
  if (!Array.isArray(verses) || verses.length === 0) return { verses, changed: 0 };
  const done = readDone();
  const todo = VERSE_FIXES.filter((f) => !done.includes(f.id));
  if (todo.length === 0) return { verses, changed: 0 };
  let changed = 0;
  let next = verses;
  todo.forEach((fix) => {
    const ids = new Set(fix.ids);
    next = next.map((v) => {
      if (!ids.has(v.id) || v[fix.field] !== fix.from) return v;
      changed += 1;
      return { ...v, [fix.field]: fix.to };
    });
  });
  writeDone([...done, ...todo.map((f) => f.id)]);
  return { verses: changed ? next : verses, changed };
};
