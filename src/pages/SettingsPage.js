// src/pages/SettingsPage.js
import React from 'react';
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Paper, Slider, Button, Divider
} from '@mui/material';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import { useAppSettings } from '../hooks/useAppSettings';
import { THEMES } from '../constants';
import { useSnackbar } from '../contexts/SnackbarContext';

const FONT_SIZE_MARKS = [
  { value: 0, label: '작게' },
  { value: 1, label: '보통' },
  { value: 2, label: '크게' },
];
const FONT_SIZE_VALUES = ['small', 'medium', 'large'];

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
    {children}
  </Typography>
);

const REVIEW_SIZE_MAP  = { small: '0.9rem',  medium: '1.1rem',  large: '1.35rem' };
const LIST_SIZE_MAP    = { small: '0.85rem', medium: '1rem',    large: '1.2rem'  };

const SettingsPage = () => {
  const { settings, setters } = useAppSettings();
  const { fontSize, listFontSize, fontType, themeKey } = settings;
  const { setFontSize, setListFontSize, setFontType, setThemeKey } = setters;
  const { showSnackbar } = useSnackbar();

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      showSnackbar('캐시를 초기화했습니다. 잠시 후 새로고침됩니다.', 'success');
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      showSnackbar('캐시 초기화 중 오류가 발생했습니다.', 'error');
    }
  };

  const fontSizeIndex     = FONT_SIZE_VALUES.indexOf(fontSize)     === -1 ? 1 : FONT_SIZE_VALUES.indexOf(fontSize);
  const listFontSizeIndex = FONT_SIZE_VALUES.indexOf(listFontSize) === -1 ? 1 : FONT_SIZE_VALUES.indexOf(listFontSize);

  const previewFontSize = REVIEW_SIZE_MAP[fontSize] || REVIEW_SIZE_MAP.medium;
  const listPreviewSize = LIST_SIZE_MAP[listFontSize] || LIST_SIZE_MAP.medium;
  const previewFontFamily =
    fontType === 'myeongjo' ? "'Nanum Myeongjo', serif" :
    fontType === 'batang'   ? "'Gowun Batang', serif" :
    'sans-serif';

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2, pb: 6 }}>

      {/* 복습 카드 폰트 크기 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <SectionTitle>복습 카드 폰트 크기</SectionTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
          <TextDecreaseIcon fontSize="small" color="action" />
          <Slider
            value={fontSizeIndex}
            min={0} max={2} step={1}
            marks={FONT_SIZE_MARKS}
            onChange={(e, v) => setFontSize(FONT_SIZE_VALUES[v])}
            sx={{ flex: 1 }}
          />
          <TextIncreaseIcon fontSize="small" color="action" />
        </Box>
        <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>미리보기</Typography>
          <Typography sx={{ fontSize: previewFontSize, fontFamily: previewFontFamily, fontWeight: 'bold', lineHeight: 1.7, wordBreak: 'keep-all' }}>
            하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니
          </Typography>
          <Typography sx={{ fontSize: `calc(${previewFontSize} * 0.8)`, color: 'text.secondary', mt: 0.5 }}>
            요한복음 3:16
          </Typography>
        </Box>
      </Paper>

      {/* 목록/관리 폰트 크기 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <SectionTitle>구절 목록 · 관리 폰트 크기</SectionTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
          <TextDecreaseIcon fontSize="small" color="action" />
          <Slider
            value={listFontSizeIndex}
            min={0} max={2} step={1}
            marks={FONT_SIZE_MARKS}
            onChange={(e, v) => setListFontSize(FONT_SIZE_VALUES[v])}
            sx={{ flex: 1 }}
          />
          <TextIncreaseIcon fontSize="small" color="action" />
        </Box>
        <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>미리보기</Typography>
          <Typography sx={{ fontSize: listPreviewSize, fontFamily: previewFontFamily, fontWeight: 'bold' }}>
            요한복음 3:16
          </Typography>
          <Typography sx={{ fontSize: `calc(${listPreviewSize} * 0.9)`, color: 'text.secondary' }}>
            하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니
          </Typography>
        </Box>
      </Paper>

      {/* 폰트 종류 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <SectionTitle>폰트 종류</SectionTitle>
        <ToggleButtonGroup
          color="primary"
          value={fontType}
          exclusive
          onChange={(e, v) => { if (v) setFontType(v); }}
          size="small"
          fullWidth
        >
          <ToggleButton value="gothic" sx={{ fontFamily: 'sans-serif' }}>고딕</ToggleButton>
          <ToggleButton value="myeongjo" sx={{ fontFamily: "'Nanum Myeongjo', serif", fontWeight: 'bold' }}>나눔 명조</ToggleButton>
          <ToggleButton value="batang" sx={{ fontFamily: "'Gowun Batang', serif", fontWeight: 'bold' }}>고운 바탕</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* 테마 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <SectionTitle>테마 색상</SectionTitle>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.keys(THEMES).map(key => (
            <Box
              key={key}
              onClick={() => setThemeKey(key)}
              sx={{
                flex: '1 1 calc(25% - 8px)',
                minWidth: 70,
                height: 48,
                borderRadius: 1.5,
                backgroundImage: THEMES[key],
                cursor: 'pointer',
                border: themeKey === key ? '3px solid' : '2px solid transparent',
                borderColor: themeKey === key ? 'primary.main' : 'transparent',
                boxShadow: themeKey === key ? 3 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.1s',
                '&:active': { transform: 'scale(0.95)' },
              }}
            >
              <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.6)', fontSize: '0.7rem' }}>
                {key}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
      {/* 앱 업데이트 */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <SectionTitle>앱 업데이트</SectionTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          새 버전이 적용되지 않을 때 캐시를 초기화하면 최신 버전으로 업데이트돼요.
          <br />⚠️ 구절 데이터는 삭제되지 않아요.
        </Typography>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<SystemUpdateIcon />}
          onClick={handleClearCache}
        >
          캐시 초기화 및 최신 버전으로 업데이트
        </Button>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
