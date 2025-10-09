// src/pages/RecitationTestPage.js
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Container, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { DataContext } from '../contexts/DataContext';
import TestSetup from '../components/TestSetup';
import TestSheet from '../components/TestSheet';

const TEST_STORAGE_KEY = 'recitation-test-progress';

const RecitationTestPage = () => {
  const { originalVerses, updateVerseStatus } = useContext(DataContext);
  const [phase, setPhase] = useState('setup'); // 'setup', 'testing', 'graded'
  const [testQuestions, setTestQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TEST_STORAGE_KEY);
      if (saved) {
        const progress = JSON.parse(saved);
        if (progress.questions && progress.questions.length > 0) {
          setSavedProgress(progress);
          setResumeDialogOpen(true);
        }
      }
    } catch (e) {
      console.error("Failed to load test progress from localStorage", e);
      localStorage.removeItem(TEST_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (phase === 'testing') {
      try {
        const progress = {
          questions: testQuestions,
          answers: userAnswers,
        };
        localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(progress));
      } catch (e) {
        console.error("Failed to save test progress to localStorage", e);
      }
    }
  }, [userAnswers, testQuestions, phase]);

  const allCategories = useMemo(() => {
    if (!originalVerses) return [];
    return [...new Set(originalVerses.map(v => v.카테고리).filter(Boolean))];
  }, [originalVerses]);

  const handleStartTest = (config) => {
    let questions = [...config.verses];
    if (config.order === 'random') {
      questions.sort(() => Math.random() - 0.5);
    }
    const currentQuestions = questions.slice(0, config.count);
    setTestQuestions(currentQuestions);

    const initialAnswers = {};
    currentQuestions.forEach(q => {
      initialAnswers[q.id] = { title: '', body: '' };
    });
    setUserAnswers(initialAnswers);
    setPhase('testing');
  };

  const handleAnswerChange = (verseId, field, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [verseId]: { ...prev[verseId], [field]: value },
    }));
  };

  const handleGradeTest = () => {
    setPhase('graded');
    localStorage.removeItem(TEST_STORAGE_KEY);
  };
  
  const handleMarkAsIncorrect = (verseId) => {
    updateVerseStatus(verseId, { '오답여부': true });
    alert('오답으로 등록되었습니다.');
  };

  const handleStartNewTest = () => {
    if (window.confirm('현재 시험 결과를 지우고 새로운 시험을 시작하시겠습니까?')) {
        setTestQuestions([]);
        setUserAnswers({});
        setPhase('setup');
    }
  };
  
  const handleRetryTest = () => {
    const initialAnswers = {};
    testQuestions.forEach(q => {
      initialAnswers[q.id] = { title: '', body: '' };
    });
    setUserAnswers(initialAnswers);
    setPhase('testing');
  };
  
  const handleResumeTest = () => {
    setPhase('testing');
  };

  const handleResumeTestFromStorage = () => {
    setTestQuestions(savedProgress.questions);
    setUserAnswers(savedProgress.answers);
    setPhase('testing');
    setResumeDialogOpen(false);
  };
  
  const handleDiscardTest = () => {
    localStorage.removeItem(TEST_STORAGE_KEY);
    setResumeDialogOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {phase === 'setup' ? (
        <TestSetup
          categories={allCategories}
          allVerses={originalVerses}
          onStartTest={handleStartTest}
        />
      ) : (
        <TestSheet
          questions={testQuestions}
          userAnswers={userAnswers}
          isGraded={phase === 'graded'}
          onAnswerChange={handleAnswerChange}
          onGradeTest={handleGradeTest}
          onMarkAsIncorrect={handleMarkAsIncorrect}
          onStartNewTest={handleStartNewTest}
          onRetryTest={handleRetryTest}
          onResumeTest={handleResumeTest}
        />
      )}

      <Dialog open={resumeDialogOpen} onClose={handleDiscardTest}>
        <DialogTitle>진행 중인 시험이 있습니다</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이전에 작성하던 시험이 있습니다. 이어서 진행하시겠습니까? '아니오'를 선택하면 작성 내용은 삭제됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDiscardTest}>아니오</Button>
          <Button onClick={handleResumeTestFromStorage} variant="contained">예, 이어서 합니다</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RecitationTestPage;