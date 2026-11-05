// src/utils/safeArea.js
// 폰 상태바·하단 버튼 줄에 앱이 가려지지 않게 하는 위/아래 여백.
// 기본(자동)은 폰이 알려 주는 값(env(safe-area-inset-*))을 쓰고,
// 폰이 0을 알려 주는데도 실제로 가려지는 기기(2026-11 갤럭시 S21 사례)를 위해 사용자가 최소 여백을 직접 고를 수 있다.
// 레이아웃은 전부 CSS 변수 --sat(위) / --sab(아래)만 쓴다.

export const SAFE_AREA_KEY = 'recitation-app-safe-area';
export const TOP_OPTIONS = ['auto', 24, 32, 40];
export const BOTTOM_OPTIONS = ['auto', 24, 48];

// 진단 줄에 표시 — 사용자가 새 버전을 받았는지 확인하는 용도
export const BUILD_ID = '2026-11-05 여백보정 v2';

export const loadSafeArea = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAFE_AREA_KEY) || '{}');
    return { top: v.top ?? 'auto', bottom: v.bottom ?? 'auto' };
  } catch {
    return { top: 'auto', bottom: 'auto' };
  }
};

// 수동 값은 '폰이 알려 준 값과 고른 값 중 큰 쪽' — 폰 값이 정상이면 이중으로 밀리지 않는다
const toCss = (side, val) => {
  const env = `env(safe-area-inset-${side}, 0px)`;
  return val === 'auto' ? env : `max(${env}, ${val}px)`;
};

export const applySafeArea = (sa) => {
  const style = document.documentElement.style;
  style.setProperty('--sat', toCss('top', sa.top));
  style.setProperty('--sab', toCss('bottom', sa.bottom));
};

export const saveSafeArea = (sa) => {
  try { localStorage.setItem(SAFE_AREA_KEY, JSON.stringify(sa)); } catch { /* 저장 실패해도 화면엔 적용 */ }
  applySafeArea(sa);
};

// 진단용: CSS 값이 실제로 몇 px로 계산되는지 잰다
export const measureCss = (value) => {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;visibility:hidden;padding-top:${value}`;
  document.body.appendChild(el);
  const px = parseFloat(getComputedStyle(el).paddingTop) || 0;
  el.remove();
  return Math.round(px);
};
