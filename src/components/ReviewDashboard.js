// src/components/ReviewDashboard.js
import React from 'react';
import { Box, Card, Paper, Typography, Button, ToggleButtonGroup, ToggleButton, Grid, ListItemIcon } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SortIcon from '@mui/icons-material/Sort';
import Filter1Icon from '@mui/icons-material/Filter1';
import CategoryIcon from '@mui/icons-material/Category';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { THEMES, MODES } from '../constants';

const InfoItem = ({ icon, primary, secondary, secondaryColor }) => (
    <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1.5, textAlign: 'center' }}>
        <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main', mb: 0.5 }}>{icon}</ListItemIcon>
        <Box><Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1.2 }}>{primary}</Typography><Typography variant="caption" color={secondaryColor || 'text.secondary'}>{secondary}</Typography></Box>
    </Grid>
);

const ReviewReadyInfo = ({ verses, settings, remainingToday }) => {
    const { mode, order, selectedCategories, targetTurn, targetTurnForNew, targetTurnForRecent } = settings;
    const currentMode = MODES.find(m => m.value === mode);
    const getTurnTarget = () => { if (mode === 'turnBasedReview') return `${targetTurn}차`; if (mode === 'turnBasedNew') return `뉴구절 ${targetTurnForNew}차`; if (mode === 'turnBasedRecent') return `최근 ${targetTurnForRecent}차`; return null; };
    const orderTextMap = { sequential: '순차', random: '랜덤', oldest_first: '오래된 순', grouped_random: '그룹별 랜덤', incorrect_only: '오답만 보기' };

    let infoItems = [
        { icon: <InfoOutlinedIcon />, primary: "복습 모드", secondary: currentMode?.label || '알 수 없음' },
        { icon: <SortIcon />, primary: "정렬 방식", secondary: orderTextMap[order] || order },
    ];

    const turnTarget = getTurnTarget();
    if (turnTarget) infoItems.push({ icon: <Filter1Icon />, primary: "목표 차수", secondary: turnTarget });
    infoItems.push({ icon: <CategoryIcon />, primary: "카테고리", secondary: selectedCategories.join(', ') });

    if (remainingToday !== null) {
        infoItems.push({
            icon: <PlaylistAddCheckIcon />,
            primary: "오늘 남은 구절",
            secondary: `${remainingToday}개`,
            secondaryColor: remainingToday > 0 ? 'error.main' : 'text.secondary'
        });
    }
    infoItems.push({ icon: <CheckCircleOutlineIcon />, primary: "진행 상태", secondary: `총 ${verses.length}개 남음` });

    return (
        <Box sx={{ textAlign: 'left' }}>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>현재 복습 설정</Typography>
                <Grid container spacing={1} justifyContent="center">{infoItems.map(item => item && <InfoItem key={item.primary} {...item} />)}</Grid>
            </Paper>
        </Box>
    );
};

const ReviewDashboard = ({
    settings, setters, verses, remainingToday, onStartReview, favoriteVerse, themeKey
}) => {
    const { fontType } = settings;
    const handleModeChange = (event, newMode) => {
        if (newMode !== null) setters.setMode(newMode);
    };

    // 폰트 스타일 결정
    const fontStyle = React.useMemo(() => {
        const baseStyle = { fontWeight: 'bold', whiteSpace: 'pre-line', opacity: 0.95, fontSize: '1.1rem', lineHeight: 1.4 };
        if (fontType === 'myeongjo') return { ...baseStyle, fontFamily: "'Nanum Myeongjo', serif" };
        if (fontType === 'batang') return { ...baseStyle, fontFamily: "'Gowun Batang', serif" };
        return { ...baseStyle, fontFamily: "sans-serif" };
    }, [fontType]);

    return (
        <Box sx={{ height: 'calc(100vh - 57px)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <Box sx={{ maxWidth: 'sm', mx: 'auto', width: '100%', pt: 1, pb: 1, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Card sx={{ mb: 1.5, flexShrink: 0, borderRadius: 3, display: 'flex', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundImage: favoriteVerse ? THEMES[themeKey] : 'none', color: 'white', transition: 'all 0.5s ease-in-out', maxHeight: '22vh', height: '100%', }}>
                    {favoriteVerse && (
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center', opacity: 0.9, mb: 1, flexShrink: 0 }}>{favoriteVerse.장절}</Typography>
                            {/* --- [수정] 본문 가운데 정렬 적용 (textAlign: 'center') --- */}
                            <Box sx={{ overflowY: 'auto', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ ...fontStyle, textAlign: 'center', width: '100%' }}>
                                    {favoriteVerse.본문}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ alignSelf: 'flex-end', opacity: 0.8, pt: 1, flexShrink: 0 }}>{favoriteVerse.제목}</Typography>
                        </Box>
                    )}
                </Card>
                <Box sx={{ p: '2px', borderRadius: 3, backgroundImage: THEMES[themeKey], boxShadow: '0 4px 12px rgba(0,0,0,0.1)', mb: 1.5 }}>
                    <Paper sx={{ p: 1.5, borderRadius: '10px' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}>빠른 모드 선택</Typography>
                        <ToggleButtonGroup value={settings.mode} exclusive onChange={handleModeChange} aria-label="quick mode select" fullWidth size="small">
                            <ToggleButton value="turnBasedReview">차수별 복습</ToggleButton>
                            <ToggleButton value="turnBasedNew">차수별 뉴구절</ToggleButton>
                            <ToggleButton value="turnBasedRecent">차수별 최근</ToggleButton>
                        </ToggleButtonGroup>
                    </Paper>
                </Box>
                <Box sx={{ p: '2px', borderRadius: 3, backgroundImage: THEMES[themeKey], boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '10px' }}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>오늘의 복습</Typography>
                            <ReviewReadyInfo verses={verses} settings={settings} remainingToday={remainingToday} />
                        </Box>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<PlayCircleFilledIcon />}
                            onClick={onStartReview}
                            disabled={verses.length === 0}
                            sx={{ mt: 2, width: '100%', py: 1.2, color: 'white', backgroundImage: THEMES[themeKey], transition: 'all 0.3s' }}
                        >
                            복습 시작하기
                        </Button>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};

export default ReviewDashboard;