// src/components/LampFocus.js
// 등불판 집중 모드의 머리줄과 아래 단추줄 (기본판은 VerseCard·TypingView 안의 종전 머리줄을 그대로 쓴다)
//  · 머리줄: 숫자를 「남은 51 · 오늘 14」처럼 짧게, 360px 에서도 한 화면에 들어가게(검토 11번)
//    완료 보기 단추에 글자를 붙인다(10번). 하루 분량은 차수 일정이 있을 때만(7번)
//  · 아래 단추줄: 「다시 / 상태 변경 / 외웠어요」(8번). 연속 재생 중에는 같은 자리에 「연속 재생 끄기」(9번)
import React from 'react';
import { Box, Typography, IconButton, Button, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import StopIcon from '@mui/icons-material/Stop';

const stat = { fontSize: '0.86rem', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' };

export const LampFocusHeader = ({
  setIsFocusMode, sessionStats, versesCount, isBrowsingCompleted, onToggleBrowseMode,
  remainingToday, onHelpClick, settings, dailyProgress, daysAgoText, startDateText, sortLabel, onToggleSort,
}) => {
  const { mode } = settings;
  const { sessionCompletedCount, totalCompletedCount } = sessionStats;
  const completedBefore = dailyProgress?.completedToday || 0;
  const doneToday = completedBefore + sessionCompletedCount;      // 오늘 몫 진행(차수별 복습 기준)
  const todayTotal = (dailyProgress?.todayBase || 0) + sessionCompletedCount; // 머리줄 「오늘」 = 오늘 전체 복습 수
  const hasDailyGoal = mode === 'turnBasedReview' && remainingToday !== null;
  const dailyTotal = hasDailyGoal ? remainingToday + doneToday : 0;
  const dailyPercent = dailyTotal > 0 ? Math.round((doneToday / dailyTotal) * 100) : 0;
  const sessionGoal = versesCount + sessionCompletedCount;
  const sessionPercent = sessionGoal > 0 ? Math.round((sessionCompletedCount / sessionGoal) * 100) : 0;

  return (
    <Box onClick={(e) => e.stopPropagation()} sx={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, color: 'white',
      backgroundColor: 'rgba(0,0,0,0.38)', pt: 'var(--sat)', pb: 1,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, pt: 0.5 }}>
        <IconButton onClick={() => setIsFocusMode(false)} color="inherit" aria-label="복습 끝내기"><CloseIcon /></IconButton>
        <IconButton onClick={onHelpClick} color="inherit" aria-label="도움말"><HelpOutlineIcon /></IconButton>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 1.5, rowGap: 0.25 }}>
          {isBrowsingCompleted ? (
            <>
              <Typography sx={stat}>완료한 구절 {totalCompletedCount}</Typography>
              {onToggleSort && (
                <Button size="small" onClick={onToggleSort} sx={{ color: 'white', minHeight: 0, py: 0, px: 0.5, fontSize: '0.86rem', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  {sortLabel}
                </Button>
              )}
            </>
          ) : (
            <>
              <Typography sx={stat}>남은 {versesCount}</Typography>
              {hasDailyGoal && <Typography sx={{ ...stat, fontWeight: 700 }}>오늘 몫 {remainingToday}</Typography>}
              <Typography sx={stat}>오늘 {todayTotal}</Typography>
            </>
          )}
        </Box>
        <Button
          onClick={onToggleBrowseMode}
          disabled={!isBrowsingCompleted && totalCompletedCount === 0}
          size="small"
          sx={{
            flexShrink: 0, color: 'white', border: '1px solid rgba(255,255,255,0.55)', px: 1.25, minHeight: 36, whiteSpace: 'nowrap',
            bgcolor: isBrowsingCompleted ? 'rgba(255,255,255,0.18)' : 'transparent',
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.25)' },
          }}
        >
          {isBrowsingCompleted ? '복습으로' : '완료 보기'}
        </Button>
      </Box>
      {(daysAgoText || startDateText) && (
        <Box sx={{ px: 2, pt: 0.5, textAlign: 'right', '@media (max-height:500px)': { display: 'none' } }}>
          {daysAgoText && <Typography variant="caption" component="div" sx={{ lineHeight: 1.3 }}>{daysAgoText}</Typography>}
          {startDateText && <Typography variant="caption" component="div" sx={{ lineHeight: 1.3 }}>{startDateText}</Typography>}
        </Box>
      )}
      {!isBrowsingCompleted && hasDailyGoal && dailyTotal > 0 && (
        <Box sx={{ px: 2, pt: 0.5, '@media (max-height:500px)': { display: 'none' } }}>
          <Typography variant="caption">오늘 몫 진행 {dailyPercent}%</Typography>
          <LinearProgress variant="determinate" value={dailyPercent} color="inherit" sx={{ height: 4, borderRadius: 2, opacity: 0.85 }} />
        </Box>
      )}
      {!isBrowsingCompleted && (mode === 'turnBasedNew' || mode === 'turnBasedRecent') && sessionGoal > 0 && (
        <Box sx={{ px: 2, pt: 0.5, '@media (max-height:500px)': { display: 'none' } }}>
          <Typography variant="caption">이번 차수 진행 {sessionPercent}%</Typography>
          <LinearProgress variant="determinate" value={sessionPercent} color="inherit" sx={{ height: 4, borderRadius: 2, opacity: 0.85 }} />
        </Box>
      )}
    </Box>
  );
};

const barBtn = {
  flex: 1, minHeight: 52, fontSize: '1rem', fontWeight: 700, color: 'white',
  border: '1px solid rgba(255,255,255,0.6)', borderRadius: '4px',
};

// mode: 'review' | 'browse' | 'peek' | 'auto'
export const LampFocusBar = ({ mode, onAgain, onDone, onMenu, onPrev, onNext, onExitPeek, onStopAuto }) => (
  <Box onClick={(e) => e.stopPropagation()} sx={{
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 3,
    display: 'flex', gap: 1, alignItems: 'stretch',
    // PC: 카드 폭에 맞춰 가운데로(N16)
    '@media (min-width:700px)': { left: '50%', right: 'auto', width: 600, transform: 'translateX(-50%)', px: 0, background: 'none' },
    px: 'max(16px, env(safe-area-inset-left, 0px))', pt: 1.5, pb: 'calc(14px + var(--sab))',
    background: 'linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0))',
    '@media (max-height:500px)': { pt: 0.75, pb: 'calc(8px + var(--sab))', '& .MuiButton-root': { minHeight: 44 } },
  }}>
    {mode === 'auto' && (
      <Button onClick={onStopAuto} startIcon={<StopIcon />} sx={{ ...barBtn, bgcolor: 'rgba(0,0,0,0.35)' }}>연속 재생 끄기</Button>
    )}
    {mode === 'review' && (
      <>
        <Button onClick={onAgain} sx={barBtn} aria-label="다시 — 완료하지 않고 뒤로 보내기">다시</Button>
        <Button onClick={onMenu} sx={{ ...barBtn, flex: '0 0 auto', px: 1.5, fontWeight: 500, fontSize: '0.9rem' }}>상태</Button>
        <Button onClick={onDone} sx={{ ...barBtn, flex: 1.4, bgcolor: 'white', color: '#1C1C1A', borderColor: 'white', '&:hover': { bgcolor: '#F1EFEA' } }}>외웠어요</Button>
      </>
    )}
    {mode === 'browse' && (
      <>
        <Button onClick={onPrev} sx={barBtn}>이전</Button>
        <Button onClick={onMenu} sx={{ ...barBtn, flex: '0 0 auto', px: 1.5, fontWeight: 500, fontSize: '0.9rem' }}>상태</Button>
        <Button onClick={onNext} sx={barBtn}>다음</Button>
      </>
    )}
    {mode === 'peek' && (
      <Button onClick={onExitPeek} sx={barBtn}>지금 구절로 돌아가기</Button>
    )}
  </Box>
);
