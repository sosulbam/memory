// src/components/TestSheet.js
import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import TestQuestion from './TestQuestion';
import { Link as RouterLink } from 'react-router-dom';

// --- onRetryTest, onResumeTest props를 추가합니다 ---
const TestSheet = ({ questions, userAnswers, isGraded, onAnswerChange, onGradeTest, onMarkAsIncorrect, onStartNewTest, onRetryTest, onResumeTest }) => {
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