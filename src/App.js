import React, { useState, useContext, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';

// Contexts & Providers
import { SnackbarProvider, useSnackbar } from './contexts/SnackbarContext';
import { DataProvider, DataContext } from './contexts/DataContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { useAppSettings } from './hooks/useAppSettings';
import { useDailyNewRecentReset } from './hooks/useDailyNewRecentReset';

// Components
import NavDrawer from './components/NavDrawer';
import ResetDialog from './components/ResetDialog';

// Pages
import HomePage from './pages/HomePage';
import Stats from './pages/Stats';
import VerseList from './pages/VerseList';
import VerseManager from './pages/VerseManager';
import TagManager from './pages/TagManager';
import UsageGuide from './pages/UsageGuide';
import ReviewLogPage from './pages/ReviewLogPage';
import RecitationTestPage from './pages/RecitationTestPage';
import LampTestPage from './pages/LampTestPage'; // 등불판 시험(#400) — 기본판은 종전 RecitationTestPage
import SettingsPage from './pages/SettingsPage';
import VerseTreePage from './pages/VerseTreePage';
import PacksPage from './pages/PacksPage';
import { IS_LAMP, LAMP_LOOK, APP_NAME, PUBLIC_URL } from './edition';

import './App.css';

const pageTitles = {
  '/': APP_NAME,
  '/stats': '📊 복습 통계',
  '/list': '📄 전체 구절 보기',
  '/manage': '🛠 구절 관리',
  '/tags': '🏷️ 전체 태그 관리',
  '/guide': '📘 사용법 안내',
  '/log': '📅 복습 로그',
  '/test': '📝 암송 시험',
  '/settings': '⚙️ 설정',
  '/tree': '🌳 구절 구조 보기',
  '/packs': '📦 암송 팩',
};
// 등불판 제목은 이모지 없이(사이트 톤)
const LAMP_PAGE_TITLES = {
  '/': APP_NAME, '/stats': '복습 통계', '/list': '구절 목록', '/manage': '구절 관리', '/tags': '태그 관리',
  '/guide': '사용 안내', '/log': '복습 기록', '/test': '암송 시험', '/settings': '설정', '/tree': '구절 구조 보기', '/packs': '암송 팩',
};

// AppLayout: 모든 페이지에 공통 UI 적용
const AppLayout = () => {
  const [drawerOpen, setDrawerOpenState] = useState(false);
  // 「일정 정하기」처럼 서랍을 열며 복습 설정을 펼쳐야 할 때 { setup: true }
  const [drawerFocus, setDrawerFocus] = useState(null);
  const setDrawerOpen = useCallback((open, focus = null) => { setDrawerFocus(open ? focus : null); setDrawerOpenState(open); }, []);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  const location = useLocation();

  // 등불판: 화면을 옮기면 맨 위부터(앞 화면 스크롤 위치가 이어지지 않게)
  useEffect(() => { if (IS_LAMP) window.scrollTo(0, 0); }, [location.pathname]);
  const { settings, setters } = useAppSettings();
  const { resetReviewStatus } = useContext(DataContext);
  const { showSnackbar } = useSnackbar();
  useDailyNewRecentReset();

  // 새 버전 감지
  useEffect(() => {
    const handler = (e) => setSwRegistration(e.detail);
    window.addEventListener('swUpdateAvailable', handler);
    return () => window.removeEventListener('swUpdateAvailable', handler);
  }, []);

  const handleUpdate = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      swRegistration.waiting.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  const handleReset = (type, options) => {
    resetReviewStatus(type, showSnackbar, options);
    // 등불판: 통계처럼 저장소를 직접 읽는 화면이 바로 새 값을 보이게(R2)
    if (IS_LAMP) setTimeout(() => window.dispatchEvent(new Event('lamp-data-reset')), 0);
    // 차수 기록을 지우면 선택된 목표 차수도 1차로 되돌린다
    // (기록은 0인데 목표만 3차면 다음 완료가 1·2차를 건너뛰고 3차로 찍히는 것 방지)
    if (type === 'all' || type === 'all_turns' || type === 'all_turns_every') setters.setTargetTurn(1);
    if (type === 'all' || type === 'all_turns_new' || type === 'all_turns_every') setters.setTargetTurnForNew(1);
    if (type === 'all' || type === 'all_turns_recent' || type === 'all_turns_every') setters.setTargetTurnForRecent(1);
  };

  const title = (LAMP_LOOK ? LAMP_PAGE_TITLES : pageTitles)[location.pathname] || APP_NAME;
  const isHomePage = location.pathname === '/';

  return (
    <>
      <NavDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onResetDialogOpen={() => setResetDialogOpen(true)}
        focus={drawerFocus}
        settings={settings}
        setters={setters}
      />
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        p: '8px 16px',
        // 폰이 화면을 상태바 밑까지 채워 그릴 때(안드로이드 edge-to-edge) 제목이 가려지지 않게
        pt: 'calc(8px + var(--sat))',
        borderBottom: LAMP_LOOK ? '1px solid #E2DFD8' : '1px solid #eee',
        position: 'sticky',
        top: 0,
        backgroundColor: LAMP_LOOK ? 'rgba(248, 246, 241, 0.94)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 1100,
      }}>
        <IconButton onClick={() => setDrawerOpen(true)} aria-label="메뉴 열기">
          <MenuIcon />
        </IconButton>
        <Typography 
          variant="h5" 
          component="h1" 
          sx={LAMP_LOOK ? {
            fontWeight: 700,
            fontSize: '1.3rem',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            color: 'text.primary',
          } : {
            fontWeight: 'bold',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textShadow: isHomePage ? '2px 2px 4px rgba(0,0,0,0.2)' : 'none',
            color: isHomePage ? 'primary.dark' : 'inherit',
          }}
        >
          {title}
        </Typography>
        <Box sx={{width: 40}} />
      </Box>

      {/* 새 버전 업데이트 배너 */}
      {swRegistration && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1,
          bgcolor: '#1565c0', color: 'white',
          position: 'sticky', top: 'calc(57px + var(--sat))', zIndex: 1099,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SystemUpdateIcon fontSize="small" />
            <Typography variant="body2">새 버전이 있습니다</Typography>
          </Box>
          <Button size="small" variant="contained" onClick={handleUpdate}
            sx={{ bgcolor: 'white', color: '#1565c0', fontWeight: 'bold', '&:hover': { bgcolor: '#e3f2fd' } }}>
            지금 업데이트
          </Button>
        </Box>
      )}

      <Outlet context={{ setDrawerOpen }} />
      <ResetDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onReset={handleReset}
      />
    </>
  );
};


function App() {
  return (
    <SnackbarProvider>
      <DataProvider>
        <AppSettingsProvider>
          {/* --- 👇 여기가 수정된 부분입니다 --- */}
          <Router basename={PUBLIC_URL || undefined}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/list" element={<VerseList />} />
                <Route path="/manage" element={<VerseManager />} />
                <Route path="/tags" element={<TagManager />} />
                <Route path="/guide" element={<UsageGuide />} />
                <Route path="/log" element={<ReviewLogPage />} />
                <Route path="/test" element={IS_LAMP ? <LampTestPage /> : <RecitationTestPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/tree" element={<VerseTreePage />} />
                {IS_LAMP && <Route path="/packs" element={<PacksPage />} />}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Router>
        </AppSettingsProvider>
      </DataProvider>
    </SnackbarProvider>
  );
}

export default App;