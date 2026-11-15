// src/components/TestSheet.js
import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import TestQuestion from './TestQuestion';
import { Link as RouterLink } from 'react-router-dom';
import { IS_LAMP } from '../edition';
import { normalizeText } from '../utils/textUtils';

// --- onRetryTest, onResumeTest props를 추가합니다 ---
const TestSheet = ({ questions, userAnswers, isGraded, onAnswerChange, onGradeTest, onMarkAsIncorrect, onStartNewTest, onRetryTest, onResumeTest }) => {
  // 등불판: 채점 요약(몇 문제 중 몇 개 정답)·채점 단추는 위아래 두 곳·경고색 아님(검토 15번)
  const correctCount = questions.filter(q => {
    const a = userAnswers[q.id] || { title: '', body: '' };
    return normalizeText(q.제목) === normalizeText(a.title) && normalizeText(q.본문) === normalizeText(a.body);
  }).length;
  const gradeButton = (sx) => (
    <Button onClick={onGradeTest} variant="contained" color="primary" size="large" fullWidth sx={sx}>채점하기</Button>
  );
  if (IS_LAMP) {
    return (
      <Box sx={{ mt: 2 }}>
        {isGraded ? (
          <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
            <Typography variant="h5">{questions.length}문제 중 {correctCount}개 정답</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              틀린 문제에서 <Box component="span" sx={{ color: '#8A5A12', textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 }}>밑줄 친 글자</Box>는 빠진 부분, <Box component="span" sx={{ color: '#A3271F', textDecoration: 'line-through' }}>줄 그은 글자</Box>는 다르게 쓴 부분입니다.
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
              <Button onClick={onResumeTest} variant="outlined">답안 고치기</Button>
              <Button onClick={onRetryTest} variant="outlined">다시 풀기</Button>
              <Button onClick={onStartNewTest} variant="contained">새 시험</Button>
            </Box>
          </Box>
        ) : gradeButton({ mb: 2 })}
        <Grid container spacing={2}>
          {questions.map((q, index) => (
            <Grid item xs={12} md={6} key={q.id}>
              <TestQuestion verse={q} userAnswer={userAnswers[q.id] || { title: '', body: '' }} isGraded={isGraded}
                onAnswerChange={onAnswerChange} onMarkAsIncorrect={onMarkAsIncorrect} questionNumber={index + 1} />
            </Grid>
          ))}
        </Grid>
        {!isGraded && gradeButton({ mt: 1 })}
      </Box>
    );
  }
  return (
    <Box sx={{ mt: 4 }}>
      {isGraded ? (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} p={2} sx={{ background: '#f5f5f5', borderRadius: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>채점 완료</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {/* --- '다시 풀기'와 '계속 풀기(수정)' 버튼을 추가합니다 --- */}
            <Button onClick={onResumeTest} variant="outlined" color="secondary">답안 수정</Button>
            <Button onClick={onRetryTest} variant="outlined">다시 풀기</Button>
            <Button onClick={onStartNewTest} variant="contained">새 시험</Button>
          </Box>
        </Box>
      ) : (
        <Button onClick={onGradeTest} variant="contained" color="error" size="large" fullWidth sx={{ mb: 2 }}>
          채점하기
        </Button>
      )}
      
      <Grid container spacing={2}>
        {questions.map((q, index) => (
          <Grid item xs={12} md={6} key={q.id}>
            <TestQuestion
              verse={q}
              userAnswer={userAnswers[q.id] || { title: '', body: '' }}
              isGraded={isGraded}
              onAnswerChange={onAnswerChange}
              onMarkAsIncorrect={onMarkAsIncorrect}
              questionNumber={index + 1}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TestSheet;