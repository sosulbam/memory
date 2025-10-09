// src/api/localStorageApi.js

/**
 * 키(key)에 해당하는 데이터를 로컬 스토리지에서 불러옵니다.
 * 데이터가 없거나 'undefined' 문자열일 경우 key에 따라 기본값 ([], {})을 반환합니다.
 * @param {string} key - 데이터를 불러올 로컬 스토리지 키
 * @returns {any} - 파싱된 데이터 또는 기본값
 */
export const loadDataFromLocal = (key) => {
  try {
    const serializedData = localStorage.getItem(key);
    // null 또는 'undefined' 문자열이 저장된 경우를 모두 체크합니다.
    if (serializedData === null || serializedData === 'undefined') {
      return key.includes('tags') || key.includes('status') || key.includes('schedule') || key.includes('log') || key.includes('state')
        ? {}
        : [];
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`[Local Storage] Error loading ${key}:`, error);
    // 오류 발생 시에도 기본값 반환
    return key.includes('tags') || key.includes('status') || key.includes('schedule') || key.includes('log') || key.includes('state')
        ? {}
        : [];
  }
};

/**
 * 주어진 키로 데이터를 로컬 스토리지에 저장합니다.
 * undefined 값은 저장하지 않도록 방지합니다.
 * @param {string} key - 데이터를 저장할 로컬 스토리지 키
 * @param {any} data - 저장할 데이터
 */
export const saveDataToLocal = (key, data) => {
  try {
    // 저장하려는 데이터가 undefined인 경우 경고를 남기고 저장을 중단합니다.
    if (data === undefined) {
      console.warn(`[Local Storage] Attempted to save undefined for key: ${key}. Aborting.`);
      return;
    }
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`[Local Storage] Error saving ${key}:`, error);
  }
};