// src/components/LampTestSheet.js — 등불판 시험지 (#400, 개인판 TestSheet 을 옮김)
//  · 시작 전: [시험 시작] + 안내(시작하면 다시 출제 못 함)
//  · 푸는 중: [채점하기](위·아래 두 곳, 남은 문제를 모두 「제안」까지) · [출제 문제 복사]
//  · 채점 뒤: 정답 수 요약 + 틀린 곳 표시 안내 · 답안 고치기 · 다시 풀기 · 새 시험
//  · 진행 줄: 채점 a/b · 기록 n문제 · 합계 · 확정 전 k + [모두 제안대로 확정]
import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LampTestQuestion, { sourceBadge, MISS_MARK, WRONG_MARK } from './LampTestQuestion';
import { useSnackbar } from '../contexts/SnackbarContext';
import { getKSTDateString } from '../utils/dateUtils';
import { formatRefFull } from '../utils/refFormat';
import { copyText } from '../utils/shareToday';

// 출제 문제 전체 + 답안을 텍스트로 (문제지 / 답안지 두 덩어리)
export const buildTestText = (questions) => {
  const head = (q, i) => `${i + 1}. ${formatRefFull(q.장절)} (${sourceBadge(q)})`;
  return [
    `암송 시험 · ${getKSTDateString()} · ${questions.length}문제`,
    '',
    '[문제]',
    ...questions.map(head),
    '',
    '[답안]',
    ...questions.flatMap((q, i) => [head(q, i), ...(q.제목 ? [`제목: ${q.제목}`] : []), q.본문 || '', '']),
  ].join('\n').trimEnd();
};

const LampTestSheet = ({ questions, userAnswers, isGraded, correctCount, onAnswerChange, onGradeTest, onMarkAsIncorrect, onStartNewTest, onRetryTest, onResumeTest, onRedraw,
  qState = {}, inputMode = 'full', started = true, onStart, onHint, onGradeOne, onChooseScore, onConfirm, onConfirmAll, onRetryOne }) => {
  const { showSnackbar } = useSnackbar();
  const qs = questions.map(q => qState[q.id] || {});
  const gradedCount = qs.filter(q => q.graded).length;
  const pendingCount = qs.filter(q => q.graded && !q.confirmed).length;
  const recordedCount = qs.filter(q => q.recorded).length;
  const recordedSum = qs.reduce((sum, q) => sum + (q.recorded ? (q.recordedScore || 0) : 0), 0);

  const progressLine = started && (gradedCount > 0 || recordedCount > 0) && (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={2} data-test-progress>
      <Typography variant="body2">
        채점 <b>{gradedCount}/{questions.length}</b> · 기록 <b>{recordedCount}</b>문제 · 합계 <b data-test-sum>{recordedSum}점</b>
        {pendingCount > 0 && <Typography component="span" variant="body2" color="warning.dark"> · 확정 전 {pendingCount}</Typography>}
      </Typography>
      {pendingCount > 0 && (
        <Button size="small" variant="outlined" color="success" onClick={onConfirmAll} data-test-confirmall>모두 제안대로 확정</Button>
      )}
    </Box>
  );

  const handleCopyAll = () => {
    copyText(buildTestText(questions)).then(ok =>
      showSnackbar(ok ? `출제 문제 ${questions.length}개와 답안을 복사했습니다.` : '복사하지 못했습니다.', ok ? 'success' : 'error'));
  };
  const copyButton = (
    <Button onClick={handleCopyAll} variant="outlined" startIcon={<ContentCopyIcon />} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }} data-test-copy>
      출제 문제 복사
    </Button>
  );
  const gradeButton = (sx) => (
    <Button onClick={onGradeTest} variant="contained" color="primary" size="large" sx={{ flex: 1, ...sx }} data-test-gradeall>채점하기</Button>
  );

  return (
    <Box sx={{ mt: 2 }}>
      {!started ? (
        <Box mb={2}>
          <Box display="flex" gap={1} mb={1}>
            <Button onClick={onStart} variant="contained" size="large" sx={{ flex: 1 }} data-test-start>시험 시작</Button>
          </Box>
          <Typography variant="body2" color="text.secondary">
            출제된 {questions.length}문제입니다. 바꾸고 싶은 구절은 [다시 출제]로 바꾸세요 — <b>시작하면 바꿀 수 없습니다.</b>
          </Typography>
        </Box>
      ) : isGraded ? (
        <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
          <Typography variant="h5">{questions.length}문제 중 {correctCount}개 정답</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            틀린 문제에서 <Box component="span" sx={MISS_MARK}>밑줄 친 글자</Box>는 빠진 부분, <Box component="span" sx={WRONG_MARK}>줄 그은 글자</Box>는 다르게 쓴 부분입니다.
            점수는 문제마다 [확정]해야 기록됩니다.
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
            <Button onClick={onResumeTest} variant="outlined">답안 고치기</Button>
            <Button onClick={onRetryTest} variant="outlined">다시 풀기</Button>
            {copyButton}
            <Button onClick={onStartNewTest} variant="contained">새 시험</Button>
          </Box>
        </Box>
      ) : (
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          {gradeButton()}
          {copyButton}
        </Box>
      )}
      {progressLine}

      <Grid container spacing={2}>
        {questions.map((q, index) => (
          <Grid item xs={12} md={6} key={q.id}>
            <LampTestQuestion
              verse={q}
              userAnswer={userAnswers[q.id] || { title: '', body: '' }}
              q={qState[q.id]}
              inputMode={inputMode}
              started={started}
              onAnswerChange={onAnswerChange}
              onMarkAsIncorrect={onMarkAsIncorrect}
              questionNumber={index + 1}
              onRedraw={onRedraw}
              onHint={onHint}
              onGradeOne={onGradeOne}
              onChooseScore={onChooseScore}
              onConfirm={onConfirm}
              onRetryOne={onRetryOne}
            />
          </Grid>
        ))}
      </Grid>
      {started && !isGraded && <Box display="flex" mt={1}>{gradeButton()}</Box>}
    </Box>
  );
};

export default LampTestSheet;
