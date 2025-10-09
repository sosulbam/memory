// src/components/ResetDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';

/**
 * 복습 기록을 초기화하는 다이얼로그 UI 및 로직을 담당하는 컴포넌트입니다.
 */
const ResetDialog = ({ open, onClose, onReset }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>복습 기록 초기화</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>어떤 복습 데이터를 초기화하시겠습니까?</Typography>
        <Box display="flex" flexDirection="column" gap={1} mt={2}>
          <Button onClick={() => { onReset('all'); onClose(); }} color="error">전체 복습 상태 초기화 (통계 기록은 유지)</Button>
          <Button onClick={() => { onReset('all_turns'); onClose(); }} color="warning">차수 복습 초기화 (일반)</Button>
          <Button onClick={() => { onReset('all_turns_new'); onClose(); }} color="warning">차수별 뉴구절 초기화 (1차로)</Button>
          <Button onClick={() => { onReset('all_turns_recent'); onClose(); }} color="warning">차수별 최근구절 초기화 (1차로)</Button>
          <Button onClick={() => { onReset('new'); onClose(); }}>뉴구절복습 초기화</Button>
          <Button onClick={() => { onReset('wrong'); onClose(); }}>오답복습 초기화</Button>
          <Button onClick={() => { onReset('recent'); onClose(); }}>최근구절복습 초기화</Button>
          <Button onClick={() => { onReset('favorite'); onClose(); }}>즐겨찾기 복습 초기화</Button>
          <Button onClick={() => { onReset('category'); onClose(); }}>카테고리별 복습 초기화</Button>
          <Button onClick={() => { onReset('reviewLog'); onClose(); }} color="secondary">📅 복습 통계 기록만 초기화</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResetDialog;