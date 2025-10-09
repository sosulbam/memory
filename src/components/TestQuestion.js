// src/components/TestQuestion.js
import React from 'react';
import { Box, TextField, Typography, Paper, Button, Chip } from '@mui/material';
import { diffChars } from 'diff';
import { normalizeText } from '../utils/textUtils';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

const DiffResult = ({ original, userInput }) => {
  const differences = diffChars(original, userInput);
  return (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, p: 1, background: '#f5f5f5', borderRadius: 1, mt: 1 }}>
      {differences.map((part, index) => {
        const style = {
          backgroundColor: part.added ? '#ffebee' : part.removed ? '#e8f5e9' : 'transparent',
          textDecoration: part.added ? 'line-through' : 'none',
          color: part.added ? '#d32f2f' : part.removed ? '#2e7d32' : 'inherit',
          fontWeight: part.removed ? 'bold' : 'normal',
        };
        return <span key={index} style={style}>{part.value}</span>;
      })}
    </Typography>
  );
};

const TestQuestion = ({ verse, userAnswer, isGraded, onAnswerChange, onMarkAsIncorrect, questionNumber }) => {
  const isTitleCorrect = isGraded ? normalizeText(verse.제목) === normalizeText(userAnswer.title) : false;
  const isBodyCorrect = isGraded ? normalizeText(verse.본문) === normalizeText(userAnswer.body) : false;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {questionNumber}. {verse.장절}
        </Typography>
        {isGraded && (isTitleCorrect && isBodyCorrect ? 
          <Chip icon={<CheckCircleOutlineIcon />} label="정답" color="success" size="small" /> :
          <Chip icon={<CancelOutlinedIcon />} label="오답" color="error" size="small" />
        )}
      </Box>

      <TextField
        label="제목"
        fullWidth
        variant="outlined"
        size="small"
        value={userAnswer.title}
        onChange={(e) => onAnswerChange(verse.id, 'title', e.target.value)}
        disabled={isGraded}
        sx={{ mb: 1 }}
      />
      <TextField
        label="본문"
        fullWidth
        variant="outlined"
        multiline
        rows={5}
        value={userAnswer.body}
        onChange={(e) => onAnswerChange(verse.id, 'body', e.target.value)}
        disabled={isGraded}
      />
      
      {isGraded && !(isTitleCorrect && isBodyCorrect) && (
        <Box mt={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>[채점 결과]</Typography>
          {!isTitleCorrect && 
            <>
              <Typography variant="caption">제목:</Typography>
              <DiffResult original={verse.제목} userInput={userAnswer.title} />
            </>
          }
          {!isBodyCorrect && 
            <>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>본문:</Typography>
              <DiffResult original={verse.본문} userInput={userAnswer.body} />
            </>
          }
          <Button 
            variant="outlined" 
            color="warning" 
            size="small" 
            sx={{ mt: 2 }}
            startIcon={<ReportProblemOutlinedIcon />}
            onClick={() => onMarkAsIncorrect(verse.id)}
          >
            이 구절 '오답'으로 등록하기
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default TestQuestion;