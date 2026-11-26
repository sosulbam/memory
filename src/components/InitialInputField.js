// src/components/InitialInputField.js
// 암송 시험 「초성 입력」 본문 칸(#362 개인판 → #400 등불판으로 옮김) — 위는 채워진 본문 + 지금 어절 자리(남은 기회 ●●○), 아래는 초성을 치는 입력칸.
// 판정은 전부 utils/initialInput.js(입력칸 값 전체에서 매번 다시 계산 — IME 조합 중 글자가 바뀌어도 그대로 맞는다)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { fillByInitials, dropLastWord, typedKeys, keysToRaw, CHANCES } from '../utils/initialInput';

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
`;
const flash = keyframes`
  0% { background-color: #ffcdd2; border-color: #d32f2f; }
  100% { background-color: #fff; border-color: #90caf9; }
`;

const WORD_STYLE = {
  ok: {},
  wrong: { color: '#d32f2f', backgroundColor: '#ffebee', fontWeight: 600, borderRadius: 3 },
  // 못 채운 어절 = 등불판 전체 입력 채점의 「빠진 글자」와 같은 밑줄
  missing: { color: '#8A5A12', backgroundColor: '#FFF3E0', textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 'bold' },
};
// 복습 화면(어두운 배경 위 흰 글씨)용
const WORD_STYLE_DARK = {
  ok: {},
  wrong: { color: '#ffcdd2', backgroundColor: 'rgba(211,47,47,0.55)', fontWeight: 700, borderRadius: 4, padding: '0 2px' },
  missing: { color: '#c8e6c9', fontWeight: 700 },
};

// 채운 본문을 원문 띄어쓰기·줄바꿈 그대로 그린다. showMissing = 채점 뒤 못 채운 어절을 초록으로
export const InitialFillView = ({ body, fill, showMissing, dark }) => {
  const styles = dark ? WORD_STYLE_DARK : WORD_STYLE;
  const text = String(body || '');
  const parts = [];
  let cursor = 0;
  fill.words.forEach((w, i) => {
    if (!w.filled && !showMissing) return;
    if (w.start > cursor) parts.push(<span key={`s${i}`}>{text.slice(cursor, w.start)}</span>);
    const kind = !w.filled ? 'missing' : w.wrong ? 'wrong' : 'ok';
    parts.push(<span key={i} data-word={kind} style={styles[kind]}>{w.word}</span>);
    cursor = w.end;
  });
  return <>{parts}</>;
};

export const Chances = ({ left, dim = '#e0e0e0', on = '#1976d2' }) => (
  <span aria-label={`남은 기회 ${left}번`} style={{ letterSpacing: 1 }}>
    {Array.from({ length: CHANCES }, (_, i) => (
      <span key={i} style={{ color: i < left ? on : dim }}>●</span>
    ))}
  </span>
);

const flashDark = keyframes`
  0% { background-color: rgba(229,57,53,0.85); border-color: #ff8a80; }
  100% { background-color: rgba(229,57,53,0); border-color: rgba(255,255,255,0.7); }
`;
export const missAnimation = `${shake} 0.32s ease, ${flash} 0.6s ease`;
export const missAnimationDark = `${shake} 0.32s ease, ${flashDark} 0.6s ease`;

// 초성 입력칸 하나의 판정·이벤트 — 시험(아래 InitialInputField)과 복습(TypingView 초성 모드)이 함께 쓴다.
// 반환: fill(채운 결과) · missTick(틀릴 때마다 +1 — 흔들림 다시 걸기용 key) · inputProps(입력칸에 펼쳐 넣을 것)
export const useInitialInput = ({ body, raw, onChange, inputRef, enabled = true }) => {
  const fill = useMemo(() => fillByInitials(body, raw), [body, raw]);

  // 틀린 글자 → 지금 어절 자리가 흔들리고 빨갛게 깜빡(채우지 않음). 3번째에 빨간 정답으로 채워질 때도 한 번
  const [missTick, setMissTick] = useState(0);
  const prevMiss = useRef(fill.missTotal);
  useEffect(() => {
    if (fill.missTotal > prevMiss.current) setMissTick(t => t + 1);
    prevMiss.current = fill.missTotal;
  }, [fill.missTotal]);

  const commit = (next, composing) => {
    const oldKeys = typedKeys(raw);
    const newKeys = typedKeys(next);
    // 지움(자판의 백스페이스가 조합 중 글자를 지운 경우 포함) → 마지막 어절 하나 통째로 되돌리기
    if (newKeys.length < oldKeys.length && newKeys.every((k, i) => k === oldKeys[i])) {
      next = dropLastWord(body, raw);
    } else if (!composing) {
      // 끝까지 채운 뒤 더 친 글자는 버린다(조합 중에 값을 바꾸면 IME 가 꼬여서 조합이 끝난 뒤에)
      const f = fillByInitials(body, next);
      if (f.extra > 0) next = keysToRaw(newKeys.slice(0, newKeys.length - f.extra));
    }
    onChange(next, fillByInitials(body, next));
  };

  // 백스페이스 = 마지막 어절 하나. 조합 중이 아닐 때는 브라우저가 지우기 전에 가로챈다(겹자음 「ㄳ」 한 글자를 통째로 지우지 않게).
  // React 의 onBeforeInput 은 지우기에 안 와서 네이티브 beforeinput 을 단다. PC 는 keydown 으로도(먼저 막으면 beforeinput 은 안 온다)
  const latest = useRef({ body, raw, onChange });
  latest.current = { body, raw, onChange };
  useEffect(() => {
    const el = inputRef.current;
    if (!el || !enabled) return undefined;
    const undo = (e) => {
      if (el.selectionStart !== el.selectionEnd) return;
      e.preventDefault();
      const { body: b, raw: r, onChange: oc } = latest.current;
      const next = dropLastWord(b, r);
      oc(next, fillByInitials(b, next));
    };
    const onBefore = (e) => { if (e.inputType === 'deleteContentBackward' && !e.isComposing) undo(e); };
    const onKey = (e) => { if (e.key === 'Backspace' && !e.isComposing && e.keyCode !== 229) undo(e); };
    el.addEventListener('beforeinput', onBefore);
    el.addEventListener('keydown', onKey);
    return () => { el.removeEventListener('beforeinput', onBefore); el.removeEventListener('keydown', onKey); };
  }, [enabled, inputRef]);

  const inputProps = {
    value: raw,
    onChange: (e) => commit(e.target.value, !!(e.nativeEvent && e.nativeEvent.isComposing)),
    onCompositionEnd: (e) => commit(e.target.value, false),
    autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false, enterKeyHint: 'done',
  };
  return { fill, missTick, inputProps };
};

// label·compact — 제목 칸(#372)은 한 줄짜리로 작게
const InitialInputField = ({ body, value, onChange, disabled, label = '초성 입력', compact = false, emptyText, field = 'body' }) => {
  const inputRef = useRef(null);
  const { fill, missTick, inputProps: ip } = useInitialInput({ body, raw: value || '', onChange, inputRef, enabled: !disabled });

  const left = CHANCES - fill.pendingMisses;
  return (
    <Box>
      <Box
        onClick={() => inputRef.current?.focus()}
        data-initial-view={field}
        sx={{
          minHeight: compact ? 40 : 96, p: compact ? 1 : 1.25, mb: 1, border: '1px solid', borderColor: disabled ? 'divider' : 'primary.light',
          borderRadius: 1, background: disabled ? '#fafafa' : '#fff', whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
          overflowWrap: 'anywhere', lineHeight: 1.75, fontSize: '1rem', cursor: disabled ? 'default' : 'text',
        }}
      >
        {fill.total === 0 && emptyText && (
          <Typography component="span" color="text.disabled" variant="body2">{emptyText}</Typography>
        )}
        {fill.total > 0 && fill.filledCount === 0 && fill.pendingMisses === 0 && !disabled && (
          <Typography component="span" color="text.disabled" variant="body2" sx={{ mr: 0.5 }}>
            {compact ? `${label} — 어절마다 첫 글자.` : '어절마다 첫 글자 — 한글은 초성(ㅌ → 태초에), 영어는 첫 글자.'}{' '}
          </Typography>
        )}
        <InitialFillView body={body} fill={fill} showMissing={disabled} />
        {!disabled && !fill.done && fill.total > 0 && (
          <Box
            component="span"
            key={missTick}
            data-slot
            data-left={left}
            sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle',
              minWidth: 44, height: 24, ml: fill.filledCount ? 0.5 : 0, px: 0.5, border: '1px dashed', borderColor: '#90caf9',
              borderRadius: 1, fontSize: '0.6rem', background: '#fff',
              animation: missTick ? missAnimation : 'none',
            }}
          >
            <Chances left={left} />
          </Box>
        )}
      </Box>
      {!disabled && fill.total > 0 && (
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            inputRef={inputRef}
            label={label}
            size="small"
            fullWidth
            value={ip.value}
            onChange={ip.onChange}
            onCompositionEnd={ip.onCompositionEnd}
            inputProps={{
              autoComplete: ip.autoComplete, autoCorrect: ip.autoCorrect, autoCapitalize: ip.autoCapitalize,
              spellCheck: ip.spellCheck, enterKeyHint: ip.enterKeyHint, 'data-initial-input': field,
              style: { letterSpacing: '0.08em' },
            }}
          />
          <Typography variant="caption" data-initial-count={field} sx={{ whiteSpace: 'nowrap', color: fill.done ? 'success.main' : 'text.secondary', fontWeight: fill.done ? 700 : 400 }}>
            {fill.done ? '끝 ✓' : `${fill.filledCount}어절`}
            {fill.wrongCount > 0 && <span style={{ color: '#d32f2f' }}> · 틀림 {fill.wrongCount}</span>}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default InitialInputField;
