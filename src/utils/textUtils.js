// src/utils/textUtils.js

/**
 * 채점을 위해 텍스트에서 모든 공백과 주요 구두점을 제거합니다.
 * @param {string} text - 원본 텍스트
 * @returns {string} - 정규화된 텍스트
 */
export const normalizeText = (text) => {
  if (!text) return '';
  // 모든 공백(띄어쓰기, 줄바꿈 등)을 제거하고, 일반적인 구두점을 제거합니다.
  return text.replace(/\s+/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
};