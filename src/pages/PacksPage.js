// src/pages/PacksPage.js
// 「암송 팩」(등불 암송 전용) — 시리즈를 골라 넣고, 팩째 뺀다.
// 팩 파일: <PUBLIC_URL>/packs/index.json · <PUBLIC_URL>/packs/<id>.json (scripts/build-lamp.sh 가 넣는다)
//  · 팩 구절 id 는 `pk-<팩id>-<번호>` 로 고정 — 같은 팩을 다시 넣으면 이미 있는 id 는 건너뛰고 복습 기록도 그대로 둔다
//  · 구절마다 `팩` 필드가 있어 팩째 빼기가 된다(직접 넣은 구절은 `팩`이 없어 안 지워진다)
//  · 사이트(apps.sosulbaram.com)의 「앱에 넣기」는 /packs?add=<id> 로 연다 — 그 팩을 짚어 줄 뿐, 넣기는 사용자가 누른다
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Paper, Stack, Chip, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress, Alert,
} from '@mui/material';
import { DataContext } from '../contexts/DataContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { loadDataFromLocal, saveDataToLocal } from '../api/localStorageApi';
import { VERSES_DATA_KEY, REVIEW_STATUS_KEY, TAGS_DATA_KEY } from '../constants';
import { PUBLIC_URL } from '../edition';

const normRef = (r) => String(r || '').replace(/\s/g, '');

const PacksPage = () => {
  const { originalVerses, loadData } = useContext(DataContext);
  const { showSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('add');

  const [index, setIndex] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [skipSameRef, setSkipSameRef] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const focusRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${PUBLIC_URL}/packs/index.json`, { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((j) => { if (!cancelled) setIndex(j); })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (index && focusRef.current) focusRef.current.scrollIntoView({ block: 'center' });
  }, [index]);

  // 팩별로 지금 몇 구절이 들어 있는지
  const installed = useMemo(() => {
    const m = {};
    (originalVerses || []).forEach((v) => { if (v.팩) m[v.팩] = (m[v.팩] || 0) + 1; });
    return m;
  }, [originalVerses]);

  const addPack = async (pack) => {
    setBusyId(pack.id);
    try {
      const res = await fetch(`${PUBLIC_URL}/packs/${pack.id}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const existing = loadDataFromLocal(VERSES_DATA_KEY);
      const list = Array.isArray(existing) ? existing : [];
      const ids = new Set(list.map((v) => v.id));
      const refs = new Set(list.map((v) => normRef(v.장절)));
      let no = list.reduce((m, v) => Math.max(m, Number(v.번호) || 0), 0);
      const added = [];
      let sameId = 0;
      let sameRef = 0;
      data.verses.forEach((v) => {
        if (ids.has(v.id)) { sameId += 1; return; }
        if (skipSameRef && refs.has(normRef(v.장절))) { sameRef += 1; return; }
        no += 1;
        added.push({ ...v, 번호: no });
      });
      if (added.length > 0) {
        saveDataToLocal(VERSES_DATA_KEY, [...list, ...added]);
        await loadData();
      }
      const parts = [`${pack.name} ${added.length}구절을 넣었습니다`];
      if (sameId) parts.push(`이미 있던 ${sameId}구절은 그대로 두었습니다`);
      if (sameRef) parts.push(`다른 곳에 같은 장절이 있는 ${sameRef}구절은 건너뛰었습니다`);
      showSnackbar(parts.join(' · '), added.length > 0 ? 'success' : 'info');
    } catch (e) {
      showSnackbar('팩을 받지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removePack = async (pack) => {
    setRemoveTarget(null);
    setBusyId(pack.id);
    try {
      const list = loadDataFromLocal(VERSES_DATA_KEY);
      const keep = [];
      const gone = new Set();
      (Array.isArray(list) ? list : []).forEach((v) => { if (v.팩 === pack.id) gone.add(v.id); else keep.push(v); });
      const status = loadDataFromLocal(REVIEW_STATUS_KEY) || {};
      const tags = loadDataFromLocal(TAGS_DATA_KEY) || {};
      gone.forEach((id) => { delete status[id]; delete tags[id]; });
      saveDataToLocal(VERSES_DATA_KEY, keep);
      saveDataToLocal(REVIEW_STATUS_KEY, status);
      saveDataToLocal(TAGS_DATA_KEY, tags);
      await loadData();
      showSnackbar(`${pack.name} ${gone.size}구절을 뺐습니다`, 'success');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 'calc(24px + var(--sab))', sm: 'calc(32px + var(--sab))' } }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        필요한 시리즈만 골라 넣으세요. 넣은 팩은 구절 구조 보기에서 분류째 보입니다.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {index ? `${index.source} · 본문 ${index.translation}` : '구절 선정: 네비게이토 암송 시리즈 · 본문 개역한글'}
      </Typography>

      <FormControlLabel
        sx={{ mt: 1.5, mb: 1 }}
        control={<Switch checked={skipSameRef} onChange={(e) => setSkipSameRef(e.target.checked)} />}
        label={<Typography variant="body2">다른 팩이나 직접 넣은 구절과 장절이 같으면 건너뛰기</Typography>}
      />

      {loadError && <Alert severity="warning" sx={{ my: 2 }}>팩 목록을 받지 못했습니다. 인터넷에 연결된 상태에서 다시 열어 주세요.</Alert>}
      {!index && !loadError && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>}

      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {index && index.packs.map((p) => {
          const have = installed[p.id] || 0;
          const full = have >= p.count;
          const focused = p.id === focusId;
          return (
            <Paper
              key={p.id}
              ref={focused ? focusRef : null}
              variant="outlined"
              sx={{ p: 2, borderColor: focused ? 'primary.main' : 'divider', borderWidth: focused ? 2 : 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 }}>{p.name}</Typography>
                <Typography variant="body2" color="text.secondary">{p.count}구절{p.groups > 1 ? ` · ${p.groups}묶음` : ''}</Typography>
                {have > 0 && <Chip size="small" color={full ? 'success' : 'warning'} label={full ? '넣음' : `${have}/${p.count} 넣음`} sx={{ ml: 'auto' }} />}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{p.description}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                {have > 0 && (
                  <Button size="small" color="error" variant="text" disabled={busyId !== null} onClick={() => setRemoveTarget({ ...p, have })}>빼기</Button>
                )}
                {!full && (
                  <Button size="small" variant="contained" disabled={busyId !== null} onClick={() => addPack(p)}>
                    {busyId === p.id ? '넣는 중…' : have > 0 ? '빠진 구절 넣기' : '넣기'}
                  </Button>
                )}
              </Box>
            </Paper>
          );
        })}
      </Stack>

      <Dialog open={!!removeTarget} onClose={() => setRemoveTarget(null)}>
        <DialogTitle>{removeTarget?.name} 빼기</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 팩의 {removeTarget?.have}구절과 그 구절들의 복습 기록·태그가 지워집니다. 직접 넣은 구절과 다른 팩은 그대로 남습니다.
            나중에 다시 넣으면 구절은 돌아오지만 복습 기록은 처음부터입니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveTarget(null)}>그만두기</Button>
          <Button color="error" variant="contained" onClick={() => removePack(removeTarget)}>빼기</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PacksPage;
