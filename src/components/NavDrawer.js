// src/components/NavDrawer.js
import React, { useState, useMemo, useContext } from 'react';
import { Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Collapse, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { THEMES, TURN_SCHEDULE_KEY } from '../constants';
import { DataContext } from '../contexts/DataContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { saveDataToLocal } from '../api/localStorageApi'; // saveDataToServer 대신 saveDataToLocal을 import 합니다.
import ControlPanel from './ControlPanel';

// 아이콘
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

const NavDrawer = ({ open, onClose, settings, setters, onResetDialogOpen }) => {
  const [openSetup, setOpenSetup] = useState(true);
  const [openTheme, setOpenTheme] = useState(false);
  const { themeKey } = settings;
  const { setThemeKey } = setters;
  
  const { originalVerses, turnScheduleData, setTurnScheduleData } = useContext(DataContext);
  const { showSnackbar } = useSnackbar();

  const displayedCategories = useMemo(() => {
    if (!originalVerses) return ['전체'];
    const relevantVerses = settings.mode === 'pending'
      ? originalVerses.filter(v => v.미암송여부)
      : (originalVerses || []).filter(v => !v.미암송여부);
    return ['전체', ...new Set(relevantVerses.map(v => v.카테고리).filter(Boolean))];
  }, [settings.mode, originalVerses]);

  const displayedSubcategories = useMemo(() => {
    if (!originalVerses) return ['전체'];
    const { selectedCategories } = settings;
    
    const relevantVerses = (originalVerses || []).filter(v => !v.미암송여부);

    const filteredByCategory = (selectedCategories.includes('전체') || selectedCategories.length === 0)
        ? relevantVerses
        : relevantVerses.filter(v => selectedCategories.includes(v.카테고리));

    return ['전체', ...new Set(filteredByCategory.map(v => v.소카테고리).filter(Boolean))];
  }, [settings.selectedCategories, originalVerses]);

  // --- 👇 여기가 수정된 부분입니다 ---
  const handleSaveTurnSchedule = (newSchedule, displaySnackbar = false) => {
    const updatedScheduleData = {
        ...turnScheduleData,
        [settings.targetTurn]: newSchedule
    };
    
    setTurnScheduleData(updatedScheduleData);
    saveDataToLocal(TURN_SCHEDULE_KEY, updatedScheduleData); // saveDataToLocal을 사용합니다.

    // success 체크 로직을 제거하고, 스낵바를 표시해야 할 때 항상 성공 메시지를 보여줍니다.
    if (displaySnackbar) {
        showSnackbar('현재 차수 일정이 저장되었습니다.', 'success');
    }
  };

  const dailyGoalDisplay = useMemo(() => {
    const schedule = turnScheduleData ? turnScheduleData[settings.targetTurn] : null;
    if (settings.mode !== 'turnBasedReview' || !schedule || !schedule.startDate || !schedule.endDate || !originalVerses) return null;
    
    const start = new Date(schedule.startDate);
    const end = new Date(schedule.endDate);
    const today = new Date();
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (today < start || today > end) return null;

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const elapsedDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const remainingDays = totalDays - elapsedDays;
    
    const { selectedCategories, selectedSubcategories } = settings;
    const categoryFilter = v =>
        (selectedCategories.includes('전체') || selectedCategories.length === 0 || selectedCategories.includes(v.카테고리)) &&
        (selectedSubcategories.includes('전체') || selectedSubcategories.length === 0 || selectedSubcategories.includes(v.소카테고리));

    const targetVerses = originalVerses.filter(v => 
        !v.미암송여부 &&
        !v.뉴구절여부 &&
        !v.최근구절여부 &&
        (v.currentReviewTurn || 1) === settings.targetTurn &&
        (v.maxCompletedTurn || 0) < settings.targetTurn &&
        categoryFilter(v)
    );

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
    { text: '사용 안내', icon: <HelpOutlineIcon />, path: '/guide' },
  ];

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }} role="presentation">
        <List>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/" onClick={onClose}>
              <ListItemIcon>{menuItems[0].icon}</ListItemIcon>
              <ListItemText primary={menuItems[0].text} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 1 }} />
          
          <ListItemButton onClick={() => setOpenSetup(!openSetup)}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="복습 설정" />
            {openSetup ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openSetup} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2 }}>
              <ControlPanel 
                settings={settings} 
                setters={setters} 
                displayedCategories={displayedCategories} 
                displayedSubcategories={displayedSubcategories}
                turnSchedule={turnScheduleData ? turnScheduleData[settings.targetTurn] : {}}
                onSaveTurnSchedule={handleSaveTurnSchedule}
                dailyGoalDisplay={dailyGoalDisplay}
              />
            </Box>
          </Collapse>

          <ListItemButton onClick={() => setOpenTheme(!openTheme)}>
            <ListItemIcon><PaletteIcon /></ListItemIcon>
            <ListItemText primary="테마 설정" />
            {openTheme ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openTheme} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.keys(THEMES).map(key => (
                <Button key={key} variant={themeKey === key ? 'contained' : 'outlined'} onClick={() => { setThemeKey(key); onClose(); }} size="small"
                  sx={{ flexGrow: 1, color: themeKey === key ? 'white' : 'default', backgroundImage: THEMES[key], textTransform: 'capitalize' }}>
                  {key}
                </Button>
              ))}
            </Box>
          </Collapse>
          
          <Divider sx={{ my: 1 }} />

          {menuItems.slice(1).map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton component={RouterLink} to={item.path} onClick={onClose}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ p: 1, mt: 'auto' }}>
          <Button 
            fullWidth 
            variant="outlined" 
            color="error" 
            startIcon={<RestartAltIcon />} 
            onClick={() => { onResetDialogOpen(); onClose(); }}
          >
            복습 기록 초기화
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default NavDrawer;