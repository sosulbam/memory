// src/constants/index.js

/**
 * 애플리케이션 전체에서 사용되는 상수들을 정의합니다.
 * API 키, 기본 URL, 모드 목록 등을 중앙에서 관리하여 일관성을 유지합니다.
 */

export const MODES = [
  { label: '카테고리별 복습', value: 'category' },
  { label: '뉴구절복습', value: 'new' },
  { label: '오답구절복습', value: 'wrong' },
  { label: '즐겨찾기', value: 'favorite' },
  { label: '최근구절복습', value: 'recent' },
  { label: '차수별 복습', value: 'turnBasedReview' },
  { label: '차수별 뉴구절', value: 'turnBasedNew' },
  { label: '차수별 최근구절', value: 'turnBasedRecent' },
  { label: '미암송 관리', value: 'pending' },
];

export const API_BASE_URL = '/api/doc';

// 데이터 저장을 위한 키
export const VERSES_DATA_KEY = 'recitation-app-verses';
export const REVIEW_STATUS_KEY = 'recitation-app-review-status';
export const TAGS_DATA_KEY = 'recitation-app-tags';
export const REVIEW_LOG_KEY = 'recitation-app-review-log';
export const TURN_SCHEDULE_KEY = 'recitation-app-turn-schedule';

// 로컬 캐시 및 사용자 설정 저장을 위한 키
export const CACHED_VERSES_KEY = 'recitation-app-cached-verses';
export const THEME_PREFERENCE_KEY = 'recitation-app-theme';
export const LAST_APP_STATE_KEY = 'recitation-app-last-app-state';
export const VERSELIST_STATE_KEY = 'recitation-app-verselist-state';

// --- 여기를 수정했습니다 ---
// purple과 dawn을 삭제하고, midnight와 forest를 추가했습니다.
export const THEMES = {
  green: 'linear-gradient(135deg, #71b280, #acd89d)',
  blue: 'linear-gradient(135deg, #5a8dee, #8ac6f2)',
  deepsea: 'linear-gradient(135deg, #2c3e50, #4ca1af)',
   twilight: 'linear-gradient(135deg, #1e3c72, #2a5298)', // 황혼 (추가)
  moss: 'linear-gradient(135deg, #134E5E, #71B280)',   // 이끼 (추가)
  midnight: 'linear-gradient(135deg, #141E30, #243B55)', // 자정
  forest: 'linear-gradient(135deg, #0f2027, #2c5364)',   // 숲
  olive: 'linear-gradient(135deg, #8E9EAB, #DAD4CC)',
};