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
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { DataContext } from '../contexts/DataContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { loadDataFromLocal, saveDataToLocal } from '../api/localStorageApi';
import { VERSES_DATA_KEY, REVIEW_STATUS_KEY, TAGS_DATA_KEY } from '../constants';
import { PUBLIC_URL } from '../edition';

const normRef = (r) => String(r || '').replace(/\s/g, '');

// 이 화면의 선택은 기기에 기억한다(화면을 옮겼다 와도 그대로, 검토 35번)
const PREF_KEY = 'recitation-app-packs-prefs';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; } };
// 「겹치는 장절 건너뛰기」로 넣지 않은 구절 id — 팩이 「덜 들어간」 것처럼 보이지 않게 기억한다(N3)
const SKIP_KEY = 'recitation-app-packs-skipped';
const loadSkipped = () => { try { return JSON.parse(localStorage.getItem(SKIP_KEY)) || {}; } catch { return {}; } };
const saveSkipped = (m) => { try { localStorage.setItem(SKIP_KEY, JSON.stringify(m)); } catch { /* 없어도 동작은 같다 */ } };
const savePrefs = (p) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* 저장 못 해도 동작은 같다 */ } };

const PacksPage = () => {
  const { originalVerses, loadData } = useContext(DataContext);
  const { showSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('add');

  const [index, setIndex] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  // 겹치는 장절 건너뛰기는 기본 꺼짐(부장님: 제목이 다르면 같은 장절도 따로 넣는다)
  const [skipSameRef, setSkipSameRef] = useState(() => !!loadPrefs().skipSameRef);
  // 넣을 때 상태: 새로 외울 구절(뉴구절) / 이미 외운 구절(복습) — 기본은 새로 외울 구절(검토 3번)
  const [asNew, setAsNew] = useState(() => loadPrefs().asNew !== false);
  useEffect(() => { savePrefs({ skipSameRef, asNew }); }, [skipSameRef, asNew]);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [skipped, setSkipped] = useState(loadSkipped);
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
      const skippedIds = new Set(skipped[pack.id] || []);
      data.verses.forEach((v) => {
        if (ids.has(v.id)) { sameId += 1; return; }
        if (skipSameRef && refs.has(normRef(v.장절))) { sameRef += 1; skippedIds.add(v.id); return; }
        skippedIds.delete(v.id);
        no += 1;
        added.push(asNew ? { ...v, 번호: no, 뉴구절여부: true } : { ...v, 번호: no });
      });
      const nextSkipped = { ...skipped, [pack.id]: [...skippedIds] };
      if (!skippedIds.size) delete nextSkipped[pack.id];
      setSkipped(nextSkipped); saveSkipped(nextSkipped);
      if (added.length > 0) {
        saveDataToLocal(VERSES_DATA_KEY, [...list, ...added]);
        await loadData();
      }
      const parts = [`「${pack.name}」에서 ${added.length}구절을 ${asNew ? '새로 외울 구절로' : '외운 구절로'} 넣었습니다`];
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
      const nextSkipped = { ...skipped }; delete nextSkipped[pack.id];
      setSkipped(nextSkipped); saveSkipped(nextSkipped);
      await loadData();
      showSnackbar(`「${pack.name}」 ${gone.size}구절을 뺐습니다`, 'success');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 'calc(24px + var(--sab))', sm: 'calc(32px + var(--sab))' } }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        필요한 시리즈만 골라 넣으세요. 넣은 팩은 구절 구조 보기에서 분류째 보입니다. 더 쓰지 않는 팩은 여기서 「빼기」로 뺍니다.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {index ? `${index.source} · 본문 ${index.translation}` : '구절 선정: 네비게이토 암송 시리즈 · 본문 개역한글'}
      </Typography>

      <Paper variant="outlined" sx={{ mt: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.75 }}>넣는 구절을</Typography>
          <ToggleButtonGroup exclusive fullWidth size="small" value={asNew ? 'new' : 'known'} onChange={(e, v) => v && setAsNew(v === 'new')} aria-label="넣는 구절의 상태">
            <ToggleButton value="new">새로 외울 구절로</ToggleButton>
            <ToggleButton value="known">이미 외운 구절로</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
            {asNew ? '홈의 「새 구절」에서 차수별로 외웁니다. 다 외우면 구절의 상태에서 「새 구절」을 풀어 복습으로 옮깁니다.' : '홈의 「차수별 복습」에서 바로 복습합니다.'}
          </Typography>
        </Box>
        <FormControlLabel
          control={<Switch checked={skipSameRef} onChange={(e) => setSkipSameRef(e.target.checked)} />}
          label={<Typography variant="body2">겹치는 장절 건너뛰기</Typography>}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          켜면 이미 들어 있는 장절은 다른 팩에서 넣지 않습니다. 끄면 제목이 다른 같은 장절도 시리즈대로 따로 들어갑니다.
        </Typography>
      </Paper>

      {loadError && <Alert severity="warning" sx={{ my: 2 }}>팩 목록을 받지 못했습니다. 인터넷에 연결된 상태에서 다시 열어 주세요.</Alert>}
      {!index && !loadError && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>}

      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {index && index.packs.map((p) => {
          const have = installed[p.id] || 0;
          const skippedN = (skipped[p.id] || []).length;
          const full = have > 0 && have + skippedN >= p.count;
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
                {have > 0 && <Chip size="small" variant={full ? 'filled' : 'outlined'} label={full ? '넣음' : `${have}/${p.count} 넣음`} sx={{ ml: 'auto', ...(full ? { bgcolor: 'text.primary', color: 'background.paper' } : {}) }} />}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{p.description}</Typography>
              {p.note && <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>{p.note}</Typography>}
              {have > 0 && skippedN > 0 && <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>{have}구절 넣음 · 겹친 {skippedN}구절은 다른 팩에 있어 건너뛰었습니다.</Typography>}
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                {have > 0 && (
                  <Button size="small" variant="text" disabled={busyId !== null} onClick={() => setRemoveTarget({ ...p, have })} sx={{ color: '#A3271F' }}>빼기</Button>
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
            이 팩의 {removeTarget?.have}구절과 그 구절들에 붙은 차수, 오답, 태그 표시를 지웁니다. 날마다 몇 구절 복습했는지 남긴 통계는 그대로 남습니다.
            직접 넣은 구절과 다른 팩도 그대로입니다. 나중에 다시 넣으면 구절은 돌아오지만 차수는 처음부터입니다.
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
