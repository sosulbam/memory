// src/utils/dateUtils.js

/**
 * 현재 시각을 KST(UTC+9) 기준 YYYY-MM-DD 문자열로 반환합니다.
 * 서버 없이 클라이언트 타임존에 의존할 경우 자정 전후로 날짜가
 * 어긋날 수 있어, KST 오프셋을 명시적으로 계산합니다.
 */
export const getKSTDateString = () =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

/**
 * 복습날짜("YYYY. M. D.")를 '마지막 복습: 3일 전' 문구로 변환합니다.
 * 복습 카드(VerseCard)와 구절 구조 보기(VerseTreePage)가 같은 문구를 쓰도록 공유합니다.
 */
export const calculateDaysAgoText = (reviewDateStr) => {
  if (!reviewDateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(reviewDateStr.replace(/\.\s*/g, '-')); reviewDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
  if (isNaN(diffDays) || diffDays < 0) return null;
  if (diffDays === 0) return '마지막 복습: 오늘';
  if (diffDays === 1) return '마지막 복습: 어제';
  return `마지막 복습: ${diffDays}일 전`;
};
