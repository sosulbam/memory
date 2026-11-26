// src/components/SyncSettings.js
// 설정 「기기 연결」 — 동기화 코드 만들기·넣기·보이기 (2026-11-26 #396)
// 🔴 저장 위치 같은 안내 문구는 넣지 않는다(부장님 결정). 할 수 있는 일만 짧게.
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { getSyncState, subscribeSync, createCode, joinCode, disconnect, pull, formatCode } from '../api/syncApi';
import { copyText } from '../utils/shareToday';
import { useSnackbar } from '../contexts/SnackbarContext';

const ERR = {
  format: '코드 12자리를 모두 넣어 주세요.',
  notfound: '그런 코드가 없습니다. 다시 확인해 주세요.',
  limit: '잠시 뒤에 다시 해 주세요.',
  server: '지금 연결할 수 없습니다. 잠시 뒤에 다시 해 주세요.',
};
const fmtTime = (t) => {
  if (!t) return '';
  const d = new Date(t); const now = new Date();
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return d.toDateString() === now.toDateString() ? `오늘 ${hm}` : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
};

const SyncSettings = ({ SectionTitle }) => {
  const { showSnackbar } = useSnackbar();
  const [st, setSt] = useState(getSyncState);
  const [working, setWorking] = useState(false);
  const [entering, setEntering] = useState(false);
  const [input, setInput] = useState('');
  const [inputErr, setInputErr] = useState('');
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  useEffect(() => subscribeSync(setSt), []);

  const make = async () => {
    setWorking(true);
    try {
      await createCode();
      showSnackbar('동기화 코드를 만들었습니다.', 'success');
    } catch (e) {
      showSnackbar(ERR[e.message] || ERR.server, 'error');
    } finally { setWorking(false); }
  };
  const join = async () => {
    setConfirmJoin(false);
    setWorking(true);
    try {
      await joinCode(input);
      showSnackbar('연결했습니다. 새로 고칩니다.', 'success');
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      setInputErr(ERR[e.message] || ERR.server);
      setWorking(false);
    }
  };
  const askJoin = () => {
    const c = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length !== 12) { setInputErr(ERR.format); return; }
    setInputErr('');
    setConfirmJoin(true);
  };
  const copy = async () => {
    const ok = await copyText(st.code);
    showSnackbar(ok ? '코드를 복사했습니다.' : '복사하지 못했습니다. 코드를 길게 눌러 복사해 주세요.', ok ? 'success' : 'error');
  };
  const share = async () => {
    const text = `말씀사랑 암송 동기화 코드\n${st.code}\n\n다른 기기에서 말씀사랑 → 설정 → 기기 연결 → 「받은 코드 넣기」에 넣으세요.`;
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const ok = await copyText(text);
    showSnackbar(ok ? '보낼 글을 복사했습니다. 카톡에 붙여 넣으세요.' : '복사하지 못했습니다.', ok ? 'success' : 'error');
  };
  const syncNow = async () => {
    const changed = await pull();
    if (changed.length) window.location.reload();
    else showSnackbar(getSyncState().error ? ERR.server : '최신 상태입니다.', getSyncState().error ? 'error' : 'success');
  };

  return (
    <Box data-testid="sync-settings">
      <SectionTitle>기기 연결</SectionTitle>
      {st.code ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'keep-all' }}>
            이 코드를 넣은 기기들은 구절·복습 기록·설정이 함께 맞춰집니다.
          </Typography>
          <Box sx={{ textAlign: 'center', py: 1.5, mb: 1.5, borderRadius: 2, bgcolor: 'grey.100' }}>
            <Typography data-testid="sync-code" sx={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontWeight: 700, fontSize: { xs: '1.45rem', sm: '1.7rem' }, letterSpacing: 1.5, userSelect: 'all' }}>
              {st.code}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copy} sx={{ flex: '1 1 150px', whiteSpace: 'nowrap' }}>코드 복사</Button>
            <Button variant="contained" startIcon={<ShareIcon />} onClick={share} sx={{ flex: '1 1 150px', whiteSpace: 'nowrap' }}>카톡으로 보내기</Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color={st.error ? 'warning.dark' : 'text.secondary'} data-testid="sync-status">
              {st.busy ? '맞추는 중…' : st.error === 'code' ? '코드를 찾을 수 없습니다.' : st.error ? `연결되면 맞춥니다${st.pending ? ` (보낼 것 ${st.pending}건)` : ''}` : st.lastOk ? `마지막으로 맞춘 때 ${fmtTime(st.lastOk)}` : ''}
            </Typography>
            <Box>
              <Button size="small" onClick={syncNow} disabled={st.busy}>지금 맞추기</Button>
              <Button size="small" color="inherit" onClick={() => setConfirmOff(true)} sx={{ color: 'text.secondary' }}>연결 끊기</Button>
            </Box>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, wordBreak: 'keep-all' }}>
            폰과 PC에서 같은 기록으로 복습할 수 있습니다. 처음 쓰는 기기에서 코드를 만들고, 다른 기기에서 그 코드를 한 번 넣으세요.
          </Typography>
          {!entering ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={make} disabled={working} sx={{ flex: '1 1 140px' }}>
                {working ? <CircularProgress size={20} color="inherit" /> : '동기화 코드 만들기'}
              </Button>
              <Button variant="outlined" onClick={() => setEntering(true)} disabled={working} sx={{ flex: '1 1 140px' }}>받은 코드 넣기</Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                autoFocus fullWidth size="small" label="동기화 코드" placeholder="XXXX-XXXX-XXXX"
                value={input} onChange={(e) => { setInput(e.target.value); setInputErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') askJoin(); }}
                error={!!inputErr} helperText={inputErr || ' '}
                inputProps={{ 'aria-label': '동기화 코드', autoCapitalize: 'characters', autoCorrect: 'off', spellCheck: false, style: { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', letterSpacing: 1 } }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={askJoin} disabled={working} sx={{ flex: 1 }}>
                  {working ? <CircularProgress size={20} color="inherit" /> : '연결'}
                </Button>
                <Button onClick={() => { setEntering(false); setInput(''); setInputErr(''); }} disabled={working}>취소</Button>
              </Box>
            </Box>
          )}
        </>
      )}

      <Dialog open={confirmJoin} onClose={() => setConfirmJoin(false)} maxWidth="xs" fullWidth>
        <DialogTitle>이 기기를 연결할까요?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ wordBreak: 'keep-all' }}>
            이 기기의 구절과 복습 기록이 코드 <b>{formatCode(input)}</b>의 기록으로 바뀝니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmJoin(false)}>취소</Button>
          <Button variant="contained" onClick={join}>연결</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmOff} onClose={() => setConfirmOff(false)} maxWidth="xs" fullWidth>
        <DialogTitle>이 기기의 연결을 끊을까요?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ wordBreak: 'keep-all' }}>
            이 기기의 기록은 그대로 남고, 앞으로는 다른 기기와 맞추지 않습니다. 다시 연결하려면 코드를 넣으면 됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOff(false)}>취소</Button>
          <Button color="error" onClick={() => { disconnect(); setConfirmOff(false); showSnackbar('연결을 끊었습니다.', 'success'); }}>끊기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SyncSettings;
