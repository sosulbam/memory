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
import { advanceToNextTurn, TURN_MODE_META } from '../utils/reviewActions';

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

  const { verse, verses, index, showAnswer, sessionStats, actions, isBrowsingCompleted, isPeeking, isTurnCompleted, resetTurnCompletion } = useReviewSession(originalVerses, settings, updateVerseStatus, showSnackbar, dailyProgress, handleReviewLogUpdate);
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

  // 완료 다이얼로그 확인:
  //  - 카테고리별: 현재 선택 범위의 복습여부만 초기화 → 같은 범위를 처음부터 다시 (통계 기록은 유지)
  //  - 차수별 복습구절: 기록을 지우지 않고 다음 차수로 진급 (maxCompletedTurn 이력 보존)
  const handleConfirmReset = () => {
    const doneMode = resetConfirm.mode;

    if (doneMode === 'category') {
      const { selectedCategories, selectedSubcategories } = settings;
      const categoryFilter = v => (selectedCategories.includes('전체') || selectedCategories.length === 0 || selectedCategories.includes(v.카테고리)) && (selectedSubcategories.includes('전체') || selectedSubcategories.length === 0 || selectedSubcategories.includes(v.소카테고리));
      const verseIds = (originalVerses || []).filter(v => !v.미암송여부 && categoryFilter(v)).map(v => v.id);
      resetReviewStatus('category', showSnackbar, { verseIds, skipLog: true });
    } else if (doneMode === 'turnBasedReview') {
      const nextTurn = advanceToNextTurn(doneMode, settings, setters);
      showSnackbar(`${nextTurn}차 복습을 시작합니다. 복습 설정에서 ${nextTurn}차 일정을 등록해 주세요.`, 'success');
    }
    setResetConfirm({ open: false, mode: null, turn: 0 });
  };

  const handleCancelReset = () => { setResetConfirm({ open: false, mode: null, turn: 0 }); };

  // 대시보드에서 직접 다음 차수 시작 (다이얼로그를 닫았거나 이미 완주 상태로 들어온 경우)
  const handleAdvanceTurn = (turnMode) => {
    const meta = TURN_MODE_META[turnMode];
    if (!meta) return;
    const nextTurn = advanceToNextTurn(turnMode, settings, setters);
    const scheduleHint = turnMode === 'turnBasedReview' ? ` 복습 설정에서 ${nextTurn}차 일정을 등록해 주세요.` : '';
    showSnackbar(`${meta.label} ${nextTurn}차 복습을 시작합니다.${scheduleHint}`, 'success');
  };

  useEffect(() => {
    if (!isTurnCompleted) return;

    // 뉴구절·최근구절 차수는 별도 일정이 없으므로 확인 없이 바로 다음 차수로 넘긴다.
    // (복습구절 차수는 새 차수의 시작일/종료일 입력이 필요해 다이얼로그 유지)
    if (mode === 'turnBasedNew' || mode === 'turnBasedRecent') {
      resetTurnCompletion();
      const done = mode === 'turnBasedNew' ? targetTurnForNew : targetTurnForRecent;
      const label = TURN_MODE_META[mode].label;
      const nextTurn = advanceToNextTurn(mode, settings, setters);
      showSnackbar(`🎉 ${label} ${done}차 복습을 모두 마쳤습니다. 이어서 ${nextTurn}차를 시작합니다.`, 'success');
      return;
    }
    if (mode !== 'category' && mode !== 'turnBasedReview') return;

    // ⚠️ 지연(setTimeout) 없이 즉시 연다. settings/setters는 렌더마다 새 객체라
    //    이 이펙트가 매 렌더 재실행되며, 예약해 둔 타이머는 cleanup에 취소돼 버린다.
    resetTurnCompletion();
    setResetConfirm({ open: true, mode, turn: mode === 'turnBasedReview' ? targetTurn : 0 });
  }, [isTurnCompleted, mode, targetTurn, targetTurnForNew, targetTurnForRecent, resetTurnCompletion, settings, setters, showSnackbar]);

  useEffect(() => {
    if (!originalVerses) return;
    const favorites = originalVerses.filter(v => v.즐겨찾기);
    if (favorites.length > 0) {
      setFavoriteVerse(favorites[Math.floor(Math.random() * favorites.length)]);
    } else {
      setFavoriteVerse({ 제목: '종일 말씀을 묵상함', 장절: '시편 119:97', 본문: '내가 주의 법을 어찌 그리 사랑하는지요 내가 그것을 종일 묵상하나이다' });
    }
  }, [originalVerses]);

  const handleStatusToggle = (field) => {
    if (!verse) return;
    if (isBrowsingCompleted || isPeeking) {
      actions.updateCompletedVerse(verse.id, { [field]: !verse[field] });
    } else {
      actions.updateVerseInPlace({ [field]: !verse[field] });
    }
  };

  if (isLoading || !settingsLoaded) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Typography>로딩 중...</Typography></Box>;
  }

  return (
    <>
      {isFocusMode ? (
        <ReviewSession
          settings={settings} setters={setters} verse={verse} verses={verses}
          isBrowsingCompleted={isBrowsingCompleted} isPeeking={isPeeking} showAnswer={showAnswer} sessionStats={sessionStats}
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
            onAdvanceTurn={handleAdvanceTurn}
          />
          <TagDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} verse={verse} tags={tagsData} onSaveTags={updateTags} />
        </Container>
      )}

      <Dialog open={resetConfirm.open} onClose={handleCancelReset}>
        <DialogTitle>복습 완료 🎉</DialogTitle>
        <DialogContent>
          {resetConfirm.mode === 'category' ? (
            <>
              <Typography>선택한 범위의 구절을 모두 복습했습니다.</Typography>
              <Typography>완료 표시를 초기화하고 처음부터 다시 복습하시겠습니까? (통계 기록은 유지됩니다)</Typography>
            </>
          ) : (
            <>
              <Typography>{resetConfirm.turn}차 복습이 모두 완료되었습니다.</Typography>
              <Typography>{resetConfirm.turn + 1}차 복습을 시작하시겠습니까? (완료 이력은 그대로 남습니다)</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReset}>나중에</Button>
          <Button onClick={handleConfirmReset} variant="contained">
            {resetConfirm.mode === 'category' ? '다시 시작' : `${resetConfirm.turn + 1}차 시작`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HomePage;