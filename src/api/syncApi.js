// src/api/syncApi.js
// 「동기화 코드」로 폰·PC 기록 맞추기 (2026-11-26 #396) — 로그인 없음, 코드 하나 = 암송 데이터 묶음.
// 서버: memo-suite /api/verse-sync (server/src/routes/verseSync.js)
//
// 규칙 (개인판 serverApi 와 같은 「마지막 저장 우선」을 키마다):
//  · 앱이 saveDataToLocal 로 저장하면 noteLocalSave 가 그 키를 「보낼 것」으로 표시하고 잠시 뒤 보낸다.
//    내용이 지난번과 같으면(해시) 보내지 않는다 — 앱이 켜질 때마다 같은 설정을 다시 저장하기 때문.
//  · 받기: 앱을 열 때(화면 그리기 전, 최대 3초)와 화면으로 돌아올 때. 다른 기기가 더 늦게 쓴 키만 받아
//    localStorage 에 넣고, 이미 화면이 떠 있으면 한 번 새로 고친다.
//  · 서버가 안 되면 로컬로 계속 쓰고, 보낼 것은 남겨 두었다가 다음에 보낸다.
//  · 목소리(voiceURI)·화면 여백·「오늘 초기화」 표시 등은 기기별 — 보내지 않는다.
// 🔴 동기화 상태 키는 recitation- 로 시작하지 않는다(등불판 「초기화」가 recitation- 만 지우므로 구분).
import { IS_LAMP } from '../edition';

export const SYNC_API = process.env.REACT_APP_SYNC_API || 'https://sosulbaram.com/api/verse-sync';
// 이번엔 기본판(Netlify)만 — 등불판은 재배포 정할 때 켠다
export const SYNC_ENABLED = !IS_LAMP;

export const SYNC_KEYS = [
  'recitation-app-verses',
  'recitation-app-review-status',
  'recitation-app-tags',
  'recitation-app-turn-schedule',
  'recitation-app-review-log',
  'recitation-app-last-app-state',
  'recitation-app-theme',
  'recitation-app-versetree-prefs',
];
// voiceURI: 기기마다 음성 목록이 달라 핑퐁 · isFocusMode: 집중모드 들고 날 때마다 설정을 보내지 않게(복원도 안 하는 값)
const LOCAL_ONLY_FIELDS = { 'recitation-app-last-app-state': ['voiceURI', 'isFocusMode'] };
const META_KEY = 'verse-sync';
const PUSH_DELAY_MS = 1500;
const KEEPALIVE_MAX = 60 * 1024; // keepalive 요청 본문 한도(64KB) 안쪽만 이탈 때 보낸다

// ── 상태 ──
const readMeta = () => {
  try { const m = JSON.parse(localStorage.getItem(META_KEY) || 'null'); return m && m.code ? m : null; } catch { return null; }
};
const writeMeta = (m) => { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* 저장 못 하면 다음에 다시 */ } emit(); };
const listeners = new Set();
const emit = () => listeners.forEach((fn) => { try { fn(getSyncState()); } catch { /* 무시 */ } });
export const subscribeSync = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

let lastError = null;
let busy = false;
export const getSyncState = () => {
  const m = readMeta();
  return m ? { code: m.code, lastOk: m.lastOk || null, pending: Object.keys(m.dirty || {}).length, error: lastError, busy } : { code: null, error: lastError, busy };
};
export const getSyncCode = () => (SYNC_ENABLED ? (readMeta() || {}).code || null : null);

// ── 도우미 ──
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return `${s.length}:${h >>> 0}`; };
const sanitize = (key, data) => {
  const fields = LOCAL_ONLY_FIELDS[key];
  if (!fields || !data || typeof data !== 'object' || Array.isArray(data)) return data;
  const copy = { ...data };
  fields.forEach((f) => { delete copy[f]; });
  return copy;
};
const readLocal = (key) => { try { const s = localStorage.getItem(key); return s === null || s === 'undefined' ? undefined : JSON.parse(s); } catch { return undefined; } };
// 받은 값 넣기 — 기기별 필드는 이 기기 값을 살린다. saveDataToLocal 을 거치지 않으므로 「보낼 것」이 되지 않는다
const applyLocal = (key, payload) => {
  let value = payload;
  const fields = LOCAL_ONLY_FIELDS[key];
  if (fields && value && typeof value === 'object' && !Array.isArray(value)) {
    const cur = readLocal(key) || {};
    value = { ...value };
    fields.forEach((f) => { if (cur[f] !== undefined) value[f] = cur[f]; });
  }
  if (value === undefined || value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
};
const api = async (path, opts = {}) => {
  const res = await fetch(`${SYNC_API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, cache: 'no-store' });
  let body = null;
  try { body = await res.json(); } catch { /* 본문 없음 */ }
  return { status: res.status, body };
};
const normCode = (raw) => String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const formatCode = (raw) => { const c = normCode(raw); return c.length === 12 ? `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}` : raw; };

// ── 보내기 ──
let pushTimer = null;
export const noteLocalSave = (key, data) => {
  if (!SYNC_ENABLED || !SYNC_KEYS.includes(key)) return;
  const m = readMeta();
  if (!m) return;
  const h = hash(JSON.stringify(sanitize(key, data)));
  if ((m.hashes || {})[key] === h) return;
  m.hashes = { ...(m.hashes || {}), [key]: h };
  m.dirty = { ...(m.dirty || {}), [key]: Date.now() };
  writeMeta(m);
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushDirty().then((replaced) => { if (replaced) window.location.reload(); }); }, PUSH_DELAY_MS);
};

// 보낼 것 모두 보내기. 다른 기기가 더 늦게 쓴 키(409)는 그 값을 받아 넣고 true(새로 고침 필요)를 돌려준다
export const pushDirty = async ({ keepalive = false } = {}) => {
  const m0 = readMeta();
  if (!SYNC_ENABLED || !m0 || !Object.keys(m0.dirty || {}).length) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  let replaced = false;
  for (const [key, at] of Object.entries(m0.dirty)) {
    const payload = sanitize(key, readLocal(key));
    if (payload === undefined) { const m = readMeta(); if (m && m.dirty) { delete m.dirty[key]; writeMeta(m); } continue; }
    const body = JSON.stringify({ payload, syncedAt: at });
    if (keepalive && body.length > KEEPALIVE_MAX) continue;
    try {
      const r = await api(`/${m0.code}/${key}`, { method: 'PUT', body, keepalive });
      const m = readMeta();
      if (!m || m.code !== m0.code) return replaced;
      if (r.status === 200) {
        m.versions = { ...(m.versions || {}), [key]: r.body.syncedAt };
        if (m.dirty && m.dirty[key] === at) delete m.dirty[key];
        m.lastOk = Date.now(); lastError = null;
        writeMeta(m);
      } else if (r.status === 409 && r.body) {
        applyLocal(key, r.body.payload);
        m.versions = { ...(m.versions || {}), [key]: r.body.syncedAt };
        m.hashes = { ...(m.hashes || {}), [key]: hash(JSON.stringify(sanitize(key, r.body.payload))) };
        if (m.dirty) delete m.dirty[key];
        m.lastOk = Date.now(); lastError = null;
        writeMeta(m);
        replaced = true;
      } else if (r.status === 404) {
        lastError = 'code'; emit(); return replaced;
      } else {
        lastError = 'server'; emit();
      }
    } catch {
      lastError = 'network'; emit();
      return replaced;
    }
  }
  return replaced;
};

// ── 받기 ── 바뀐 키 목록을 돌려준다(없으면 [])
export const pull = async () => {
  if (!SYNC_ENABLED || !readMeta()) return [];
  busy = true; emit();
  try {
    let changed = [];
    if (await pushDirty()) changed.push('*');
    const m0 = readMeta();
    if (!m0) return changed;
    const meta = await api(`/${m0.code}/meta`);
    if (meta.status === 404) { lastError = 'code'; return changed; }
    if (meta.status !== 200) { lastError = 'server'; return changed; }
    const server = meta.body.keys || {};
    const want = Object.entries(server).filter(([key, at]) => {
      if (!SYNC_KEYS.includes(key)) return false;
      if (at <= ((m0.versions || {})[key] || 0)) return false;
      const d = (m0.dirty || {})[key];
      return !(d && d >= at); // 이 기기에서 더 늦게 고친 것은 보낸다(위 pushDirty 가 못 보냈으면 다음에)
    }).map(([key]) => key);
    if (want.length) {
      const r = await api(`/${m0.code}?keys=${want.join(',')}`);
      if (r.status !== 200) { lastError = 'server'; return changed; }
      const m = readMeta();
      if (!m || m.code !== m0.code) return changed;
      Object.entries(r.body.docs || {}).forEach(([key, doc]) => {
        applyLocal(key, doc.payload);
        m.versions = { ...(m.versions || {}), [key]: doc.syncedAt };
        m.hashes = { ...(m.hashes || {}), [key]: hash(JSON.stringify(sanitize(key, doc.payload))) };
        if (m.dirty) delete m.dirty[key];
        changed.push(key);
      });
      writeMeta(m);
    }
    const m = readMeta();
    if (m) { m.lastOk = Date.now(); writeMeta(m); }
    lastError = null;
    return changed;
  } catch {
    lastError = 'network';
    return [];
  } finally {
    busy = false; emit();
  }
};

// ── 코드 만들기 / 넣기 / 끊기 ──
// 이 기기의 지금 기록으로 새 코드를 만든다
export const createCode = async () => {
  const r = await api('/new', { method: 'POST', body: '{}' });
  if (r.status !== 200 || !r.body || !r.body.code) throw new Error(r.status === 429 ? 'limit' : 'server');
  const now = Date.now();
  const dirty = {}; const hashes = {};
  SYNC_KEYS.forEach((key) => {
    const v = readLocal(key);
    if (v === undefined) return;
    dirty[key] = now;
    hashes[key] = hash(JSON.stringify(sanitize(key, v)));
  });
  writeMeta({ code: r.body.code, versions: {}, hashes, dirty, lastOk: null });
  await pushDirty();
  return r.body.code;
};

// 받은 코드로 연결 — 이 기기의 기록을 코드의 기록으로 바꾼다(호출 쪽이 먼저 확인을 받는다). 끝나면 새로 고쳐야 한다
export const joinCode = async (raw) => {
  const c = normCode(raw);
  if (c.length !== 12) throw new Error('format');
  const code = formatCode(c);
  const r = await api(`/${code}`);
  if (r.status === 404) throw new Error('notfound');
  if (r.status === 429) throw new Error('limit');
  if (r.status !== 200) throw new Error('server');
  const docs = (r.body && r.body.docs) || {};
  const versions = {}; const hashes = {};
  SYNC_KEYS.forEach((key) => {
    const doc = docs[key];
    if (doc) {
      applyLocal(key, doc.payload);
      versions[key] = doc.syncedAt;
      hashes[key] = hash(JSON.stringify(sanitize(key, doc.payload)));
    } else if (key !== 'recitation-app-last-app-state' && key !== 'recitation-app-theme') {
      localStorage.removeItem(key); // 코드 쪽에 없는 데이터는 이 기기에서도 비운다(설정은 이 기기 것 유지)
    }
  });
  writeMeta({ code, versions, hashes, dirty: {}, lastOk: Date.now() });
  lastError = null;
  return code;
};

// 이 기기만 연결을 끊는다(기록은 이 기기에 그대로, 다른 기기·코드는 그대로)
export const disconnect = () => { localStorage.removeItem(META_KEY); lastError = null; emit(); };

// ── 앱 시작·화면 전환 ──
let appReady = false;
// 화면을 그리기 전에 한 번 받는다(최대 waitMs). 늦게 받은 변경이 있으면 새로 고친다
export const syncOnStart = (waitMs = 3000) => {
  if (!SYNC_ENABLED || !readMeta()) { appReady = true; return Promise.resolve(); }
  const p = pull().then((changed) => { if (appReady && changed.length) window.location.reload(); });
  return Promise.race([p, new Promise((ok) => setTimeout(ok, waitMs))]).then(() => { appReady = true; });
};

if (typeof window !== 'undefined' && SYNC_ENABLED) {
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (!readMeta()) return;
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      clearTimeout(pushTimer);
      pushDirty({ keepalive: true });
    } else if (hiddenAt && Date.now() - hiddenAt > 2000) {
      pull().then((changed) => { if (changed.length) window.location.reload(); });
    }
  });
  window.addEventListener('pagehide', () => { if (readMeta()) { clearTimeout(pushTimer); pushDirty({ keepalive: true }); } });
  window.addEventListener('online', () => { if (readMeta()) pushDirty().then((r) => { if (r) window.location.reload(); }); });
}
