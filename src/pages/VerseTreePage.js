// src/pages/VerseTreePage.js
// 암송 중인 모든 구절의 구조를 트리 형태로 한눈에 보는 페이지 + 트리 복습 모드.
// 복습 모드: 차수별(복습/뉴/최근) 대상 구절만 시리즈 구조로 조망하며 복습.
//  - 대카테고리 → 소카테고리 → 제목·장절 → 본문 아코디언
//  - 완료 표시(숨김/회색), 오늘 분량/전체, 오늘 분량 진행률, PC 단축키, 상단 고정
// ⚠️ 공개판: 서버 의존 도구(감사저장·메모·AI주석·다른번역)는 제외하고,
//    로컬 전용 ActionBar(뉴/오답/최근/즐겨찾기/미암송/태그/복사)만 인라인 제공.
import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Container, Paper, Collapse, Chip, Button, Divider, Stack,
  ToggleButton, ToggleButtonGroup, LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { DataContext } from '../contexts/DataContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
  TURN_BASED_MODES, getTurnTargetLabel, buildTreeReviewData,
} from '../utils/reviewScope';
import { buildReviewUpdates, writeReviewLog } from '../utils/reviewActions';
import ActionBar from '../components/ActionBar';
import TagDialog from '../components/TagDialog';
import { loadDataFromLocal, saveDataToLocal } from '../api/localStorageApi';
import { VERSETREE_PREFS_KEY } from '../constants';

// 대카테고리마다 돌아가며 부여하는 은은한 색 팔레트 (좌측 악센트 바 & 칩)
const PALETTE = [
  '#5C6BC0', '#26A69A', '#EC407A', '#FFA726',
  '#7E57C2', '#42A5F5', '#66BB6A', '#EF5350',
];

const SUB_FALLBACK = '기타';

const VerseTreePage = () => {
  const { originalVerses, updateVerseStatus, turnScheduleData, tagsData, updateTags } = useContext(DataContext);
  const { settings } = useAppSettings();
  const { showSnackbar } = useSnackbar();

  // 저장된 트리 복습 설정 불러오기 (완료 표시 방식·분량·모드 유지)
  const savedPrefs = useMemo(() => loadDataFromLocal(VERSETREE_PREFS_KEY) || {}, []);

  // 복습 모드 on/off + 트리 로컬 모드(홈 설정은 건드리지 않음)
  const [reviewMode, setReviewMode] = useState(false);
  const [treeMode, setTreeMode] = useState(() => {
    if (['turnBasedReview', 'turnBasedNew', 'turnBasedRecent'].includes(savedPrefs.treeMode)) {
      return savedPrefs.treeMode;
    }
    return ['turnBasedReview', 'turnBasedNew', 'turnBasedRecent'].includes(settings.mode)
      ? settings.mode
      : 'turnBasedReview';
  });
  // 완료 구절 표시 방식: 'hide'(숨김) / 'gray'(회색으로 남김) — 기본 회색
  const [completedDisplay, setCompletedDisplay] = useState(
    savedPrefs.completedDisplay === 'hide' ? 'hide' : 'gray'
  );
  // 차수별 복습에서 오늘 날짜 분량만 볼지 여부
  const [dailyLimit, setDailyLimit] = useState(
    savedPrefs.dailyLimit !== undefined ? savedPrefs.dailyLimit : true
  );
  // 태그 다이얼로그 대상 구절
  const [tagVerse, setTagVerse] = useState(null);

  // 설정 변경 시 저장 (다음 방문에도 유지)
  useEffect(() => {
    saveDataToLocal(VERSETREE_PREFS_KEY, { completedDisplay, dailyLimit, treeMode });
  }, [completedDisplay, dailyLimit, treeMode]);

  // 복습 모드에서 실제 노출할 구절/카운트 (옵션 반영)
  const reviewData = useMemo(
    () => buildTreeReviewData(
      originalVerses, treeMode, settings, turnScheduleData, { dailyLimit, completedDisplay }
    ),
    [originalVerses, treeMode, settings, turnScheduleData, dailyLimit, completedDisplay]
  );

  // 차수별 복습이고 스케줄이 있어 오늘 분량 개념이 성립하는지
  const hasDailyGoal = treeMode === 'turnBasedReview' && reviewData.goal !== null;

  // 오늘 분량 진행률: 오늘 완료 / (오늘 완료 + 남은 목표)
  const dailyDone = reviewData.doneTodayCount;
  const dailyTotal = hasDailyGoal ? dailyDone + reviewData.goal : 0;
  const dailyPct = dailyTotal > 0 ? Math.round((dailyDone / dailyTotal) * 100) : 0;

  // 복습 모드면 옵션 반영된 목록, 아니면 전체 구절을 트리 소스로 사용
  const sourceVerses = reviewMode ? reviewData.verses : originalVerses;

  // 대카테고리 → 소카테고리 → 구절[] 로 그룹화 (번호 순서 유지)
  const tree = useMemo(() => {
    const verses = [...(sourceVerses || [])].sort(
      (a, b) => (a.번호 || 0) - (b.번호 || 0)
    );
    const catOrder = [];
    const catMap = new Map();
    verses.forEach((v) => {
      const cat = v.카테고리 || SUB_FALLBACK;
      const sub = v.소카테고리 || SUB_FALLBACK;
      if (!catMap.has(cat)) {
        catMap.set(cat, { name: cat, subOrder: [], subMap: new Map(), count: 0 });
        catOrder.push(cat);
      }
      const catNode = catMap.get(cat);
      catNode.count += 1;
      if (!catNode.subMap.has(sub)) {
        catNode.subMap.set(sub, { name: sub, verses: [] });
        catNode.subOrder.push(sub);
      }
      catNode.subMap.get(sub).verses.push(v);
    });
    return catOrder.map((cat) => {
      const c = catMap.get(cat);
      return {
        name: c.name,
        count: c.count,
        subs: c.subOrder.map((s) => c.subMap.get(s)),
      };
    });
  }, [sourceVerses]);

  const totalVerses = useMemo(
    () => tree.reduce((sum, c) => sum + c.count, 0),
    [tree]
  );

  const [openCats, setOpenCats] = useState(() => new Set());
  const [openSubs, setOpenSubs] = useState(() => new Set());
  const [openVerses, setOpenVerses] = useState(() => new Set());

  const toggle = useCallback((setter, key) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const cats = new Set();
    const subs = new Set();
    tree.forEach((c) => {
      cats.add(c.name);
      c.subs.forEach((s) => subs.add(`${c.name}|||${s.name}`));
    });
    setOpenCats(cats);
    setOpenSubs(subs);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setOpenCats(new Set());
    setOpenSubs(new Set());
    setOpenVerses(new Set());
  }, []);

  // 구절 목록을 받아 대/소카테고리를 모두 펼친 상태로 세팅 (복습 모드 진입 시 바로 조망)
  const applyExpand = useCallback((verses) => {
    const cats = new Set();
    const subs = new Set();
    (verses || []).forEach((v) => {
      const cat = v.카테고리 || SUB_FALLBACK;
      const sub = v.소카테고리 || SUB_FALLBACK;
      cats.add(cat);
      subs.add(`${cat}|||${sub}`);
    });
    setOpenCats(cats);
    setOpenSubs(subs);
    setOpenVerses(new Set());
  }, []);

  const toggleReviewMode = useCallback(() => {
    setReviewMode((prev) => {
      const next = !prev;
      if (next) applyExpand(reviewData.verses);
      else collapseAll();
      return next;
    });
  }, [collapseAll, applyExpand, reviewData.verses]);

  const handleTreeModeChange = useCallback((_e, newMode) => {
    if (newMode !== null && newMode !== treeMode) {
      setTreeMode(newMode);
      const next = buildTreeReviewData(
        originalVerses, newMode, settings, turnScheduleData, { dailyLimit, completedDisplay }
      );
      applyExpand(next.verses);
    }
  }, [treeMode, applyExpand, originalVerses, settings, turnScheduleData, dailyLimit, completedDisplay]);

  // 구절 상태 토글(뉴구절/오답/최근/즐겨찾기/미암송) — 홈과 동일하게 즉시 반영
  const handleStatusToggle = useCallback((verse, field) => {
    updateVerseStatus(verse.id, { [field]: !verse[field] });
  }, [updateVerseStatus]);

  // 구절 복사
  const handleCopy = useCallback((verse) => {
    const textToCopy = `${verse.장절}\n${verse.본문}`;
    navigator.clipboard.writeText(textToCopy).then(() => showSnackbar('구절이 복사되었습니다.', 'info'));
  }, [showSnackbar]);

  // 트리에서의 "복습 완료" — 홈과 동일하게 차수 상태 갱신 + 복습 로그 기록
  const handleComplete = useCallback((verse) => {
    const updates = buildReviewUpdates(verse, treeMode, settings);
    updateVerseStatus(verse.id, updates);
    writeReviewLog(treeMode);
    setOpenVerses((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(verse.id);
      return nextSet;
    });
    showSnackbar(
      `'${verse.제목}' ${getTurnTargetLabel(treeMode, settings)} 복습 완료`,
      'success'
    );
  }, [treeMode, settings, updateVerseStatus, showSnackbar]);

  const currentModeLabel =
    TURN_BASED_MODES.find((m) => m.value === treeMode)?.label || '';

  // 키보드 단축키 대상 = 아직 완료하지 않은 '가장 위' 구절 (트리 표시 순서 기준)
  const targetInfo = useMemo(() => {
    if (!reviewMode) return null;
    for (const cat of tree) {
      for (const sub of cat.subs) {
        for (const v of sub.verses) {
          if (!v._completed) {
            return { verse: v, catName: cat.name, subKey: `${cat.name}|||${sub.name}` };
          }
        }
      }
    }
    return null;
  }, [reviewMode, tree]);
  const targetVerseId = targetInfo?.verse.id;

  // PC 단축키: Space/./s = 대상 구절 본문 열기, Enter = 대상 구절 복습 완료
  useEffect(() => {
    if (!reviewMode) return;
    const handler = (e) => {
      const ae = document.activeElement;
      const tag = ae?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae?.isContentEditable) return;
      if (document.querySelector('.MuiDialog-container')) return; // 다이얼로그 열림 시 무시
      if (!targetInfo) return;
      const { verse, catName, subKey } = targetInfo;
      if (e.key === ' ' || e.key === '.' || e.key === 's') {
        e.preventDefault();
        setOpenCats((prev) => (prev.has(catName) ? prev : new Set(prev).add(catName)));
        setOpenSubs((prev) => (prev.has(subKey) ? prev : new Set(prev).add(subKey)));
        toggle(setOpenVerses, verse.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleComplete(verse);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reviewMode, targetInfo, toggle, handleComplete]);

  // 데이터 자체가 없을 때만 전체 빈 화면 (복습 모드에서 대상이 없는 경우는 본문에서 안내)
  if (!originalVerses || !originalVerses.length) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <AccountTreeIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">암송 중인 구절이 없습니다.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3, px: { xs: 1.5, sm: 3 } }}>
      {/* 상단 컨트롤을 앱 헤더 아래에 고정 — 복습 중 스크롤해도 프로그레스바·항목 유지 */}
      <Box
        sx={{
          position: 'sticky',
          top: 57,
          zIndex: 900,
          backgroundColor: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(8px)',
          mx: { xs: -1.5, sm: -3 },
          px: { xs: 1.5, sm: 3 },
          pt: 1.5,
          pb: 1,
          mb: 1.5,
          borderBottom: reviewMode ? '1px solid rgba(0,0,0,0.08)' : 'none',
        }}
      >
      {/* 복습 모드 토글 */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: reviewMode ? 1 : 0 }}
      >
        <Typography variant="body2" color="text.secondary">
          {reviewMode ? (
            <>
              <b style={{ color: '#5C6BC0' }}>{currentModeLabel} {getTurnTargetLabel(treeMode, settings)}</b>
              {' · '}남은 <b>{reviewData.remainingCount}</b> · 완료 <b>{reviewData.completedCount}</b>
              {hasDailyGoal && dailyLimit && (
                <>{' · '}오늘 <b style={{ color: '#EC407A' }}>{reviewData.activeCount}</b>개</>
              )}
            </>
          ) : (
            <><b>{tree.length}</b>개 시리즈 · 총 <b>{totalVerses}</b>구절</>
          )}
        </Typography>
        <Button
          size="small"
          variant={reviewMode ? 'contained' : 'outlined'}
          color="primary"
          startIcon={reviewMode ? <CheckCircleIcon /> : <SchoolIcon />}
          onClick={toggleReviewMode}
        >
          {reviewMode ? '복습 모드 끄기' : '복습 모드'}
        </Button>
      </Stack>

      {/* 복습 모드일 때: 차수별 모드 선택 (복습구절 / 뉴구절 / 최근구절) */}
      {reviewMode && (
        <ToggleButtonGroup
          value={treeMode}
          exclusive
          onChange={handleTreeModeChange}
          fullWidth
          size="small"
          sx={{ mb: 1 }}
        >
          {TURN_BASED_MODES.map((m) => (
            <ToggleButton key={m.value} value={m.value}>
              {m.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      {/* 복습 모드 옵션: 완료 표시 방식 + 오늘 분량 */}
      {reviewMode && (
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={1.5}
          sx={{ mb: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography variant="caption" color="text.secondary">완료 표시</Typography>
            <ToggleButtonGroup
              value={completedDisplay}
              exclusive
              size="small"
              onChange={(_e, val) => { if (val !== null) setCompletedDisplay(val); }}
            >
              <ToggleButton value="hide" sx={{ px: 1.5, py: 0.4 }}>숨김</ToggleButton>
              <ToggleButton value="gray" sx={{ px: 1.5, py: 0.4 }}>회색</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {hasDailyGoal && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography variant="caption" color="text.secondary">분량</Typography>
              <ToggleButtonGroup
                value={dailyLimit ? 'today' : 'all'}
                exclusive
                size="small"
                onChange={(_e, val) => { if (val !== null) setDailyLimit(val === 'today'); }}
              >
                <ToggleButton value="today" sx={{ px: 1.5, py: 0.4 }}>오늘 분량</ToggleButton>
                <ToggleButton value="all" sx={{ px: 1.5, py: 0.4 }}>전체</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          )}
        </Stack>
      )}

      {/* 오늘 분량 진행률 프로그레스바 */}
      {reviewMode && hasDailyGoal && dailyTotal > 0 && (
        <Box sx={{ mb: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: dailyPct >= 100 ? '#66BB6A' : '#EC407A' }}>
              {dailyPct >= 100 ? '🎉 오늘 분량 완료!' : '오늘 분량 진행률'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dailyDone} / {dailyTotal}개 · {dailyPct}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, dailyPct)}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                backgroundColor: dailyPct >= 100 ? '#66BB6A' : '#EC407A',
              },
            }}
          />
        </Box>
      )}

      {/* PC 단축키 안내 */}
      {reviewMode && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: 'block' }, mb: 1 }}
        >
          ⌨️ PC 단축키 · <b>Space</b>/<b>.</b>/<b>s</b> 본문 보기 · <b>Enter</b> 복습 완료
          (표시된 <span style={{ color: '#5C6BC0' }}>맨 위 구절</span>부터 하나씩)
        </Typography>
      )}
      </Box>
      {/* 고정 컨트롤 끝 */}

      {/* 전체 펼치기/접기 */}
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mb: 2 }}>
        <Button size="small" startIcon={<UnfoldMoreIcon />} onClick={expandAll}>
          모두 펼치기
        </Button>
        <Button size="small" startIcon={<UnfoldLessIcon />} onClick={collapseAll}>
          모두 접기
        </Button>
      </Stack>

      {/* 복습 모드에서 대상 구절이 없을 때 */}
      {reviewMode && !tree.length && (
        <Paper
          elevation={0}
          sx={{
            py: 6, textAlign: 'center', borderRadius: 2.5,
            border: '1px dashed rgba(0,0,0,0.12)',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
          {hasDailyGoal && dailyLimit && reviewData.remainingCount > 0 ? (
            <Typography color="text.secondary">
              오늘 예정된 분량을 모두 마쳤습니다. (남은 {reviewData.remainingCount}구절은 '전체'에서 확인)
            </Typography>
          ) : (
            <Typography color="text.secondary">
              {currentModeLabel} {getTurnTargetLabel(treeMode, settings)} 복습을 모두 마쳤습니다.
            </Typography>
          )}
        </Paper>
      )}

      <Stack spacing={1.5}>
        {tree.map((cat, i) => {
          const color = PALETTE[i % PALETTE.length];
          const catOpen = openCats.has(cat.name);
          return (
            <Paper
              key={cat.name}
              elevation={0}
              sx={{
                borderRadius: 2.5,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'rgba(0,0,0,0.08)',
                borderLeft: `4px solid ${color}`,
                transition: 'box-shadow .2s',
                boxShadow: catOpen ? '0 4px 16px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {/* 대카테고리 헤더 */}
              <Box
                onClick={() => toggle(setOpenCats, cat.name)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1.75,
                  cursor: 'pointer',
                  userSelect: 'none',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                }}
              >
                <ExpandMoreIcon
                  sx={{
                    color,
                    transition: 'transform .2s',
                    transform: catOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  }}
                />
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', flexGrow: 1 }}>
                  {cat.name}
                </Typography>
                <Chip
                  label={`${cat.count}`}
                  size="small"
                  sx={{
                    bgcolor: `${color}1A`,
                    color,
                    fontWeight: 700,
                    height: 22,
                  }}
                />
              </Box>

              {/* 소카테고리 목록 */}
              <Collapse in={catOpen} timeout="auto" unmountOnExit>
                <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5 }}>
                  {cat.subs.map((sub) => {
                    const subKey = `${cat.name}|||${sub.name}`;
                    const subOpen = openSubs.has(subKey);
                    return (
                      <Box key={subKey} sx={{ mb: 0.5 }}>
                        <Box
                          onClick={() => toggle(setOpenSubs, subKey)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.5,
                            py: 1.1,
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.03)' },
                          }}
                        >
                          {subOpen ? (
                            <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          ) : (
                            <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          )}
                          <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                            {sub.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sub.verses.length}구절
                          </Typography>
                        </Box>

                        {/* 제목 · 장절 목록 */}
                        <Collapse in={subOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ pl: 3.5, pr: 0.5, pt: 0.5 }}>
                            {sub.verses.map((v) => {
                              const vOpen = openVerses.has(v.id);
                              const done = !!v._completed;
                              const isTarget = reviewMode && v.id === targetVerseId;
                              return (
                                <Box key={v.id} sx={{ opacity: done ? 0.5 : 1 }}>
                                  <Box
                                    onClick={() => toggle(setOpenVerses, v.id)}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      py: 0.9,
                                      px: isTarget ? 1 : 0,
                                      mx: isTarget ? -1 : 0,
                                      borderRadius: 1.5,
                                      backgroundColor: isTarget ? `${color}18` : 'transparent',
                                      boxShadow: isTarget ? `inset 3px 0 0 ${color}` : 'none',
                                      cursor: 'pointer',
                                      userSelect: 'none',
                                      borderBottom: '1px dashed rgba(0,0,0,0.06)',
                                      '&:hover .verse-title': { color: done ? undefined : color },
                                    }}
                                  >
                                    {done ? (
                                      <TaskAltIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                    ) : (
                                      <MenuBookIcon
                                        sx={{
                                          fontSize: 16,
                                          color: vOpen ? color : 'text.disabled',
                                        }}
                                      />
                                    )}
                                    <Typography
                                      className="verse-title"
                                      sx={{
                                        fontWeight: 500,
                                        fontSize: '0.95rem',
                                        transition: 'color .15s',
                                        textDecoration: done ? 'line-through' : 'none',
                                      }}
                                    >
                                      {v.제목}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ ml: 'auto', color: 'text.secondary', flexShrink: 0 }}
                                    >
                                      {v.장절}
                                    </Typography>
                                  </Box>

                                  {/* 본문 카드 (아코디언) */}
                                  <Collapse in={vOpen} timeout="auto" unmountOnExit>
                                    <Paper
                                      elevation={0}
                                      sx={{
                                        my: 1,
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: `${color}0D`,
                                        border: `1px solid ${color}33`,
                                      }}
                                    >
                                      <Typography
                                        sx={{ fontWeight: 700, color, fontSize: '0.9rem', mb: 0.25 }}
                                      >
                                        {v.제목}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                                      >
                                        {v.장절}
                                      </Typography>
                                      <Divider sx={{ my: 1, borderColor: `${color}33` }} />
                                      <Typography
                                        sx={{
                                          lineHeight: 1.8,
                                          whiteSpace: 'pre-line',
                                          wordBreak: 'keep-all',
                                          color: 'text.primary',
                                        }}
                                      >
                                        {v.본문}
                                      </Typography>
                                      <Typography
                                        align="right"
                                        sx={{ mt: 1.25, color, fontWeight: 700, fontSize: '0.85rem' }}
                                      >
                                        {v.장절}
                                      </Typography>

                                      {/* 구절 처리 툴(뉴/오답/최근/즐겨찾기/미암송/태그/복사) */}
                                      <Divider sx={{ my: 1, borderColor: `${color}33` }} />
                                      <ActionBar
                                        verse={v}
                                        onStatusToggle={(field) => handleStatusToggle(v, field)}
                                        onTagDialogOpen={() => setTagVerse(v)}
                                        onCopy={() => handleCopy(v)}
                                      />

                                      {reviewMode && !done && (
                                        <Button
                                          fullWidth
                                          variant="contained"
                                          startIcon={<CheckCircleIcon />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleComplete(v);
                                          }}
                                          sx={{
                                            mt: 1,
                                            bgcolor: color,
                                            '&:hover': { bgcolor: color, filter: 'brightness(0.92)' },
                                          }}
                                        >
                                          {getTurnTargetLabel(treeMode, settings)} 복습 완료
                                        </Button>
                                      )}
                                    </Paper>
                                  </Collapse>
                                </Box>
                              );
                            })}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>

      {/* 태그 편집 다이얼로그 (페이지 단위 1개) */}
      <TagDialog
        open={!!tagVerse}
        onClose={() => setTagVerse(null)}
        verse={tagVerse}
        tags={tagsData}
        onSaveTags={updateTags}
      />
    </Container>
  );
};

export default VerseTreePage;
