// src/components/LampTestQuestion.js — 등불판 암송 시험 한 문제 (#400, 개인판 TestQuestion 을 옮김)
//  · 시작 전: 장절·분류·「긴 구절」과 [다시 출제]만 / 시작 뒤: 답 칸 · 힌트(-1) · [채점]
//  · 채점 뒤: 제안 점수 → 사람이 고쳐 [확정](기록) · 확정한 문제 [다시 풀기]는 연습(기록 안 함)
//  · 틀린 곳 표시는 등불판 그대로 — 빠진 글자 밑줄, 다르게 쓴 글자 줄 긋기
//  · 개인판과 다른 점: 출처 뱃지는 큰 분류 이름, OYO 규칙 대신 「제목이 없는 구절은 제목을 채점하지 않음」
import React from 'react';
import { Box, TextField, Typography, Paper, Button, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { diffChars } from 'diff';
import { normalizeText } from '../utils/textUtils';
import { formatRefFull } from '../utils/refFormat';
import { isLongVerse } from '../utils/verseCount';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import { hintText, scoreBreakdown, MAX_PENALTY, isTitleRight } from '../utils/testScore';
import InitialInputField from './InitialInputField';
import { fillByInitials } from '../utils/initialInput';

const SCORE_CHOICES = Array.from({ length: MAX_PENALTY + 1 }, (_, i) => -i);   // 0, -1 … -5

export const MISS_MARK = { color: '#8A5A12', textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 };
export const WRONG_MARK = { color: '#A3271F', textDecoration: 'line-through' };

// 출처 뱃지 = 큰 분류 이름(팩 이름). 없으면 「기타」
export const sourceBadge = (verse) => String(verse?.카테고리 || '').trim() || '기타';
// 제목이 없는 구절(직접 넣은 구절 등)은 제목을 채점하지 않는다
export const hasTitle = (verse) => !!String(verse?.제목 || '').trim();

// 채점 뒤 점수 칸: 앱이 제안하고, 사람이 고쳐서 [확정]해야 기록된다
const ScoreBox = ({ q, onChoose, onConfirm, onRetry }) => {
  const { suggestion, chosen, confirmed, practice } = q;
  return (
    <Box mt={1.5} p={1.25} data-test-scorebox
      sx={{ border: '1px solid', borderColor: confirmed ? 'success.light' : 'warning.light', borderRadius: 1, background: confirmed ? '#f1f8f2' : '#fffaf0' }}>
      <Typography variant="body2" sx={{ mb: 0.75 }}>
        제안 <b data-test-suggest>{suggestion?.score ?? 0}점</b>{' '}
        <Typography component="span" variant="caption" color="text.secondary">({suggestion ? scoreBreakdown(suggestion) : ''})</Typography>
        {practice && <Chip label="연습 · 기록 안 함" size="small" sx={{ ml: 0.75 }} />}
      </Typography>
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <ToggleButtonGroup size="small" exclusive value={chosen} disabled={confirmed}
          onChange={(_, v) => { if (v !== null) onChoose(v); }} aria-label="점수">
          {SCORE_CHOICES.map(v => (
            <ToggleButton key={v} value={v} sx={{ px: 1.1, minWidth: 34, fontWeight: 600 }}>{v}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        {confirmed ? (
          <>
            <Chip label={practice ? `연습 ${chosen}점` : `확정 ${chosen}점 · 기록됨`} color="success" size="small" />
            <Button size="small" startIcon={<ReplayIcon />} onClick={onRetry} sx={{ whiteSpace: 'nowrap' }}>다시 풀기</Button>
          </>
        ) : (
          <Button size="small" variant="contained" color="success" onClick={onConfirm} sx={{ whiteSpace: 'nowrap' }} data-test-confirm>확정</Button>
        )}
      </Box>
    </Box>
  );
};

// 등불판 틀린 곳 표시: 빠진 글자는 주황 밑줄, 다르게 쓴 글자는 빨간 줄
const DiffResult = ({ original, userInput }) => {
  const differences = diffChars(original || '', userInput || '');
  return (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, p: 1, background: '#f5f5f5', borderRadius: 1, mt: 1 }}>
      {differences.map((part, index) => {
        const style = {
          backgroundColor: part.added ? '#FBEAE8' : part.removed ? '#FFF3E0' : 'transparent',
          textDecoration: part.added ? 'line-through' : part.removed ? 'underline' : 'none',
          textUnderlineOffset: 3,
          color: part.added ? '#A3271F' : part.removed ? '#8A5A12' : 'inherit',
          fontWeight: part.removed ? 'bold' : 'normal',
        };
        return <span key={index} style={style}>{part.value}</span>;
      })}
    </Typography>
  );
};

const InitialLegend = ({ label, answer }) => (
  <Typography variant="caption" sx={{ mt: 1, display: 'block', lineHeight: 1.6 }}>
    {label}: 위 칸의 <span style={{ color: '#d32f2f', fontWeight: 600 }}>빨간 어절</span>은 세 번 다 틀린 곳,{' '}
    <span style={MISS_MARK}>밑줄 친 어절</span>은 못 채운 곳입니다{answer ? ` — 정답 「${answer}」` : ''}
  </Typography>
);

const LampTestQuestion = ({ verse, userAnswer, q = {}, inputMode = 'full', started = true, onAnswerChange, onMarkAsIncorrect, questionNumber, onRedraw, onHint, onGradeOne, onChooseScore, onConfirm, onRetryOne }) => {
  const isGraded = !!q.graded;
  const badge = sourceBadge(verse);
  const isLong = isLongVerse(verse);
  const titled = hasTitle(verse);
  const isInitial = inputMode === 'initial';
  // 초성 입력은 제목도 초성으로 — 이어 하기로 불러온 옛 답(titleInitials 없이 글자가 있음)만 글자 칸
  const titleByInitials = isInitial && (userAnswer.titleInitials !== undefined || !userAnswer.title);
  const isTitleCorrect = isGraded ? (!titled || isTitleRight({ verse, answer: userAnswer, initialMode: isInitial })) : false;
  const initialFill = isInitial ? fillByInitials(verse.본문, userAnswer.initials) : null;
  const isBodyCorrect = isGraded && (isInitial
    ? initialFill.done && initialFill.wrongCount === 0
    : normalizeText(verse.본문) === normalizeText(userAnswer.body));

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }} data-test-q={verse.id}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={started ? 1 : 0} gap={1}>
        <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap" sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, wordBreak: 'keep-all' }}>
            {questionNumber}. {formatRefFull(verse.장절)}
          </Typography>
          <Chip label={badge} size="small" variant="outlined" color="primary" />
          {isLong && <Chip label="긴 구절" size="small" color="warning" />}
        </Box>
        {!started && onRedraw && (
          <Button size="small" startIcon={<AutorenewIcon />} onClick={() => onRedraw(verse.id)} sx={{ whiteSpace: 'nowrap', minWidth: 0, flexShrink: 0 }} data-test-redraw>
            다시 출제
          </Button>
        )}
        {started && !isGraded && (
          <Button size="small" variant="outlined" onClick={() => onGradeOne(verse.id)} sx={{ whiteSpace: 'nowrap', minWidth: 0, flexShrink: 0 }} data-test-gradeone>
            채점
          </Button>
        )}
        {isGraded && (isTitleCorrect && isBodyCorrect
          ? <Chip icon={<CheckCircleOutlineIcon />} label="정답" color="success" size="small" sx={{ flexShrink: 0 }} />
          : <Chip icon={<CancelOutlinedIcon />} label="오답" color="error" size="small" sx={{ flexShrink: 0 }} />
        )}
      </Box>

      {!started || !titled ? null : titleByInitials ? (
        <InitialInputField
          compact
          field="title"
          label="제목 초성"
          body={verse.제목 || ''}
          value={userAnswer.titleInitials || ''}
          disabled={isGraded}
          onChange={(raw, fill) => onAnswerChange(verse.id, { titleInitials: raw, title: fill.filledText })}
        />
      ) : (
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
      )}
      {started && !titled && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>제목이 없는 구절이라 본문만 채점합니다.</Typography>
      )}
      {started && !isGraded && !q.hint && (
        <Button size="small" color="warning" startIcon={<LightbulbOutlinedIcon />} onClick={() => onHint(verse.id)} sx={{ mb: 0.5 }} data-test-hint>
          힌트 보기 (-1)
        </Button>
      )}
      {q.hint && (
        <Typography variant="body2" sx={{ mb: 1, px: 1, py: 0.5, background: '#fff8e1', borderRadius: 1 }} data-test-hinttext>
          힌트 (-1): {hintText(verse.본문)} …
        </Typography>
      )}
      {!started ? null : isInitial ? (
        <InitialInputField
          body={verse.본문}
          value={userAnswer.initials || ''}
          disabled={isGraded}
          onChange={(raw, fill) => onAnswerChange(verse.id, { initials: raw, body: fill.filledText })}
        />
      ) : (
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
      )}

      {isGraded && (
        <ScoreBox q={q}
          onChoose={(v) => onChooseScore(verse.id, v)}
          onConfirm={() => onConfirm(verse.id)}
          onRetry={() => onRetryOne(verse.id)} />
      )}

      {isGraded && !(isTitleCorrect && isBodyCorrect) && (
        <Box mt={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>채점 결과</Typography>
          {!isTitleCorrect && titleByInitials && <InitialLegend label="제목" answer={verse.제목} />}
          {!isTitleCorrect && !titleByInitials && (
            <>
              <Typography variant="caption">제목:</Typography>
              <DiffResult original={verse.제목} userInput={userAnswer.title} />
            </>
          )}
          {!isBodyCorrect && isInitial && <InitialLegend label="본문" />}
          {!isBodyCorrect && !isInitial && (
            <>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>본문:</Typography>
              <DiffResult original={verse.본문} userInput={userAnswer.body} />
            </>
          )}
          <Button
            variant="outlined"
            color="warning"
            size="small"
            sx={{ mt: 2 }}
            startIcon={<ReportProblemOutlinedIcon />}
            onClick={() => onMarkAsIncorrect(verse.id)}
          >
            오답으로 표시
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default LampTestQuestion;
