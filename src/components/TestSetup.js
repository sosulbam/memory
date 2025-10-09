// src/components/TestSetup.js
import React, { useState, useMemo } from 'react';
import { Box, Button, FormControl, InputLabel, Select, MenuItem, TextField, Typography, Paper, Alert } from '@mui/material';

const TestSetup = ({ categories, allVerses, onStartTest }) => {
  const [selectedCategories, setSelectedCategories] = useState(['전체']);
  const [questionCount, setQuestionCount] = useState(10);
  const [order, setOrder] = useState('random');
  const [error, setError] = useState('');

  const availableVerses = useMemo(() => {
    const activeVerses = allVerses.filter(v => !v.미암송여부);
    if (selectedCategories.includes('전체')) {
      return activeVerses;
    }
    return activeVerses.filter(v => selectedCategories.includes(v.카테고리));
  }, [allVerses, selectedCategories]);

  const handleCategoryChange = (event) => {
    const { target: { value } } = event;
    const newValues = typeof value === 'string' ? value.split(',') : value;

    if (newValues[newValues.length - 1] === '전체' || newValues.length === 0) {
      setSelectedCategories(['전체']);
    } else {
      setSelectedCategories(newValues.filter(cat => cat !== '전체'));
    }
  };

  const handleStartClick = () => {
    if (questionCount > availableVerses.length) {
      setError(`선택하신 범위의 최대 문제 수는 ${availableVerses.length}개입니다.`);
      return;
    }
    if (questionCount <= 0) {
        setError('문제 수는 1개 이상이어야 합니다.');
        return;
    }
    setError('');
    onStartTest({
      categories: selectedCategories,
      count: Number(questionCount),
      order,
      verses: availableVerses,
    });
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        암송 시험 설정
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>테스트 범위 (카테고리)</InputLabel>
        <Select
          multiple
          value={selectedCategories}
          onChange={handleCategoryChange}
          renderValue={(selected) => selected.join(', ')}
          label="테스트 범위 (카테고리)"
        >
          <MenuItem value="전체"><em>전체</em></MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>
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
            <MenuItem value="random">랜덤</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Typography variant="caption" display="block" align="center" sx={{ mb: 2 }}>
        선택 범위 내 암송 구절: {availableVerses.length}개
      </Typography>
      <Button variant="contained" size="large" fullWidth onClick={handleStartClick}>
        테스트 시작
      </Button>
    </Paper>
  );
};

export default TestSetup;