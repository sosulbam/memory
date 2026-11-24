// src/components/SameRefCompare.js
// 같은 장절 모아 보기 (#354, 2026-11-24 부장님) — 정규구절 안에 장절이 같은 구절이 또 있으면 복습 카드 아래에 안내 + [비교하기].
// 누르면 그 장절의 구절들을 시리즈 순(5→8→60→180→DEP)으로 모아 제목을 비교한다. 보기만 — 복습 기록·차수·통계는 건드리지 않는다.
import React from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, useMediaQuery, useTheme } from '@mui/material';
import { formatRefFull } from '../utils/refFormat';
import { bodiesDiffer, seriesLabel } from '../utils/sameRef';

// 「SM::2. DEP 242::1. Assurance of Salvation」 → 「1. Assurance of Salvation」
const subLabel = (v) => {
  const sub = String(v.소카테고리 || '').split('::').pop().trim();
  return sub && sub !== String(v.카테고리 || '').trim() ? sub : '';
};

// 카드 아래 안내 줄 — 카드 탭(정답 보기)·타이핑 진행으로 번지지 않게 클릭 전파를 막는다
export const SameRefPrompt = ({ onOpen }) => (
  <Box
    data-same-ref-prompt
    onClick={(e) => e.stopPropagation()}
    sx={{
      display: 'flex', alignItems: 'center', gap: 1.25,
      px: 1.5, py: 0.75, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.22)', color: 'rgba(255,255,255,0.92)',
      maxWidth: 'min(92vw, 560px)', boxSizing: 'border-box', userSelect: 'none',
    }}
  >
    <Typography component="span" sx={{ flex: 1, minWidth: 0, fontSize: { xs: '0.8rem', sm: '0.9rem' }, lineHeight: 1.4, wordBreak: 'keep-all', textAlign: 'left' }}>
      동일한 구절이 또 있습니다. 모아서 비교해보실래요?
    </Typography>
    <Button
      size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); onOpen(); }}
      sx={{ flexShrink: 0, color: 'white', borderColor: 'rgba(255,255,255,0.7)', py: 0.1, minWidth: 0, whiteSpace: 'nowrap', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.12)' } }}
    >
      비교하기
    </Button>
  </Box>
);

const Body = ({ text }) => (
  <Typography sx={{ whiteSpace: 'pre-line', wordBreak: 'keep-all', lineHeight: 1.7, fontSize: '0.95rem' }}>{text}</Typography>
);

export const SameRefDialog = ({ open, onClose, group, currentId, disableRestoreFocus }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  if (!group || group.length < 2) return null;
  const differ = bodiesDiffer(group);
  const ref = group.find((v) => v.id === currentId)?.장절 || group[0].장절;

  return (
    <Dialog
      open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" scroll="paper"
      disableRestoreFocus={disableRestoreFocus}
      // 집중모드 카드(1300)·오답 해제 버튼(1301) 위로
      sx={{ zIndex: 1400 }}
      PaperProps={{ sx: fullScreen ? { pt: 'var(--sat)', pb: 'var(--sab)', boxSizing: 'border-box' } : {} }}
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography component="div" variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{formatRefFull(ref)}</Typography>
        <Typography component="div" variant="body2" color="text.secondary">같은 장절이 {group.length}곳에 있습니다 · 제목 비교</Typography>
      </DialogTitle>
      <DialogContent dividers data-same-ref-dialog>
        {!differ && (
          <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Body text={group[0].본문} />
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {group.map((v) => {
            const isCurrent = v.id === currentId;
            const sub = subLabel(v);
            return (
              <Box
                key={v.id} data-same-ref-row data-current={isCurrent ? '1' : '0'}
                sx={{
                  p: 1.5, borderRadius: 1, border: '1px solid', borderColor: isCurrent ? 'primary.main' : 'divider',
                  bgcolor: isCurrent ? 'action.selected' : 'transparent', borderLeftWidth: isCurrent ? 4 : 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.5 }}>
                  <Chip label={seriesLabel(v)} size="small" color="primary" variant={isCurrent ? 'filled' : 'outlined'} />
                  {sub && <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'keep-all' }}>{sub}</Typography>}
                  {isCurrent && <Typography variant="caption" color="primary" sx={{ fontWeight: 700, ml: 'auto' }}>지금 복습 중</Typography>}
                </Box>
                <Typography sx={{ fontWeight: 700, wordBreak: 'keep-all' }}>{v.제목 || '(제목 없음)'}</Typography>
                {differ && <Box sx={{ mt: 0.75 }}><Body text={v.본문} /></Box>}
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};
