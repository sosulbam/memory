// src/components/TypingView.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Typography, Box, IconButton, Chip, Tooltip, LinearProgress } from '@mui/material';
import { useSwipeable } from 'react-swipeable';
import { THEMES } from '../constants';
import SwipeUpIcon from '@mui/icons-material/SwipeUp';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import StyleIcon from '@mui/icons-material/Style';
import ReplayIcon from '@mui/icons-material/Replay';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import HistoryIcon from '@mui/icons-material/History';

const calculateDaysAgoText = (reviewDateStr) => {
    if (!reviewDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewDate = new Date(reviewDateStr.replace(/\.\s*/g, '-'));
    reviewDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - reviewDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    if (diffDays === 0) return '마지막 복습: 오늘';
    if (diffDays === 1) return '마지막 복습: 어제';
    return `마지막 복습: ${diffDays}일 전`;
};

const FocusModeHeader = ({ setIsFocusMode, sessionStats, versesCount, isBrowsingCompleted, onToggleBrowseMode, currentIndex, remainingToday, onHelpClick, settings, setters, dailyProgress, daysAgoText }) => {
    const { mode } = settings;
    const { sessionCompletedCount } = sessionStats;

    const dailyProgressPercent = dailyProgress && dailyProgress.todaysGoal > 0
        ? Math.round(((dailyProgress.completedToday + sessionCompletedCount) / dailyProgress.todaysGoal) * 100)
        : 0;

    const sessionGoal = versesCount + sessionCompletedCount;
    const sessionProgressPercent = sessionGoal > 0
        ? Math.round((sessionCompletedCount / sessionGoal) * 100)
        : 0;
        
    return (
        <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0,
            backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', zIndex: 1,
            pb: 1
        }}>
            <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                py: '4px', px: 2,
            }}>
                <Box>
                    <Tooltip title="복습 종료"><IconButton onClick={() => setIsFocusMode(false)} color="inherit"><FullscreenExitIcon /></IconButton></Tooltip>
                    <Tooltip title="도움말"><IconButton onClick={onHelpClick} color="inherit"><HelpOutlineIcon /></IconButton></Tooltip>
                </Box>
                <Box sx={{display: 'flex', gap: {xs: 1.5, sm: 2}, alignItems: 'center', textAlign: 'center', overflow: 'hidden'}}>
                    {isBrowsingCompleted ? (
                        <Box sx={{width: '120px'}} />
                    ) : (
                        <>
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>총남은: {versesCount}</Typography>
                            {remainingToday !== null && <Typography variant="body2" sx={{ color: '#ffeb3b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>오늘: {remainingToday}</Typography>}
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>완료: {sessionCompletedCount}</Typography>
                        </>
                    )}
                </Box>
                <Tooltip title={isBrowsingCompleted ? "진행 중인 복습으로 돌아가기" : "전체 완료 구절 보기"}>
                    <span>
                        <IconButton 
                            onClick={(e) => { e.stopPropagation(); onToggleBrowseMode(); }}
                            disabled={sessionStats.totalCompletedCount === 0}
                            sx={{ color: 'white', bgcolor: isBrowsingCompleted ? 'primary.main' : 'rgba(255, 255, 255, 0.2)', '&:hover': { bgcolor: isBrowsingCompleted ? 'primary.dark' : 'rgba(255, 255, 255, 0.3)'} }}
                        >
                            <StyleIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            
            {daysAgoText && (
              <Box sx={{ px: 2, textAlign: 'right', height: '20px', pt: 0.5 }}>
                  <Typography variant="caption" component="div">{daysAgoText}</Typography>
              </Box>
            )}

            {mode === 'turnBasedReview' && dailyProgress && dailyProgress.todaysGoal > 0 && !isBrowsingCompleted && (
              <Box sx={{ width: '100%', px: 2, pt: 0.5, boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Typography variant="caption">오늘 진행률 ({dailyProgressPercent}%)</Typography>
                </Box>
                <LinearProgress variant="determinate" value={dailyProgressPercent} sx={{ height: 6, borderRadius: 3 }}/>
              </Box>
            )}
            {(mode === 'turnBasedNew' || mode === 'turnBasedRecent') && sessionGoal > 0 && !isBrowsingCompleted && (
                <Box sx={{ width: '100%', px: 2, pt: 0.5, boxSizing: 'border-box' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Typography variant="caption">진행률 ({sessionProgressPercent}%)</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={sessionProgressPercent} sx={{ height: 6, borderRadius: 3 }} />
                </Box>
            )}
        </Box>
    );
};
const FocusModeFooter = ({ onFooterClick }) => (
    <Box sx={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        color: 'rgba(255,255,255,0.7)', zIndex: 1,
    }}>
        <IconButton onClick={onFooterClick} color="inherit"><SwipeUpIcon /></IconButton>
    </Box>
);

const TypingView = ({ verse, onComplete, themeKey, settings, setters, sessionStats, versesCount, isBrowsingCompleted, onToggleBrowseMode, onFooterClick, currentIndex, remainingToday, onHelpClick, actions, dailyProgress }) => {
  const [completedWords, setCompletedWords] = useState([]);
  const inputRef = useRef(null);
  const isMobile = useMemo(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), []);
  const currentTheme = THEMES[themeKey];
  const { completedSortOrder } = settings;
  const { setCompletedSortOrder } = setters;
  const daysAgoText = calculateDaysAgoText(verse?.복습날짜);

  const verseWords = useMemo(() => (verse ? verse.본문.replace(/\n/g, ' ').split(' ').filter(w => w) : []), [verse]);
  const currentWordIndex = completedWords.length;
  const isVerseComplete = currentWordIndex >= verseWords.length;

  useEffect(() => {
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, [verse, currentWordIndex, isMobile]);

  useEffect(() => {
    setCompletedWords([]);
  }, [verse]);

  const advanceWord = () => {
    if (isVerseComplete) return;
    const targetWord = verseWords[currentWordIndex];
    setCompletedWords(prev => [...prev, targetWord]);
  };

  const handleKeyDown = (e) => {
    if (!verse) return;
    if (isVerseComplete) {
      if (e.key === 'Enter') onComplete();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      advanceWord();
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isBrowsingCompleted) {
        actions.browseNext();
      } else if (isVerseComplete) {
        onComplete();
      }
    },
    onSwipedRight: () => {
      if (isBrowsingCompleted) {
        actions.browsePrev();
      } else if (isVerseComplete) {
        onComplete();
      }
    },
    preventDefaultTouchmoveEvent: true,
  });

  const handleClick = () => {
    if (isBrowsingCompleted) return;
    advanceWord();
    if (!isMobile) {
      inputRef.current?.focus();
    }
  };

  return (
    <Card
      variant="outlined"
      {...swipeHandlers}
      sx={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        borderRadius: 0, zIndex: 1300, border: 'none', display: 'flex',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        cursor: isBrowsingCompleted ? 'default' : 'text', userSelect: 'none',
        background: currentTheme, color: 'white', padding: { xs: '32px 32px', sm: '32px 60px' },
        boxSizing: 'border-box',
      }}
      onClick={handleClick}
    >
      <FocusModeHeader 
        setIsFocusMode={setters.setIsFocusMode} 
        sessionStats={sessionStats} 
        versesCount={versesCount}
        isBrowsingCompleted={isBrowsingCompleted}
        onToggleBrowseMode={onToggleBrowseMode}
        currentIndex={currentIndex}
        remainingToday={remainingToday}
        onHelpClick={onHelpClick}
        settings={settings}
        setters={setters}
        dailyProgress={dailyProgress}
        daysAgoText={daysAgoText}
      />
      
      {isBrowsingCompleted && (
        <Box sx={{
            position: 'absolute', top: { xs: '52px', sm: '60px' }, left: { xs: '12px', sm: '16px' },
            display: 'flex', alignItems: 'center', gap: 1, zIndex: 1,
        }}>
            <Chip 
                icon={<ReplayIcon />} label="전체 완료 구절" size="small"
                sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}
            />
            <Tooltip title={completedSortOrder === 'recent' ? "구절순으로 정렬" : "최근 복습순으로 정렬"}>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setCompletedSortOrder(completedSortOrder === 'recent' ? 'sequential' : 'recent');
                    }}
                    sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': {bgcolor: 'rgba(0,0,0,0.6)'} }}
                >
                    {completedSortOrder === 'recent' ? <SortByAlphaIcon fontSize="small" /> : <HistoryIcon fontSize="small" />}
                </IconButton>
            </Tooltip>
        </Box>
      )}
      
      <Typography 
        variant="h6" 
        fontWeight="bold" 
        fontSize="1.5rem" 
        component="div" 
        mb={2} 
        sx={{ mt: 11, userSelect: 'none' }}
      >
        {verse ? `${verse.장절} — ${verse.카테고리}` : (isBrowsingCompleted ? '완료한 구절이 없습니다.' : '로딩 중...')}
      </Typography>

      <Typography variant="h5" sx={{ flexGrow: 1, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', textAlign: 'center', alignContent: 'center', userSelect: 'text' }}>
        {isBrowsingCompleted ? verse?.본문 : completedWords.join(' ')}
      </Typography>

      <Typography 
        variant="h6" 
        sx={{ 
          mt: 2, height: '30px', color: 'rgba(255, 255, 255, 0.8)',
          mb: 8, userSelect: 'none'
        }}
      >
        {isBrowsingCompleted 
            ? '(스와이프로 구절을 넘겨보세요)' 
            : (isVerseComplete ? '✅ 완료! (Enter 또는 스와이프)' : '(화면을 탭하거나 스페이스바)')}
      </Typography>

      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0 }}
        readOnly={isMobile || isBrowsingCompleted}
        inputMode={(isMobile || isBrowsingCompleted) ? "none" : "text"}
      />
      
      {verse && <FocusModeFooter onFooterClick={onFooterClick} />}
    </Card>
  );
};

export default TypingView;