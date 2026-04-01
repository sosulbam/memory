// src/components/VerseCard.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Divider, Tooltip, Chip, LinearProgress, Dialog, DialogActions, DialogContent, DialogContentText, Button } from '@mui/material';
import { THEMES, BIBLE_BOOKS } from '../constants';
import { saveRecording, getRecording, deleteRecording } from '../api/audioStorage';
import { useSnackbar } from '../contexts/SnackbarContext';
import { numberToSinoKorean } from '../utils/textUtils';

import SwipeUpIcon from '@mui/icons-material/SwipeUp';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import StyleIcon from '@mui/icons-material/Style';
import ReplayIcon from '@mui/icons-material/Replay';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import HistoryIcon from '@mui/icons-material/History';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import MicIcon from '@mui/icons-material/Mic';
import DeleteIcon from '@mui/icons-material/Delete';
import AudioFileIcon from '@mui/icons-material/AudioFile';

const calculateDaysAgoText = (reviewDateStr) => {
    if (!reviewDateStr) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const reviewDate = new Date(reviewDateStr.replace(/\.\s*/g, '-')); reviewDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - reviewDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null; if (diffDays === 0) return '마지막 복습: 오늘'; if (diffDays === 1) return '마지막 복습: 어제';
    return `마지막 복습: ${diffDays}일 전`;
};

const calculateStartDateText = (startDateStr) => {
    if (!startDateStr) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(startDateStr); start.setHours(0, 0, 0, 0);
    if (isNaN(start.getTime())) return null;
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let elapsedText = '';
    if (diffDays < 0) elapsedText = '';
    else if (diffDays < 7) elapsedText = `(${diffDays}일 전)`;
    else if (diffDays < 60) elapsedText = `(${Math.floor(diffDays / 7)}주 전)`;
    else if (diffDays < 365) elapsedText = `(${Math.floor(diffDays / 30)}개월 전)`;
    else elapsedText = `(${Math.floor(diffDays / 365)}년 전)`;
    return `암송 시작: ${startDateStr} ${elapsedText}`;
};


const FocusModeHeader = ({ setIsFocusMode, sessionStats, versesCount, isBrowsingCompleted, onToggleBrowseMode, currentIndex, remainingToday, onHelpClick, settings, dailyProgress, daysAgoText, startDateText }) => {
    const { mode } = settings;
    const { sessionCompletedCount } = sessionStats;
    const completedBeforeSession = dailyProgress?.completedToday || 0;
    const goalForThisSession = (remainingToday !== null ? remainingToday : 0) + sessionCompletedCount;
    const totalDailyGoal = goalForThisSession + completedBeforeSession;
    const currentCompleted = totalDailyGoal - (remainingToday !== null ? remainingToday : 0);
    const dailyProgressPercent = totalDailyGoal > 0 ? Math.round((currentCompleted / totalDailyGoal) * 100) : 0;
    const sessionGoal = versesCount + sessionCompletedCount;
    const sessionProgressPercent = sessionGoal > 0 ? Math.round((sessionCompletedCount / sessionGoal) * 100) : 0;

    return (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', zIndex: 1, pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '4px', px: 2 }}>
                <Box>
                    <Tooltip title="복습 종료"><IconButton onClick={() => setIsFocusMode(false)} color="inherit"><FullscreenExitIcon /></IconButton></Tooltip>
                    <Tooltip title="도움말"><IconButton onClick={onHelpClick} color="inherit"><HelpOutlineIcon /></IconButton></Tooltip>
                </Box>
                <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'center', textAlign: 'center', overflow: 'hidden' }}>
                    {isBrowsingCompleted ? (<Box sx={{ width: '120px' }} />) : (
                        <>
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>총남은: {versesCount}</Typography>
                            {remainingToday !== null && <Typography variant="body2" sx={{ color: '#ffeb3b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>오늘남은: {remainingToday}</Typography>}
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>오늘완료: {currentCompleted}</Typography>
                        </>
                    )}
                </Box>
                <Tooltip title={isBrowsingCompleted ? "진행 중인 복습으로 돌아가기" : "전체 완료 구절 보기"}>
                    <span><IconButton onClick={(e) => { e.stopPropagation(); onToggleBrowseMode(); }} disabled={sessionStats.totalCompletedCount === 0} sx={{ color: 'white', bgcolor: isBrowsingCompleted ? 'primary.main' : 'rgba(255, 255, 255, 0.2)', '&:hover': { bgcolor: isBrowsingCompleted ? 'primary.dark' : 'rgba(255, 255, 255, 0.3)' } }}><StyleIcon /></IconButton></span>
                </Tooltip>
            </Box>
            <Box sx={{ px: 2, textAlign: 'right', pt: 0.5 }}>
                {daysAgoText && <Typography variant="caption" component="div" sx={{ lineHeight: 1.2 }}>{daysAgoText}</Typography>}
                {startDateText && <Typography variant="caption" component="div" sx={{ color: '#ffcc80', fontWeight: 'bold', lineHeight: 1.2 }}>{startDateText}</Typography>}
            </Box>
            {mode === 'turnBasedReview' && dailyProgress && totalDailyGoal > 0 && !isBrowsingCompleted && (<Box sx={{ width: '100%', px: 2, pt: 0.5, boxSizing: 'border-box' }}><Box sx={{ display: 'flex', justifyContent: 'flex-start' }}><Typography variant="caption">오늘 진행률 ({dailyProgressPercent}%)</Typography></Box><LinearProgress variant="determinate" value={dailyProgressPercent} sx={{ height: 6, borderRadius: 3 }} /></Box>)}
            {(mode === 'turnBasedNew' || mode === 'turnBasedRecent') && sessionGoal > 0 && !isBrowsingCompleted && (<Box sx={{ width: '100%', px: 2, pt: 0.5, boxSizing: 'border-box' }}><Box sx={{ display: 'flex', justifyContent: 'flex-start' }}><Typography variant="caption">진행률 ({sessionProgressPercent}%)</Typography></Box><LinearProgress variant="determinate" value={sessionProgressPercent} sx={{ height: 6, borderRadius: 3 }} /></Box>)}
        </Box>
    );
};

const FocusModeFooter = ({ onFooterClick }) => (
    <Box onClick={(e) => { e.stopPropagation(); onFooterClick(); }} sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255, 255, 255, 0.7)', zIndex: 1, cursor: 'pointer' }}>
        <IconButton color="inherit" sx={{ p: 0 }}><SwipeUpIcon /></IconButton><Typography variant="caption">상태 변경</Typography>
    </Box>
);

const StatusDisplay = ({ verse }) => {
    if (!verse) return null;
    const statuses = [verse.뉴구절여부 && '뉴구절', verse.최근구절여부 && '최근', verse.오답여부 && '오답', verse.즐겨찾기 && '즐겨찾기'].filter(Boolean);
    if (statuses.length === 0) return null;
    return (<Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontStyle: 'italic', pl: 2 }}>{`상태: ${statuses.join(', ')}`}</Typography>);
};

const VerseCard = ({ verse, showAnswer, themeKey, settings, setters, sessionStats, versesCount, onClick, onFooterClick, isBrowsingCompleted, onToggleBrowseMode, currentIndex, remainingToday, onHelpClick, dailyProgress, onAutoPlay, isAutoPlaying }) => {
    const { mode, targetTurn, targetTurnForNew, targetTurnForRecent, isFocusMode, fontSize, completedSortOrder, fontType, ttsOrder, voiceURI, speechRate, ttsInterval, audioPriority } = settings;
    const { setIsFocusMode, setCompletedSortOrder } = setters;
    const { showSnackbar } = useSnackbar();

    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
    const requestConfirm = (message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm });
    const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });
    const handleConfirmYes = () => { confirmDialog.onConfirm?.(); closeConfirm(); };

    const pendingFileRef = useRef(null);

    const currentTheme = THEMES[themeKey];
    const daysAgoText = calculateDaysAgoText(verse?.복습날짜);
    const startDateText = calculateStartDateText(verse?.암송시작일);

    const fontStyle = useMemo(() => {
        const baseStyle = { fontWeight: 'bold' };
        if (fontType === 'myeongjo') return { ...baseStyle, fontFamily: "'Nanum Myeongjo', serif", fontWeight: 800 };
        if (fontType === 'batang') return { ...baseStyle, fontFamily: "'Gowun Batang', serif", fontWeight: 800 };
        return { ...baseStyle, fontFamily: "sans-serif", fontWeight: 800 };
    }, [fontType]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecordedFile, setHasRecordedFile] = useState(false);
    const speechRef = useRef(null);
    const audioRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const fileInputRef = useRef(null);
    const sequenceTimeoutRef = useRef(null);

    const stopAll = useCallback(() => {
        window.speechSynthesis.cancel();
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
            sequenceTimeoutRef.current = null;
        }
        setIsPlaying(false);
        setIsRecording(false);
    }, []);

    // 페이지 이동 시 오디오 리소스 해제
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        stopAll();
        if (verse) {
            getRecording(verse.id).then(blob => {
                setHasRecordedFile(!!blob);
            });
        } else {
            setHasRecordedFile(false);
        }
    }, [verse, isAutoPlaying, stopAll]);

    const handleToggleRecording = (e) => {
        e.stopPropagation();
        if (!verse) return;

        if (isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            return;
        }

        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false, sampleRate: 44100, channelCount: 1 }
                });
                const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 }
                    : {};
                const mediaRecorder = new MediaRecorder(stream, options);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];
                mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    await saveRecording(verse.id, audioBlob);
                    setHasRecordedFile(true);
                    stream.getTracks().forEach(track => track.stop());
                };
                mediaRecorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Mic Error:", err);
                showSnackbar('마이크 권한이 필요합니다.', 'error');
            }
        };

        if (hasRecordedFile) {
            requestConfirm('기존 녹음 파일이 있습니다. 새로 녹음하여 덮어쓰시겠습니까?', startRecording);
        } else {
            startRecording();
        }
    };

    const handleFileUpload = (e) => {
        e.stopPropagation();
        const file = e.target.files[0];
        if (!file || !verse) return;
        if (!file.type.startsWith('audio/')) { showSnackbar('오디오 파일만 업로드 가능합니다.', 'warning'); return; }

        const saveFile = async (f) => {
            try {
                await saveRecording(verse.id, f);
                setHasRecordedFile(true);
                showSnackbar('업로드 완료!', 'success');
            } catch (err) { console.error("File Save Error:", err); showSnackbar('파일 저장 중 오류가 발생했습니다.', 'error'); }
        };

        if (hasRecordedFile) {
            pendingFileRef.current = file;
            requestConfirm('기존 녹음 파일이 있습니다. 덮어쓰시겠습니까?', () => saveFile(pendingFileRef.current));
        } else {
            saveFile(file);
        }
    };

    const triggerFileUpload = (e) => { e.stopPropagation(); if (fileInputRef.current) fileInputRef.current.click(); };

    const handleDeleteRecording = (e) => {
        e.stopPropagation();
        if (!hasRecordedFile) return;
        requestConfirm('녹음(또는 업로드)된 파일을 삭제하시겠습니까?', async () => {
            await deleteRecording(verse.id);
            setHasRecordedFile(false);
            stopAll();
        });
    };

    const speak = (text, isEnglish, onEnd) => {
        if (!text) { if (onEnd) onEnd(); return; }

        const utterance = new SpeechSynthesisUtterance(text.replace(/[:,-]/g, ' '));
        utterance.lang = isEnglish ? 'en-US' : 'ko-KR';
        utterance.rate = speechRate || 1.0;

        if (voiceURI) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
            if (selectedVoice && selectedVoice.lang.startsWith(utterance.lang.split('-')[0])) {
                utterance.voice = selectedVoice;
            }
        }

        utterance.onend = () => { if (onEnd) onEnd(); };
        utterance.onerror = () => { setIsPlaying(false); };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const parseReferenceForTTS = (ref) => {
        if (!ref) return '';
        const match = ref.match(/^([1-3]?\s*[가-힣a-zA-Z\s]+)\s*([0-9]+)[:.](.+)/);
        if (match) {
            let book = match[1].trim();
            const chap = match[2];
            const versesPart = match[3];
            const isEnglish = /^[a-zA-Z0-9\s]+$/.test(book);
            if (isEnglish) {
                book = book.replace(/^1\s/, "First ").replace(/^2\s/, "Second ").replace(/^3\s/, "Third ");
                const verseNumbers = versesPart.split(/[-,\s]+/).filter(Boolean).join(', ');
                return `${book} Chapter ${chap} Verse ${verseNumbers}`;
            } else {
                const fullBook = BIBLE_BOOKS[book] || book;
                const chapterUnit = (fullBook === '시편' || book === '시') ? '편' : '장';
                const chapKorean = numberToSinoKorean(chap);
                const verseNumbers = versesPart.split(/[-,\s]+/).filter(Boolean);
                const versesKorean = verseNumbers.map(v => `${numberToSinoKorean(v)}절`).join(' ');
                return `${fullBook} ${chapKorean}${chapterUnit} ${versesKorean}`;
            }
        }
        return ref;
    };

    // 하이브리드 재생 시퀀스
    const playSequence = async (verseToRead, onEndCallback) => {
        if (!verseToRead) return;
        setIsPlaying(true);

        const readableRef = parseReferenceForTTS(verseToRead.장절);
        const match = verseToRead.장절.match(/^([1-3]?\s*[가-힣a-zA-Z\s]+)/);
        const isRefEnglish = match && /^[a-zA-Z0-9\s]+$/.test(match[1].trim());

        const audioBlob = await getRecording(verseToRead.id);

        const step1_Ref = () => {
            if (ttsOrder === 'body-only') {
                step3_Body();
            } else {
                speak(readableRef, isRefEnglish, () => step2_Wait());
            }
        };

        const step2_Wait = () => {
            if (ttsInterval > 0) {
                sequenceTimeoutRef.current = setTimeout(() => {
                    step3_Body();
                }, ttsInterval * 1000);
            } else {
                step3_Body();
            }
        };

        const step3_Body = () => {
            if (audioBlob && audioPriority === 'recording') {
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.playbackRate = speechRate || 1.0;
                audioRef.current = audio;
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    step4_RefClosing();
                };
                audio.play();
            } else {
                let textToRead = '';
                if (ttsOrder === 'ref-title-body-ref') textToRead = `${verseToRead.제목}. ${verseToRead.본문}`;
                else textToRead = verseToRead.본문;

                const isEnglishBody = /^[a-zA-Z\s.,;:'"-]+$/.test(verseToRead.본문.replace(/\d+/g, ''));
                speak(textToRead, isRefEnglish || isEnglishBody, () => step4_RefClosing());
            }
        };

        const step4_RefClosing = () => {
            if (ttsOrder.endsWith('ref')) {
                speak(readableRef, isRefEnglish, () => finish());
            } else {
                finish();
            }
        };

        const finish = () => {
            setIsPlaying(false);
            if (onEndCallback) onEndCallback();
        };

        step1_Ref();
    };


    useEffect(() => {
        if (isAutoPlaying && verse) {
            sequenceTimeoutRef.current = setTimeout(() => {
                playSequence(verse, onAutoPlay);
            }, 500);
            return () => {
                if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
                stopAll();
            };
        }
    }, [verse, isAutoPlaying]);

    const handleSinglePlay = (e) => {
        e.stopPropagation();
        if (isPlaying) {
            stopAll();
            if (isAutoPlaying) onAutoPlay(false);
        } else {
            if (!showAnswer) onClick();
            playSequence(verse, null);
        }
    };

    const handleToggleAutoPlay = (e) => {
        e.stopPropagation();
        if (isAutoPlaying) {
            onAutoPlay(false);
            stopAll();
        } else {
            onAutoPlay(true);
        }
    };

    // UI Mappings
    const frontSizeMap = { small: { xs: '2rem', sm: '2.5rem' }, medium: { xs: '2.5rem', sm: '3rem' }, large: { xs: '3rem', sm: '3.5rem' } };
    const titleSizeMap = { small: { xs: '1.1rem', sm: '1.25rem' }, medium: { xs: '1.25rem', sm: '1.5rem' }, large: { xs: '1.5rem', sm: '1.75rem' } };
    const bodySizeMap = { small: { xs: '1.2rem', sm: '1.3rem' }, medium: { xs: '1.3rem', sm: '1.5rem' }, large: { xs: '1.5rem', sm: '1.7rem' } };

    const TTSControls = () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
            <Tooltip title={isPlaying ? "멈춤" : "듣기(녹음/TTS)"}>
                <IconButton onClick={handleSinglePlay} size="medium" sx={{ color: isPlaying ? '#ffeb3b' : (hasRecordedFile ? '#4fc3f7' : 'rgba(255,255,255,0.8)'), bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)', color: 'white' } }}>
                    {isPlaying && !isAutoPlaying ? <StopIcon /> : <VolumeUpIcon />}
                </IconButton>
            </Tooltip>
            <Tooltip title="MP3 파일 업로드">
                <IconButton onClick={triggerFileUpload} size="medium" sx={{ color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)', color: 'white' } }}><AudioFileIcon /></IconButton>
            </Tooltip>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={handleFileUpload} onClick={(e) => e.stopPropagation()} />
            <Tooltip title={isRecording ? "녹음 중지(저장)" : "목소리 녹음하기"}>
                <IconButton onClick={handleToggleRecording} size="medium" sx={{ color: isRecording ? '#f44336' : (hasRecordedFile ? '#81c784' : 'rgba(255,255,255,0.8)'), bgcolor: isRecording ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', animation: isRecording ? 'pulse 1.5s infinite' : 'none', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)', color: 'white' } }}>{isRecording ? <StopIcon /> : <MicIcon />}</IconButton>
            </Tooltip>
            {hasRecordedFile && !isRecording && (
                <Tooltip title="녹음 파일 삭제"><IconButton onClick={handleDeleteRecording} size="medium" sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)', color: '#f44336' } }}><DeleteIcon /></IconButton></Tooltip>
            )}
            <Tooltip title={isAutoPlaying ? "연속 재생 끄기" : "연속 재생 (자동 넘김)"}>
                <IconButton onClick={handleToggleAutoPlay} size="medium" sx={{ color: isAutoPlaying ? '#ffeb3b' : 'rgba(255,255,255,0.8)', bgcolor: isAutoPlaying ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)', color: 'white' } }}><PlaylistPlayIcon /></IconButton>
            </Tooltip>
        </Box>
    );

    const FrontContent = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Box sx={{ mb: 2 }}>
                <Typography fontWeight="bold" sx={{ fontSize: frontSizeMap[fontSize] || frontSizeMap.medium, userSelect: 'none' }}>
                    {verse ? verse.장절 : (isBrowsingCompleted ? '완료한 구절이 없습니다.' : '복습할 구절이 없습니다.')}
                </Typography>
            </Box>
            {verse && <TTSControls />}
            {verse && mode.startsWith('turnBased') && (
                <Typography variant="subtitle1" sx={{ fontSize: '1.1rem', mt: 2, userSelect: 'none' }}>
                    {mode === 'turnBasedReview' && `(${verse.currentReviewTurn || 1}차 / 목표 ${targetTurn}차)`}
                    {mode === 'turnBasedNew' && `(뉴 ${verse.currentReviewTurn || 1}차 / 목표 ${targetTurnForNew}차)`}
                    {mode === 'turnBasedRecent' && `(최근 ${verse.currentReviewTurn || 1}차 / 목표 ${targetTurnForRecent}차)`}
                </Typography>
            )}
        </Box>
    );

    const BackContent = ({ verse }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', pt: isFocusMode ? '120px' : '20px', pb: isFocusMode ? '80px' : '20px', px: isFocusMode ? { xs: '20px', sm: '60px' } : '20px', boxSizing: 'border-box' }}>
            <Box sx={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography fontWeight="bold" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.85)', fontSize: titleSizeMap[fontSize] || titleSizeMap.medium, textAlign: 'center' }}>
                        {verse?.제목}
                    </Typography>
                    <TTSControls />
                    <Box sx={{ width: '100%', mt: 3 }}>
                        <Typography align="left" sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>
                            {verse?.장절}
                        </Typography>
                    </Box>
                    <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.3)', width: '100%' }} />
                    <Typography variant="body1" sx={{ width: '100%', textAlign: 'center', lineHeight: 1.7, whiteSpace: 'pre-line', wordBreak: 'keep-all', fontSize: bodySizeMap[fontSize] || bodySizeMap.medium, ...fontStyle }}>
                        {verse?.본문}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mt: 1, pt: 1, width: '100%', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <StatusDisplay verse={verse} />
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', opacity: 0.9 }}>{verse?.장절}</Typography>
                    <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.7, display: 'block' }}>{verse?.카테고리}</Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <>
            <Card variant="outlined" sx={{ cursor: 'pointer', display: 'flex', border: 'none', ...(isFocusMode ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0, zIndex: 1300, overflow: 'hidden' } : {}) }} onClick={onClick}>
                <CardContent sx={{ position: 'relative', width: '100%', background: currentTheme, color: 'white', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: isFocusMode ? '100%' : '350px', borderRadius: isFocusMode ? 0 : 1 }}>
                    {isFocusMode && <FocusModeHeader setIsFocusMode={setIsFocusMode} sessionStats={sessionStats} versesCount={versesCount} isBrowsingCompleted={isBrowsingCompleted} onToggleBrowseMode={onToggleBrowseMode} currentIndex={currentIndex} remainingToday={remainingToday} onHelpClick={onHelpClick} settings={settings} dailyProgress={dailyProgress} daysAgoText={daysAgoText} startDateText={startDateText} />}
                    {isBrowsingCompleted && (<Box sx={{ position: 'absolute', top: { xs: '52px', sm: '60px' }, left: { xs: '12px', sm: '16px' }, display: 'flex', alignItems: 'center', gap: 1, zIndex: 1 }}> <Chip icon={<ReplayIcon />} label="전체 완료 구절" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }} /> <Tooltip title={completedSortOrder === 'recent' ? "구절순으로 정렬" : "최근 복습순으로 정렬"}> <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCompletedSortOrder(completedSortOrder === 'recent' ? 'sequential' : 'recent'); }} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}> {completedSortOrder === 'recent' ? <SortByAlphaIcon fontSize="small" /> : <HistoryIcon fontSize="small" />} </IconButton> </Tooltip> </Box>)}
                    {showAnswer ? <BackContent verse={verse} /> : <FrontContent />}
                    {isFocusMode && verse && <FocusModeFooter onFooterClick={onFooterClick} />}
                </CardContent>
            </Card>
            <Dialog open={confirmDialog.open} onClose={closeConfirm} onClick={(e) => e.stopPropagation()}>
                <DialogContent>
                    <DialogContentText>{confirmDialog.message}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirm}>취소</Button>
                    <Button onClick={handleConfirmYes} variant="contained" color="warning" autoFocus>확인</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default VerseCard;