// src/utils/textUtils.js

/**
 * 채점을 위해 텍스트에서 모든 공백과 주요 구두점을 제거합니다.
 */
export const normalizeText = (text) => {
  if (!text) return '';
  return text.replace(/\s+/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
};

/**
 * 숫자 문자열을 한국어 한자음(십, 백, 천...)으로 변환합니다.
 * TTS 발음 처리용. 예: "3" → "삼", "12" → "십이", "150" → "백오십"
 */
export const numberToSinoKorean = (numStr) => {
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return numStr;
  const digitMap = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const tenMap = ['', '십', '백', '천'];
  const sNum = String(num);
  let result = '';
  for (let i = 0; i < sNum.length; i++) {
    const digit = parseInt(sNum[i]);
    const pos = sNum.length - 1 - i;
    if (digit !== 0) {
      if (digit === 1 && pos > 0) { } else { result += digitMap[digit]; }
      result += tenMap[pos];
    }
  }
  return result;
};