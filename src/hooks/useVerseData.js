import { useState, useEffect, useCallback } from 'react';
import { loadDataFromLocal, saveDataToLocal } from '../api/localStorageApi';
import {
  VERSES_DATA_KEY,
  REVIEW_STATUS_KEY,
  TAGS_DATA_KEY,
  TURN_SCHEDULE_KEY,
  REVIEW_LOG_KEY,
} from '../constants';
import { getKSTDateString } from '../utils/dateUtils';

export const useVerseData = () => {
  const [isLoading, setIsLoading] = useState(true);

  const [rawVerses, setRawVerses] = useState([]);
  const [reviewStatusData, setReviewStatusData] = useState({});
  const [tagsData, setTagsData] = useState({});
  const [turnScheduleData, setTurnScheduleData] = useState({});
  const [originalVerses, setOriginalVerses] = useState([]);
  const [reviewLogData, setReviewLogData] = useState({});

  useEffect(() => {
    if (rawVerses.length > 0) {
      // --- [수정] '암송시작일'이 rawVerses에 있으므로, reviewStatusData와 합칠 때 덮어쓰지 않도록 함 ---
      const enriched = rawVerses.map(v => ({ 
          ...v, // v에 '암송시작일' 포함
          ...(reviewStatusData[v.id] || {}) 
      }));
      setOriginalVerses(enriched);
    } else {
      setOriginalVerses([]);
    }
  }, [rawVerses, reviewStatusData]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    const verses = loadDataFromLocal(VERSES_DATA_KEY);
    const statusData = loadDataFromLocal(REVIEW_STATUS_KEY);
    const tags = loadDataFromLocal(TAGS_DATA_KEY);
    const schedule = loadDataFromLocal(TURN_SCHEDULE_KEY);
    const reviewLog = loadDataFromLocal(REVIEW_LOG_KEY);

    let finalVerses = Array.isArray(verses) ? verses : [];
    
    if (finalVerses.length === 0) {
      try {
        const res = await fetch('/data/verses.json'); 
        if (res.ok) {
          const localJson = await res.json();
          finalVerses = localJson.map(v => ({ ...v, id: v.id || `verse-${Math.random().toString(36).substr(2, 9)}` }));
          saveDataToLocal(VERSES_DATA_KEY, finalVerses); 
        } else {
          console.error('Failed to fetch initial verses:', res.status, res.statusText);
        }
      } catch (error) { 
        console.error('Error fetching initial verses', error); 
      }
    }

    setRawVerses(finalVerses);
    setReviewStatusData(statusData || {});
    setTagsData(tags || {});
    setTurnScheduleData(schedule || {});
    setReviewLogData(reviewLog || {});
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateVerseStatus = useCallback(
    (verseId, updates) => {
      setReviewStatusData(prev => {
        const currentStatus = prev[verseId] || {};
        const newUpdates = { ...updates };

        // --- 👇 [수정] '암송시작일' 자동 기록 로직 제거 ---
        // '암송시작일'은 VerseManager에서 수동으로 VERSES_DATA_KEY에 저장됩니다.
        // --- 👆 [수정] 완료 ---

        return { ...prev, [verseId]: { ...currentStatus, ...newUpdates } };
      });
    },
    [] // 의존성 배열은 비워 둡니다 (setState의 함수형 업데이트 사용)
  );
  
  useEffect(() => {
      if (Object.keys(reviewStatusData).length === 0) return;
      const handler = setTimeout(() => {
          saveDataToLocal(REVIEW_STATUS_KEY, reviewStatusData);
      }, 1000);
      return () => clearTimeout(handler);
  }, [reviewStatusData]);

  const updateTags = useCallback(
    (verseId, newTags) => {
      const newTagsData = { ...tagsData, [verseId]: newTags };
      setTagsData(newTagsData);
      saveDataToLocal(TAGS_DATA_KEY, newTagsData);
    },
    [tagsData]
  );

  const resetReviewStatus = useCallback(
    (type, showSnackbar) => {
      if (!showSnackbar) { console.error("showSnackbar function is not provided."); alert("오류가 발생했습니다."); return; }

      if (type === 'reviewLog') {
        if (window.confirm('정말로 모든 통계 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
          saveDataToLocal(REVIEW_LOG_KEY, {});
          setReviewLogData({});
          showSnackbar('통계 기록이 초기화되었습니다.', 'success');
        }
        return;
      }
      
      const turnKeys = ['currentReviewTurn', 'maxCompletedTurn', 'currentReviewTurnForNew', 'maxCompletedTurnForNew', 'currentReviewTurnForRecent', 'maxCompletedTurnForRecent'];
      const boolKeys = ['복습여부', '뉴구절복습여부', '오답복습여부', '최근구절복습여부', '즐겨찾기복습여부'];

      const logResetTypes = {
        category: 'general',
        new: 'new',
        wrong: 'wrong',
        recent: 'recent',
        favorite: 'favorite',
      };

      const logCategoryToReset = logResetTypes[type];
      const isFullReset = type === 'all';

      if (logCategoryToReset || isFullReset) {
        const log = loadDataFromLocal(REVIEW_LOG_KEY) || {};
        const kst = getKSTDateString();

        if (log[kst] && typeof log[kst] === 'object') {
          if (isFullReset) {
            Object.keys(log[kst]).forEach(key => {
              if (key !== 'total') {
                log[kst][key] = 0;
              }
            });
          } else if (logCategoryToReset) {
            log[kst][logCategoryToReset] = 0;
          }

          const totalCount = Object.keys(log[kst]).reduce((sum, key) => key !== 'total' ? sum + (log[kst][key] || 0) : sum, 0);
          log[kst].total = totalCount;
          
          saveDataToLocal(REVIEW_LOG_KEY, log);
          setReviewLogData(log); 
        }
      }

      const resetMap = {
        new: ['뉴구절복습여부'],
        wrong: ['오답복습여부'],
        recent: ['최근구절복습여부'],
        favorite: ['즐겨찾기복습여부'],
        category: ['복습여부'],
        all_turns: [...turnKeys.filter(k => !k.includes('New') && !k.includes('Recent')), '복습여부'],
        all_turns_new: [...turnKeys.filter(k => k.includes('New')), '뉴구절복습여부'],
        all_turns_recent: [...turnKeys.filter(k => k.includes('Recent')), '최근구절복습여부'],
        all: [...turnKeys, ...boolKeys],
      };

      const keysToReset = resetMap[type];
      if (!keysToReset) {
        if (showSnackbar) showSnackbar('알 수 없는 초기화 타입입니다.', 'error');
        return;
      }

      const newStatusData = JSON.parse(JSON.stringify(reviewStatusData));

      for (const verse of rawVerses) {
        if (!newStatusData[verse.id]) newStatusData[verse.id] = {};
        keysToReset.forEach((prop) => {
          if (prop.includes('maxCompletedTurn')) {
            newStatusData[verse.id][prop] = 0;
          } else if (prop.includes('currentReviewTurn')) {
            newStatusData[verse.id][prop] = 1;
          } else {
            newStatusData[verse.id][prop] = false;
          }
        });
      }

      saveDataToLocal(REVIEW_STATUS_KEY, newStatusData);
      setReviewStatusData(newStatusData); 
      if (showSnackbar) showSnackbar('선택한 복습 기록이 초기화되었습니다.', 'success');
      
    },
    [reviewStatusData, rawVerses]
  );
  
  return {
    isLoading,
    originalVerses,
    reviewStatusData,
    tagsData,
    turnScheduleData,
    reviewLogData,
    setTurnScheduleData,
    updateVerseStatus,
    updateTags,
    loadData,
    resetReviewStatus,
  };
};