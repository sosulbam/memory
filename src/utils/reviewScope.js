// src/utils/reviewScope.js
// 차수별 복습(뉴구절 / 최근구절 / 복습구절)의 "복습 대상 구절"을 계산하는 순수 헬퍼.
// useReviewSession의 baseFilter + completionCheck 로직을 그대로 옮긴 것으로,
// 홈(useReviewSession)과 트리 구조 보기(VerseTreePage)가 동일한 규칙을 공유하게 한다.
// ⚠️ 공개판: 구절의 복습날짜는 홈(useReviewSession)과 동일하게 "YYYY. M. D"(로컬) 형식.
//    getKSTDateString(YYYY-MM-DD)는 REVIEW_LOG 키에만 쓰이므로 여기선 사용하지 않는다.
import { T } from '../terms';

// 홈 useReviewSession의 복습날짜/오늘 비교와 100% 동일한 문자열 (로컬 기준, 무패딩 점 형식)
export const getReviewDateStr = () => {
  const n = new Date();
  return `${n.getFullYear()}. ${n.getMonth() + 1}. ${n.getDate()}`;
};

const categoryFilter = (v, selectedCategories = ['전체'], selectedSubcategories = ['전체']) =>
  (selectedCategories.includes('전체') || selectedCategories.length === 0 || selectedCategories.includes(v.카테고리)) &&
  (selectedSubcategories.includes('전체') || selectedSubcategories.length === 0 || selectedSubcategories.includes(v.소카테고리));

// 트리 복습 모드에서 노출하는 3개 차수별 모드
export const TURN_BASED_MODES = [
  { value: 'turnBasedReview', label: T.review },
  { value: 'turnBasedNew', label: T.newV },
  { value: 'turnBasedRecent', label: T.recent },
];

// 주어진 모드/설정으로 복습 대상을 { base, remaining, completed } 로 분리
export const getTurnBasedScope = (originalVerses, mode, settings = {}) => {
  const {
    selectedCategories = ['전체'],
    selectedSubcategories = ['전체'],
    targetTurn = 1,
    targetTurnForNew = 1,
    targetTurnForRecent = 1,
  } = settings;

  if (!originalVerses || !originalVerses.length) return { base: [], remaining: [], completed: [] };

  const activeVerses = originalVerses.filter(v => !v.미암송여부);

  const baseFilter = {
    turnBasedReview: v => !v.뉴구절여부 && !v.최근구절여부 && categoryFilter(v, selectedCategories, selectedSubcategories),
    turnBasedNew: v => v.뉴구절여부 && categoryFilter(v, selectedCategories, selectedSubcategories),
    turnBasedRecent: v => v.최근구절여부 && categoryFilter(v, selectedCategories, selectedSubcategories),
  };

  const completionCheck = {
    turnBasedReview: v => (v.maxCompletedTurn || 0) >= targetTurn,
    turnBasedNew: v => (v.maxCompletedTurnForNew || 0) >= targetTurnForNew,
    turnBasedRecent: v => (v.maxCompletedTurnForRecent || 0) >= targetTurnForRecent,
  };

  const bf = baseFilter[mode];
  const cc = completionCheck[mode];
  if (!bf || !cc) return { base: [], remaining: [], completed: [] };

  const base = activeVerses.filter(bf);
  return {
    base,
    remaining: base.filter(v => !cc(v)),
    completed: base.filter(v => cc(v)),
  };
};

// 현재 모드의 목표 차수 라벨 (예: "3차")
export const getTurnTargetLabel = (mode, settings = {}) => {
  const { targetTurn = 1, targetTurnForNew = 1, targetTurnForRecent = 1 } = settings;
  if (mode === 'turnBasedReview') return `${targetTurn}차`;
  if (mode === 'turnBasedNew') return `${targetTurnForNew}차`;
  if (mode === 'turnBasedRecent') return `${targetTurnForRecent}차`;
  return '';
};

// 차수별 복습(turnBasedReview)의 "오늘 날짜에 맞는 분량" 계산.
// HomePage의 목표량 계산 로직과 동일. 스케줄이 없으면 null(=분량 제한 개념 없음).
export const getDailyReviewGoal = (originalVerses, mode, settings = {}, turnScheduleData = {}) => {
  if (mode !== 'turnBasedReview') return null;
  if (!originalVerses || !originalVerses.length || !turnScheduleData) return null;

  const { selectedCategories = ['전체'], selectedSubcategories = ['전체'], targetTurn = 1 } = settings;
  const schedule = turnScheduleData[targetTurn];
  if (!schedule || !schedule.startDate || !schedule.endDate) return null;

  const versesInScope = originalVerses.filter(v =>
    !v.미암송여부 && !v.뉴구절여부 && !v.최근구절여부 &&
    categoryFilter(v, selectedCategories, selectedSubcategories));
  const totalInScope = versesInScope.length;
  if (totalInScope === 0) return 0;

  const totalReviewedCount = versesInScope.filter(v => (v.maxCompletedTurn || 0) >= targetTurn).length;
  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
  const today = new Date();
  [startDate, endDate, today].forEach(d => d.setHours(0, 0, 0, 0));
  if (today < startDate || today > endDate) return 0;

  const totalDays = Math.round((endDate - startDate) / 86400000) + 1;
  const elapsedDays = Math.round((today - startDate) / 86400000) + 1;
  if (totalDays <= 0) return 0;

  const recommendedPerDay = totalInScope / totalDays;
  const targetByToday = Math.floor(elapsedDays * recommendedPerDay);
  const goal = targetByToday - totalReviewedCount;
  return goal > 0 ? goal : 0;
};

// 하루 단위로 안정적인 유사난수 해시 (같은 날 동일 순서 유지 → 리렌더 시 안 섞임)
const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
};

// 홈 복습 정렬(useReviewSession)과 동일한 규칙으로 구절 목록을 정렬.
// 단, random/grouped_random은 Math.random 대신 "구절id+날짜" 해시로 하루 동안 고정.
const orderVerses = (list, order) => {
  const arr = [...list];
  const dayStr = getReviewDateStr();
  const seeded = (a, b) => hashStr(`${a.id}|${dayStr}`) - hashStr(`${b.id}|${dayStr}`);

  switch (order) {
    case 'random':
      return arr.sort(seeded);
    case 'ref_asc':
      return arr.sort((a, b) => (a.장절 || '').localeCompare(b.장절 || ''));
    case 'oldest_first':
      return arr.sort((a, b) => {
        const da = a.복습날짜 ? new Date(a.복습날짜.replace(/\./g, '-')).getTime() : 0;
        const db = b.복습날짜 ? new Date(b.복습날짜.replace(/\./g, '-')).getTime() : 0;
        return da - db;
      });
    case 'grouped_random': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const getDaysAgo = (v) => {
        if (!v.복습날짜) return Infinity;
        const d = new Date(v.복습날짜.replace(/\.\s*/g, '-'));
        d.setHours(0, 0, 0, 0);
        return (today.getTime() - d.getTime()) / 86400000;
      };
      const buckets = { b10: [], b8: [], b7: [], b6: [], b5: [], b4: [], b3: [], rest: [] };
      for (const v of arr) {
        const da = getDaysAgo(v);
        if (da >= 10) buckets.b10.push(v);
        else if (da >= 8) buckets.b8.push(v);
        else if (da >= 7) buckets.b7.push(v);
        else if (da >= 6) buckets.b6.push(v);
        else if (da >= 5) buckets.b5.push(v);
        else if (da >= 4) buckets.b4.push(v);
        else if (da >= 3) buckets.b3.push(v);
        else buckets.rest.push(v);
      }
      Object.values(buckets).forEach((b) => b.sort(seeded));
      return [
        ...buckets.b10, ...buckets.b8, ...buckets.b7, ...buckets.b6,
        ...buckets.b5, ...buckets.b4, ...buckets.b3, ...buckets.rest,
      ];
    }
    case 'sequential':
    default:
      return arr.sort((a, b) => (Number(a.번호) || 0) - (Number(b.번호) || 0));
  }
};

// 트리 복습 모드에서 실제로 렌더링할 구절 목록을 옵션에 맞게 구성.
//  - dailyLimit: 차수별 복습에서 "오늘 분량"(getDailyReviewGoal)만큼만 노출.
//      어떤 구절이 오늘 분량인지는 홈 정렬(settings.order)로 선택(홈과 동일한 오늘 세트).
//  - completedDisplay: 'hide' = 완료 구절 숨김 / 'gray' = 완료 구절도 회색으로 노출.
//      오늘 분량 모드에선 '오늘 완료한 구절'만, 전체 모드에선 완료 전체를 회색 노출.
// 반환 구절에는 _completed(완료 여부) 플래그를 부여. (화면 배치는 호출부에서 번호순 구조로 재그룹)
export const buildTreeReviewData = (originalVerses, mode, settings = {}, turnScheduleData = {}, options = {}) => {
  const { dailyLimit = false, completedDisplay = 'hide' } = options;
  const { order = 'sequential' } = settings;
  const { remaining, completed } = getTurnBasedScope(originalVerses, mode, settings);
  const goal = getDailyReviewGoal(originalVerses, mode, settings, turnScheduleData);
  const limitActive = dailyLimit && goal !== null;
  const todayStr = getReviewDateStr();

  // 오늘 완료한 구절 수 (오늘 분량 진행률 계산용)
  const doneTodayCount = completed.filter((v) => v.복습날짜 === todayStr).length;

  // 오늘 분량: 홈 정렬로 남은 구절을 정렬해 앞에서 goal개 선택
  const activeRemaining = limitActive
    ? orderVerses(remaining, order).slice(0, Math.max(0, goal))
    : remaining;

  let shownCompleted = [];
  if (completedDisplay === 'gray') {
    shownCompleted = limitActive
      ? completed.filter((v) => v.복습날짜 === todayStr)
      : completed;
  }

  const verses = [
    ...activeRemaining.map((v) => ({ ...v, _completed: false })),
    ...shownCompleted.map((v) => ({ ...v, _completed: true })),
  ];

  return {
    verses,
    remainingCount: remaining.length,
    completedCount: completed.length,
    activeCount: activeRemaining.length,
    goal,
    doneTodayCount,
  };
};

// ── 개인판에서 옮김(#395, 2026-11-26) — 날짜는 이 앱 복습날짜 형식(getReviewDateStr) ──
// 홈 「빠른 모드 선택」 버튼용 — 해당 모드의 "오늘" 진행 상태.
//   'done'     : 오늘 할 것이 남지 않음
//   'progress' : 오늘 한 개 이상 복습했지만 아직 남음
//   'idle'     : 오늘 복습 기록 없음
//   null       : 대상 구절이 없어 판정 불가
// 판정 규칙:
//   - 복습구절 + 오늘이 차수 일정 안: 「오늘 남은 구절」(getDailyReviewGoal)이 0이면 done
//   - 그 외(뉴구절·최근구절, 일정 없는 복습구절): 대상 전부가 오늘 날짜로 복습됐거나 차수 잔여 0이면 done
//   오늘 복습 수는 base 기준(완료 판정과 무관)으로 센다 — 뉴/최근은 완주 즉시 다음 차수로 자동 진급해
//   completed가 비어 버리므로, completed 기준으로 세면 다 한 직후에 '시작 전'으로 되돌아간다.
export const getTodayModeStatus = (originalVerses, mode, settings = {}, turnScheduleData = {}) => {
  const { base, remaining } = getTurnBasedScope(originalVerses, mode, settings);
  if (!base.length) return null;

  const todayStr = getReviewDateStr();
  const doneToday = base.filter((v) => v.복습날짜 === todayStr).length;

  let inSchedule = false;
  if (mode === 'turnBasedReview' && turnScheduleData) {
    const schedule = turnScheduleData[settings.targetTurn || 1];
    if (schedule && schedule.startDate && schedule.endDate) {
      const start = new Date(schedule.startDate);
      const end = new Date(schedule.endDate);
      const today = new Date();
      [start, end, today].forEach((d) => d.setHours(0, 0, 0, 0));
      inSchedule = today >= start && today <= end;
    }
  }

  if (inSchedule) {
    const goal = getDailyReviewGoal(originalVerses, mode, settings, turnScheduleData);
    if (goal === 0) return 'done';
    return doneToday > 0 ? 'progress' : 'idle';
  }

  if (remaining.length === 0 || doneToday >= base.length) return 'done';
  return doneToday > 0 ? 'progress' : 'idle';
};

// 홈 「오늘의 복습」 마감 표시용 — 현재 차수 일정의 종료일과 남은 날짜.
// 차수별 복습(turnBasedReview)만 일정을 갖는다 → 다른 모드는 null(표시 안 함).
// 일정이 등록되지 않은 차수면 { missing: true }.
//   tone: 'normal'(여유) | 'warn'(3일 이하) | 'danger'(오늘 마감·초과)
// 날짜 정규화는 getDailyReviewGoal과 똑같이 `new Date(문자열)` + setHours(0,0,0,0)를 쓴다 —
// 방식을 달리하면 "오늘 마감"인데 오늘 분량은 이미 0인 식으로 경계가 어긋난다.
export const getTurnDeadline = (mode, settings = {}, turnScheduleData = {}) => {
  if (mode !== 'turnBasedReview') return null;
  const turn = settings.targetTurn || 1;
  const schedule = turnScheduleData ? turnScheduleData[turn] : null;
  if (!schedule || !schedule.endDate) return { turn, missing: true };

  const end = new Date(schedule.endDate);
  const today = new Date();
  [end, today].forEach((d) => d.setHours(0, 0, 0, 0));
  if (Number.isNaN(end.getTime())) return { turn, missing: true };

  const daysLeft = Math.round((end - today) / 86400000);
  const endLabel = `${end.getMonth() + 1}. ${end.getDate()}.`;

  let text;
  let tone;
  if (daysLeft > 0) {
    text = `${daysLeft}일 남음`;
    tone = daysLeft <= 3 ? 'warn' : 'normal';
  } else if (daysLeft === 0) {
    text = '오늘 마감';
    tone = 'danger';
  } else {
    text = `${-daysLeft}일 지남`;
    tone = 'danger';
  }
  return { turn, missing: false, endLabel, daysLeft, text, tone };
};
