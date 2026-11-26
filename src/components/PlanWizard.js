// src/components/PlanWizard.js
// 「새 복습 플랜」 — 앱이 차례로 묻고 버튼으로 답해 복습 모드·범위·일정·순서를 정한 뒤 바로 시작한다.
// 시안: https://claude.ai/artifact/Ee7MASUqggHWvpiDWtxhYH (2026-11-08 사용자 확정)
// 저장은 HomePage.handleStartPlan 이 한다(설정 세터 + 차수 일정). 이 컴포넌트는 고르기만 한다.
// 개인판(verse-app)에서 옮김(#395, 2026-11-26) — 공개판 차이: 위아래 여백은 --sat/--sab, 「카테고리」는 T.cat
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, Box, Typography, IconButton, Button, Chip, TextField, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import {
  PLAN_MODES, ORDER_OPTIONS, UPCOMING_EVENTS, categoryCounts, planInfo,
  toYMD, fromYMD, startOfToday, addDays, daysInclusive, fmtMD,
} from '../utils/reviewPlan';
import { T } from '../terms';

const PER_DAY_OPTIONS = [60, 80, 100, 120];
const HEAVY_PER_DAY = 120; // 이보다 많으면 「하루 2시간 넘게」 안내

const Bot = ({ children }) => (
  <Box sx={{ alignSelf: 'flex-start', maxWidth: '88%', bgcolor: '#eef2f3', color: '#1f2a2c', px: 1.5, py: 1, borderRadius: '14px', borderTopLeftRadius: '4px', fontSize: '0.92rem', lineHeight: 1.5 }}>
    {children}
  </Box>
);
const Me = ({ children, onClick }) => (
  <Box component="button" type="button" onClick={onClick} aria-label={`다시 고르기: ${typeof children === 'string' ? children : ''}`}
    sx={{ alignSelf: 'flex-end', maxWidth: '88%', bgcolor: 'primary.main', color: '#fff', px: 1.5, py: 1, border: 0, borderRadius: '14px', borderTopRightRadius: '4px', fontSize: '0.92rem', lineHeight: 1.5, cursor: 'pointer', textAlign: 'left', font: 'inherit',
      '&::after': { content: '" ✎"', opacity: 0.65, fontSize: '0.75rem' } }}>
    {children}
  </Box>
);
const Hint = ({ children }) => <Typography component="span" sx={{ display: 'block', fontSize: '0.78rem', color: 'text.secondary', mt: 0.25 }}>{children}</Typography>;
const Choices = ({ children }) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, py: 0.25 }}>{children}</Box>;
const Opt = ({ selected, label, sub, ...rest }) => (
  <Chip clickable color="primary" variant={selected ? 'filled' : 'outlined'} size="medium"
    label={<span>{label}{sub != null && <Box component="span" sx={{ ml: 0.5, opacity: 0.7, fontSize: '0.8em' }}>{sub}</Box>}</span>} {...rest} />
);

const PlanWizard = ({ open, onClose, onStart, originalVerses, settings, reason = 'manual' }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const today = useMemo(() => startOfToday(), [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const fresh = () => ({ step: 'mode', mode: null, scope: null, cats: [], end: null, endBy: null, perDay: null, order: settings.order || 'grouped_random' });
  const [s, setS] = useState(fresh);
  useEffect(() => { if (open) setS(fresh()); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const bodyRef = useRef(null);
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [s]);

  const cats = s.scope === 'pick' ? s.cats : ['전체'];
  const info = useMemo(() => (s.mode ? planInfo(originalVerses, settings, s.mode, cats) : null), [originalVerses, settings, s.mode, s.scope, s.cats]); // eslint-disable-line react-hooks/exhaustive-deps
  const modeInfo = useMemo(() => Object.fromEntries(PLAN_MODES.map((m) => [m.value, planInfo(originalVerses, settings, m.value, ['전체'])])), [originalVerses, settings]);
  const catList = useMemo(() => (s.mode ? categoryCounts(originalVerses, s.mode) : []), [originalVerses, s.mode]);

  const meta = PLAN_MODES.find((m) => m.value === s.mode);
  const needsScope = s.mode === 'turnBasedReview' || s.mode === 'category';
  const needsDate = s.mode === 'turnBasedReview';
  const steps = ['mode', ...(needsScope ? ['scope'] : []), ...(needsDate ? ['date'] : []), 'order'];
  const days = s.end ? daysInclusive(today, s.end) : 0;
  const perDay = s.end && info ? Math.round(info.count / days) : 0;
  const turnLabel = info && info.turn ? `${info.turn}차` : '';

  const next = (patch = {}) => setS((prev) => {
    const merged = { ...prev, ...patch };
    const mode = merged.mode;
    const st = ['mode', ...((mode === 'turnBasedReview' || mode === 'category') ? ['scope'] : []), ...(mode === 'turnBasedReview' ? ['date'] : []), 'order'];
    const i = st.indexOf(prev.step);
    return { ...merged, step: i >= 0 && i + 1 < st.length ? st[i + 1] : 'summary' };
  });

  const intro = reason === 'turnDone'
    ? `🎉 ${settings.targetTurn || 1}차 복습을 모두 마쳤어요. 다음 플랜을 세워 볼게요.`
    : reason === 'overdue'
      ? `${settings.targetTurn || 1}차 마감이 지났어요. 새 플랜을 세워 볼게요.`
      : '새 복습 플랜을 세워 볼게요.';

  const question = (step) => {
    if (step === 'mode') return '무엇을 복습할까요?';
    if (step === 'scope') return s.mode === 'category' ? `어느 ${T.cat}를 복습할까요?` : <>{meta.label} {turnLabel} — 범위는요?<Hint>지금 암송 중인 구절 기준</Hint></>;
    if (step === 'date') return <>{info.count.toLocaleString()}구절을 언제까지 마칠까요?<Hint>시작은 오늘({fmtMD(today)})</Hint></>;
    if (step === 'order') return '어떤 순서로 볼까요?';
    return '';
  };
  const answer = (step) => {
    if (step === 'mode') return info && info.turn ? `${meta.label} (${info.turn}차)` : meta.label;
    if (step === 'scope') return s.scope === 'pick' ? `${s.cats.join(', ')} · ${info.count.toLocaleString()}구절` : `전체 ${info.count.toLocaleString()}구절`;
    if (step === 'date') return `${fmtMD(s.end)}까지 · 하루 약 ${perDay}구절`;
    if (step === 'order') return ORDER_OPTIONS.find((o) => o.value === s.order)?.label || s.order;
    return '';
  };

  const controls = (step) => {
    if (step === 'mode') return (
      <Choices>
        {PLAN_MODES.map((m) => {
          const n = modeInfo[m.value]?.count || 0;
          return <Opt key={m.value} label={m.label} sub={n ? n.toLocaleString() : '없음'} disabled={!n} selected={s.mode === m.value}
            onClick={() => next({ mode: m.value, scope: (m.value === 'turnBasedNew' || m.value === 'turnBasedRecent' || m.value === 'wrong') ? 'all' : null, cats: [], end: null, endBy: null, perDay: null })} />;
        })}
      </Choices>
    );
    if (step === 'scope') return (
      <>
        <Choices>
          <Opt label="전체" sub={planInfo(originalVerses, settings, s.mode, ['전체']).count.toLocaleString()} selected={s.scope === 'all'} onClick={() => next({ scope: 'all', cats: [] })} />
          <Opt label={`${T.cat} 고르기`} selected={s.scope === 'pick'} onClick={() => setS((p) => ({ ...p, scope: 'pick' }))} />
        </Choices>
        {s.scope === 'pick' && (
          <>
            <Choices>
              {catList.map(([c, n]) => (
                <Opt key={c} label={c} sub={n} selected={s.cats.includes(c)}
                  onClick={() => setS((p) => ({ ...p, cats: p.cats.includes(c) ? p.cats.filter((x) => x !== c) : [...p.cats, c] }))} />
              ))}
            </Choices>
            <Typography sx={{ fontSize: '0.85rem', color: s.cats.length ? 'primary.main' : 'text.secondary', fontWeight: 600 }}>{s.cats.length ? `선택 ${s.cats.length}개 · ${info.count.toLocaleString()}구절` : `복습할 ${T.cat}를 골라 주세요`}</Typography>
            <Choices><Opt label="다음 →" selected disabled={!s.cats.length || !info.count} onClick={() => next()} /></Choices>
          </>
        )}
      </>
    );
    if (step === 'date') {
      const events = UPCOMING_EVENTS.map((e) => ({ ...e, day: fromYMD(e.date) })).filter((e) => addDays(e.day, -1) > today);
      const quick = [
        ...events.map((e) => { const eve = addDays(e.day, -1); return { label: `${e.label} 전날 ${eve.getMonth() + 1}/${eve.getDate()}`, end: eve }; }),
        { label: '1주', end: addDays(today, 6) }, { label: '2주', end: addDays(today, 13) }, { label: '한 달', end: addDays(today, 29) },
      ];
      const pick = (end) => setS((p) => ({ ...p, end, endBy: 'end', perDay: null }));
      return (
        <>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>마감일로 정하기</Typography>
          <Choices>
            {quick.map((q) => <Opt key={q.label} label={q.label} selected={s.endBy === 'end' && s.end && +s.end === +q.end} onClick={() => pick(q.end)} />)}
            <TextField type="date" size="small" inputProps={{ min: toYMD(addDays(today, 1)), 'aria-label': '마감일 직접 고르기' }}
              value={s.end && s.endBy === 'end' ? toYMD(s.end) : ''} onChange={(e) => e.target.value && pick(fromYMD(e.target.value))} sx={{ width: 160 }} />
          </Choices>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>하루 분량으로 정하기</Typography>
          <Choices>
            {PER_DAY_OPTIONS.map((n) => {
              const end = addDays(today, Math.max(1, Math.ceil(info.count / n)) - 1);
              return <Opt key={n} label={`하루 ${n}구절`} sub={`→ ${end.getMonth() + 1}/${end.getDate()}`} selected={s.endBy === 'per' && s.perDay === n}
                onClick={() => setS((p) => ({ ...p, end, endBy: 'per', perDay: n }))} />;
            })}
          </Choices>
          {s.end && (
            <>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: perDay > HEAVY_PER_DAY ? 'warning.dark' : 'primary.main' }}>
                {fmtMD(today)} ~ {fmtMD(s.end)} ({days}일) · 하루 약 {perDay}구절{perDay > HEAVY_PER_DAY ? ' — 하루 2시간 넘게 걸릴 수 있어요' : ''}
              </Typography>
              <Choices><Opt label="이대로 →" selected onClick={() => next()} /></Choices>
            </>
          )}
        </>
      );
    }
    if (step === 'order') return (
      <Choices>
        {ORDER_OPTIONS.map((o) => <Opt key={o.value} label={o.label} sub={o.value === settings.order ? '지금 설정' : null} selected={s.order === o.value} onClick={() => next({ order: o.value })} />)}
      </Choices>
    );
    return null;
  };

  const start = () => onStart({
    mode: s.mode,
    cats: s.scope === 'pick' && s.cats.length ? s.cats : ['전체'],
    order: s.order,
    turn: info.turn,
    startDate: needsDate ? toYMD(today) : null,
    endDate: needsDate ? toYMD(s.end) : null,
  });

  const current = s.step === 'summary' ? steps.length : steps.indexOf(s.step);

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm"
      PaperProps={{ sx: { boxSizing: 'border-box', pt: fullScreen ? 'var(--sat)' : 0, pb: fullScreen ? 'var(--sab)' : 0, bgcolor: '#f6f7f7', height: fullScreen ? '100%' : '80vh' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, height: 52, flexShrink: 0, bgcolor: '#fff', borderBottom: '1px solid #e3e7e8' }}>
        <IconButton onClick={onClose} aria-label="닫기"><CloseIcon /></IconButton>
        <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 700, mr: 5 }}>새 복습 플랜</Typography>
      </Box>
      <Box ref={bodyRef} data-testid="plan-wizard" sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Bot>{intro}</Bot>
        {steps.slice(0, current + 1).map((step, i) => (
          <React.Fragment key={step}>
            {(i < current || s.step === 'summary') ? (
              <>
                <Bot>{question(step)}</Bot>
                <Me onClick={() => setS((p) => ({ ...p, step }))}>{answer(step)}</Me>
              </>
            ) : (
              <>
                <Bot>{question(step)}</Bot>
                {controls(step)}
              </>
            )}
          </React.Fragment>
        ))}
        {s.step === 'summary' && info && (
          <>
            <Bot>이렇게 시작할게요.</Bot>
            <Box data-testid="plan-summary" sx={{ bgcolor: '#fff', border: '1.5px solid', borderColor: 'primary.main', borderRadius: '12px', p: 1.5, display: 'grid', gap: 0.75, fontSize: '0.92rem' }}>
              <Typography sx={{ fontWeight: 700 }}>새 복습 플랜</Typography>
              <Box sx={{ fontWeight: 700 }}>{meta.label}{turnLabel && ` · ${turnLabel}`}</Box>
              <Box>{s.scope === 'pick' ? `${s.cats.join(', ')} · ` : (needsScope ? '전체 ' : '')}{info.count.toLocaleString()}구절</Box>
              {needsDate && <Box>{fmtMD(today)} ~ {fmtMD(s.end)} ({days}일) · 하루 약 {perDay}구절</Box>}
              {info.carried > 0 && <Box sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{info.turn - 1}차에서 남은 {info.carried}구절도 함께 들어가요</Box>}
              <Box>순서: {ORDER_OPTIONS.find((o) => o.value === s.order)?.label || s.order}</Box>
              {(s.mode === 'turnBasedNew' || s.mode === 'turnBasedRecent') && <Box sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>다 돌면 다음 차수로 자동으로 넘어가요</Box>}
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Button variant="contained" sx={{ flex: 1 }} onClick={start}>시작하기</Button>
                <Button variant="outlined" onClick={() => setS(fresh())}>처음부터</Button>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default PlanWizard;
