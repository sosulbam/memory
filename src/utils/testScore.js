// src/utils/testScore.js
// 암송 시험 문제별 감점 제안 (#300, 2026-11-22 부장님 규칙)
//  - 만점 0, 한 문제 최대 -5
//  - 제목 틀림 -1 (OYO 는 제목을 채점하지 않으므로 0)
//  - 틀린 단어(어절) 하나마다 -1 — 다르게 쓴 어절·빠뜨린 어절·더 쓴 어절
//  - 띄어쓰기·문장부호는 무시, 글자가 하나라도 다르면 틀린 단어 (「맞춤법 무시」 = 가안)
//  - 힌트(첫 3어절) 보기 -1
// 앱은 점수를 「제안」만 하고, 사람이 고쳐서 확정한다.
import { diffChars } from 'diff';
import { normalizeText } from './textUtils';
import { fillByInitials } from './initialInput';

export const MAX_PENALTY = 5;
export const HINT_WORDS = 3;

export const hintText = (body) =>
  String(body || '').trim().split(/\s+/).slice(0, HINT_WORDS).join(' ');

// 원문 어절 기준으로 몇 개가 틀렸는지 센다.
// 띄어쓰기를 무시하려고 양쪽을 붙여 쓴 글자열로 비교하고, 다른 글자를 원문 어절에 되짚어 센다.
// 어절 사이에 끼어든 글자(더 쓴 말)는 그 틈 하나를 틀린 단어 하나로 센다.
export const countWrongWords = (original, answer) => {
  const words = String(original || '').trim().split(/\s+/).map(normalizeText).filter(Boolean);
  if (words.length === 0) return 0;
  const owner = [];                       // 붙여 쓴 원문 글자 i → 어절 번호
  words.forEach((w, wi) => { for (let k = 0; k < w.length; k++) owner.push(wi); });
  const O = words.join('');
  const A = normalizeText(answer);
  if (!A) return words.length;

  const wrong = new Set();
  const gaps = new Set();
  const parts = diffChars(O, A);
  let pos = 0;
  parts.forEach((part, i) => {
    const len = part.value.length;
    if (part.removed) {
      for (let k = pos; k < pos + len; k++) wrong.add(owner[k]);
      pos += len;
    } else if (part.added) {
      const prevRemoved = i > 0 && parts[i - 1].removed;
      const nextRemoved = i + 1 < parts.length && parts[i + 1].removed;
      if (prevRemoved || nextRemoved) return;                     // 바꿔 쓴 것 — 지운 쪽에서 이미 셌다
      if (pos > 0 && pos < O.length && owner[pos - 1] === owner[pos]) wrong.add(owner[pos]); // 어절 안에 끼어듦
      else gaps.add(pos);                                          // 어절 사이(또는 앞뒤)에 더 쓴 말
    } else {
      pos += len;
    }
  });
  return wrong.size + gaps.size;
};

// 제안 점수와 내역
//  초성 입력(#362)은 친 초성으로 다시 계산한다 — 틀린 어절(기회 3번을 다 써서 빨간 정답으로 채운 것) + 아직 안 채운 어절
// 제목 맞음 여부 — 초성 입력(#372)은 제목도 초성으로: 끝까지 채우고 빨간 어절(3번 다 틀림)이 없어야 맞음.
//  제목이 없는 구절은 맞음. 초성 제목 칸이 생기기 전 저장본(titleInitials 없음)은 전체 입력처럼 글자로 비교
export const titleFill = (verse, answer) => fillByInitials(verse?.제목, answer?.titleInitials);
export const isTitleRight = ({ verse, answer, initialMode }) => {
  if (initialMode && answer?.titleInitials !== undefined) {
    const f = titleFill(verse, answer);
    return f.total === 0 || (f.done && f.wrongCount === 0);
  }
  return normalizeText(verse?.제목) === normalizeText(answer?.title);
};

export const suggestScore = ({ verse, answer, isOyo, hintUsed, initialMode }) => {
  const titleWrong = !isOyo && !isTitleRight({ verse, answer, initialMode });
  const fill = initialMode ? fillByInitials(verse.본문, answer?.initials) : null;
  const wrongWords = fill ? fill.wrongCount + fill.missingCount : countWrongWords(verse.본문, answer?.body);
  const raw = (titleWrong ? 1 : 0) + wrongWords + (hintUsed ? 1 : 0);
  return { score: raw ? -Math.min(MAX_PENALTY, raw) : 0, titleWrong, wrongWords, hintUsed: !!hintUsed, raw,
    ...(fill ? { initialMode: true, missTotal: fill.missTotal + (answer?.titleInitials !== undefined ? titleFill(verse, answer).missTotal : 0) } : {}) };
};

export const scoreBreakdown = ({ titleWrong, wrongWords, hintUsed, raw }) => {
  const items = [];
  if (titleWrong) items.push('제목 -1');
  if (wrongWords) items.push(`틀린 단어 ${wrongWords}개 -${wrongWords}`);
  if (hintUsed) items.push('힌트 -1');
  if (raw > MAX_PENALTY) items.push(`최대 -${MAX_PENALTY}`);
  return items.length ? items.join(' · ') : '감점 없음';
};
