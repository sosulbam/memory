// 암송 시험 확정 점수 기록(#400, 개인판 #300 과 같은 한 줄 형식) — 한 문제 확정 = 한 줄.
// 이 기기 localStorage 에만 둔다. 동기화 코드를 쓰는 기기는 saveDataToLocal 이 다른 기기로도 보내고,
// 받을 때는 syncApi 가 id 로 합친다(두 기기가 따로 기록해도 잃지 않게).
import { TEST_SCORES_KEY } from '../constants';
import { loadDataFromLocal, saveDataToLocal } from '../api/localStorageApi';

const asList = (v) => (Array.isArray(v) ? v : []);

export const loadScoreLog = () => asList(loadDataFromLocal(TEST_SCORES_KEY));

export const appendScoreRecords = (records) => {
  if (!records.length) return;
  const merged = new Map();
  [...loadScoreLog(), ...records].forEach((r) => {
    if (r && r.id && !merged.has(r.id)) merged.set(r.id, r);
  });
  saveDataToLocal(TEST_SCORES_KEY, [...merged.values()]);
};
