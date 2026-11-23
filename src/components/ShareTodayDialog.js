// src/components/ShareTodayDialog.js
// 「오늘 복습한 내용 보내기」(#342) — 오늘 복습한 구절을 골라 암송짝에게 보낸다(휴대폰 공유 창 → 카카오톡, 안 되면 복사).
// 홈 대시보드·홈 완주 다이얼로그·트리 복습 모드에서 연다.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Checkbox, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useSnackbar } from '../contexts/SnackbarContext';
import { T } from '../terms';
import { SHARE_PREFS_KEY, getTodayReviewed, groupByCategory, buildShareText, copyText, verseMarks } from '../utils/shareToday';

const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(SHARE_PREFS_KEY)) || {}; } catch (e) { return {}; }
};
const savePrefs = (p) => {
  try { localStorage.setItem(SHARE_PREFS_KEY, JSON.stringify(p)); } catch (e) { /* 기기별 편의 설정이라 못 남겨도 된다 */ }
};

const ShareTodayDialog = ({ open, onClose, verses }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useSnackbar();

  const groups = useMemo(() => (open ? groupByCategory(getTodayReviewed(verses)) : []), [open, verses]);
  const allIds = useMemo(() => groups.flatMap(g => g.verses.map(v => v.id)), [groups]);

  const [selected, setSelected] = useState(() => new Set());
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [format, setFormat] = useState(() => loadPrefs().format || 'full');
  const [withTitle, setWithTitle] = useState(() => !!loadPrefs().withTitle);
  const [showPreview, setShowPreview] = useState(false);

  // 열 때마다 오늘 복습한 구절 전부 선택. 구절이 적으면 묶음을 펼쳐 둔다
  useEffect(() => {
    if (!open) return;
    setSelected(new Set(allIds));
    setOpenGroups(allIds.length <= 15 ? new Set(groups.map(g => g.name)) : new Set());
    setShowPreview(false);
    // 열 때만 초기화 — 열려 있는 동안 verses 가 바뀌어도 고른 것을 지우지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { savePrefs({ format, withTitle }); }, [format, withTitle]);

  const text = useMemo(() => buildShareText(groups, selected, { format, withTitle }), [groups, selected, format, withTitle]);
  const selectedCount = allIds.filter(id => selected.has(id)).length;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const toggleIds = (ids, on) => setSelected(prev => {
    const next = new Set(prev);
    ids.forEach(id => (on ? next.add(id) : next.delete(id)));
    return next;
  });
  const toggleGroupOpen = (name) => setOpenGroups(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const handleCopy = async () => {
    const ok = await copyText(text);
    showSnackbar(ok ? `${selectedCount}구절을 복사했습니다. 카카오톡 대화창에 붙여 넣으세요.` : '복사하지 못했습니다. 미리 보기 글을 길게 눌러 복사해 주세요.', ok ? 'success' : 'error');
    if (!ok) setShowPreview(true);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ text });
    } catch (e) {
      if (e && e.name === 'AbortError') return; // 공유 창을 그냥 닫음
      handleCopy();
    }
  };

  const allOn = selectedCount === allIds.length && allIds.length > 0;
  const someOn = selectedCount > 0 && !allOn;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{ sx: fullScreen ? { pt: 'var(--sat)', pb: 'var(--sab)', boxSizing: 'border-box' } : {} }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        <Box sx={{ flex: 1 }}>오늘 복습 보내기</Box>
        <IconButton aria-label="닫기" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        {allIds.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            오늘 복습한 구절이 아직 없습니다.<br />복습을 마친 구절이 여기에 모입니다.
          </Typography>
        ) : (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>보낼 모양</Typography>
            <ToggleButtonGroup value={format} exclusive fullWidth size="small" onChange={(_e, v) => { if (v) setFormat(v); }}>
              <ToggleButton value="full">장절 + 본문</ToggleButton>
              <ToggleButton value="ref">장절만</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {format === 'ref' ? '짝이 장절을 보고 본문을 외워 보게 합니다. 확인용 본문은 메시지 아래쪽에 따로 붙습니다.' : '장절 아래에 본문을 함께 보냅니다.'}
            </Typography>
            <FormControlLabel
              sx={{ mt: 0.5 }}
              control={<Checkbox size="small" checked={withTitle} onChange={(e) => setWithTitle(e.target.checked)} />}
              label={<Typography variant="body2">제목도 넣기</Typography>}
            />

            <Box sx={{ mt: 1.5, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
              <FormControlLabel
                control={<Checkbox checked={allOn} indeterminate={someOn} onChange={(e) => toggleIds(allIds, e.target.checked)} />}
                label={<Typography sx={{ fontWeight: 'bold' }}>전체</Typography>}
              />
              <Typography variant="body2" color="text.secondary">{selectedCount} / {allIds.length}구절</Typography>
            </Box>

            {groups.map(g => {
              const ids = g.verses.map(v => v.id);
              const on = ids.filter(id => selected.has(id)).length;
              const isOpen = openGroups.has(g.name);
              return (
                <Box key={g.name} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={on === ids.length}
                      indeterminate={on > 0 && on < ids.length}
                      onChange={(e) => toggleIds(ids, e.target.checked)}
                      inputProps={{ 'aria-label': `${g.name} 전체` }}
                    />
                    <Box
                      onClick={() => toggleGroupOpen(g.name)}
                      sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', py: 1 }}
                    >
                      <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5, flexShrink: 0 }}>{on}/{ids.length}</Typography>
                      {isOpen ? <ExpandMoreIcon color="action" /> : <ChevronRightIcon color="action" />}
                    </Box>
                  </Box>
                  <Collapse in={isOpen} unmountOnExit>
                    <Box sx={{ pl: 3, pb: 0.5 }}>
                      {g.verses.map(v => (
                        <Box key={v.id} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Checkbox size="small" checked={selected.has(v.id)} onChange={(e) => toggleIds([v.id], e.target.checked)} inputProps={{ 'aria-label': v.장절 }} />
                          <Box sx={{ minWidth: 0, flex: 1, py: 0.75, cursor: 'pointer' }} onClick={() => toggleIds([v.id], !selected.has(v.id))}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {v.장절}
                              {verseMarks(v).map(m => (
                                <Box key={m} component="span" sx={{ ml: 0.75, px: 0.6, py: '1px', borderRadius: 1, fontSize: '0.7rem', fontWeight: 600, verticalAlign: 'middle', color: m === T.recentShort ? 'secondary.main' : 'primary.main', border: '1px solid', borderColor: 'currentColor' }}>{m}</Box>
                              ))}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.본문}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}

            <Button size="small" sx={{ mt: 1.5 }} onClick={() => setShowPreview(p => !p)} disabled={!selectedCount}>
              {showPreview ? '미리 보기 닫기' : '보낼 글 미리 보기'}
            </Button>
            <Collapse in={showPreview && !!selectedCount}>
              <Box
                component="pre"
                sx={{ mt: 1, p: 1.5, bgcolor: 'grey.100', borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'anywhere', fontFamily: 'inherit', fontSize: '0.85rem', maxHeight: 320, overflowY: 'auto', userSelect: 'text' }}
              >
                {text}
              </Box>
            </Collapse>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        {allIds.length === 0 ? (
          <Button onClick={onClose}>닫기</Button>
        ) : (
          <>
            <Button startIcon={<ContentCopyIcon />} variant={canShare ? 'outlined' : 'contained'} onClick={handleCopy} disabled={!selectedCount} sx={{ flex: 1 }}>
              복사
            </Button>
            {canShare && (
              <Button startIcon={<ShareIcon />} variant="contained" onClick={handleShare} disabled={!selectedCount} sx={{ flex: 2 }}>
                보내기 ({selectedCount})
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ShareTodayDialog;
