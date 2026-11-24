// src/hooks/useDailyNewRecentReset.js
// 날이 바뀌면 뉴구절·최근구절 「했음」 표시(뉴구절복습여부·최근구절복습여부)를 지운다 (#351).
// 뉴·최근은 날마다 도는 복습이라, 어제 한 표시가 남으면 오늘 목록이 비어 「완료」로 보인다.
//  · 지우는 것은 두 표시뿐 — 전체 복습·오답·즐겨찾기·차수(maxCompletedTurn*)·통계(REVIEW_LOG)는 그대로
//  · 차수별 뉴·최근(turnBased*)은 maxCompletedTurnFor* 로 완료를 판정하므로 이 초기화와 무관하다
//  · 앱을 열 때와 다시 화면으로 돌아왔을 때 한 번. 마지막으로 확인한 날짜를 저장해 하루 한 번만
//  · 집중모드(복습 중)에는 미루고, 홈으로 나오면 그때 지운다 — 자정 넘어 복습 중인 목록이 흔들리지 않게
//  · 오늘 복습한 구절(복습날짜 === 오늘)의 표시는 남긴다 — 업데이트 첫날 아침에 한 것까지 지우지 않게
import { useEffect, useCallback, useContext } from 'react';
import { DataContext } from '../contexts/DataContext';
import { useAppSettings } from './useAppSettings';
import { useSnackbar } from '../contexts/SnackbarContext';
import { loadDataFromLocal, saveDataToLocal } from '../api/localStorageApi';
import { DAILY_RESET_KEY } from '../constants';
import { getReviewDateStr } from '../utils/reviewScope';
import { IS_LAMP } from '../edition';

const NOTICE = IS_LAMP ? '오늘 새 구절·최근 구절 복습을 처음부터 시작합니다' : '오늘 뉴·최근 복습을 새로 시작합니다';

// 날짜는 복습날짜와 같은 기기 날짜("YYYY. M. D") — 둘이 어긋나면 오늘 한 표시를 지울 수 있다
export const useDailyNewRecentReset = () => {
  const { isLoading, originalVerses, resetReviewStatus } = useContext(DataContext);
  const { settings, isLoaded } = useAppSettings();
  const { showSnackbar } = useSnackbar();
  const enabled = settings.dailyNewRecentReset !== false;
  const inSession = settings.isFocusMode;

  const check = useCallback(() => {
    if (isLoading || !isLoaded || !enabled || inSession) return;
    // 로드 직후 한 박자는 originalVerses 가 아직 비어 있다 — 그때 날짜를 남기면 오늘 초기화를 건너뛴다
    if (!originalVerses || originalVerses.length === 0) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const today = getReviewDateStr();
    const saved = loadDataFromLocal(DAILY_RESET_KEY);
    if (saved && saved.date === today) return;

    const verseIds = (originalVerses || [])
      .filter(v => (v.뉴구절복습여부 || v.최근구절복습여부) && v.복습날짜 !== today)
      .map(v => v.id);
    saveDataToLocal(DAILY_RESET_KEY, { date: today });
    if (verseIds.length === 0) return; // 지울 것이 없으면 알림 없이 날짜만 남긴다(처음 설치한 날 등)
    resetReviewStatus('daily_new_recent', () => {}, { verseIds, skipLog: true });
    showSnackbar(NOTICE, 'info');
  }, [isLoading, isLoaded, enabled, inSession, originalVerses, resetReviewStatus, showSnackbar]);

  // 열 때 · 데이터 로드가 끝났을 때 · 집중모드에서 홈으로 나왔을 때
  useEffect(() => { check(); }, [check]);

  // 다시 화면으로 돌아왔을 때(앱 전환·화면 켜기·뒤로 가기 캐시)
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('pageshow', onShow);
    return () => {
      document.removeEventListener('visibilitychange', onShow);
      window.removeEventListener('pageshow', onShow);
    };
  }, [check]);
};
