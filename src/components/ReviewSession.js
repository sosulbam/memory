// src/components/ReviewSession.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Backdrop, Slide, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import { useSwipeable } from 'react-swipeable';
import VerseCard from './VerseCard';
import TypingView from './TypingView';
import ActionBar from './ActionBar';
import TagDialog from './TagDialog';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const HelpDialog = ({ open, onClose }) => {
    const Highlight = ({ children }) => <Typography component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>{children}</Typography>;
    return (
        <Dialog open={open} onClose={onClose} scroll="paper">
            <DialogTitle>복습 화면 도움말</DialogTitle>
            <DialogContent dividers>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>기본 조작 (카드뷰)</Typography>
                <List dense sx={{ '& .MuiListItem-root': { alignItems: 'flex-start' } }}>
                    <ListItem><ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon><ListItemText><b>정답 확인:</b> <Highlight>짧게 터치</Highlight> 또는 🔊아이콘으로 듣기</ListItemText></ListItem>
                    <ListItem><ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon><ListItemText><b>완료 처리:</b> <Highlight>좌우로 스와이프</Highlight></ListItemText></ListItem>
                    <ListItem><ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon><ListItemText><b>상태 변경/복사:</b> <Highlight>위로 스와이프</Highlight>하여 메뉴를 열 수 있습니다.</ListItemText></ListItem>
                </List>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }} gutterBottom>키보드 단축키 (PC)</Typography>
                <List dense>
                    <ListItem>
                        <ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>
                            {/* k 제거 */}
                            <b>정답 확인:</b> <Chip size="small" label="Space" /> <Chip size="small" label="." /> <Chip size="small" label="s" />
                        </ListItemText>
                    </ListItem>
                    <ListItem>
                        <ListItemIcon sx={{ mt: 0.5 }}><ChevronRightIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>
                            {/* k 추가 */}
                            <b>완료 처리:</b> <Chip size="small" label="Enter" /> <Chip size="small" label="k" />
                        </ListItemText>
                    </ListItem>
                </List>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>닫기</Button></DialogActions>
        </Dialog>
    );
};

const ReviewSession = ({
    settings, setters, verse, verses, isBrowsingCompleted, showAnswer, sessionStats, actions,
    onStatusToggle, onTagDialogOpen, currentIndex, remainingToday, onHelpClick, tagDialogOpen,
    helpOpen, setHelpOpen, setTagDialogOpen, showSnackbar, dailyProgress, tagsData, updateTags
}) => {
    const COMPLETED_BROWSE_THEME_KEY = 'olive';
    const { reviewView } = settings;
    const { toggleAnswer, handleMarkAsReviewed, browseNext, browsePrev, toggleBrowseMode } = actions;
    const [isActionBarVisible, setIsActionBarVisible] = useState(false);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);

    // Wake Lock (화면 꺼짐 방지)
    const wakeLockRef = useRef(null);
    const requestWakeLock = useCallback(async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (err) { console.log(`${err.name}, ${err.message}`); }
    }, []);
    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
    }, []);
    useEffect(() => {
        if (isAutoPlaying) requestWakeLock(); else releaseWakeLock();
        return () => releaseWakeLock();
    }, [isAutoPlaying, requestWakeLock, releaseWakeLock]);

    const activeThemeKey = isBrowsingCompleted ? COMPLETED_BROWSE_THEME_KEY : settings.themeKey;

    const handleAutoPlay = useCallback((shouldPlay) => {
        if (typeof shouldPlay === 'boolean') {
            setIsAutoPlaying(shouldPlay);
        } else {
            if (isAutoPlaying && verse) {
                handleMarkAsReviewed();
            }
        }
    }, [isAutoPlaying, verse, handleMarkAsReviewed]);

    useEffect(() => {
        if (verses.length === 0 && isAutoPlaying) {
            setIsAutoPlaying(false);
            showSnackbar('모든 구절 복습을 완료했습니다.', 'success');
        }
    }, [verses.length, isAutoPlaying, showSnackbar]);

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => { if (!verse) return; if (isBrowsingCompleted) { browseNext(); } else if (reviewView === 'card') { handleMarkAsReviewed(); } },
        onSwipedRight: () => { if (!verse) return; if (isBrowsingCompleted) { browsePrev(); } else if (reviewView === 'card') { handleMarkAsReviewed(); } },
        onSwipedUp: () => { if (reviewView === 'card' && verse && !isBrowsingCompleted) { setIsActionBarVisible(true); } },
        preventDefaultTouchmoveEvent: true,
        trackTouch: true,
    });

    // --- [수정됨] 키보드 단축키 핸들러 ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // 팝업이나 입력창이 열려있으면 단축키 무시
            if (isActionBarVisible || tagDialogOpen || helpOpen) return;

            // 1. 화면 뒤집기 (정답 확인): ., Space, s (k 제거됨)
            if (e.key === '.' || e.key === ' ' || e.key === 's') {
                e.preventDefault();
                toggleAnswer();
            }

            // 2. 복습 완료 (넘기기): Enter, k (k 추가됨)
            if ((e.key === 'Enter' || e.key === 'k') && verse) {
                e.preventDefault();
                isBrowsingCompleted ? browseNext() : handleMarkAsReviewed();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleAnswer, handleMarkAsReviewed, isBrowsingCompleted, browseNext, isActionBarVisible, verse, tagDialogOpen, helpOpen]);

    const handleCopyVerse = () => {
        if (!verse) return;
        const textToCopy = `${verse.장절}\n${verse.본문}`;
        navigator.clipboard.writeText(textToCopy).then(() => { showSnackbar('구절이 복사되었습니다.', 'info'); });
        setIsActionBarVisible(false);
    };

    const commonProps = {
        verse, themeKey: activeThemeKey, isFocusMode: true, settings, setters, sessionStats,
        versesCount: verses.length, isBrowsingCompleted, onToggleBrowseMode: toggleBrowseMode,
        onFooterClick: () => setIsActionBarVisible(true), currentIndex, remainingToday,
        onHelpClick, actions, dailyProgress,
        onAutoPlay: handleAutoPlay, isAutoPlaying: isAutoPlaying
    };

    return (
        <Box {...swipeHandlers} sx={{ minHeight: '100vh', width: '100vw' }}>
            {reviewView === 'typing' ? (
                <TypingView {...commonProps} onComplete={isBrowsingCompleted ? browseNext : handleMarkAsReviewed} />
            ) : (
                <VerseCard {...commonProps} showAnswer={showAnswer} onClick={toggleAnswer} />
            )}

            <Backdrop sx={{ zIndex: 1350 }} open={isActionBarVisible} onClick={() => setIsActionBarVisible(false)} />
            {verse && (
                <Slide direction="up" in={isActionBarVisible} mountOnEnter unmountOnExit>
                    <Paper elevation={4} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1400, borderTopLeftRadius: 16, borderTopRightRadius: 16, pb: 2 }}>
                        <Typography variant="caption" align="center" display="block" sx={{ pt: 1, color: 'text.secondary' }}>바깥 영역을 터치하여 닫기</Typography>
                        <ActionBar verse={verse} onStatusToggle={onStatusToggle} onTagDialogOpen={onTagDialogOpen} onCopy={handleCopyVerse} />
                    </Paper>
                </Slide>
            )}
            <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
            <TagDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} verse={verse} tags={tagsData} onSaveTags={updateTags} />
        </Box>
    );
};

export default ReviewSession;