// src/components/VerseCard.js
import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Divider, Tooltip, Chip, LinearProgress } from '@mui/material';
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

const FocusModeHeader = ({ setIsFocusMode, sessionStats, versesCount, isBrowsingCompleted, onToggleBrowseMode, currentIndex, remainingToday, onHelpClick, settings, dailyProgress, daysAgoText }) => {
    const { mode } = settings;
    const { sessionCompletedCount } = sessionStats;

    // --- 👇 [수정 3] 진행률 계산 로직 변경 ---
    const totalDailyGoal = (dailyProgress?.todaysGoal || 0) + (dailyProgress?.completedToday || 0);
    const completedForToday = (dailyProgress?.completedToday || 0) + sessionCompletedCount;
    const dailyProgressPercent = totalDailyGoal > 0
        ? Math.round((completedForToday / totalDailyGoal) * 100)
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
                            {remainingToday !== null && <Typography variant="body2" sx={{ color: '#ffeb3b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>오늘남은: {remainingToday}</Typography>}
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>오늘완료: {dailyProgress.completedToday + sessionStats.sessionCompletedCount}</Typography>
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

            {mode === 'turnBasedReview' && dailyProgress && totalDailyGoal > 0 && !isBrowsingCompleted && (
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
    <Box 
        onClick={(e) => {
            e.stopPropagation();
            onFooterClick();
        }}
        sx={{
            position: 'absolute', bottom: 20, left: '50%',
            transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', color: 'rgba(255, 255, 255, 0.7)', zIndex: 1, cursor: 'pointer'
        }}
    >
        <IconButton color="inherit" sx={{p: 0}}><SwipeUpIcon /></IconButton>
        <Typography variant="caption">상태 변경</Typography>
    </Box>
);

const StatusDisplay = ({ verse }) => {
    if (!verse) return null;
    const statuses = [
        verse.뉴구절여부 && '뉴구절', verse.최근구절여부 && '최근',
        verse.오답여부 && '오답', verse.즐겨찾기 && '즐겨찾기',
    ].filter(Boolean);
    if (statuses.length === 0) return null;
    return (
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontStyle: 'italic', pl: 2 }}>
            {`상태: ${statuses.join(', ')}`}
        </Typography>
    );
};

const VerseCard = ({ verse, showAnswer, themeKey, settings, setters, sessionStats, versesCount, onClick, onFooterClick, isBrowsingCompleted, onToggleBrowseMode, currentIndex, remainingToday, onHelpClick, dailyProgress }) => {
  const { mode, targetTurn, targetTurnForNew, targetTurnForRecent, isFocusMode, fontSize, completedSortOrder } = settings;
  const { setIsFocusMode, setCompletedSortOrder } = setters;
  const currentTheme = THEMES[themeKey];
  const daysAgoText = calculateDaysAgoText(verse?.복습날짜);

  const frontSizeMap = { small: { xs: '2rem', sm: '2.5rem' }, medium: { xs: '2.5rem', sm: '3rem' }, large: { xs: '3rem', sm: '3.5rem' } };
  const titleSizeMap = { small: { xs: '1.1rem', sm: '1.25rem' }, medium: { xs: '1.25rem', sm: '1.5rem' }, large: { xs: '1.5rem', sm: '1.75rem' } };
  const bodySizeMap = { small: { xs: '1.2rem', sm: '1.3rem' }, medium: { xs: '1.3rem', sm: '1.5rem' }, large: { xs: '1.5rem', sm: '1.7rem' } };

  const FrontContent = () => (
    <>
      <Typography fontWeight="bold" sx={{ fontSize: frontSizeMap[fontSize] || frontSizeMap.medium, userSelect: 'none' }}>
        {verse ? verse.장절 : (isBrowsingCompleted ? '완료한 구절이 없습니다.' : '복습할 구절이 없습니다.')}
      </Typography>
      {verse && mode.startsWith('turnBased') && (
        <Typography variant="subtitle1" sx={{ fontSize: '1.1rem', mt: 0.5, userSelect: 'none' }}>
          {mode === 'turnBasedReview' && `(${verse.currentReviewTurn || 1}차 / 목표 ${targetTurn}차)`}
          {mode === 'turnBasedNew' && `(뉴 ${verse.currentReviewTurn || 1}차 / 목표 ${targetTurnForNew}차)`}
          {mode === 'turnBasedRecent' && `(최근 ${verse.currentReviewTurn || 1}차 / 목표 ${targetTurnForRecent}차)`}
        </Typography>
      )}
    </>
  );
  
  const BackContent = ({ verse }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: isFocusMode ? { xs: '80px 32px 90px', sm: '80px 60px 90px' } : '20px' }}>
        <Box sx={{ overflowY: 'auto', flexGrow: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography fontWeight="bold" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: titleSizeMap[fontSize] || titleSizeMap.medium }}>
                {verse?.제목}
            </Typography>
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.3)', width: '50%', mx: 'auto' }} />
            <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.7, whiteSpace: 'pre-line', wordBreak: 'keep-all', fontSize: bodySizeMap[fontSize] || bodySizeMap.medium }}>
                {verse?.본문}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', mt: 'auto', pt: 1, width: '100%' }}>
            <StatusDisplay verse={verse} />
            <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.9, ml: 'auto', pr: 2 }}>
                {verse?.카테고리}{verse?.소카테고리 ? ` - ${verse.소카테고리}` : ''}
            </Typography>
        </Box>
    </Box>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        cursor: 'pointer', display: 'flex', border: 'none',
        ...(isFocusMode ? {
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            borderRadius: 0, zIndex: 1300, overflow: 'hidden'
        } : {})
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          position: 'relative', width: '100%', background: currentTheme, color: 'white',
          padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', minHeight: isFocusMode ? '100%' : '350px',
          borderRadius: isFocusMode ? 0 : 1,
        }}
      >
        {isFocusMode && 
            <FocusModeHeader 
                setIsFocusMode={setIsFocusMode} 
                sessionStats={sessionStats} 
                versesCount={versesCount}
                isBrowsingCompleted={isBrowsingCompleted}
                onToggleBrowseMode={onToggleBrowseMode}
                currentIndex={currentIndex}
                remainingToday={remainingToday}
                onHelpClick={onHelpClick}
                settings={settings}
                dailyProgress={dailyProgress}
                daysAgoText={daysAgoText}
            />
        }
        
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
        
        {showAnswer ? <BackContent verse={verse} /> : <FrontContent />}
        
        {isFocusMode && verse && <FocusModeFooter onFooterClick={onFooterClick} />}
      </CardContent>
    </Card>
  );
};

export default VerseCard;