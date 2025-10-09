// src/pages/ReviewLogPage.js
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link, CircularProgress } from '@mui/material';
import { loadDataFromLocal } from '../api/localStorageApi';
import { REVIEW_LOG_KEY } from '../constants';

/**
 * 일자별 복습 기록을 보여주는 페이지 컴포넌트입니다.
 */
function ReviewLogPage() {
  const [logData, setLogData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = () => {
      setIsLoading(true);
      const storedLogObject = loadDataFromLocal(REVIEW_LOG_KEY);
      
      const entries = Object.entries(storedLogObject || {})
        .map(([date, data]) => {
          // data가 숫자일 수도 있고, 객체일 수도 있는 경우를 모두 처리
          const totalCount = (typeof data === 'object' && data !== null) ? (data.total || 0) : (Number(data) || 0);
          return { date, count: totalCount };
        })
        .sort((a, b) => b.date.localeCompare(a.date)); // 최신 날짜순 정렬
      setLogData(entries);
      setIsLoading(false);
    };

    loadLogs();
  }, []);

  const totalCount = logData.reduce((sum, item) => sum + item.count, 0);

  if (isLoading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">📅 복습 로그 확인</Typography>
      <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 3 }}>
        총 복습 횟수: <strong>{totalCount}회</strong>
      </Typography>

      {logData.length === 0 ? (
        <Typography align="center" color="text.secondary">복습 기록이 아직 없습니다.</Typography>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>날짜</TableCell>
                <TableCell align="right">복습 횟수</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logData.map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">{row.count}회</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box mt={4} textAlign="center">
        <Link component={RouterLink} to="/" variant="button">← 홈으로 돌아가기</Link>
      </Box>
    </Box>
  );
}

export default ReviewLogPage;