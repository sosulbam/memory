// src/hooks/useReviewSession.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { saveDataToLocal, loadDataFromLocal } from '../api/localStorageApi';
import { REVIEW_LOG_KEY } from '../constants';

export const useReviewSession = (originalVerses, settings, updateVerseStatus, showSnackbar, dailyProgress) => {
  const { mode, selectedCategories, selectedSubcategories, order, targetTurn, targetTurnForNew, targetTurnForRecent, completedSortOrder } = settings;

  const [versesToReview, setVersesToReview] = useState([]);
  const [completedInMode, setCompletedInMode] = useState([]);
  const [sessionCompleted, setSessionCompleted] = useState([]);
  
  const [index, setIndex] = useState(0);
  const [browseIndex, setBrowseIndex] = useState(0);
  
  const [showAnswer, setShowAnswer] = useState(false);
  const [isBrowsingCompleted, setIsBrowsingCompleted] = useState(false);

  const [todayCount, setTodayCount] = useState(0);
  const [totalTargetCount, setTotalTargetCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  
  const [isTurnCompleted, setIsTurnCompleted] = useState(false);
  
  const ignoreNextFilterRef = useRef(false);
  const todayStr = `${new Date().getFullYear()}. ${new Date().getMonth() + 1}. ${new Date().getDate()}`;

  const resetTurnCompletion = useCallback(() => {
    setIsTurnCompleted(false);
  }, []);

  useEffect(() => {
    setSessionCompleted([]);
    setIndex(0);
    setIsTurnCompleted(false); 
  }, [mode, selectedCategories, selectedSubcategories, order, targetTurn, targetTurnForNew, targetTurnForRecent]);

  useEffect(() => {
    if (ignoreNextFilterRef.current) {
      ignoreNextFilterRef.current = false;
      return;
    }

    if (!originalVerses || !originalVerses.length) {
      setVersesToReview([]);
      return;
    };

    setIsTurnCompleted(false);

    const activeVerses = originalVerses.filter(v => !v.미암송여부);

    const completionCheck = {
      category: v => v.복습여부,
      new: v => v.뉴구절복습여부,
      wrong: v => v.오답복습여부,
      favorite: v => v.즐겨찾기복습여부,
      recent: v => v.최근구절복습여부,
      turnBasedReview: v => (v.maxCompletedTurn || 0) >= targetTurn,
      turnBasedNew: v => (v.maxCompletedTurnForNew || 0) >= targetTurnForNew,
      turnBasedRecent: v => (v.maxCompletedTurnForRecent || 0) >= targetTurnForRecent,
      pending: v => false,
    };

    const categoryFilter = v => 
        (selectedCategories.includes('전체') || selectedCategories.length === 0 || selectedCategories.includes(v.카테고리)) &&
        (selectedSubcategories.includes('전체') || selectedSubcategories.length === 0 || selectedSubcategories.includes(v.소카테고리));

    const baseFilter = {
      turnBasedReview: v => !v.뉴구절여부 && !v.최근구절여부 && categoryFilter(v),
      turnBasedNew: v => v.뉴구절여부 && categoryFilter(v),
      turnBasedRecent: v => v.최근구절여부 && categoryFilter(v),
      new: v => v.뉴구절여부,
      wrong: v => v.오답여부,
      favorite: v => v.즐겨찾기,
      recent: v => v.최근구절여부,
      category: v => categoryFilter(v),
      pending: v => v.미암송여부 && categoryFilter(v),
    };

    const base = mode === 'pending' ? originalVerses.filter(baseFilter[mode]) : activeVerses.filter(baseFilter[mode] || (() => true));
    
    let remainingList = base.filter(v => !completionCheck[mode](v));
    const completedList = base.filter(v => completionCheck[mode](v));
    
    if (mode.startsWith('turnBased') && remainingList.length === 0 && base.length > 0) {
        setIsTurnCompleted(true);
    }

    if (remainingList.length > 0) {
      switch (order) {
        case 'random':
          remainingList.sort(() => Math.random() - 0.5);
          break;
        case 'oldest_first':
          remainingList.sort((a, b) => {
            const dateA = a.복습날짜 ? new Date(a.복습날짜.replace(/\./g, '-')).getTime() : 0;
            const dateB = b.복습날짜 ? new Date(b.복습날짜.replace(/\./g, '-')).getTime() : 0;
            return dateA - dateB;
          });
          break;
        case 'grouped_random':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const getDaysAgo = (verse) => {
              if (!verse.복습날짜) return Infinity;
              const reviewDate = new Date(verse.복습날짜.replace(/\.\s*/g, '-'));
              reviewDate.setHours(0, 0, 0, 0);
              return (today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
          };
          const buckets = { b10: [], b8: [], b7: [], b6: [], b5: [], b4: [], b3: [], rest: [] };
          for (const verse of remainingList) {
              const daysAgo = getDaysAgo(verse);
              if (daysAgo >= 10) buckets.b10.push(verse);
              else if (daysAgo >= 8) buckets.b8.push(verse);
              else if (daysAgo >= 7) buckets.b7.push(verse);
              else if (daysAgo >= 6) buckets.b6.push(verse);
              else if (daysAgo >= 5) buckets.b5.push(verse);
              else if (daysAgo >= 4) buckets.b4.push(verse);
              else if (daysAgo >= 3) buckets.b3.push(verse);
              else buckets.rest.push(verse);
          }
          Object.values(buckets).forEach(bucket => bucket.sort(() => Math.random() - 0.5));
          remainingList = [ ...buckets.b10, ...buckets.b8, ...buckets.b7, ...buckets.b6, ...buckets.b5, ...buckets.b4, ...buckets.b3, ...buckets.rest ];
          break;
        case 'sequential':
        default:
          remainingList.sort((a,b) => (Number(a.번호) || 0) - (Number(b.번호) || 0));
          break;
      }
    }

    setVersesToReview(remainingList);
    setCompletedInMode(completedList);
    setTotalTargetCount(base.length);
    setReviewedCount(completedList.length);
    setTodayCount(base.filter(v => completionCheck[mode](v) && v.복습날짜 === todayStr).length);
    
    setShowAnswer(false);
    setIsBrowsingCompleted(false);
    setBrowseIndex(0);
    
  }, [mode, selectedCategories, selectedSubcategories, order, originalVerses, targetTurn, targetTurnForNew, targetTurnForRecent, todayStr]);

  const browsableCompletedList = useMemo(() => {
    const combined = [...completedInMode, ...sessionCompleted];
    if (completedSortOrder === 'sequential') {
        return combined.sort((a, b) => (Number(a.번호) || 0) - (Number(b.번호) || 0));
    }
    const sorted = combined.sort((a, b) => {
        const dateA = a.복습날짜 ? new Date(a.복습날짜.replace(/\./g, '-')).getTime() : 0;
        const dateB = b.복습날짜 ? new Date(b.복습날짜.replace(/\./g, '-')).getTime() : 0;
        return dateB - dateA;
    });
    return sorted;
  }, [completedInMode, sessionCompleted, completedSortOrder]);

  const toggleAnswer = useCallback(() => setShowAnswer(prev => !prev), []);
  
  const updateVerseInPlace = useCallback((updates) => {
    if (isBrowsingCompleted || !versesToReview[index]) return;
    ignoreNextFilterRef.current = true;
    setVersesToReview(currentList => {
      const newList = [...currentList];
      newList[index] = { ...newList[index], ...updates };
      return newList;
    });
    updateVerseStatus(versesToReview[index].id, updates);
  }, [index, versesToReview, isBrowsingCompleted, updateVerseStatus]);

  const browseNext = useCallback(() => {
    if (browsableCompletedList.length === 0) return;
    setBrowseIndex(prev => (prev + 1) % browsableCompletedList.length);
    setShowAnswer(false);
  }, [browsableCompletedList.length]);

  const browsePrev = useCallback(() => {
    if (browsableCompletedList.length === 0) return;
    setBrowseIndex(prev => (prev - 1 + browsableCompletedList.length) % browsableCompletedList.length);
    setShowAnswer(false);
  }, [browsableCompletedList.length]);
  
  const toggleBrowseMode = useCallback(() => {
      setIsBrowsingCompleted(prev => {
          setShowAnswer(false);
          if (!prev) {
              const lastCompleted = sessionCompleted.length > 0 ? sessionCompleted[sessionCompleted.length - 1] : null;
              if (lastCompleted) {
                  const newIndex = browsableCompletedList.findIndex(v => v.id === lastCompleted.id);
                  setBrowseIndex(newIndex !== -1 ? newIndex : 0);
              } else {
                  setBrowseIndex(0);
              }
          }
          return !prev;
      });
  }, [sessionCompleted, browsableCompletedList]);

  const handleMarkAsReviewed = useCallback(() => {
    if (!versesToReview[index] || mode === 'pending' || isBrowsingCompleted) return;
    const verseToComplete = versesToReview[index];
    const now = new Date();
    const todayStr = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}`;
    const updates = { 복습날짜: todayStr, 미암송여부: false };
    switch (mode) {
      case 'category': updates.복습여부 = true; break;
      case 'new': updates.뉴구절복습여부 = true; updates.복습여부 = true; break;
      case 'wrong': updates.오답복습여부 = true; updates.복습여부 = true; break;
      case 'recent': updates.최근구절복습여부 = true; updates.복습여부 = true; break;
      case 'favorite': updates.즐겨찾기복습여부 = true; updates.복습여부 = true; break;
      case 'turnBasedReview':
        if ((verseToComplete.maxCompletedTurn || 0) < targetTurn) updates.maxCompletedTurn = targetTurn;
        updates.currentReviewTurn = targetTurn + 1;
        updates.복습여부 = true;
        break;
      case 'turnBasedNew':
        if ((verseToComplete.maxCompletedTurnForNew || 0) < targetTurnForNew) updates.maxCompletedTurnForNew = targetTurnForNew;
        updates.currentReviewTurnForNew = targetTurnForNew + 1;
        updates.뉴구절복습여부 = true;
        updates.복습여부 = true;
        break;
      case 'turnBasedRecent':
        if ((verseToComplete.maxCompletedTurnForRecent || 0) < targetTurnForRecent) updates.maxCompletedTurnForRecent = targetTurnForRecent;
        updates.currentReviewTurnForRecent = targetTurnForRecent + 1;
        updates.최근구절복습여부 = true;
        updates.복습여부 = true;
        break;
      default: break;
    }

    if (showSnackbar && mode.startsWith('turnBased') && dailyProgress) {
        const { todaysGoal, completedToday } = dailyProgress;
        if (todaysGoal > 0) {
            const completedBeforeThisVerse = completedToday + sessionCompleted.length;
            const progressBefore = (completedBeforeThisVerse / todaysGoal) * 100;
            const completedAfterThisVerse = completedBeforeThisVerse + 1;
            const progressAfter = (completedAfterThisVerse / todaysGoal) * 100;

            if (progressBefore < 100 && progressAfter >= 100) { showSnackbar('오늘의 목표 달성을 축하합니다! 🎉 수고하셨습니다.', 'success'); } 
            else if (progressBefore < 75 && progressAfter >= 75) { showSnackbar('오늘 목표의 75%를 달성했습니다! 🏃', 'info'); } 
            else if (progressBefore < 50 && progressAfter >= 50) { showSnackbar('오늘 목표의 절반을 달성하셨습니다! 💪', 'info'); }
        }
    }

    setSessionCompleted(prev => [...prev, { ...verseToComplete, ...updates }]);
    updateVerseStatus(verseToComplete.id, updates);

    const logCategoryMap = {
        turnBasedReview: 'general', category: 'general',
        turnBasedNew: 'new', new: 'new',
        turnBasedRecent: 'recent', recent: 'recent',
        favorite: 'favorite', wrong: 'wrong'
    };
    const logCategory = logCategoryMap[mode];

    if (logCategory) {
      const log = loadDataFromLocal(REVIEW_LOG_KEY) || {};
      const kst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (!log[kst] || typeof log[kst] !== 'object') { log[kst] = { total: 0 }; }
      log[kst][logCategory] = (log[kst][logCategory] || 0) + 1;
      const totalCount = Object.keys(log[kst]).reduce((sum, key) => key !== 'total' ? sum + log[kst][key] : sum, 0);
      log[kst].total = totalCount;
      saveDataToLocal(REVIEW_LOG_KEY, log);
    }

    setVersesToReview(prev => prev.filter(v => v.id !== verseToComplete.id));
    setShowAnswer(false);
  }, [versesToReview, index, mode, isBrowsingCompleted, targetTurn, targetTurnForNew, targetTurnForRecent, updateVerseStatus, showSnackbar, dailyProgress, sessionCompleted]);

  return {
    verse: isBrowsingCompleted ? browsableCompletedList[browseIndex] : versesToReview[index],
    verses: versesToReview,
    index: isBrowsingCompleted ? browseIndex : index,
    showAnswer,
    sessionStats: { todayCount, reviewedCount, totalTargetCount, sessionCompletedCount: sessionCompleted.length, totalCompletedCount: browsableCompletedList.length },
    isBrowsingCompleted,
    isTurnCompleted,
    actions: { toggleAnswer, handleMarkAsReviewed, updateVerseInPlace, toggleBrowseMode, browseNext, browsePrev },
    resetTurnCompletion,
  };
};