// src/lampTheme.js
// 등불 암송(lamp) 전용 MUI 테마 — 사이트(apps.sosulbaram.com)와 같은 톤: 먹색·아이보리, 명조 제목, 얇은 선, 그림자 없음.
// 기본판(Netlify 공개판)은 이 테마를 쓰지 않는다(index.js 에서 IS_LAMP 일 때만 감싼다).
import { createTheme } from '@mui/material/styles';
import { koKR } from '@mui/material/locale';

export const LAMP = {
  ink: '#1C1C1A',
  sub: '#5F5E5A',
  hair: '#E2DFD8',
  ivory: '#F8F6F1',
  paper: '#FFFFFF',
  serif: "'Nanum Myeongjo', 'AppleMyungjo', 'Batang', serif",
  sans: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
};

const serifHeading = { fontFamily: LAMP.serif, fontWeight: 700, letterSpacing: '-0.01em' };

export const lampTheme = createTheme({
  palette: {
    primary: { main: LAMP.ink, light: '#3A3A37', dark: '#000000', contrastText: '#FFFFFF' },
    secondary: { main: '#5F5E5A', contrastText: '#FFFFFF' },
    error: { main: '#A3271F' },
    warning: { main: '#8A5A12' },
    success: { main: '#2E6B47' },
    info: { main: '#2F4B6B' },
    background: { default: LAMP.ivory, paper: LAMP.paper },
    text: { primary: '#151514', secondary: LAMP.sub },
    divider: LAMP.hair,
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: LAMP.sans,
    h1: serifHeading, h2: serifHeading, h3: serifHeading, h4: serifHeading, h5: serifHeading, h6: serifHeading,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // 한글이 낱말 중간에서 끊기지 않게(검토 14번)
        body: { wordBreak: 'keep-all', overflowWrap: 'anywhere', backgroundColor: LAMP.ivory },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: `1px solid ${LAMP.hair}` } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 4 } } },
  },
}, koKR);
