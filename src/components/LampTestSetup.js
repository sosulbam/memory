// src/components/LampTestSetup.js — 등불판 암송 시험 설정 (#400, 개인판 TestSetup 을 옮김)
// 기본판(scripture-memory-sta)은 종전 TestSetup.js 를 그대로 쓴다.
import React, { useState, useMemo } from 'react';
import { Box, Button, FormControl, InputLabel, Select, MenuItem, ListSubheader, Checkbox, ListItemText, TextField, Typography, Paper, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { T } from '../terms';

// 입력 방식 — 기기마다 기억한다(휴대폰은 초성, PC 는 전체 입력처럼 기기별로 다르게 쓰기 쉬워서)
const INPUT_MODE_KEY = 'recitation-test-input-mode';
const loadInputMode = () => {
  try { return localStorage.getItem(INPUT_MODE_KEY) === 'initial' ? 'initial' : 'full'; } catch (e) { return 'full'; }
};

// 세부 범위(작은 분류) 키 — 큰 분류와 작은 분류를 함께 담는다
const SUB_SEP = '\u0001';
const subKey = (cat, sub) => `${cat}${SUB_SEP}${sub}`;
// 「SM::2. DEP 242::1. Assurance of Salvation」 → 「1. Assurance of Salvation」
const subLabel = (sub) => String(sub || '').split('::').pop().trim() || '(없음)';

const LampTestSetup = ({ categories, allVerses, onStartTest }) => {
  const [selectedCategories, setSelectedCategories] = useState(['전체']);
  const [selectedSubs, setSelectedSubs] = useState([]); // 비어 있으면 고른 큰 분류 전체
  const [questionCount, setQuestionCount] = useState(10);
  const [order, setOrder] = useState('random');
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState(loadInputMode);
  const changeInputMode = (_, v) => {
    if (!v) return;
    setInputMode(v);
    try { localStorage.setItem(INPUT_MODE_KEY, v); } catch (e) { /* 저장 못 해도 이번 시험엔 쓴다 */ }
  };

  // 고른 큰 분류별 작은 분류 목록(번호순) — 작은 분류가 둘 이상인 것만
  const subGroups = useMemo(() => {
    if (selectedCategories.includes('전체')) return [];
    return selectedCategories.map(cat => {
      const subs = new Map();
      allVerses.forEach(v => {
        if (v.카테고리 !== cat || v.미암송여부) return;
        const sub = v.소카테고리 || '';
        const cur = subs.get(sub) || { sub, first: Infinity, count: 0 };
        cur.first = Math.min(cur.first, Number(v.번호) || Infinity);
        cur.count += 1;
        subs.set(sub, cur);
      });
      return { cat, subs: [...subs.values()].sort((a, b) => a.first - b.first) };
    }).filter(g => g.subs.length > 1);
  }, [allVerses, selectedCategories]);

  const availableVerses = useMemo(() => {
    const activeVerses = allVerses.filter(v => !v.미암송여부);
    if (selectedCategories.includes('전체')) return activeVerses;
    // 세부 범위를 하나라도 고른 큰 분류는 그 작은 분류만, 안 고른 큰 분류는 전체
    const chosen = new Set(selectedSubs);
    const narrowed = new Set(selectedSubs.map(k => k.split(SUB_SEP)[0]));
    return activeVerses.filter(v => selectedCategories.includes(v.카테고리)
      && (!narrowed.has(v.카테고리) || chosen.has(subKey(v.카테고리, v.소카테고리 || ''))));
  }, [allVerses, selectedCategories, selectedSubs]);

  const handleCategoryChange = (event) => {
    const { target: { value } } = event;
    const newValues = typeof value === 'string' ? value.split(',') : value;
    const next = (newValues[newValues.length - 1] === '전체' || newValues.length === 0)
      ? ['전체']
      : newValues.filter(cat => cat !== '전체');
    setSelectedCategories(next);
    // 빠진 큰 분류의 세부 범위는 함께 지운다
    setSelectedSubs(prev => prev.filter(k => next.includes(k.split(SUB_SEP)[0])));
  };

  const handleSubChange = (event) => {
    const { target: { value } } = event;
    setSelectedSubs((typeof value === 'string' ? value.split(',') : value).filter(Boolean));
  };

  const handleStartClick = () => {
    if (questionCount > availableVerses.length) {
      setError(`고른 범위에서 낼 수 있는 문제는 ${availableVerses.length}개까지입니다.`);
      return;
    }
    if (questionCount <= 0) {
      setError('문제 수는 1개 이상이어야 합니다.');
      return;
    }
    setError('');
    onStartTest({
      categories: selectedCategories,
      subCategories: selectedSubs,
      count: Number(questionCount),
      order,
      inputMode,
      verses: availableVerses,
    });
  };

  const catLabel = `시험 범위 (${T.cat})`;
  const subFieldLabel = `세부 범위 (${T.sub} · 고르지 않으면 전체)`;

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        암송 시험 설정
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>{catLabel}</InputLabel>
        <Select
          multiple
          value={selectedCategories}
          onChange={handleCategoryChange}
          renderValue={(selected) => selected.join(', ')}
          label={catLabel}
        >
          <MenuItem value="전체"><em>전체</em></MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {subGroups.length > 0 && (
        <FormControl fullWidth margin="normal" data-test-subs>
          <InputLabel shrink>{subFieldLabel}</InputLabel>
          <Select
            multiple
            displayEmpty
            value={selectedSubs}
            onChange={handleSubChange}
            label={subFieldLabel}
            notched
            renderValue={(selected) => (selected.length === 0
              ? <span style={{ color: '#757575' }}>전체</span>
              : selected.map(k => subLabel(k.split(SUB_SEP)[1])).join(', '))}
            MenuProps={{ PaperProps: { sx: { maxHeight: 420 } } }}
          >
            {subGroups.flatMap(g => [
              <ListSubheader key={`h-${g.cat}`} sx={{ fontWeight: 'bold', lineHeight: '36px' }}>{g.cat.trim()}</ListSubheader>,
              ...g.subs.map(({ sub, count }) => (
                <MenuItem key={subKey(g.cat, sub)} value={subKey(g.cat, sub)} dense>
                  <Checkbox size="small" checked={selectedSubs.includes(subKey(g.cat, sub))} sx={{ py: 0 }} />
                  <ListItemText primary={subLabel(sub)} secondary={`${count}구절`} primaryTypographyProps={{ sx: { whiteSpace: 'normal' } }} />
                </MenuItem>
              )),
            ])}
          </Select>
        </FormControl>
      )}
      <Box display="flex" gap={2} my={2}>
        <TextField
          label="문항 수"
          type="number"
          value={questionCount}
          onChange={(e) => setQuestionCount(e.target.value)}
          fullWidth
          InputProps={{ inputProps: { min: 1, max: availableVerses.length } }}
        />
        <FormControl fullWidth>
          <InputLabel>순서</InputLabel>
          <Select value={order} label="순서" onChange={(e) => setOrder(e.target.value)}>
            <MenuItem value="sequential">순차</MenuItem>
            <MenuItem value="random">골고루 무작위</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box my={2}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>입력 방식</Typography>
        <ToggleButtonGroup exclusive fullWidth size="small" color="primary" value={inputMode} onChange={changeInputMode}>
          <ToggleButton value="full" sx={{ fontWeight: 600 }}>전체 입력</ToggleButton>
          <ToggleButton value="initial" sx={{ fontWeight: 600 }} data-test-initial>초성 입력</ToggleButton>
        </ToggleButtonGroup>
        {inputMode === 'initial' && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            어절마다 첫 글자 하나만 칩니다 — 한글은 초성(ㅌ → 태초에), 영어는 첫 글자(대소문자 무관). 쌍자음은 홑자음으로 쳐도 됩니다.
            어절마다 기회는 3번, 다 틀리면 빨간 정답으로 채우고 -1입니다. 지우기는 한 어절씩. 제목도 같은 방식으로 칩니다.
          </Typography>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Typography variant="caption" display="block" align="center" sx={{ mb: 2 }} data-test-avail>
        고른 범위의 암송 구절: {availableVerses.length}개
      </Typography>
      <Button variant="contained" size="large" fullWidth onClick={handleStartClick} data-test-make>
        문제 내기
      </Button>
    </Paper>
  );
};

export default LampTestSetup;
