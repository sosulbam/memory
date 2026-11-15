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
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { THEMES, MODES } from '../constants';
import { IS_LAMP, LAMP_LOOK } from '../edition';

const InfoItem = ({ icon, primary, secondary, secondaryColor }) => (
    <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1.5, textAlign: 'center' }}>
        <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main', mb: 0.5 }}>{icon}</ListItemIcon>
        <Box><Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1.2 }}>{primary}</Typography><Typography variant="caption" color={secondaryColor || 'text.secondary'}>{secondary}</Typography></Box>
    </Grid>
);

// 등불판은 홈 단추와 같은 말로(새 구절·최근 구절)
const LAMP_MODE_LABELS = { turnBasedReview: '차수별 복습', turnBasedNew: '새 구절', turnBasedRecent: '최근 구절' };

const ReviewReadyInfo = ({ verses, settings, remainingToday }) => {
    const { mode, order, selectedCategories, targetTurn, targetTurnForNew, targetTurnForRecent } = settings;
    const currentMode = MODES.find(m => m.value === mode);
    const getTurnTarget = () => { if (mode === 'turnBasedReview') return `${targetTurn}차`; if (mode === 'turnBasedNew') return `${IS_LAMP ? '새 구절' : '뉴구절'} ${targetTurnForNew}차`; if (mode === 'turnBasedRecent') return `최근 ${targetTurnForRecent}차`; return null; };
    const orderTextMap = { sequential: '순차', random: '랜덤', oldest_first: '오래된 순', grouped_random: '그룹별 랜덤', incorrect_only: '오답만 보기' };

    let infoItems = [
        { icon: <InfoOutlinedIcon />, primary: "복습 모드", secondary: (IS_LAMP && LAMP_MODE_LABELS[mode]) || currentMode?.label || '알 수 없음' },
        { icon: <SortIcon />, primary: "정렬 방식", secondary: orderTextMap[order] || order },
    ];

    const turnTarget = getTurnTarget();
    if (turnTarget) infoItems.push({ icon: <Filter1Icon />, primary: "목표 차수", secondary: turnTarget });
    infoItems.push({ icon: <CategoryIcon />, primary: IS_LAMP ? "분류" : "카테고리", secondary: selectedCategories.join(', ') });

    if (remainingToday !== null) {
        infoItems.push({
            icon: <PlaylistAddCheckIcon />,
            primary: "오늘 남은 구절",
            secondary: `${remainingToday}개`,
            secondaryColor: remainingToday > 0 ? 'error.main' : 'text.secondary'
        });
    }
    infoItems.push({ icon: <CheckCircleOutlineIcon />, primary: IS_LAMP ? "남은 구절" : "진행 상태", secondary: IS_LAMP ? `${verses.length}개` : `총 ${verses.length}개 남음` });

    if (LAMP_LOOK) {
        return (
            <Box component="dl" sx={{ m: 0, textAlign: 'left', borderTop: '1px solid', borderColor: 'divider' }}>
                {infoItems.filter(Boolean).map(item => (
                    <Box key={item.primary} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography component="dt" variant="body2" color="text.secondary">{item.primary}</Typography>
                        <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600, textAlign: 'right', color: item.secondaryColor === 'error.main' ? 'text.primary' : 'inherit' }}>{item.secondary}</Typography>
                    </Box>
                ))}
            </Box>
        );
    }

    return (
        <Box sx={{ textAlign: 'left' }}>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>현재 복습 설정</Typography>
                <Grid container spacing={1} justifyContent="center">{infoItems.map(item => item && <InfoItem key={item.primary} {...item} />)}</Grid>
            </Paper>
        </Box>
    );
};

const LAMP_EMPTY_HINT = {
    turnBasedNew: '새로 외울 구절이 없습니다. 암송 팩에서 「새로 외울 구절」로 넣거나, 구절의 상태에서 「새 구절」을 켜세요.',
    turnBasedRecent: '최근 구절로 표시한 구절이 없습니다. 구절의 상태에서 「최근」을 켜면 여기에 모입니다.',
    turnBasedReview: '복습할 구절이 없습니다. 새 구절을 다 외웠으면 구절의 상태에서 「새 구절」을 풀어 복습으로 옮기세요.',
};

const ReviewDashboard = ({
    settings, setters, verses, remainingToday, onStartReview, favoriteVerse, themeKey, onAdvanceTurn,
    modePoolCount, hasSchedule, onOpenSchedule, schedule,
}) => {
    const { fontType, mode, targetTurn, targetTurnForNew, targetTurnForRecent } = settings;

    // 차수별 모드에서 대상 구절이 하나도 남지 않았을 때 = 현재 차수 완주.
    // 설정을 열지 않고 여기서 바로 다음 차수를 시작할 수 있게 한다.
    const currentTurn = mode === 'turnBasedReview' ? targetTurn
        : mode === 'turnBasedNew' ? targetTurnForNew
        : mode === 'turnBasedRecent' ? targetTurnForRecent : null;
    // 등불판: 모드에 구절이 아예 없으면 「완주」가 아니다(검토 3번)
    const modeIsEmpty = IS_LAMP && currentTurn !== null && modePoolCount === 0;
    const canAdvanceTurn = currentTurn !== null && verses.length === 0 && !modeIsEmpty;
    const needsSchedule = IS_LAMP && mode === 'turnBasedReview' && !hasSchedule && modePoolCount > 0;
    const sc = settings.selectedCategories || [], ss = settings.selectedSubcategories || [];
    const filtered = !(sc.includes('전체') || sc.length === 0) || !(ss.includes('전체') || ss.length === 0);
    const filterLabel = [...sc.filter(x => x !== '전체'), ...ss.filter(x => x !== '전체')].join(' · ');
    const fmtMD = (d) => { const m = String(d || '').match(/^\d{4}-(\d{2})-(\d{2})/); return m ? `${+m[1]}/${+m[2]}` : d; };
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

    if (LAMP_LOOK) {
        return (
            <Box sx={{ maxWidth: 'sm', mx: 'auto', width: '100%', pt: 1, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {favoriteVerse && (
                    <Box sx={{ backgroundImage: THEMES[themeKey], color: 'white', borderRadius: 1, px: 2.5, py: 2.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700, fontSize: '1.05rem', opacity: 0.85 }}>{favoriteVerse.장절}</Typography>
                        <Typography sx={{ ...fontStyle, fontWeight: 700, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{favoriteVerse.본문}</Typography>
                        {favoriteVerse.제목 && <Typography variant="body2" sx={{ alignSelf: 'flex-end', opacity: 0.75 }}>{favoriteVerse.제목}</Typography>}
                    </Box>
                )}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>복습 방식</Typography>
                    <ToggleButtonGroup value={settings.mode} exclusive onChange={handleModeChange} aria-label="빠른 모드 선택" fullWidth size="small" sx={{ bgcolor: 'background.paper' }}>
                        <ToggleButton value="turnBasedReview">차수별 복습</ToggleButton>
                        <ToggleButton value="turnBasedNew">새 구절</ToggleButton>
                        <ToggleButton value="turnBasedRecent">최근 구절</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>오늘의 복습</Typography>
                    {modeIsEmpty ? (
                        filtered ? (
                            // 분류를 걸어 둔 탓이면 그 분류를 보여 준다(R4)
                            <Box sx={{ py: 1 }}>
                                <Typography color="text.secondary">지금 고른 분류({filterLabel})에는 이 방식으로 볼 구절이 없습니다.</Typography>
                                <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => { setters.setSelectedCategories(['전체']); setters.setSelectedSubcategories(['전체']); }}>분류를 전체로</Button>
                            </Box>
                        ) : (
                            <Typography color="text.secondary" sx={{ py: 1 }}>{LAMP_EMPTY_HINT[mode]}</Typography>
                        )
                    ) : (
                        <ReviewReadyInfo verses={verses} settings={settings} remainingToday={remainingToday} />
                    )}
                    {IS_LAMP && mode === 'turnBasedReview' && hasSchedule && schedule && (
                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">{targetTurn}차 일정 {fmtMD(schedule.startDate)}~{fmtMD(schedule.endDate)}</Typography>
                            <Button size="small" onClick={onOpenSchedule}>고치기</Button>
                        </Box>
                    )}
                    {needsSchedule && (
                        <Box sx={{ mt: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ flex: '1 1 200px' }}>차수의 시작일과 마감일을 정하면 하루에 볼 분량을 나눠 줍니다.</Typography>
                            <Button variant="outlined" size="small" onClick={onOpenSchedule}>일정 정하기</Button>
                        </Box>
                    )}
                    <Button variant="contained" size="large" startIcon={<PlayCircleFilledIcon />} onClick={onStartReview} disabled={verses.length === 0} sx={{ mt: 2, width: '100%', py: 1.3 }}>
                        복습 시작하기
                    </Button>
                    {canAdvanceTurn && (
                        <Button variant="outlined" size="large" startIcon={<RestartAltIcon />} onClick={() => onAdvanceTurn && onAdvanceTurn(mode)} sx={{ mt: 1, width: '100%', py: 1.2 }}>
                            {currentTurn}차를 마쳤습니다 · {currentTurn + 1}차 시작하기
                        </Button>
                    )}
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ height: 'calc(100vh - 57px - var(--sat))', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
                            <ToggleButton value="turnBasedNew">{IS_LAMP ? '새 구절' : '차수별 뉴구절'}</ToggleButton>
                            <ToggleButton value="turnBasedRecent">{IS_LAMP ? '최근 구절' : '차수별 최근'}</ToggleButton>
                        </ToggleButtonGroup>
                    </Paper>
                </Box>
                <Box sx={{ p: '2px', borderRadius: 3, backgroundImage: THEMES[themeKey], boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '10px' }}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>오늘의 복습</Typography>
                            {modeIsEmpty ? (
                                filtered ? (
                                    // 분류를 걸어 둔 탓이면 그 분류를 보여 준다(R4)
                                    <Box sx={{ py: 1 }}>
                                        <Typography color="text.secondary">지금 고른 분류({filterLabel})에는 이 방식으로 볼 구절이 없습니다.</Typography>
                                        <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => { setters.setSelectedCategories(['전체']); setters.setSelectedSubcategories(['전체']); }}>분류를 전체로</Button>
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary" sx={{ py: 1 }}>{LAMP_EMPTY_HINT[mode]}</Typography>
                                )
                            ) : (
                                <ReviewReadyInfo verses={verses} settings={settings} remainingToday={remainingToday} />
                            )}
                            {IS_LAMP && mode === 'turnBasedReview' && hasSchedule && schedule && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">{targetTurn}차 일정 {fmtMD(schedule.startDate)}~{fmtMD(schedule.endDate)}</Typography>
                                    <Button size="small" onClick={onOpenSchedule}>고치기</Button>
                                </Box>
                            )}
                            {needsSchedule && (
                                <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', textAlign: 'left' }}>
                                    <Typography variant="body2" sx={{ flex: '1 1 200px' }}>차수의 시작일과 마감일을 정하면 하루에 볼 분량을 나눠 줍니다.</Typography>
                                    <Button variant="outlined" size="small" onClick={onOpenSchedule}>일정 정하기</Button>
                                </Box>
                            )}
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
                        {canAdvanceTurn && (
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<RestartAltIcon />}
                                onClick={() => onAdvanceTurn && onAdvanceTurn(mode)}
                                sx={{ mt: 1, width: '100%', py: 1.2 }}
                            >
                                {currentTurn}차 완주 · {currentTurn + 1}차 시작하기
                            </Button>
                        )}
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};

export default ReviewDashboard;