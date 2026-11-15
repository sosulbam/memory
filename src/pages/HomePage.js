// src/pages/HomePage.js
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { DataContext } from '../contexts/DataContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { useReviewSession } from '../hooks/useReviewSession';
import { useSnackbar } from '../contexts/SnackbarContext';
import { Box, Typography, Container, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { saveDataToLocal, loadDataFromLocal } from '../api/localStorageApi';
import { TURN_SCHEDULE_KEY, REVIEW_LOG_KEY } from '../constants';
import { getKSTDateString } from '../utils/dateUtils';

import ReviewDashboard from '../components/ReviewDashboard';
import ReviewSession from '../components/ReviewSession';
import TagDialog from '../components/TagDialog';
import { THEMES } from '../constants';
import { advanceToNextTurn, TURN_MODE_META } from '../utils/reviewActions';
import { Link as RouterLink, useOutletContext } from 'react-router-dom';
import { IS_LAMP } from '../edition';

const HomePage = () => {
  const { isLoading, originalVerses, tagsData, updateTags, updateVerseStatus, turnScheduleData, setTurnScheduleData, reviewLogData, resetReviewStatus, loadData } = useContext(DataContext);
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
      // 등불판: 일정이 없으면 하루 분량을 내지 않는다(「오늘 0개·진행률 100%」 대신 일정 안내, 검토 7번)
      setTodaysGoal(IS_LAMP ? null : 0);
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

    if (today < startDate || today > endDate) { setTodaysGoal(IS_LAMP ? null : 0); return; }

    const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const elapsedDays = Math.round((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays <= 0) { setTodaysGoal(0); return; }

    const recommendedPerDay = totalInScope / totalDays;
    // 등불판은 올림(하루 0.53구절 → 1구절) — 서랍의 「하루 N개」와 같은 값(R1)
    const targetByToday = IS_LAMP ? Math.ceil(elapsedDays * recommendedPerDay) : Math.floor(elapsedDays * recommendedPerDay);
    const goal = targetByToday - totalReviewedCount;

    setTodaysGoal(goal > 0 ? goal : 0);
  }, [settings.mode, settings.targetTurn, settings.selectedCategories, settings.selectedSubcategories, originalVerses, turnScheduleData, reviewLogData]);

  // 등불판 머리줄 「오늘 N」= 오늘 전체 복습 수(통계와 같은 값). 복습을 시작할 때 기록에서 읽어 둔다(N5)
  const [todayBase, setTodayBase] = useState(0);
  const readTodayTotal = () => { const log = loadDataFromLocal(REVIEW_LOG_KEY) || {}; const d = log[getKSTDateString()]; return (d && typeof d === 'object' ? d.total : d) || 0; };
  const dailyProgress = { todaysGoal, completedToday, todayBase };
  const handleReviewLogUpdate = () => { loadData(); };

  const { verse, verses, index, showAnswer, sessionStats, actions, isBrowsingCompleted, isPeeking, isTurnCompleted, resetTurnCompletion } = useReviewSession(originalVerses, settings, updateVerseStatus, showSnackbar, dailyProgress, handleReviewLogUpdate);
  const { isFocusMode, themeKey, mode, targetTurn, targetTurnForNew, targetTurnForRecent } = settings;
  const { setIsFocusMode } = setters;

  const [favoriteVerse, setFavoriteVerse] = useState(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState({ open: false, mode: null, turn: 0 });
  const outlet = useOutletContext() || {};
  // 등불판 「일정 정하기」: 날짜 두 칸과 저장만 있는 작은 창(N4)
  const [scheduleDraft, setScheduleDraft] = useState(null);
  const openSchedule = () => {
    const cur = (turnScheduleData && turnScheduleData[targetTurn]) || {};
    // 기기 날짜 기준(해외에서 쓰는 사람도 「오늘」이 맞게 — 차수 계산도 기기 날짜로 한다)
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setScheduleDraft({ startDate: cur.startDate || today, endDate: cur.endDate || '' });
  };
  const saveSchedule = () => {
    const next = { ...(turnScheduleData || {}), [targetTurn]: { startDate: scheduleDraft.startDate, endDate: scheduleDraft.endDate } };
    setTurnScheduleData(next);
    saveDataToLocal(TURN_SCHEDULE_KEY, next);
    setScheduleDraft(null);
    showSnackbar(`${targetTurn}차 일정을 저장했습니다.`, 'success');
  };

  // 등불판: 지금 모드에 들어 있는 구절 수(완료 여부와 무관). 0이면 「완주」 대신 「이 모드에 구절이 없습니다」(검토 3번)
  const modePoolCount = useMemo(() => {
    if (!originalVerses) return 0;
    const { selectedCategories, selectedSubcategories } = settings;
    const inCat = v => (selectedCategories.includes('전체') || selectedCategories.length === 0 || selectedCategories.includes(v.카테고리)) && (selectedSubcategories.includes('전체') || selectedSubcategories.length === 0 || selectedSubcategories.includes(v.소카테고리));
    const active = originalVerses.filter(v => !v.미암송여부);
    if (mode === 'turnBasedReview') return active.filter(v => !v.뉴구절여부 && !v.최근구절여부 && inCat(v)).length;
    if (mode === 'turnBasedNew') return active.filter(v => v.뉴구절여부 && inCat(v)).length;
    if (mode === 'turnBasedRecent') return active.filter(v => v.최근구절여부 && inCat(v)).length;
    return active.length;
  }, [originalVerses, mode, settings]);
  const hasSchedule = !!(turnScheduleData && turnScheduleData[targetTurn] && turnScheduleData[targetTurn].startDate && turnScheduleData[targetTurn].endDate);

  const remainingToday = useMemo(() => {
    if (mode !== 'turnBasedReview') return null;
    if (IS_LAMP && todaysGoal === null) return null;
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

  // 등불 암송은 빈 상태로 시작한다 — 첫 화면에서 구절 넣는 길을 보여 준다
  if (IS_LAMP && (!originalVerses || originalVerses.length === 0)) {
    return (
      <Container maxWidth="sm" sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 5, sm: 8 }, pb: 'calc(24px + var(--sab))' }}>
        <Typography sx={{ fontFamily: "'Nanum Myeongjo', serif", fontSize: 24, fontWeight: 700, lineHeight: 1.5 }}>
          외울 구절을 넣어 시작하세요
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, mb: 4 }}>
          오래 써 온 암송 시리즈를 팩째 넣거나, 내가 외우는 구절을 직접 넣을 수 있습니다. 기록은 이 기기 안에만 저장됩니다.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button component={RouterLink} to="/packs" variant="contained" size="large">암송 팩에서 고르기</Button>
          <Button component={RouterLink} to="/manage" variant="outlined" size="large">구절 직접 넣기 · 엑셀</Button>
          <Button component={RouterLink} to="/manage#backup" variant="text" size="large">백업 파일에서 되살리기</Button>
        </Box>
      </Container>
    );
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
          dailyProgress={dailyProgress} tagsData={tagsData} updateTags={updateTags}
        />
      ) : (
        <Container maxWidth="lg" sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 'calc(16px + var(--sab))', sm: 'calc(24px + var(--sab))' } }}>
          <ReviewDashboard
            settings={settings} setters={setters} verses={verses} remainingToday={remainingToday}
            favoriteVerse={favoriteVerse} themeKey={themeKey}
            onStartReview={() => { setSessionTodaysGoal(todaysGoal); if (IS_LAMP) setTodayBase(readTodayTotal() - sessionStats.sessionCompletedCount); /* 같은 방식으로 다시 열면 이전 회차 수가 이어지므로 빼 둔다 */ setIsFocusMode(true); }}
            onAdvanceTurn={handleAdvanceTurn}
            modePoolCount={modePoolCount}
            hasSchedule={hasSchedule}
            schedule={turnScheduleData && turnScheduleData[targetTurn]}
            onOpenSchedule={openSchedule}
          />
          <TagDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} verse={verse} tags={tagsData} onSaveTags={updateTags} />
        </Container>
      )}

      {IS_LAMP && (
        <Dialog open={!!scheduleDraft} onClose={() => setScheduleDraft(null)} fullWidth maxWidth="xs">
          <DialogTitle>{targetTurn}차 일정</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>시작일부터 마감일까지 남은 구절을 날마다 나눠 보여 줍니다.</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField type="date" label="시작일" value={scheduleDraft?.startDate || ''} onChange={(e) => setScheduleDraft(d => ({ ...d, startDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField type="date" label="마감일" value={scheduleDraft?.endDate || ''} onChange={(e) => setScheduleDraft(d => ({ ...d, endDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth
                error={!!(scheduleDraft?.endDate && scheduleDraft?.startDate && scheduleDraft.endDate < scheduleDraft.startDate)}
                helperText={scheduleDraft?.endDate && scheduleDraft?.startDate && scheduleDraft.endDate < scheduleDraft.startDate ? '마감일이 시작일보다 앞입니다.' : ' '} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDraft(null)}>닫기</Button>
            <Button variant="contained" onClick={saveSchedule} disabled={!scheduleDraft?.startDate || !scheduleDraft?.endDate || scheduleDraft.endDate < scheduleDraft.startDate}>저장</Button>
          </DialogActions>
        </Dialog>
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