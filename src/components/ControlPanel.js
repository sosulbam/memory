// src/components/ControlPanel.js
import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { MODES } from '../constants';

const ControlPanel = ({
  settings,
  setters,
  displayedCategories,
  displayedSubcategories,
  turnSchedule = { startDate: '', endDate: '' },
  onSaveTurnSchedule,
  dailyGoalDisplay,
}) => {
  const {
    mode,
    order,
    selectedCategories,
    selectedSubcategories,
    targetTurn,
    targetTurnForNew,
    targetTurnForRecent,
    reviewView,
    fontSize,
  } = settings;
  const {
    setMode,
    setOrder,
    handleCategoryChange,
    handleSubcategoryChange,
    setTargetTurn,
    setTargetTurnForNew,
    setTargetTurnForRecent,
    setReviewView,
    setFontSize,
  } = setters;

  // --- 여기를 수정했습니다: 카테고리 선택 메뉴가 표시될 조건 변경 ---
  const showCategorySelectors = mode === 'category' || mode === 'pending' || mode.startsWith('turnBased');

  return (
    <Box>
      <Grid container spacing={1.5} mb={1} alignItems="flex-end">
        <Grid item xs={12}>
          <FormControl size="small" fullWidth>
            <InputLabel>복습 모드</InputLabel>
            <Select value={mode} label="복습 모드" onChange={(e) => setMode(e.target.value)}>
              {MODES.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {showCategorySelectors && (
            <>
                <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                    <InputLabel>카테고리 선택</InputLabel>
                    <Select
                        multiple
                        value={selectedCategories}
                        onChange={handleCategoryChange}
                        renderValue={(selected) => selected.includes('전체') || selected.length === 0 ? '전체' : selected.join(', ')}
                        label="카테고리 선택"
                        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                    >
                        {displayedCategories.map((cat) => (
                        <MenuItem key={cat} value={cat} sx={{ fontWeight: selectedCategories.includes(cat) ? 'bold' : 'normal' }}>
                            {cat}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                    <InputLabel>소카테고리 선택</InputLabel>
                    <Select
                        multiple
                        value={selectedSubcategories}
                        onChange={handleSubcategoryChange}
                        renderValue={(selected) => selected.includes('전체') || selected.length === 0 ? '전체' : selected.join(', ')}
                        label="소카테고리 선택"
                        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                    >
                        {displayedSubcategories.map((cat) => (
                        <MenuItem key={cat} value={cat} sx={{ fontWeight: selectedSubcategories.includes(cat) ? 'bold' : 'normal' }}>
                            {cat}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>
            </>
        )}

        {mode === 'turnBasedReview' && (
          <Grid item xs={12}>
            <FormControl size="small" fullWidth>
              <InputLabel>복습 차수</InputLabel>
              <Select value={targetTurn} label="복습 차수" onChange={(e) => setTargetTurn(Number(e.target.value))}>
                  <MenuItem value={1}>1차</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        {mode === 'turnBasedNew' && (
          <Grid item xs={12}>
            <FormControl size="small" fullWidth>
                <InputLabel>뉴구절 차수</InputLabel>
                <Select value={targetTurnForNew} label="뉴구절 차수" onChange={(e) => setTargetTurnForNew(Number(e.target.value))} >
                    <MenuItem value={1}>1차</MenuItem>
                </Select>
            </FormControl>
          </Grid>
        )}
        {mode === 'turnBasedRecent' && (
            <Grid item xs={12}>
            <FormControl size="small" fullWidth>
                <InputLabel>최근구절 차수</InputLabel>
                <Select value={targetTurnForRecent} label="최근구절 차수" onChange={(e) => setTargetTurnForRecent(Number(e.target.value))} >
                    <MenuItem value={1}>1차</MenuItem>
                </Select>
            </FormControl>
            </Grid>
        )}

        {mode !== 'pending' && (
          <Grid item xs={12}>
            <FormControl size="small" fullWidth>
              <InputLabel>정렬 방식</InputLabel>
              <Select value={order} label="정렬 방식" onChange={(e) => setOrder(e.target.value)}>
                <MenuItem value="sequential">순차</MenuItem>
                <MenuItem value="random">랜덤</MenuItem>
                <MenuItem value="oldest_first">오래된 순</MenuItem>
                <MenuItem value="grouped_random">그룹별 랜덤</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
      
      {mode !== 'pending' && (
        <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                복습 방식
            </Typography>
            <ToggleButtonGroup
                color="primary"
                value={reviewView}
                exclusive
                onChange={(e, newView) => { if (newView) setReviewView(newView); }}
                aria-label="Review View"
                size="small"
                fullWidth
            >
                <ToggleButton value="card">카드</ToggleButton>
                <ToggleButton value="typing">타이핑</ToggleButton>
            </ToggleButtonGroup>
        </Box>
      )}

      {mode !== 'pending' && (
        <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                복습 카드 폰트 크기
            </Typography>
            <ToggleButtonGroup
                color="primary"
                value={fontSize}
                exclusive
                onChange={(e, newSize) => { if (newSize) setFontSize(newSize); }}
                aria-label="Font Size"
                size="small"
                fullWidth
            >
                <ToggleButton value="small">작게</ToggleButton>
                <ToggleButton value="medium">보통</ToggleButton>
                <ToggleButton value="large">크게</ToggleButton>
            </ToggleButtonGroup>
        </Box>
      )}

      {mode === 'turnBasedReview' && (
        <Box mt={2}>
            <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12}>
                  <TextField 
                    label="시작일" 
                    type="date" 
                    size="small" 
                    fullWidth 
                    value={turnSchedule.startDate || ''} 
                    onChange={(e) => onSaveTurnSchedule({ ...turnSchedule, startDate: e.target.value })} 
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label="목표종료일" 
                    type="date" 
                    size="small" 
                    fullWidth 
                    value={turnSchedule.endDate || ''} 
                    onChange={(e) => onSaveTurnSchedule({ ...turnSchedule, endDate: e.target.value })} 
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5}}>
                    {dailyGoalDisplay && <Typography variant="caption" sx={{textAlign:'center', color: 'text.secondary'}}>{dailyGoalDisplay}</Typography>}
                    <Tooltip title="현재 차수 일정 저장">
                        <IconButton onClick={() => onSaveTurnSchedule(turnSchedule, true)} color="primary" size="medium" sx={{ml: 'auto'}}><SaveIcon /></IconButton>
                    </Tooltip>
                </Grid>
            </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ControlPanel;