// src/components/NavDrawer.js
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Collapse, Button, FormControl, InputLabel, Select, MenuItem, Typography, Slider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { THEMES, TURN_SCHEDULE_KEY } from '../constants';
import { DataContext } from '../contexts/DataContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { saveDataToLocal } from '../api/localStorageApi';
import ControlPanel from './ControlPanel';

import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import PaletteIcon from '@mui/icons-material/Palette';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ViewListIcon from '@mui/icons-material/ViewList';
import StyleIcon from '@mui/icons-material/Style';
import ConstructionIcon from '@mui/icons-material/Construction';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import TuneIcon from '@mui/icons-material/Tune';

const NavDrawer = ({ open, onClose, settings, setters, onResetDialogOpen }) => {
  const [openSetup, setOpenSetup] = useState(true);
  const [openTheme, setOpenTheme] = useState(false);
  const [openTTS, setOpenTTS] = useState(false);

  const { themeKey, fontType, ttsOrder, voiceURI, speechRate, ttsInterval, audioPriority } = settings;
  const { setThemeKey, setFontType, setTtsOrder, setVoiceURI, setSpeechRate, setTtsInterval, setAudioPriority } = setters;

  const { originalVerses, turnScheduleData, setTurnScheduleData } = useContext(DataContext);
  const { showSnackbar } = useSnackbar();

  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      let koVoices = allVoices.filter(v => v.lang.includes('ko'));

      koVoices.sort((a, b) => {
        const isASamsung = a.name.toLowerCase().includes('samsung') || a.name.toLowerCase().includes('smt');
        const isBSamsung = b.name.toLowerCase().includes('samsung') || b.name.toLowerCase().includes('smt');
        if (isASamsung && !isBSamsung) return -1;
        if (!isASamsung && isBSamsung) return 1;
        const isAGood = a.name.includes('Google') || a.name.includes('Online') || a.name.includes('Premium');
        const isBGood = b.name.includes('Google') || b.name.includes('Online') || b.name.includes('Premium');
        if (isAGood && !isBGood) return -1;
        if (!isAGood && isBGood) return 1;
        return a.name.localeCompare(b.name);
      });

      setVoices(koVoices);
      if (koVoices.length > 0 && (!voiceURI || !koVoices.find(v => v.voiceURI === voiceURI))) {
        setVoiceURI(koVoices[0].voiceURI);
      }
    };
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [voiceURI, setVoiceURI]);

  const displayedCategories = useMemo(() => {
    if (!originalVerses) return ['전체'];
    const relevantVerses = settings.mode === 'pending' ? originalVerses.filter(v => v.미암송여부) : (originalVerses || []).filter(v => !v.미암송여부);
    return ['전체', ...new Set(relevantVerses.map(v => v.카테고리).filter(Boolean))];
  }, [settings.mode, originalVerses]);

  const displayedSubcategories = useMemo(() => {
    if (!originalVerses) return ['전체'];
    const { selectedCategories } = settings;
    const relevantVerses = (originalVerses || []).filter(v => !v.미암송여부);
    const filteredByCategory = (selectedCategories.includes('전체') || selectedCategories.length === 0) ? relevantVerses : relevantVerses.filter(v => selectedCategories.includes(v.카테고리));
    return ['전체', ...new Set(filteredByCategory.map(v => v.소카테고리).filter(Boolean))];
  }, [settings.selectedCategories, originalVerses]);

  const handleSaveTurnSchedule = (newSchedule, displaySnackbar = false) => {
    const updatedScheduleData = { ...turnScheduleData, [settings.targetTurn]: newSchedule };
    setTurnScheduleData(updatedScheduleData);
    saveDataToLocal(TURN_SCHEDULE_KEY, updatedScheduleData);
    if (displaySnackbar) showSnackbar('현재 차수 일정이 저장되었습니다.', 'success');
  };

  const dailyGoalDisplay = useMemo(() => {
    const schedule = turnScheduleData ? turnScheduleData[settings.targetTurn] : null;
    if (settings.mode !== 'turnBasedReview' || !schedule || !schedule.startDate || !schedule.endDate || !originalVerses) return null;
    const start = new Date(schedule.startDate);
    const end = new Date(schedule.endDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
    if (today < start || today > end) return null;
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const elapsedDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const remainingDays = totalDays - elapsedDays;
    const { selectedCategories, selectedSubcategories } = settings;
    const categoryFilter = v => (selectedCategories.includes('전체') || selectedCategories.length === 0 || selectedCategories.includes(v.카테고리)) && (selectedSubcategories.includes('전체') || selectedSubcategories.length === 0 || selectedSubcategories.includes(v.소카테고리));
    const targetVerses = originalVerses.filter(v => !v.미암송여부 && !v.뉴구절여부 && !v.최근구절여부 && (v.currentReviewTurn || 1) === settings.targetTurn && (v.maxCompletedTurn || 0) < settings.targetTurn && categoryFilter(v));
    if (remainingDays <= 0 || targetVerses.length === 0) return null;
    const dailyGoal = Math.ceil(targetVerses.length / remainingDays);
    return `남은 ${remainingDays}일간 하루 ${dailyGoal}개 암송 필요`;
  }, [settings.mode, settings.targetTurn, settings.selectedCategories, settings.selectedSubcategories, turnScheduleData, originalVerses]);

  const menuItems = [
    { text: '홈', icon: <HomeIcon />, path: '/' },
    { text: '구절 목록', icon: <ViewListIcon />, path: '/list' },
    { text: '구절 관리', icon: <ConstructionIcon />, path: '/manage' },
    { text: '태그 관리', icon: <StyleIcon />, path: '/tags' },
    { text: '암송 시험', icon: <AssignmentIcon />, path: '/test' },
    { text: '통계', icon: <AnalyticsIcon />, path: '/stats' },
    { text: '설정', icon: <TuneIcon />, path: '/settings' },
    { text: '사용 안내', icon: <HelpOutlineIcon />, path: '/guide' },
  ];

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }} role="presentation">
        <List>
          <ListItem disablePadding><ListItemButton component={RouterLink} to="/" onClick={onClose}><ListItemIcon>{menuItems[0].icon}</ListItemIcon><ListItemText primary={menuItems[0].text} /></ListItemButton></ListItem>
          <Divider sx={{ my: 1 }} />

          <ListItemButton onClick={() => setOpenSetup(!openSetup)}><ListItemIcon><SettingsIcon /></ListItemIcon><ListItemText primary="복습 설정" />{openSetup ? <ExpandLess /> : <ExpandMore />}</ListItemButton>
          <Collapse in={openSetup} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2 }}>
              <ControlPanel settings={settings} setters={setters} displayedCategories={displayedCategories} displayedSubcategories={displayedSubcategories} turnSchedule={turnScheduleData ? turnScheduleData[settings.targetTurn] : {}} onSaveTurnSchedule={handleSaveTurnSchedule} dailyGoalDisplay={dailyGoalDisplay} />
            </Box>
          </Collapse>

          <ListItemButton onClick={() => setOpenTTS(!openTTS)}><ListItemIcon><RecordVoiceOverIcon /></ListItemIcon><ListItemText primary="음성 및 폰트 설정" />{openTTS ? <ExpandLess /> : <ExpandMore />}</ListItemButton>
          <Collapse in={openTTS} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>폰트 선택</InputLabel>
                <Select value={fontType} label="폰트 선택" onChange={(e) => setFontType(e.target.value)}>
                  <MenuItem value="gothic" style={{ fontFamily: 'sans-serif' }}>고딕 (기본)</MenuItem>
                  <MenuItem value="myeongjo" style={{ fontFamily: "'Nanum Myeongjo', serif", fontWeight: 'bold' }}>나눔 명조</MenuItem>
                  <MenuItem value="batang" style={{ fontFamily: "'Gowun Batang', serif", fontWeight: 'bold' }}>고운 바탕</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>음성 읽기 순서</InputLabel>
                <Select value={ttsOrder} label="음성 읽기 순서" onChange={(e) => setTtsOrder(e.target.value)}>
                  <MenuItem value="ref-title-body-ref">장절 - 제목 - 본문 - 장절</MenuItem>
                  <MenuItem value="ref-body-ref">장절 - 본문 - 장절</MenuItem>
                  <MenuItem value="ref-body">장절 - 본문</MenuItem>
                  <MenuItem value="body-only">본문만 (참조 없음)</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>목소리 선택</InputLabel>
                <Select value={voiceURI || ''} label="목소리 선택" onChange={(e) => setVoiceURI(e.target.value)}>
                  {voices.map((v) => (<MenuItem key={v.voiceURI} value={v.voiceURI}>{v.name}</MenuItem>))}
                  {voices.length === 0 && <MenuItem value="" disabled>한국어 음성 없음</MenuItem>}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>재생 우선순위</InputLabel>
                <Select value={audioPriority} label="재생 우선순위" onChange={(e) => setAudioPriority(e.target.value)}>
                  <MenuItem value="recording">녹음 파일 우선 (기본)</MenuItem>
                  <MenuItem value="tts">TTS 우선 (녹음 무시)</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="caption" color="text.secondary">암송 간격 (장절 후 대기): {ttsInterval}초</Typography>
                <Slider value={ttsInterval} min={0} max={5} step={0.5} onChange={(e, newVal) => setTtsInterval(newVal)} valueLabelDisplay="auto" size="small" />
              </Box>
              <Box><Typography variant="caption" color="text.secondary">읽기 속도: {speechRate}x</Typography><Slider value={speechRate} min={0.5} max={2.0} step={0.1} onChange={(e, newVal) => setSpeechRate(newVal)} valueLabelDisplay="auto" size="small" /></Box>
            </Box>
          </Collapse>

          <ListItemButton onClick={() => setOpenTheme(!openTheme)}><ListItemIcon><PaletteIcon /></ListItemIcon><ListItemText primary="테마 설정" />{openTheme ? <ExpandLess /> : <ExpandMore />}</ListItemButton>
          <Collapse in={openTheme} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.keys(THEMES).map(key => (
                <Button key={key} variant={themeKey === key ? 'contained' : 'outlined'} onClick={() => { setThemeKey(key); onClose(); }} size="small" sx={{ flexGrow: 1, color: themeKey === key ? 'white' : 'default', backgroundImage: THEMES[key], textTransform: 'capitalize' }}>{key}</Button>
              ))}
            </Box>
          </Collapse>
          <Divider sx={{ my: 1 }} />
          {menuItems.slice(1).map((item) => (<ListItem key={item.text} disablePadding><ListItemButton component={RouterLink} to={item.path} onClick={onClose}><ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.text} /></ListItemButton></ListItem>))}
        </List>
        <Box sx={{ p: 1, mt: 'auto' }}><Button fullWidth variant="outlined" color="error" startIcon={<RestartAltIcon />} onClick={() => { onResetDialogOpen(); onClose(); }}>복습 기록 초기화</Button></Box>
      </Box>
    </Drawer>
  );
};

export default NavDrawer;