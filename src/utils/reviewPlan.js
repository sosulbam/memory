// src/utils/reviewPlan.js
// 「새 복습 플랜」 문답(PlanWizard)용 순수 헬퍼 — 모드·범위별 구절 수와 시작할 차수를 계산한다.
// 개인판(verse-app)에서 옮김(#395, 2026-11-26) — 공개판 차이: 정렬에 「장절순」 없음, 행사 마감 없음, 보이는 말은 T
import { getTurnBasedScope } from './reviewScope';
import { T } from '../terms';

export const PLAN_MODES = [
  { value: 'turnBasedReview', label: '차수별 복습', turnKey: 'targetTurn' },
  { value: 'turnBasedNew', label: T.newV, turnKey: 'targetTurnForNew' },
  { value: 'turnBasedRecent', label: T.recent, turnKey: 'targetTurnForRecent' },
  { value: 'category', label: `${T.cat}별` },
  { value: 'wrong', label: '오답' },
];

export const ORDER_OPTIONS = [
  { value: 'grouped_random', label: '그룹 랜덤' },
  { value: 'sequential', label: '순차' },
  { value: 'random', label: '랜덤' },
  { value: 'oldest_first', label: '오래된 순' },
];

// 마감일 빠른 선택에 띄울 행사 — 날짜가 지나면 자동으로 사라진다 (전날을 마감으로 제안)
//   예: { date: '2026-11-22', label: '암송대회' }
export const UPCOMING_EVENTS = [];

const inCats = (v, cats) => !cats || cats.length === 0 || cats.includes('전체') || cats.includes(v.카테고리);

// 범위 단계에서 보여 줄 카테고리별 구절 수 (해당 모드의 대상만)
export const categoryCounts = (originalVerses = [], mode) => {
  const active = originalVerses.filter((v) => !v.미암송여부);
  const base = mode === 'turnBasedReview' ? active.filter((v) => !v.뉴구절여부 && !v.최근구절여부) : active;
  const map = new Map();
  base.forEach((v) => map.set(v.카테고리 || '기타', (map.get(v.카테고리 || '기타') || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

// 선택한 모드·범위로 { count: 이번 플랜에서 볼 구절 수, turn: 시작할 차수, carried: 이전 차수에서 넘어오는 남은 구절 수 }
//  - 차수별 복습: 지금 차수를 하나도 안 했으면 그 차수 그대로, 일부라도 했으면 다음 차수로 새로 (일정·하루 분량 계산이 처음부터 맞게)
//  - 뉴구절·최근구절: 지금 차수가 남아 있으면 이어서, 다 했으면 다음 차수
export const planInfo = (originalVerses = [], settings = {}, mode, cats = ['전체']) => {
  const meta = PLAN_MODES.find((m) => m.value === mode);
  if (meta && meta.turnKey) {
    const cur = settings[meta.turnKey] || 1;
    const scopeSettings = { selectedCategories: cats, selectedSubcategories: ['전체'], targetTurn: settings.targetTurn || 1, targetTurnForNew: settings.targetTurnForNew || 1, targetTurnForRecent: settings.targetTurnForRecent || 1 };
    const s = getTurnBasedScope(originalVerses, mode, scopeSettings);
    let turn;
    if (mode === 'turnBasedReview') turn = s.completed.length === 0 ? cur : cur + 1;
    else turn = s.remaining.length === 0 && s.base.length > 0 ? cur + 1 : cur;
    const count = turn === cur ? s.remaining.length : s.base.length;
    const carried = turn === cur + 1 && mode === 'turnBasedReview' ? s.remaining.length : 0;
    return { count, total: s.base.length, turn, carried };
  }
  const active = originalVerses.filter((v) => !v.미암송여부);
  if (mode === 'category') {
    const inScope = active.filter((v) => inCats(v, cats));
    const left = inScope.filter((v) => !v.복습여부).length;
    return { count: left || inScope.length, total: inScope.length, turn: null, carried: 0 };
  }
  if (mode === 'wrong') {
    const n = active.filter((v) => v.오답여부).length;
    return { count: n, total: n, turn: null, carried: 0 };
  }
  return { count: 0, total: 0, turn: null, carried: 0 };
};

// 로컬 날짜 ↔ 'YYYY-MM-DD' (차수 일정 저장 형식)
export const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromYMD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const daysInclusive = (start, end) => Math.round((end - start) / 86400000) + 1;
export const fmtMD = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
