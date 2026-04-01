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

export const THEMES = {
  green: 'linear-gradient(135deg, #71b280, #acd89d)',
  blue: 'linear-gradient(135deg, #5a8dee, #8ac6f2)',
  deepsea: 'linear-gradient(135deg, #2c3e50, #4ca1af)',
  twilight: 'linear-gradient(135deg, #1e3c72, #2a5298)', // 황혼
  moss: 'linear-gradient(135deg, #134E5E, #71B280)',   // 이끼
  midnight: 'linear-gradient(135deg, #141E30, #243B55)', // 자정
  forest: 'linear-gradient(135deg, #0f2027, #2c5364)',   // 숲
  olive: 'linear-gradient(135deg, #8E9EAB, #DAD4CC)',
};

// --- [신규] 성경 약어 매핑 (TTS용) ---
export const BIBLE_BOOKS = {
  '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기', '신': '신명기',
  '수': '여호수아', '삿': '사사기', '룻': '룻기', '삼상': '사무엘상', '삼하': '사무엘하',
  '왕상': '열왕기상', '왕하': '열왕기하', '대상': '역대상', '대하': '역대하', '스': '에스라',
  '느': '느헤미야', '에': '에스더', '욥': '욥기', '시': '시편', '잠': '잠언',
  '전': '전도서', '아': '아가', '사': '이사야', '렘': '예레미야', '애': '예레미야애가',
  '겔': '에스겔', '단': '다니엘', '호': '호세아', '욜': '요엘', '암': '아모스',
  '옵': '오바댜', '욘': '요나', '미': '미가', '나': '나훔', '합': '하박국',
  '습': '스바냐', '학': '학개', '슥': '스가랴', '말': '말라기',
  '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음', '행': '사도행전',
  '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서', '갈': '갈라디아서', '엡': '에베소서',
  '빌': '빌립보서', '골': '골로새서', '살전': '데살로니가전서', '살후': '데살로니가후서',
  '딤전': '디모데전서', '딤후': '디모데후서', '딛': '디도서', '몬': '빌레몬서', '히': '히브리서',
  '약': '야고보서', '벧전': '베드로전서', '벧후': '베드로후서', '요일': '요한일서', '요이': '요한이서',
  '요삼': '요한삼서', '유': '유다서', '계': '요한계시록'
};