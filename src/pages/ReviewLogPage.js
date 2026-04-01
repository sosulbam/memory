// src/pages/ReviewLogPage.js
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link, CircularProgress, Chip } from '@mui/material';
import { loadDataFromLocal } from '../api/localStorageApi';
import { REVIEW_LOG_KEY } from '../constants';
import { getKSTDateString } from '../utils/dateUtils';

/** entries 배열에서 현재 스트릭과 최장 스트릭을 계산합니다. */
function calculateStreaks(entries) {
  const activeDates = new Set(entries.filter(e => e.count > 0).map(e => e.date));

  // 최장 스트릭
  const sorted = [...activeDates].sort();
  let longest = 0;
  let streak = 0;
  let prevMs = null;
  for (const dateStr of sorted) {
    const ms = new Date(dateStr).getTime();
    if (prevMs !== null && ms - prevMs === 86400000) {
      streak++;
    } else {
      streak = 1;
    }
    longest = Math.max(longest, streak);
    prevMs = ms;
  }

  // 현재 스트릭 (오늘 또는 어제부터 역산)
  const todayStr = getKSTDateString();
  let current = 0;
  const startOffset = activeDates.has(todayStr) ? 0 : 1; // 오늘 복습 없으면 어제부터
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(Date.now() + 9 * 60 * 60 * 1000 - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    if (activeDates.has(dateStr)) {
      current++;
    } else {
      break;
    }
  }

  return { current, longest };
}

function ReviewLogPage() {
  const [logData, setLogData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    const loadLogs = () => {
      setIsLoading(true);
      const storedLogObject = loadDataFromLocal(REVIEW_LOG_KEY);
      const entries = Object.entries(storedLogObject || {})
        .map(([date, data]) => {
          const totalCount = (typeof data === 'object' && data !== null) ? (data.total || 0) : (Number(data) || 0);
          return { date, count: totalCount };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
      setLogData(entries);
      setStreaks(calculateStreaks(entries));
      setIsLoading(false);
    };
    loadLogs();
  }, []);

  const totalCount = logData.reduce((sum, item) => sum + item.count, 0);
  const activeDays = logData.filter(item => item.count > 0).length;

  if (isLoading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center" fontWeight="bold">📅 복습 로그</Typography>

      {/* 요약 카드 */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', flex: '1 1 120px', borderRadius: 2 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">{streaks.current}</Typography>
          <Typography variant="caption" color="text.secondary">🔥 현재 연속</Typography>
          <Typography variant="caption" color="text.secondary" display="block">복습 일수</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', flex: '1 1 120px', borderRadius: 2 }}>
          <Typography variant="h4" fontWeight="bold" color="secondary">{streaks.longest}</Typography>
          <Typography variant="caption" color="text.secondary">🏆 최장 연속</Typography>
          <Typography variant="caption" color="text.secondary" display="block">복습 일수</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', flex: '1 1 120px', borderRadius: 2 }}>
          <Typography variant="h4" fontWeight="bold">{activeDays}</Typography>
          <Typography variant="caption" color="text.secondary">📆 복습한 날</Typography>
          <Typography variant="caption" color="text.secondary" display="block">총 일수</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', flex: '1 1 120px', borderRadius: 2 }}>
          <Typography variant="h4" fontWeight="bold">{totalCount}</Typography>
          <Typography variant="caption" color="text.secondary">📖 총 복습</Typography>
          <Typography variant="caption" color="text.secondary" display="block">횟수</Typography>
        </Paper>
      </Box>

      {logData.length === 0 ? (
        <Typography align="center" color="text.secondary">복습 기록이 아직 없습니다.</Typography>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>날짜</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>복습 횟수</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logData.map((row) => (
                <TableRow key={row.date} sx={{ opacity: row.count === 0 ? 0.4 : 1 }}>
                  <TableCell>
                    {row.date}
                    {row.date === getKSTDateString() && (
                      <Chip label="오늘" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {row.count > 0 ? `${row.count}회` : <Typography variant="caption" color="text.disabled">-</Typography>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box mt={3} textAlign="center">
        <Link component={RouterLink} to="/" variant="button">← 홈으로 돌아가기</Link>
      </Box>
    </Box>
  );
}

export default ReviewLogPage;
