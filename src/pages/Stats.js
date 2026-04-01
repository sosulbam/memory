// src/pages/Stats.js
import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { FormControl, InputLabel, MenuItem, Select, Typography, Box, Paper, Grid, CircularProgress, Chip } from '@mui/material';
import { loadDataFromLocal } from '../api/localStorageApi';
import { VERSES_DATA_KEY, REVIEW_STATUS_KEY, REVIEW_LOG_KEY } from '../constants';
import { getKSTDateString } from '../utils/dateUtils';

function Stats() {
  const [stats, setStats] = useState({
    totalVerses: 0, favoriteTotal: 0, newTotal: 0, wrongTotal: 0, recentTotal: 0, unmemorizedTotal: 0, memorizedTotal: 0,
    todayStats: { total: 0, general: 0, new: 0, recent: 0, favorite: 0, wrong: 0 },
    dailyReviewCounts: [], memorizationByYear: {}, existingMemorizedCount: 0,
  });
  const [period, setPeriod] = useState(7); // 기본 7일
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStatsData = () => {
      setIsLoading(true);
      const versesArray = loadDataFromLocal(VERSES_DATA_KEY);
      const reviewStatusData = loadDataFromLocal(REVIEW_STATUS_KEY);
      const reviewLogData = loadDataFromLocal(REVIEW_LOG_KEY);

      const enrichedVerses = (versesArray || []).map(v => ({ ...v, ...(reviewStatusData[v.id] || {}) }));
      const memorizationByYear = {};
      let existingMemorizedCount = 0;

      enrichedVerses.forEach(verse => {
        if (verse.암송시작일 && typeof verse.암송시작일 === 'string') {
          const year = verse.암송시작일.split('-')[0].trim();
          if (year) memorizationByYear[year] = (memorizationByYear[year] || 0) + 1;
        } else if (!verse.미암송여부) { existingMemorizedCount++; }
      });

      const totalVerses = enrichedVerses.length;
      const favoriteTotal = enrichedVerses.filter(v => v.즐겨찾기).length;
      const newTotal = enrichedVerses.filter(v => v.뉴구절여부).length;
      const wrongTotal = enrichedVerses.filter(v => v.오답여부).length;
      const recentTotal = enrichedVerses.filter(v => v.최근구절여부).length;
      const unmemorizedTotal = enrichedVerses.filter(v => v.미암송여부).length;
      const memorizedTotal = totalVerses - unmemorizedTotal;

      const todayISO_KST_forLog = getKSTDateString();
      const todayLog = (reviewLogData || {})[todayISO_KST_forLog] || {};
      const todayStats = {
        total: (typeof todayLog === 'object' ? todayLog.total : todayLog) || 0,
        general: todayLog.general || 0, new: todayLog.new || 0, recent: todayLog.recent || 0, favorite: todayLog.favorite || 0, wrong: todayLog.wrong || 0,
      };

      const dailyChartData = [];
      const today = new Date();
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayLog = (reviewLogData || {})[dateKey];
        const count = (typeof dayLog === 'object' ? dayLog.total : dayLog) || 0;
        dailyChartData.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count });
      }

      setStats({
        totalVerses, favoriteTotal, newTotal, wrongTotal, recentTotal, unmemorizedTotal, memorizedTotal,
        todayStats, dailyReviewCounts: dailyChartData, memorizationByYear, existingMemorizedCount,
      });
      setIsLoading(false);
    };
    loadStatsData();
  }, [period]);

  const totalForPeriod = useMemo(() => stats.dailyReviewCounts.reduce((sum, day) => sum + day.count, 0), [stats.dailyReviewCounts]);
  const HighlightedCount = ({ value }) => <Box component="span" sx={{ fontWeight: 'bold', color: value > 0 ? 'error.main' : 'inherit' }}>{value}</Box>;

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /><Typography sx={{ ml: 2 }}>통계 데이터를 불러오는 중...</Typography></Box>;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '1200px', margin: 'auto' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>전체 구절 현황</Typography>
            <Typography>• 총 등록 구절: <strong>{stats.totalVerses}</strong>개</Typography>
            <Typography>• 즐겨찾기: <strong>{stats.favoriteTotal}</strong>개</Typography>
            <Typography>• 뉴구절: <strong>{stats.newTotal}</strong>개</Typography>
            <Typography>• 오답: <strong>{stats.wrongTotal}</strong>개</Typography>
            <Typography>• 최근구절: <strong>{stats.recentTotal}</strong>개</Typography>
            <Typography>• 미암송: <strong>{stats.unmemorizedTotal}</strong>개</Typography>
            <Typography sx={{ fontWeight: 'bold', color: 'error.main' }}>• 암송구절: <strong>{stats.memorizedTotal}</strong>개</Typography>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>신규 암송 현황</Typography>
              <Typography>• 기존 암송 구절: <strong>{stats.existingMemorizedCount}</strong>개</Typography>
              {Object.keys(stats.memorizationByYear || {}).sort((a, b) => b.localeCompare(a)).map(year => (
                <Typography key={year}>• {year}년 신규 암송: <strong>{stats.memorizationByYear[year]}</strong>개</Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>🗓️ 오늘 총 복습</Typography>
            <Typography variant="h3" color="secondary" sx={{ fontWeight: 'bold' }}>{stats.todayStats.total}구절</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>✅ 오늘 복습한 구절 현황</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6} sm={4}><Typography>일반/차수별: <HighlightedCount value={stats.todayStats.general} />회</Typography></Grid>
              <Grid item xs={6} sm={4}><Typography>뉴구절: <HighlightedCount value={stats.todayStats.new} />회</Typography></Grid>
              <Grid item xs={6} sm={4}><Typography>최근구절: <HighlightedCount value={stats.todayStats.recent} />회</Typography></Grid>
              <Grid item xs={6} sm={4}><Typography>즐겨찾기: <HighlightedCount value={stats.todayStats.favorite} />회</Typography></Grid>
              <Grid item xs={6} sm={4}><Typography>오답구절: <HighlightedCount value={stats.todayStats.wrong} />회</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap">
              <Typography variant="h6">📅 일별 복습량 그래프 (총 <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{totalForPeriod}</Box>회)</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>기간</InputLabel>
                <Select value={period} label="기간" onChange={(e) => setPeriod(Number(e.target.value))}>
                  <MenuItem value={7}>7일</MenuItem>
                  <MenuItem value={30}>30일</MenuItem>
                  <MenuItem value={90}>3개월</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyReviewCounts} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" name="복습 횟수"><LabelList dataKey="count" position="top" /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Stats;