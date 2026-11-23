// src/utils/shareToday.js
// 「오늘 복습한 내용 보내기」(#342) — 오늘 복습한 구절을 카테고리별로 묶고, 암송짝에게 보낼 글을 만든다.
// ⚠️ 오늘 복습한 구절은 구절의 복습날짜("YYYY. M. D", 로컬)로 찾는다.
//    REVIEW_LOG(키 YYYY-MM-DD)는 모드별 개수만 들고 있어 어느 구절인지 모른다.
import { getReviewDateStr } from './reviewScope';

export const SHARE_PREFS_KEY = 'recitation-app-share-prefs';

export const catName = (v) => (v.카테고리 || '').trim() || '기타';

export const getTodayReviewed = (verses) => {
  const today = getReviewDateStr();
  return (verses || []).filter(v => v.복습날짜 === today);
};

// [{ name, verses }] — 카테고리 순서·묶음 안 순서 모두 번호순
export const groupByCategory = (verses) => {
  const byNum = [...verses].sort((a, b) => (a.번호 ?? Infinity) - (b.번호 ?? Infinity));
  const groups = [];
  const index = new Map();
  byNum.forEach(v => {
    const name = catName(v);
    if (!index.has(name)) { index.set(name, groups.length); groups.push({ name, verses: [] }); }
    groups[index.get(name)].verses.push(v);
  });
  return groups;
};

const todayMD = () => { const n = new Date(); return `${n.getMonth() + 1}/${n.getDate()}`; };

// format: 'full' = 장절 + 본문 / 'ref' = 장절만(확인용 본문은 아래에 따로)
export const buildShareText = (groups, selectedIds, { format = 'full', withTitle = false } = {}) => {
  const picked = groups
    .map(g => ({ name: g.name, verses: g.verses.filter(v => selectedIds.has(v.id)) }))
    .filter(g => g.verses.length);
  const total = picked.reduce((s, g) => s + g.verses.length, 0);
  if (!total) return '';

  const head = `${todayMD()} 오늘 복습 ${total}구절 (${picked.map(g => `${g.name} ${g.verses.length}`).join(' · ')})`;
  const titleOf = v => (withTitle && v.제목 ? ` ${v.제목}` : '');
  const lines = [head];
  let n = 0;
  const numbered = [];

  picked.forEach(g => {
    lines.push('', `[${g.name}]`);
    g.verses.forEach(v => {
      n += 1;
      numbered.push({ n, v });
      if (format === 'ref') {
        lines.push(`${n}. ${v.장절}${titleOf(v)}`);
      } else {
        lines.push(`${n}. ${v.장절}${titleOf(v)}`, v.본문 || '', '');
      }
    });
    if (format !== 'ref') lines.pop(); // 묶음 끝 빈 줄은 다음 머리 앞 빈 줄과 겹친다
  });

  if (format === 'ref') {
    lines.push('', '', '── 확인용 본문 ──');
    numbered.forEach(({ n: k, v }) => lines.push('', `${k}. ${v.장절}`, v.본문 || ''));
  }
  return lines.join('\n').trim();
};

export const copyText = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* 아래 방법으로 */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
};
