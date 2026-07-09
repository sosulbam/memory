// src/utils/reviewActions.js
// "복습 완료" 처리 시 필요한 상태 업데이트 계산 + 복습 로그 기록.
// useReviewSession.handleMarkAsReviewed 안에 있던 로직을 순수 함수로 추출한 것으로,
// 트리 구조 보기(VerseTreePage)의 복습이 홈과 100% 동일하게 통계/차수에 반영되도록 한다.
// ⚠️ 공개판: 날짜는 getKSTDateString(YYYY-MM-DD) 사용. 홈 코드는 건드리지 않음.

import { saveDataToLocal, loadDataFromLocal } from '../api/localStorageApi';
import { REVIEW_LOG_KEY } from '../constants';
import { getKSTDateString } from './dateUtils';

// 모드에 맞는 상태 업데이트 객체 생성 (updateVerseStatus에 그대로 전달)
export const buildReviewUpdates = (verse, mode, turns = {}) => {
  const { targetTurn = 1, targetTurnForNew = 1, targetTurnForRecent = 1 } = turns;
  const updates = { 복습날짜: getKSTDateString(), 미암송여부: false };

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
