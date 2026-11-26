// src/pages/LampTestPage.js — 등불판 암송 시험 (#400, 개인판 RecitationTestPage 를 옮김. 팀 시험은 뺌)
// 기본판(scripture-memory-sta)은 종전 RecitationTestPage.js 그대로. App.js 가 IS_LAMP 로 고른다.
// 점수 기록은 이 기기(recitation-app-test-scores) — 동기화 코드를 쓰면 다른 기기와 id 로 합쳐진다.
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Container, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { DataContext } from '../contexts/DataContext';
import LampTestSetup from '../components/LampTestSetup';
import LampTestSheet from '../components/LampTestSheet';
import { sourceBadge, hasTitle } from '../components/LampTestQuestion';
import { useSnackbar } from '../contexts/SnackbarContext';
import { sortByGroup, pickSpread, sameChunkCandidates } from '../utils/testOrder';
import { suggestScore } from '../utils/testScore';
import { appendScoreRecords } from '../utils/testScoreLog';
import { getKSTDateString } from '../utils/dateUtils';

const TEST_STORAGE_KEY = 'recitation-test-progress';

const LampTestPage = () => {
  const { showSnackbar } = useSnackbar();
  const { originalVerses, updateVerseStatus } = useContext(DataContext);
  const [phase, setPhase] = useState('setup'); // 'setup', 'testing', 'graded'
  const [testQuestions, setTestQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [poolIds, setPoolIds] = useState(null); // 처음 고른 시험 범위(구절 id) — [다시 출제]가 여기서 뽑는다
  // 문제별 채점 상태(#300) — { [구절 id]: { hint, graded, suggestion, chosen, confirmed, recorded, recordedScore, practice } }
  //  recorded = 이 시험에서 이미 점수를 기록함 → 그 뒤 [다시 풀기]는 연습(기록 안 함, 처음 확정한 점수만 남긴다)
  const [qState, setQState] = useState({});
  const [testId, setTestId] = useState(null);
  const [inputMode, setInputMode] = useState('full'); // 'full' | 'initial'(#362 초성 입력) — 시험을 시작할 때 정한다
  // [시험 시작] 전에는 장절만 보고 [다시 출제]로 바꿀 수 있다. 시작한 뒤엔 못 바꾼다(#372)
  const [started, setStarted] = useState(true);
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

  // 채점 뒤에도 저장한다 — 확정 전 제안 점수가 새로고침으로 사라지지 않게. [새 시험]에서 지운다
  useEffect(() => {
    if (phase === 'testing' || phase === 'graded') {
      try {
        const progress = {
          questions: testQuestions,
          answers: userAnswers,
          poolIds,
          qState,
          testId,
          phase,
          inputMode,
          started,
        };
        localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(progress));
      } catch (e) {
        console.error("Failed to save test progress to localStorage", e);
      }
    }
  }, [userAnswers, testQuestions, phase, poolIds, qState, testId, inputMode, started]);

  const allCategories = useMemo(() => {
    if (!originalVerses) return [];
    return [...new Set(originalVerses.map(v => v.카테고리).filter(Boolean))];
  }, [originalVerses]);

  const handleStartTest = (config) => {
    // 랜덤 = 범위 전체에 골고루(칸마다 하나), 순차 = 앞에서부터
    const picked = config.order === 'random'
      ? pickSpread(config.verses, config.count)
      : config.verses.slice(0, config.count);
    const currentQuestions = sortByGroup(picked);
    setTestQuestions(currentQuestions);
    setPoolIds(config.verses.map(v => v.id));

    const initialAnswers = {};
    currentQuestions.forEach(q => {
      initialAnswers[q.id] = { title: '', body: '' };
    });
    setUserAnswers(initialAnswers);
    setQState({});
    setTestId(String(Date.now()));
    setInputMode(config.inputMode === 'initial' ? 'initial' : 'full');
    setStarted(false);
    setPhase('testing');
  };

  // field 가 객체면 여러 칸을 한 번에(초성 입력은 친 초성과 채운 본문을 함께 바꾼다)
  const handleAnswerChange = (verseId, field, value) => {
    const patch = typeof field === 'object' ? field : { [field]: value };
    setUserAnswers(prev => ({
      ...prev,
      [verseId]: { ...prev[verseId], ...patch },
    }));
  };

  // 다시 출제 후보: 처음 범위(이어 하기로 범위를 모르면 미암송 아닌 전체) 중 지금 시험에 없는 구절
  const redrawCandidates = useMemo(() => {
    if (!originalVerses) return [];
    const inTest = new Set(testQuestions.map(q => q.id));
    const inPool = poolIds ? new Set(poolIds) : null;
    return originalVerses.filter(v => !v.미암송여부 && !inTest.has(v.id) && (!inPool || inPool.has(v.id)));
  }, [originalVerses, testQuestions, poolIds]);

  const handleRedraw = (verseId) => {
    if (started) return;
    if (redrawCandidates.length === 0) {
      showSnackbar('범위 안에 바꿀 구절이 없습니다.', 'info');
      return;
    }
    // 골고루 출제를 지키려고 바뀌는 문제가 있던 칸에서 먼저 뽑는다
    const poolSet = new Set(poolIds || []);
    const poolVerses = originalVerses ? originalVerses.filter(v => poolSet.has(v.id)) : [];
    const from = sameChunkCandidates(poolVerses, testQuestions.length, verseId, redrawCandidates) || redrawCandidates;
    const next = from[Math.floor(Math.random() * from.length)];
    setTestQuestions(prev => sortByGroup(prev.map(q => (q.id === verseId ? next : q))));
    setUserAnswers(prev => {
      const { [verseId]: _drop, ...rest } = prev;
      return { ...rest, [next.id]: { title: '', body: '' } };
    });
    setQState(prev => {
      const { [verseId]: _drop, ...rest } = prev;
      return rest;
    });
  };

  // 채점 뒤 요약의 정답 수 — 감점 내역에 제목·틀린 단어가 없으면 정답(힌트만 쓴 것은 정답)
  const correctCount = testQuestions.filter(q => {
    const s = qState[q.id]?.suggestion;
    return s && !s.titleWrong && !s.wrongWords;
  }).length;

  // ── 문제별 채점 ──
  const patchQ = (verseId, patch) => setQState(prev => ({ ...prev, [verseId]: { ...prev[verseId], ...patch } }));

  const gradeOne = (verse, prevQ, answers) => {
    const suggestion = suggestScore({
      verse,
      answer: answers[verse.id],
      isOyo: !hasTitle(verse),   // 제목 없는 구절은 제목 채점 안 함
      hintUsed: !!prevQ?.hint,
      initialMode: inputMode === 'initial',
    });
    return { ...prevQ, graded: true, suggestion, chosen: suggestion.score, confirmed: false, practice: !!prevQ?.recorded };
  };

  const handleGradeOne = (verseId) => {
    const verse = testQuestions.find(q => q.id === verseId);
    if (!verse) return;
    setQState(prev => ({ ...prev, [verseId]: gradeOne(verse, prev[verseId], userAnswers) }));
  };

  const handleHint = (verseId) => patchQ(verseId, { hint: true });
  const handleChooseScore = (verseId, value) => patchQ(verseId, { chosen: value });

  const confirmIds = (ids) => {
    const records = [];
    const now = new Date().toISOString();
    const next = { ...qState };
    ids.forEach(id => {
      const q = next[id];
      if (!q?.graded || q.confirmed) return;
      if (q.recorded) {
        next[id] = { ...q, confirmed: true };   // 연습 — 기록 안 함
        return;
      }
      const verse = testQuestions.find(v => v.id === id);
      records.push({
        id: `${testId}:${id}`,
        testId,
        date: getKSTDateString(),
        at: now,
        verseId: id,
        장절: verse?.장절 || '',
        출처: verse ? sourceBadge(verse) : '',
        score: q.chosen,
        suggested: q.suggestion?.score,
        titleWrong: !!q.suggestion?.titleWrong,
        wrongWords: q.suggestion?.wrongWords || 0,
        hint: !!q.hint,
        ...(inputMode === 'initial' ? { inputMode: 'initial', misses: q.suggestion?.missTotal || 0 } : {}),
      });
      next[id] = { ...q, confirmed: true, recorded: true, recordedScore: q.chosen };
    });
    setQState(next);
    appendScoreRecords(records);
  };

  const handleConfirm = (verseId) => confirmIds([verseId]);
  const handleConfirmAll = () => confirmIds(testQuestions.map(q => q.id));

  // 확정한 문제 다시 풀기 — 답을 지우고 빈칸에서. 기록은 처음 확정한 점수 그대로
  const handleRetryOne = (verseId) => {
    setUserAnswers(prev => ({ ...prev, [verseId]: { title: '', body: '' } }));
    setQState(prev => ({ ...prev, [verseId]: { recorded: prev[verseId]?.recorded, recordedScore: prev[verseId]?.recordedScore } }));
    if (phase === 'graded') setPhase('testing');
  };

  const handleGradeTest = () => {
    // 아직 채점하지 않은 문제를 모두 채점(제안). 확정은 문제마다 또는 [모두 제안대로 확정]
    setQState(prev => {
      const next = { ...prev };
      testQuestions.forEach(q => { if (!next[q.id]?.graded) next[q.id] = gradeOne(q, next[q.id], userAnswers); });
      return next;
    });
    setPhase('graded');
  };
  
  const handleMarkAsIncorrect = (verseId) => {
    updateVerseStatus(verseId, { '오답여부': true });
    showSnackbar('오답으로 표시했습니다.', 'success');
  };

  const handleStartNewTest = () => {
    if (window.confirm('현재 시험 결과를 지우고 새로운 시험을 시작하시겠습니까?')) {
        setTestQuestions([]);
        setUserAnswers({});
        setQState({});
        setTestId(null);
        localStorage.removeItem(TEST_STORAGE_KEY);
        setPhase('setup');
    }
  };
  
  const handleRetryTest = () => {
    const initialAnswers = {};
    testQuestions.forEach(q => {
      initialAnswers[q.id] = { title: '', body: '' };
    });
    setUserAnswers(initialAnswers);
    // 이미 기록한 문제는 다시 풀어도 연습(기록 안 함)
    setQState(prev => {
      const next = {};
      Object.entries(prev).forEach(([id, q]) => { if (q?.recorded) next[id] = { recorded: true, recordedScore: q.recordedScore }; });
      return next;
    });
    setPhase('testing');
  };
  
  // 답안 수정 — 확정한 문제는 잠긴 채, 확정 전 문제만 채점을 풀고 다시 고친다
  const handleResumeTest = () => {
    setQState(prev => {
      const next = { ...prev };
      Object.entries(next).forEach(([id, q]) => { if (q?.graded && !q.confirmed) next[id] = { ...q, graded: false, suggestion: null, chosen: null }; });
      return next;
    });
    setPhase('testing');
  };

  const handleResumeTestFromStorage = () => {
    setTestQuestions(sortByGroup(savedProgress.questions));
    setPoolIds(savedProgress.poolIds || null);
    setUserAnswers(savedProgress.answers);
    setQState(savedProgress.qState || {});
    setTestId(savedProgress.testId || String(Date.now()));
    setInputMode(savedProgress.inputMode === 'initial' ? 'initial' : 'full');
    setStarted(savedProgress.started !== false);
    setPhase(savedProgress.phase === 'graded' ? 'graded' : 'testing');
    setResumeDialogOpen(false);
  };
  
  const handleDiscardTest = () => {
    localStorage.removeItem(TEST_STORAGE_KEY);
    setResumeDialogOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {phase === 'setup' ? (
        <LampTestSetup
          categories={allCategories}
          allVerses={originalVerses}
          onStartTest={handleStartTest}
        />
      ) : (
        <LampTestSheet
          questions={testQuestions}
          correctCount={correctCount}
          userAnswers={userAnswers}
          isGraded={phase === 'graded'}
          onAnswerChange={handleAnswerChange}
          onGradeTest={handleGradeTest}
          onMarkAsIncorrect={handleMarkAsIncorrect}
          onStartNewTest={handleStartNewTest}
          onRetryTest={handleRetryTest}
          onResumeTest={handleResumeTest}
          onRedraw={started ? null : handleRedraw}
          started={started}
          onStart={() => setStarted(true)}
          qState={qState}
          inputMode={inputMode}
          onHint={handleHint}
          onGradeOne={handleGradeOne}
          onChooseScore={handleChooseScore}
          onConfirm={handleConfirm}
          onConfirmAll={handleConfirmAll}
          onRetryOne={handleRetryOne}
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

export default LampTestPage;