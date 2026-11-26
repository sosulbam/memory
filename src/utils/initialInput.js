// src/utils/initialInput.js
// 암송 시험 「초성 입력」(#362, 2026-11-25 부장님) — 어절마다 첫 글자 하나만 치면 그 어절 전체가 채워진다.
//  - 한글 어절 = 첫 음절의 초성(ㅌ → 「태초에」), 영어 = 첫 글자(대소문자 무시), 숫자로 시작 = 첫 숫자(「2,172」 → 2)
//  - 쌍자음은 홑자음과 같게 본다(ㄲ 어절에 ㄱ, ㄱ 어절에 ㄲ 모두 정답) — 휴대폰 두벌식은 Shift, 천지인은 세 번 눌러야 해서.
//    부장님 최종 확인 중이라 DOUBLE_AS_SINGLE 하나로 끄고 켠다
//  - 앞에 붙은 괄호·따옴표는 건너뛴다(「(사람이」 → ㅅ). 글자·숫자가 하나도 없는 어절(「—」 등)은 앞 어절과 함께 자동으로 채운다
//  - 어절마다 기회 3번(CHANCES, 11/25 덧붙임): 틀린 글자는 채우지 않고 기회만 줄인다. 3번 안에 맞히면 감점 없이 검은 글씨,
//    3번 다 틀리면 그때 빨간 정답으로 채우고 다음 어절 — 빨간 어절 수 = 감점
// 입력칸에 친 글자 전체에서 매번 다시 계산한다(IME 조합 중 글자가 바뀌어도, 백스페이스로 지워도 그대로 맞는다).
// 화면에 매이지 않은 순수 함수 — 팀 시험(방 설정)에서도 그대로 쓴다.

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
// 받침(종성) — 조합 중 「택」처럼 다음 자음이 받침으로 붙는 경우를 위해. 겹받침은 둘로 나눈다
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
// 두벌식에서 자음 둘을 잇달아 치면 겹자음 한 글자로 조합된다(ㄱ+ㅅ → ㄳ)
const CLUSTER = { 'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ' };
const BASE = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
// 첫자모 영역(U+1100~)으로 들어오는 자판도 있어 호환 자모로 바꾼다
const JAMO_INITIAL = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

export const CHANCES = 3;
export const DOUBLE_AS_SINGLE = true;

const isSyllable = (ch) => ch >= '가' && ch <= '힣';
const isConsonant = (ch) => ch >= 'ㄱ' && ch <= 'ㅎ';

// 어절의 「칠 글자」: 첫 한글 음절의 초성 / 첫 영문자(소문자) / 첫 숫자. 없으면 null(자동으로 채우는 어절)
export const wordKey = (word) => {
  for (const ch of String(word || '')) {
    if (isSyllable(ch)) return CHO[Math.floor((ch.charCodeAt(0) - 0xac00) / 588)];
    if (/[A-Za-z]/.test(ch)) return ch.toLowerCase();
    if (/[0-9]/.test(ch)) return ch;
    if (isConsonant(ch)) return CLUSTER[ch] ? CLUSTER[ch][0] : ch;
  }
  return null;
};

// 본문 → 어절 목록. end = 이 어절까지 채웠을 때 원문을 어디까지 보여 줄지(띄어쓰기·줄바꿈·문장부호를 원문 그대로)
export const tokenizeBody = (body) => {
  const text = String(body || '');
  const tokens = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) {
    tokens.push({ word: m[0], start: m.index, end: m.index + m[0].length, key: wordKey(m[0]) });
  }
  return tokens;
};

// 입력칸 글자 → 친 초성 차례. 한글 음절은 초성(+받침), 겹자음은 둘로, 영문은 소문자, 숫자는 그대로. 모음·공백·문장부호는 버린다
export const typedKeys = (raw) => {
  const keys = [];
  for (const ch of String(raw || '').normalize('NFC')) {
    if (isSyllable(ch)) {
      const idx = ch.charCodeAt(0) - 0xac00;
      keys.push(CHO[Math.floor(idx / 588)]);
      for (const j of JONG[idx % 28]) keys.push(j);
    } else if (CLUSTER[ch]) {
      for (const j of CLUSTER[ch]) keys.push(j);
    } else if (isConsonant(ch)) {
      keys.push(ch);
    } else if (ch >= 'ᄀ' && ch <= 'ᄒ') {
      keys.push(JAMO_INITIAL[ch.charCodeAt(0) - 0x1100]);
    } else if (/[A-Za-z]/.test(ch)) {
      keys.push(ch.toLowerCase());
    } else if (/[0-9]/.test(ch)) {
      keys.push(ch);
    }
  }
  return keys;
};

export const sameKey = (typed, expected) => {
  if (!typed || !expected) return false;
  if (!DOUBLE_AS_SINGLE) return typed === expected;
  return (BASE[typed] || typed) === (BASE[expected] || expected);
};

// 친 글자로 본문을 채운 결과
//  words: [{ word, start, end, key, filled, wrong, misses, keyStart }]
//    filled = 채워짐, wrong = 기회를 다 써서 빨간 정답으로 채워짐, misses = 그 어절에서 틀린 횟수, keyStart = 그 어절의 첫 친 글자 번호
//  filledText = 채워진 데까지의 원문(답안 본문에 넣는 값), wrongCount = 빨간 어절, missingCount = 아직 안 채운 어절
//  pendingMisses = 지금 어절에서 이미 틀린 횟수(남은 기회 = CHANCES - pendingMisses), missTotal = 틀리게 친 글자 전체
//  last = 마지막 글자의 결과 'ok' | 'miss' | 'red' | null, done = 끝까지 채움, extra = 끝난 뒤 더 친 글자 수(버림)
export const fillByInitials = (body, raw) => {
  const tokens = tokenizeBody(body);
  const keys = typedKeys(raw);
  const words = tokens.map((t) => ({ ...t, filled: false, wrong: false, misses: 0, keyStart: -1 }));
  let k = 0;
  let end = 0;
  let wrongCount = 0;
  let missTotal = 0;
  let pendingMisses = 0;
  let last = null;
  let i = 0;
  // 글자 없는 어절은 앞 어절이 채워지면(맨 앞이면 첫 글자를 칠 때) 함께 채운다
  const autoFill = () => {
    while (i < words.length && words[i].key === null) { words[i].filled = true; end = words[i].end; i += 1; }
  };
  if (keys.length > 0) autoFill();
  while (i < words.length && k < keys.length) {
    const w = words[i];
    if (w.keyStart < 0) w.keyStart = k;
    const ok = sameKey(keys[k], w.key);
    k += 1;
    if (ok) {
      last = 'ok';
    } else {
      w.misses += 1;
      missTotal += 1;
      if (w.misses < CHANCES) { last = 'miss'; continue; }
      w.wrong = true;
      wrongCount += 1;
      last = 'red';
    }
    w.filled = true;
    end = w.end;
    i += 1;
    autoFill();
  }
  if (i < words.length) pendingMisses = words[i].misses;
  const keyed = words.filter((w) => w.key !== null);
  const missingCount = keyed.filter((w) => !w.filled).length;
  return {
    words,
    filledText: String(body || '').slice(0, end),
    wrongCount,
    missingCount,
    missTotal,
    pendingMisses,
    last,
    total: keyed.length,
    filledCount: keyed.length - missingCount,
    done: words.length > 0 && words.every((w) => w.filled),
    extra: keys.length - k,
  };
};

// 친 글자 차례 → 입력칸 값(한 글자 = 초성 하나라 다시 읽어도 같은 차례가 나온다)
export const keysToRaw = (keys) => keys.join('');

// 백스페이스 = 마지막으로 채운 어절 하나 되돌리기. 그 어절에서 틀린 횟수와, 지금 어절에서 이미 틀린 것도 함께 지운다
// (틀린 글자만 골라 지워 기회를 되살리지 못하게). 채운 어절이 없으면 지금 어절의 틀린 것만 지운다
export const dropLastWord = (body, raw) => {
  const keys = typedKeys(raw);
  const { words } = fillByInitials(body, raw);
  const lastFilled = [...words].reverse().find((w) => w.filled && w.key !== null);
  return keysToRaw(keys.slice(0, lastFilled ? lastFilled.keyStart : 0));
};
