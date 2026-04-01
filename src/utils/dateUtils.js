// src/utils/dateUtils.js

/**
 * 현재 시각을 KST(UTC+9) 기준 YYYY-MM-DD 문자열로 반환합니다.
 * 서버 없이 클라이언트 타임존에 의존할 경우 자정 전후로 날짜가
 * 어긋날 수 있어, KST 오프셋을 명시적으로 계산합니다.
 */
export const getKSTDateString = () =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
