// src/pages/HomePage.js
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { DataContext } from '../contexts/DataContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { useReviewSession } from '../hooks/useReviewSession';
import { useSnackbar } from '../contexts/SnackbarContext';
import { Box, Typography, Container, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getKSTDateString } from '../utils/dateUtils';

import ReviewDashboard from '../components/ReviewDashboard';
import ReviewSession from '../components/ReviewSession';
import TagDialog from '../components/TagDialog';
import { THEMES } from '../constants';

const HomePage = () => {
  const { isLoading, originalVerses, tagsData, updateTags, updateVerseStatus, turnScheduleData, reviewLogData, resetReviewStatus, loadData } = useContext(DataContext);
  const { isLoaded: settingsLoaded, settings, setters } = useAppSettings();
  const { showSnackbar } = useSnackbar();

  const [todaysGoal, setTodaysGoal] = useState(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [sessionTodaysGoal, setSessionTodaysGoal] = useState(0);

  // --- 목표량 계산 로직 (기존 유지) ---
  useEffect(() => {
    if (!originalVerses || settings.mode !== 'turnBasedReview' || !turnScheduleData || originalVerses.length === 0) {
      setTodaysGoal(null);
      setCompletedToday(0);
      return;
    }
    const kstDate = getKSTDateString();
    const todayLog = reviewLogData[kstDate];
    const completedTodayCount = (todayLog && typeof todayLog === 'object') ? (todayLog.general || 0) : 0;
    setCompletedToday(completedTodayCount);

    const schedule = turnScheduleData[settings.targetTurn];
    if (!schedule || !schedule.startDate || !schedule.endDate) {
      setTodaysGoal(0);
      return;
    }
    const { selectedCategories, selectedSubcategories } = settings;
    const categoryFilter = v => (selectedCategories.includes('전체') || selectedCategories.length === 0 || selectedCategories.includes(v.카테고리)) && (selectedSubcategories.includes('전체') || selectedSubcategories.length === 0 || selectedSubcategories.includes(v.소카테고리));

    const versesInScope = originalVerses.filter(v => !v.미암송여부 && !v.뉴구절여부 && !v.최근구절여부 && categoryFilter(v));
    const totalInScope = versesInScope.length;

    if (totalInScope === 0) { setTodaysGoal(0); return; }

    const totalReviewedCount = versesInScope.filter(v => (v.maxCompletedTurn || 0) >= settings.targetTurn).length;
    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);
    const today = new Date();
    [startDate, endDate, today].forEach(d => d.setHours(0, 0, 0, 0));

    if (today < startDate || today > endDate) { setTodaysGoal(0); return; }

    const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const elapsedDays = Math.round((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays <= 0) { setTodaysGoal(0); return; }

    const recommendedPerDay = totalInScope / totalDays;
    const targetByToday = Math.floor(elapsedDays * recommendedPerDay);
    const goal = targetByToday - totalReviewedCount;

    setTodaysGoal(goal > 0 ? goal : 0);
  }, [settings.mode, settings.targetTurn, settings.selectedCategories, settings.selectedSubcategories, originalVerses, turnScheduleData, reviewLogData]);

  const dailyProgress = { todaysGoal, completedToday };
  const handleReviewLogUpdate = () => { loadData(); };

  const { verse, verses, index, showAnswer, sessionStats, actions, isBrowsingCompleted, isTurnCompleted, resetTurnCompletion } = useReviewSession(originalVerses, settings, updateVerseStatus, showSnackbar, dailyProgress, handleReviewLogUpdate);
  const { isFocusMode, themeKey, mode, targetTurn, targetTurnForNew, targetTurnForRecent } = settings;
  const { setIsFocusMode } = setters;

  const [favoriteVerse, setFavoriteVerse] = useState(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState({ open: false, mode: null, turn: 0 });

  const remainingToday = useMemo(() => {
    if (mode !== 'turnBasedReview') return null;
    if (isFocusMode) return Math.max(0, sessionTodaysGoal - sessionStats.sessionCompletedCount);
    if (todaysGoal === null) return null;
    return Math.max(0, todaysGoal);
  }, [mode, isFocusMode, todaysGoal, sessionTodaysGoal, sessionStats.sessionCompletedCount]);

  const handleConfirmReset = () => {
    let resetType = '';
    if (resetConfirm.mode === 'turnBasedNew') resetType = 'all_turns_new';
    else if (resetConfirm.mode === 'turnBasedRecent') resetType = 'all_turns_recent';
    else if (resetConfirm.mode === 'turnBasedReview') resetType = 'all_turns';

    if (resetType) resetReviewStatus(resetType, showSnackbar);
    setResetConfirm({ open: false, mode: null, turn: 0 });
  };

  const handleCancelReset = () => { setResetConfirm({ open: false, mode: null, turn: 0 }); };

  useEffect(() => {
    if (isTurnCompleted) {
      let turnToReset;
      if (mode === 'turnBasedReview') turnToReset = targetTurn;
      else if (mode === 'turnBasedNew') turnToReset = targetTurnForNew;
      else if (mode === 'turnBasedRecent') turnToReset = targetTurnForRecent;
      resetTurnCompletion();
      if (turnToReset) {
        const timer = setTimeout(() => {
          setResetConfirm({ open: true, mode: mode, turn: turnToReset });
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isTurnCompleted, mode, targetTurn, targetTurnForNew, targetTurnForRecent, resetTurnCompletion]);

  useEffect(() => {
    if (!originalVerses) return;
    const favorites = originalVerses.filter(v => v.즐겨찾기);
    if (favorites.length > 0) {
      setFavoriteVerse(favorites[Math.floor(Math.random() * favorites.length)]);
    } else {
      setFavoriteVerse({ 제목: '종일 말씀을 묵상함', 장절: '시편 119:97', 본문: '내가 주의 법을 어찌 그리 사랑하는지요 내가 그것을 종일 묵상하나이다' });
    }
  }, [originalVerses]);

  const handleStatusToggle = (field) => { if (!verse) return; actions.updateVerseInPlace({ [field]: !verse[field] }); };

  if (isLoading || !settingsLoaded) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Typography>로딩 중...</Typography></Box>;
  }

  return (
    <>
      {isFocusMode ? (
        <ReviewSession
          settings={settings} setters={setters} verse={verse} verses={verses}
          isBrowsingCompleted={isBrowsingCompleted} showAnswer={showAnswer} sessionStats={sessionStats}
          actions={actions} onStatusToggle={handleStatusToggle}
          onTagDialogOpen={() => setTagDialogOpen(true)} currentIndex={index} remainingToday={remainingToday}
          onHelpClick={() => setHelpOpen(true)} tagDialogOpen={tagDialogOpen} helpOpen={helpOpen}
          setHelpOpen={setHelpOpen} setTagDialogOpen={setTagDialogOpen} showSnackbar={showSnackbar}
          dailyProgress={{ todaysGoal, completedToday }} tagsData={tagsData} updateTags={updateTags}
        />
      ) : (
        <Container maxWidth="lg" sx={{ p: { xs: 2, sm: 3 } }}>
          <ReviewDashboard
            settings={settings} setters={setters} verses={verses} remainingToday={remainingToday}
            favoriteVerse={favoriteVerse} themeKey={themeKey}
            onStartReview={() => { setSessionTodaysGoal(todaysGoal); setIsFocusMode(true); }}
          />
          <TagDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} verse={verse} tags={tagsData} onSaveTags={updateTags} />
        </Container>
      )}

      <Dialog open={resetConfirm.open} onClose={handleCancelReset}>
        <DialogTitle>복습 완료</DialogTitle>
        <DialogContent><Typography>{resetConfirm.turn}차 복습이 모두 완료되었습니다.</Typography><Typography>완료 기록을 초기화하여 다시 복습하시겠습니까?</Typography></DialogContent>
        <DialogActions><Button onClick={handleCancelReset}>취소</Button><Button onClick={handleConfirmReset} variant="contained">확인</Button></DialogActions>
      </Dialog>
    </>
  );
};

export default HomePage;