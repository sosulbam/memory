// src/terms.js
// 화면에 보이는 용어 — 등불판은 사이트와 같은 말(새 구절·최근 구절·큰 분류·작은 분류), 기본판은 종전 말 그대로.
// 데이터 필드 이름(뉴구절여부·카테고리 등)은 바꾸지 않는다. 보이는 글자만.
import { IS_LAMP } from './edition';

export const T = IS_LAMP ? {
  cat: '큰 분류', sub: '작은 분류', newV: '새 구절', recent: '최근 구절', review: '복습 구절', wrong: '오답 구절',
} : {
  cat: '카테고리', sub: '소카테고리', newV: '뉴구절', recent: '최근구절', review: '복습구절', wrong: '오답구절',
};

// 구절 목록·관리의 「유형」 거르기 값(값은 그대로, 보이는 이름만)
export const typeLabel = (f) => (IS_LAMP ? ({ 뉴구절: '새 구절', 최근구절: '최근 구절', 오답구절: '오답 구절' }[f] || f) : f);
