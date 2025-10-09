import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// Contexts & Providers
import { SnackbarProvider, useSnackbar } from './contexts/SnackbarContext';
import { DataProvider, DataContext } from './contexts/DataContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { useAppSettings } from './hooks/useAppSettings';

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

import './App.css';

const pageTitles = {
  '/': '말씀사랑',
  '/stats': '📊 복습 통계',
  '/list': '📄 전체 구절 보기',
  '/manage': '🛠 구절 관리',
  '/tags': '🏷️ 전체 태그 관리',
  '/guide': '📘 사용법 안내',
  '/log': '📅 복습 로그',
  '/test': '📝 암송 시험',
};

// AppLayout: 모든 페이지에 공통 UI 적용
const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  const location = useLocation();
  const { settings, setters } = useAppSettings();
  const { resetReviewStatus } = useContext(DataContext);
  const { showSnackbar } = useSnackbar();

  const handleReset = (type) => {
    resetReviewStatus(type, showSnackbar);
  };

  const title = pageTitles[location.pathname] || '말씀사랑';
  const isHomePage = location.pathname === '/';

  return (
    <>
      <NavDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onResetDialogOpen={() => setResetDialogOpen(true)}
        settings={settings}
        setters={setters}
      />
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        p: '8px 16px',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 1100,
      }}>
        <IconButton onClick={() => setDrawerOpen(true)}>
          <MenuIcon />
        </IconButton>
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
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
          <Router> {/* basename="/verse" 속성을 제거했습니다. */}
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/list" element={<VerseList />} />
                <Route path="/manage" element={<VerseManager />} />
                <Route path="/tags" element={<TagManager />} />
                <Route path="/guide" element={<UsageGuide />} />
                <Route path="/log" element={<ReviewLogPage />} />
                <Route path="/test" element={<RecitationTestPage />} />
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