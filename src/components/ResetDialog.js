// src/components/ResetDialog.js
import React, { useState } from 'react';
import { IS_LAMP } from '../edition';
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
// 등불판: 고를 것 셋 + 무엇이 지워지는지 한 줄 + 확인 단계(N10)
const LAMP_CHOICES = [
  { key: 'turns', title: '차수를 1차부터 다시', desc: '차수별 복습·새 구절·최근 구절의 차수 기록을 지우고 1차로 돌아갑니다. 구절과 오답·즐겨찾기 표시, 날마다의 통계는 남습니다.', types: ['all_turns_every'] },
  { key: 'all', title: '모든 복습 기록 지우기', desc: '차수와 완료 표시를 모두 지웁니다. 구절과 태그, 날마다의 통계는 남습니다.', types: ['all'] },
  { key: 'log', title: '날마다의 통계만 지우기', desc: '통계 화면의 날짜별 복습 수를 지웁니다. 구절과 차수 기록은 남습니다.', types: ['reviewLog'] },
];

const LampResetDialog = ({ open, onClose, onReset }) => {
  const [picked, setPicked] = useState(null);
  const close = () => { setPicked(null); onClose(); };
  const choice = LAMP_CHOICES.find(c => c.key === picked);
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>{choice ? choice.title : '복습 기록 초기화'}</DialogTitle>
      <DialogContent>
        {!choice ? (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {LAMP_CHOICES.map(c => (
              <Box key={c.key} component="button" type="button" onClick={() => setPicked(c.key)}
                sx={{ textAlign: 'left', font: 'inherit', cursor: 'pointer', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, '&:hover': { borderColor: 'text.primary' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'text.primary' } }}>
                <Typography sx={{ fontWeight: 700 }}>{c.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{c.desc}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography>{choice.desc} 되돌릴 수 없습니다. 지울까요?</Typography>
        )}
      </DialogContent>
      <DialogActions>
        {choice ? (
          <>
            <Button onClick={() => setPicked(null)}>뒤로</Button>
            <Button color="error" variant="contained" onClick={() => { choice.types.forEach(t => onReset(t, { skipConfirm: true, skipLog: t !== 'reviewLog' })); close(); }}>지우기</Button>
          </>
        ) : (
          <Button onClick={close}>닫기</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const ResetDialog = IS_LAMP ? LampResetDialog : ({ open, onClose, onReset }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>복습 기록 초기화</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>어떤 복습 데이터를 초기화하시겠습니까?</Typography>
        <Box display="flex" flexDirection="column" gap={1} mt={2}>
          <Button onClick={() => { onReset('all'); onClose(); }} color="error">전체 복습 상태 초기화 (통계 기록은 유지)</Button>
          <Button onClick={() => { onReset('all_turns'); onClose(); }} color="warning">차수 복습 초기화 (일반, 이력 삭제 후 1차로)</Button>
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