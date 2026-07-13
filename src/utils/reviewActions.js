// src/utils/reviewActions.js
// "복습 완료" 처리 시 필요한 상태 업데이트 계산 + 복습 로그 기록.
// useReviewSession.handleMarkAsReviewed 안에 있던 로직을 순수 함수로 추출한 것으로,
// 트리 구조 보기(VerseTreePage)의 복습이 홈과 100% 동일하게 통계/차수에 반영되도록 한다.
// ⚠️ 공개판: 날짜는 getKSTDateString(YYYY-MM-DD) 사용. 홈 코드는 건드리지 않음.

import { saveDataToLocal, loadDataFromLocal } from '../api/localStorageApi';
import { REVIEW_LOG_KEY } from '../constants';
import { getKSTDateString } from './dateUtils';
import { getReviewDateStr } from './reviewScope';

// 모드에 맞는 상태 업데이트 객체 생성 (updateVerseStatus에 그대로 전달)
export const buildReviewUpdates = (verse, mode, turns = {}) => {
  const { targetTurn = 1, targetTurnForNew = 1, targetTurnForRecent = 1 } = turns;
  // ⚠️ 복습날짜는 홈(useReviewSession)과 동일한 "YYYY. M. D"(로컬) 형식이어야
  //    통계/정렬/오늘 완료 비교가 일치한다. (REVIEW_LOG 키만 getKSTDateString 사용)
  const updates = { 복습날짜: getReviewDateStr(), 미암송여부: false };

  switch (mode) {
    case 'category':
      updates.복습여부 = true;
      break;
    case 'new':
      updates.뉴구절복습여부 = true;
      updates.복습여부 = true;
      break;
    case 'wrong':
      updates.오답복습여부 = true;
      updates.복습여부 = true;
      break;
    case 'recent':
      updates.최근구절복습여부 = true;
      updates.복습여부 = true;
      break;
    case 'favorite':
      updates.즐겨찾기복습여부 = true;
      updates.복습여부 = true;
      break;
    case 'turnBasedReview':
      if ((verse.maxCompletedTurn || 0) < targetTurn) updates.maxCompletedTurn = targetTurn;
      updates.currentReviewTurn = targetTurn + 1;
      break;
    case 'turnBasedNew':
      if ((verse.maxCompletedTurnForNew || 0) < targetTurnForNew) updates.maxCompletedTurnForNew = targetTurnForNew;
      updates.currentReviewTurnForNew = targetTurnForNew + 1;
      updates.뉴구절복습여부 = true;
      break;
    case 'turnBasedRecent':
      if ((verse.maxCompletedTurnForRecent || 0) < targetTurnForRecent) updates.maxCompletedTurnForRecent = targetTurnForRecent;
      updates.currentReviewTurnForRecent = targetTurnForRecent + 1;
      updates.최근구절복습여부 = true;
      break;
    default:
      break;
  }
  return updates;
};

// 차수별 모드 → 설정 키 / 세터 이름 / 사람이 읽는 이름
export const TURN_MODE_META = {
  turnBasedReview: { key: 'targetTurn', setter: 'setTargetTurn', label: '복습구절' },
  turnBasedNew: { key: 'targetTurnForNew', setter: 'setTargetTurnForNew', label: '뉴구절' },
  turnBasedRecent: { key: 'targetTurnForRecent', setter: 'setTargetTurnForRecent', label: '최근구절' },
};

// 현재 차수를 다음 차수로 진급시킨다. 완료 이력(maxCompletedTurn*)은 지우지 않으므로
// "몇 바퀴 돌았는지"가 누적 보존된다. 진급한 차수를 반환(모드가 아니면 null).
export const advanceToNextTurn = (mode, settings, setters) => {
  const meta = TURN_MODE_META[mode];
  if (!meta) return null;
  const nextTurn = (settings[meta.key] || 1) + 1;
  setters[meta.setter](nextTurn);
  return nextTurn;
};

// 복습 로그(통계/복습로그 페이지 집계)에 1건 기록
export const writeReviewLog = (mode) => {
  const logCategoryMap = {
    turnBasedReview: 'general', category: 'general',
    turnBasedNew: 'new', new: 'new',
    turnBasedRecent: 'recent', recent: 'recent',
    favorite: 'favorite', wrong: 'wrong',
  };
  const logCategory = logCategoryMap[mode];
  if (!logCategory) return;

  const log = loadDataFromLocal(REVIEW_LOG_KEY) || {};
  const kst = getKSTDateString();
  if (!log[kst] || typeof log[kst] !== 'object') { log[kst] = { total: 0 }; }
  log[kst][logCategory] = (log[kst][logCategory] || 0) + 1;
  const totalCount = Object.keys(log[kst]).reduce((sum, key) => key !== 'total' ? sum + log[kst][key] : sum, 0);
  log[kst].total = totalCount;
  saveDataToLocal(REVIEW_LOG_KEY, log);
};
