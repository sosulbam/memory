import React, { useMemo, useState, useEffect, useContext } from 'react';
import { DataContext } from '../contexts/DataContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { useReviewSession } from '../hooks/useReviewSession';
import { useSnackbar } from '../contexts/SnackbarContext';
import { Chip, Container, Box, Typography, Button, Paper, Slide, Backdrop, Card, List, ListItem, ListItemText, ListItemIcon, Grid, Dialog, DialogTitle, DialogContent, DialogActions, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useSwipeable } from 'react-swipeable';

import VerseCard from '../components/VerseCard';
import TypingView from '../components/TypingView';
import ActionBar from '../components/ActionBar';
import TagDialog from '../components/TagDialog';
import { THEMES, MODES } from '../constants';

import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CategoryIcon from '@mui/icons-material/Category';
import SortIcon from '@mui/icons-material/Sort';
import Filter1Icon from '@mui/icons-material/Filter1';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const HelpDialog = ({ open, onClose }) => {
    const Highlight = ({ children }) => <Typography component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>{children}</Typography>;
    return (
        <Dialog open={open} onClose={onClose} scroll="paper">
            <DialogTitle>복습 화면 도움말</DialogTitle>
            <DialogContent dividers>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>기본 조작 (카드뷰)</Typography>
                <List dense sx={{ '& .MuiListItem-root': { alignItems: 'flex-start' } }}><ListItem><ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon><ListItemText><b>정답 확인:</b> <Highlight>짧게 터치</Highlight></ListItemText></ListItem><ListItem><ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon><ListItemText><b>완료 처리:</b> <Highlight>좌우로 스와이프</Highlight></ListItemText></ListItem><ListItem><ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon><ListItemText><b>상태 변경/복사:</b> <Highlight>위로 스와이프</Highlight>하여 메뉴를 열 수 있습니다.</ListItemText></ListItem></List>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }} gutterBottom>키보드 단축키 (PC)</Typography>
                <List dense><ListItem><ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon><ListItemText><b>정답 확인:</b> <Chip size="small" label="s" /> 또는 <Chip size="small" label="." /></ListItemText></ListItem><ListItem><ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon><ListItemText><b>완료 처리:</b> <Chip size="small" label="Enter" /> 또는 <Chip size="small" label="k" /></ListItemText></ListItem></List>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>닫기</Button></DialogActions>
        </Dialog>
    );
};

const ReviewScreen = ({ settings, setters, verse, verses, isBrowsingCompleted, showAnswer, sessionStats, actions, onStatusToggle, onTagDialogOpen, currentIndex, remainingToday, onHelpClick, tagDialogOpen, helpOpen, showSnackbar, dailyProgress }) => {
    const COMPLETED_BROWSE_THEME_KEY = 'olive';
    const { reviewView } = settings;
    const { toggleAnswer, handleMarkAsReviewed, browseNext, browsePrev, toggleBrowseMode } = actions;
    const [isActionBarVisible, setIsActionBarVisible] = useState(false);
    const activeThemeKey = isBrowsingCompleted ? COMPLETED_BROWSE_THEME_KEY : settings.themeKey;
    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => { if (!verse) return; if (isBrowsingCompleted) { browseNext(); } else if (reviewView === 'card') { handleMarkAsReviewed(); } },
      onSwipedRight: () => { if (!verse) return; if (isBrowsingCompleted) { browsePrev(); } else if (reviewView === 'card') { handleMarkAsReviewed(); } },
      onSwipedUp: () => { if (reviewView === 'card' && verse && !isBrowsingCompleted) { setIsActionBarVisible(true); } },
      preventDefaultTouchmoveEvent: true,
      trackTouch: true,
    });
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isActionBarVisible || tagDialogOpen || helpOpen) return;
            if (e.key === 's' || e.key === '.') { e.preventDefault(); toggleAnswer(); }
            if ((e.key === 'Enter' || e.key === 'k') && verse) { e.preventDefault(); isBrowsingCompleted ? browseNext() : handleMarkAsReviewed(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleAnswer, handleMarkAsReviewed, isBrowsingCompleted, browseNext, isActionBarVisible, verse, tagDialogOpen, helpOpen]);
    const handleCopyVerse = () => {
        if (!verse) return;
        const textToCopy = `${verse.장절}\n${verse.본문}`;
        navigator.clipboard.writeText(textToCopy).then(() => { showSnackbar('구절이 복사되었습니다.', 'info'); });
        setIsActionBarVisible(false);
    };
    const commonProps = { verse, themeKey: activeThemeKey, isFocusMode: true, settings, setters, sessionStats, versesCount: verses.length, isBrowsingCompleted, onToggleBrowseMode: toggleBrowseMode, onFooterClick: () => setIsActionBarVisible(true), currentIndex, remainingToday, onHelpClick, actions, dailyProgress, };
    return (
      <Box {...swipeHandlers} sx={{ minHeight: '100vh', width: '100vw' }}>
        {reviewView === 'typing' ? ( <TypingView {...commonProps} onComplete={isBrowsingCompleted ? browseNext : handleMarkAsReviewed} /> ) : ( <VerseCard {...commonProps} showAnswer={showAnswer} onClick={toggleAnswer} /> )}
        <Backdrop sx={{ zIndex: 1350 }} open={isActionBarVisible} onClick={() => setIsActionBarVisible(false)} />
        {verse && (
          <Slide direction="up" in={isActionBarVisible} mountOnEnter unmountOnExit>
            <Paper elevation={4} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1400, borderTopLeftRadius: 16, borderTopRightRadius: 16, pb: 2 }}>
              <Typography variant="caption" align="center" display="block" sx={{ pt: 1, color: 'text.secondary' }}>바깥 영역을 터치하여 닫기</Typography>
              <ActionBar verse={verse} onStatusToggle={onStatusToggle} onTagDialogOpen={onTagDialogOpen} onCopy={handleCopyVerse} />
            </Paper>
          </Slide>
        )}
      </Box>
    );
};

const InfoItem = ({ icon, primary, secondary, secondaryColor }) => (
    <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1.5, textAlign: 'center' }}>
        <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main', mb: 0.5 }}>{icon}</ListItemIcon>
        <Box><Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1.2 }}>{primary}</Typography><Typography variant="caption" color={secondaryColor || 'text.secondary'}>{secondary}</Typography></Box>
    </Grid>
);

const ReviewReadyInfo = ({ verses, settings, remainingToday }) => {
    const { mode, order, selectedCategories, targetTurn, targetTurnForNew, targetTurnForRecent } = settings;
    const currentMode = MODES.find(m => m.value === mode);
    const getTurnTarget = () => { if (mode === 'turnBasedReview') return `${targetTurn}차`; if (mode === 'turnBasedNew') return `뉴구절 ${targetTurnForNew}차`; if (mode === 'turnBasedRecent') return `최근 ${targetTurnForRecent}차`; return null; };
    const orderTextMap = { sequential: '순차', random: '랜덤', oldest_first: '오래된 순', grouped_random: '그룹별 랜덤' };
    
    let infoItems = [
        { icon: <InfoOutlinedIcon />, primary: "복습 모드", secondary: currentMode?.label || '알 수 없음' },
        { icon: <SortIcon />, primary: "정렬 방식", secondary: orderTextMap[order] || order },
    ];

    const turnTarget = getTurnTarget();
    if (turnTarget) infoItems.push({ icon: <Filter1Icon />, primary: "목표 차수", secondary: turnTarget });

    infoItems.push({ icon: <CategoryIcon />, primary: "카테고리", secondary: selectedCategories.join(', ') });

    if (remainingToday !== null) {
      infoItems.push({ 
        icon: <PlaylistAddCheckIcon />, 
        primary: "오늘 남은 구절", 
        secondary: `${remainingToday}개`, 
        secondaryColor: remainingToday > 0 ? 'error.main' : 'text.secondary' 
      });
    }

    infoItems.push({ icon: <CheckCircleOutlineIcon />, primary: "진행 상태", secondary: `총 ${verses.length}개 남음` });

    return (
        <Box sx={{textAlign: 'left'}}>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="body1" sx={{fontWeight: 'bold', mb: 1, textAlign: 'center' }}>현재 복습 설정</Typography>
                <Grid container spacing={1} justifyContent="center">{infoItems.map(item => item && <InfoItem key={item.primary} {...item} />)}</Grid>
            </Paper>
        </Box>
    );
};

const HomePage = () => {
  const { isLoading, originalVerses, tagsData, updateTags, updateVerseStatus, turnScheduleData, reviewLogData, resetReviewStatus, loadData } = useContext(DataContext);
  const { isLoaded: settingsLoaded, settings, setters } = useAppSettings();
  const { showSnackbar } = useSnackbar();

  const [todaysGoal, setTodaysGoal] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [sessionTodaysGoal, setSessionTodaysGoal] = useState(0);

  useEffect(() => {
    if (!originalVerses || settings.mode !== 'turnBasedReview' || !turnScheduleData) {
      setTodaysGoal(0);
      setCompletedToday(0);
      return;
    }
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
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
    
    if (totalInScope === 0) {
      setTodaysGoal(0);
      return;
    }

    const totalReviewedCount = versesInScope.filter(v => (v.maxCompletedTurn || 0) >= settings.targetTurn).length;
    
    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);
    const today = new Date();
    [startDate, endDate, today].forEach(d => d.setHours(0, 0, 0, 0));
    
    if (today < startDate || today > endDate) {
      setTodaysGoal(0);
      return;
    }
    
    const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const elapsedDays = Math.round((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays <= 0) {
      setTodaysGoal(0);
      return;
    }
    
    const recommendedPerDay = totalInScope / totalDays;
    const targetByToday = Math.floor(elapsedDays * recommendedPerDay);

    const goal = targetByToday - totalReviewedCount;
    
    setTodaysGoal(goal > 0 ? goal : 0);
  }, [settings.mode, settings.targetTurn, settings.selectedCategories, settings.selectedSubcategories, originalVerses, turnScheduleData, reviewLogData]);
  
  const dailyProgress = { todaysGoal, completedToday };
  
  const handleReviewLogUpdate = () => {
    loadData();
  };

  const { verse, verses, index, showAnswer, sessionStats, actions, isBrowsingCompleted, isTurnCompleted, resetTurnCompletion } = useReviewSession(originalVerses, settings, updateVerseStatus, showSnackbar, dailyProgress, handleReviewLogUpdate);
  const { isFocusMode, themeKey, mode, targetTurn, targetTurnForNew, targetTurnForRecent } = settings;
  const { setIsFocusMode } = setters;
  const [favoriteVerse, setFavoriteVerse] = useState(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState({ open: false, mode: null, turn: 0 });
  
  const remainingToday = useMemo(() => {
    if (mode !== 'turnBasedReview') return null;

    // --- 👇 여기가 수정된 부분입니다 ---
    if (isFocusMode) {
      // 집중 모드일 때는 세션 시작 시점의 목표량을 기준으로 계산
      return Math.max(0, sessionTodaysGoal - sessionStats.sessionCompletedCount);
    }
    // 홈 화면일 때는 실시간으로 계산된 전체 목표량을 표시
    return Math.max(0, todaysGoal);
  }, [mode, isFocusMode, todaysGoal, sessionTodaysGoal, sessionStats.sessionCompletedCount]);

  const handleConfirmReset = () => {
    let resetType = '';
    if (resetConfirm.mode === 'turnBasedNew') {
      resetType = 'all_turns_new';
    } else if (resetConfirm.mode === 'turnBasedRecent') {
      resetType = 'all_turns_recent';
    } else if (resetConfirm.mode === 'turnBasedReview') {
      resetType = 'all_turns';
    }

    if (resetType) {
      resetReviewStatus(resetType, showSnackbar);
    }
    
    setResetConfirm({ open: false, mode: null, turn: 0 });
  };

  const handleCancelReset = () => {
    setResetConfirm({ open: false, mode: null, turn: 0 });
  };
  
  useEffect(() => {
    if (isTurnCompleted) {
        let turnToReset;
        if (mode === 'turnBasedReview') turnToReset = targetTurn;
        else if (mode === 'turnBasedNew') turnToReset = targetTurnForNew;
        else if (mode === 'turnBasedRecent') turnToReset = targetTurnForRecent;
        
        if (turnToReset) {
            setResetConfirm({ open: true, mode: mode, turn: turnToReset });
        }
        resetTurnCompletion();
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
  const handleModeChange = (event, newMode) => { if (newMode !== null) { setters.setMode(newMode); } };

  if (isLoading || !settingsLoaded) {
    return <Box sx={{display:'flex', justifyContent:'center', alignItems:'center', height:'80vh'}}><Typography>로딩 중...</Typography></Box>;
  }
  if (isFocusMode) {
      return (
        <>
            <ReviewScreen 
                settings={settings} 
                setters={setters} 
                verse={verse} 
                verses={verses} 
                isBrowsingCompleted={isBrowsingCompleted} 
                showAnswer={showAnswer} 
                sessionStats={sessionStats} 
                actions={actions} 
                onStatusToggle={handleStatusToggle} 
                onTagDialogOpen={() => setTagDialogOpen(true)} 
                currentIndex={index} 
                remainingToday={remainingToday} 
                onHelpClick={() => setHelpOpen(true)} 
                tagDialogOpen={tagDialogOpen} 
                helpOpen={helpOpen} 
                showSnackbar={showSnackbar} 
                dailyProgress={{ todaysGoal, completedToday }} 
            />
            <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
            <TagDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} verse={verse} tags={tagsData} onSaveTags={updateTags} />
        </>
      );
  }
  
  return (
    <>
      <Box sx={{ height: 'calc(100vh - 57px)', display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth="sm" sx={{ pt: 1, pb: 1, display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
          <Card sx={{ mb: 1.5, flexShrink: 0, borderRadius: 3, display: 'flex', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundImage: favoriteVerse ? THEMES[themeKey] : 'none', color: 'white', transition: 'all 0.5s ease-in-out', maxHeight: '22vh', height: '100%', }}>
            {favoriteVerse && (
              <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden'}}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center', opacity: 0.9, mb: 1, flexShrink: 0 }}>{favoriteVerse.장절}</Typography>
                <Box sx={{ overflowY: 'auto', flexGrow: 1}}><Typography sx={{ whiteSpace: 'pre-line', opacity: 0.95, fontSize: '1.1rem', lineHeight: 1.4, fontWeight: 'bold' }}>{favoriteVerse.본문}</Typography></Box>
                <Typography variant="body2" sx={{ alignSelf: 'flex-end', opacity: 0.8, pt: 1, flexShrink: 0 }}>{favoriteVerse.제목}</Typography>
              </Box>
            )}
          </Card>
          <Box sx={{ p: '2px', borderRadius: 3, backgroundImage: THEMES[themeKey], boxShadow: '0 4px 12px rgba(0,0,0,0.1)', mb: 1.5 }}>
              <Paper sx={{ p: 1.5, borderRadius: '10px' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}>빠른 모드 선택</Typography>
                  <ToggleButtonGroup value={settings.mode} exclusive onChange={handleModeChange} aria-label="quick mode select" fullWidth size="small">
                      <ToggleButton value="turnBasedReview">차수별 복습</ToggleButton>
                      <ToggleButton value="turnBasedNew">차수별 뉴구절</ToggleButton>
                      <ToggleButton value="turnBasedRecent">차수별 최근</ToggleButton>
                  </ToggleButtonGroup>
              </Paper>
          </Box>
          <Box sx={{ p: '2px', borderRadius: 3, backgroundImage: THEMES[themeKey], boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '10px' }}>
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>오늘의 복습</Typography>
                    <ReviewReadyInfo verses={verses} settings={settings} remainingToday={remainingToday} />
                </Box>
                <Button 
                    variant="contained" 
                    size="large" 
                    startIcon={<PlayCircleFilledIcon />} 
                    onClick={() => {
                        setSessionTodaysGoal(todaysGoal);
                        setIsFocusMode(true);
                    }} 
                    disabled={verses.length === 0} 
                    sx={{ mt: 2, width: '100%', py: 1.2, color: 'white', backgroundImage: THEMES[themeKey], transition: 'all 0.3s' }}
                >
                    복습 시작하기
                </Button>
              </Paper>
          </Box>
        </Container>
      </Box>
      {!isFocusMode && <TagDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} verse={verse} tags={tagsData} onSaveTags={updateTags} />}
      <Dialog open={resetConfirm.open} onClose={handleCancelReset}>
        <DialogTitle>복습 완료</DialogTitle>
        <DialogContent><Typography>{resetConfirm.turn}차 복습이 모두 완료되었습니다.</Typography><Typography>완료 기록을 초기화하여 다시 복습하시겠습니까?</Typography></DialogContent>
        <DialogActions><Button onClick={handleCancelReset}>취소</Button><Button onClick={handleConfirmReset} variant="contained">확인</Button></DialogActions>
      </Dialog>
    </>
  );
};

export default HomePage;