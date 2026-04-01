// src/pages/VerseList.js
import React, { useEffect, useState, useContext, useMemo, useRef, useCallback } from 'react';
import { Container, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card, CardContent, ToggleButton, ToggleButtonGroup, Grid, CircularProgress, Collapse, TablePagination, Chip, IconButton, Tooltip, LinearProgress, Button, Dialog, DialogActions, DialogContent, DialogContentText } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { DataContext } from '../contexts/DataContext';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { saveDataToLocal, loadDataFromLocal } from '../api/localStorageApi';
import { VERSELIST_STATE_KEY, BIBLE_BOOKS } from '../constants';
import ActionBar from '../components/ActionBar';
import TagDialog from '../components/TagDialog';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useDebounce } from '../hooks/useDebounce';
import { saveRecording, getRecording, deleteRecording } from '../api/audioStorage';
import { numberToSinoKorean } from '../utils/textUtils';

import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import MicIcon from '@mui/icons-material/Mic';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import PauseIcon from '@mui/icons-material/Pause';

const LIST_FONT_SIZE_MAP = {
  small:  { title: '0.85rem', ref: '0.75rem', body: '0.85rem' },
  medium: { title: '1rem',    ref: '0.875rem', body: '1rem'   },
  large:  { title: '1.2rem',  ref: '1rem',    body: '1.2rem'  },
};

function VerseItem({ verse, allVerses, tags, onStatusToggle, onTagDialogOpen, onCopyVerse, isPlaying, onPlay, onRecord, onDeleteRecord, listFontSize }) {
  const [open, setOpen] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fs = LIST_FONT_SIZE_MAP[listFontSize] || LIST_FONT_SIZE_MAP.medium;

  useEffect(() => {
    getRecording(verse.id).then(blob => setHasRecording(!!blob));
  }, [verse.id, isRecording]);

  const handleRecordClick = (e) => { e.stopPropagation(); onRecord(verse.id, isRecording, setIsRecording); };
  const handleDeleteClick = (e) => { e.stopPropagation(); onDeleteRecord(verse.id, setHasRecording); };
  const handlePlayClick = (e) => { e.stopPropagation(); onPlay(verse); };

  const verseWithStatus = useMemo(() => allVerses.find(v => v.id === verse.id) || verse, [verse, allVerses]);

  const AudioControls = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }} onClick={(e) => e.stopPropagation()}>
      <Tooltip title={isPlaying ? "중지" : "듣기"}>
        <IconButton size="small" onClick={handlePlayClick} sx={{ color: isPlaying ? 'primary.main' : 'text.secondary', bgcolor: isPlaying ? 'rgba(25, 118, 210, 0.1)' : 'transparent' }}>
          {isPlaying ? <StopIcon /> : <VolumeUpIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title={isRecording ? "녹음 중지" : "녹음 하기"}>
        <IconButton size="small" onClick={handleRecordClick} sx={{ color: isRecording ? 'error.main' : (hasRecording ? 'success.main' : 'text.secondary'), animation: isRecording ? 'pulse 1.5s infinite' : 'none' }}>
          {isRecording ? <StopIcon /> : <MicIcon />}
        </IconButton>
      </Tooltip>
      {hasRecording && !isRecording && (
        <Tooltip title="녹음 삭제"><IconButton size="small" onClick={handleDeleteClick} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      )}
    </Box>
  );

  return (
    <Card onClick={() => setOpen(!open)} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, boxShadow: isPlaying ? '0 0 0 2px #1976d2' : '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s', bgcolor: isPlaying ? 'rgba(25, 118, 210, 0.04)' : 'white' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start"><Typography align="center" sx={{ flexGrow: 1, fontSize: fs.title, fontWeight: 'bold' }}>{verse.제목 || "제목 없음"}</Typography></Box>
        <Typography color="text.secondary" align="center" sx={{ fontSize: fs.ref, mb: 1 }}>{verse.장절}</Typography>
        <Box display="flex" justifyContent="center"><AudioControls /></Box>
        <Typography sx={{ my: 1.5, whiteSpace: 'pre-line', flexGrow: 1, fontSize: fs.body }}>{verse.본문}</Typography>
        {(tags && tags.length > 0) && (<Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{tags.map(tag => <Chip key={tag} label={tag} size="small" />)}</Box>)}
        <Typography color="text.secondary" align="right" sx={{ mt: 'auto', pt: 1 }}>{verse.장절}</Typography>
      </CardContent>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ p: 1, borderTop: '1px solid #eee' }} onClick={(e) => e.stopPropagation()}>
          <ActionBar verse={verseWithStatus} onStatusToggle={(field) => onStatusToggle(verse.id, field)} onTagDialogOpen={() => onTagDialogOpen(verse)} onCopy={() => onCopyVerse(verse)} />
        </Box>
      </Collapse>
    </Card>
  );
}

function VerseRow({ verse, allVerses, tags, onStatusToggle, onTagDialogOpen, onCopyVerse, isPlaying, onPlay, onRecord, onDeleteRecord, listFontSize }) {
  const [open, setOpen] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fs = LIST_FONT_SIZE_MAP[listFontSize] || LIST_FONT_SIZE_MAP.medium;

  useEffect(() => { getRecording(verse.id).then(blob => setHasRecording(!!blob)); }, [verse.id, isRecording]);

  const handleRecordClick = (e) => { e.stopPropagation(); onRecord(verse.id, isRecording, setIsRecording); };
  const handleDeleteClick = (e) => { e.stopPropagation(); onDeleteRecord(verse.id, setHasRecording); };
  const handlePlayClick = (e) => { e.stopPropagation(); onPlay(verse); };

  const verseWithStatus = useMemo(() => allVerses.find(v => v.id === verse.id) || verse, [verse, allVerses]);

  return (
    <React.Fragment>
      <TableRow onClick={() => setOpen(!open)} sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer', bgcolor: isPlaying ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
        <TableCell sx={{ minWidth: 180, fontSize: fs.title, fontWeight: 500, verticalAlign: 'top' }}>
          {verse.제목}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={isPlaying ? "중지" : "듣기"}><IconButton size="small" onClick={handlePlayClick} sx={{ p: 0.5, color: isPlaying ? 'primary.main' : 'action.active' }}>{isPlaying ? <StopIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}</IconButton></Tooltip>
            <Tooltip title={isRecording ? "중지" : "녹음"}><IconButton size="small" onClick={handleRecordClick} sx={{ p: 0.5, color: isRecording ? 'error.main' : (hasRecording ? 'success.main' : 'action.active') }}>{isRecording ? <StopIcon fontSize="small" /> : <MicIcon fontSize="small" />}</IconButton></Tooltip>
            {hasRecording && !isRecording && <IconButton size="small" onClick={handleDeleteClick} sx={{ p: 0.5 }}><DeleteIcon fontSize="small" /></IconButton>}
          </Box>
        </TableCell>
        <TableCell sx={{ fontSize: fs.ref, verticalAlign: 'top', minWidth: 100 }}>{verse.장절}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}>
              <Typography sx={{ whiteSpace: 'pre-line', fontSize: fs.body, lineHeight: 1.6 }}>{verse.본문}</Typography>
              {tags && tags.length > 0 && <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{tags.map(tag => <Chip key={tag} label={tag} size="small" variant="outlined" />)}</Box>}
              <Box mt={2} borderTop={1} borderColor="grey.200">
                <ActionBar verse={verseWithStatus} onStatusToggle={(field) => onStatusToggle(verse.id, field)} onTagDialogOpen={() => onTagDialogOpen(verse)} onCopy={() => onCopyVerse(verse)} />
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function VerseList() {
  const { isLoading, originalVerses: allVerses, tagsData, updateVerseStatus, updateTags } = useContext(DataContext);
  const { settings } = useContext(AppSettingsContext);
  const { listFontSize } = settings;
  const { showSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({ searchText: '', tagSearchText: '', selectedCategory: '전체', selectedSubcategory: '전체', typeFilter: '전체' });
  const [viewType, setViewType] = useState('card');
  const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 12 });
  const [isInitialStateApplied, setIsInitialStateApplied] = useState(false);

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedVerseForTags, setSelectedVerseForTags] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);

  const [playingVerseId, setPlayingVerseId] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);

  const audioRef = useRef(null);
  const speechRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const sequenceTimeoutRef = useRef(null);
  const itemRefs = useRef({});

  const debouncedSearchText = useDebounce(filters.searchText, 300);
  const debouncedTagSearchText = useDebounce(filters.tagSearchText, 300);

  const { categoryList, subcategoryList } = useMemo(() => {
    if (!allVerses) return { categoryList: [], subcategoryList: [] };
    const categories = ['전체', ...new Set(allVerses.map(v => v.카테고리).filter(Boolean))];
    const subcategories = ['전체', ...new Set(allVerses.filter(v => filters.selectedCategory === '전체' || v.카테고리 === filters.selectedCategory).map(v => v.소카테고리).filter(Boolean))];
    return { categoryList: categories, subcategoryList: subcategories };
  }, [allVerses, filters.selectedCategory]);

  const filteredVerses = useMemo(() => {
    if (!allVerses) return [];
    return allVerses.filter(v => {
      const searchLower = debouncedSearchText.toLowerCase();
      const tagSearchLower = debouncedTagSearchText.toLowerCase();
      const matchSearch = !searchLower || ['제목', '장절', '본문', '카테고리', '소카테고리'].some(key => (v[key] || '').toLowerCase().includes(searchLower)) || (v.암송시작일 && v.암송시작일.toLowerCase().includes(searchLower));
      const matchTag = !tagSearchLower || (tagsData[v.id] || []).some(tag => tag.toLowerCase().includes(tagSearchLower));
      const matchCategory = filters.selectedCategory === '전체' || v.카테고리 === filters.selectedCategory;
      const matchSubcategory = filters.selectedSubcategory === '전체' || v.소카테고리 === filters.selectedSubcategory;
      const matchType = filters.typeFilter === '전체' || (filters.typeFilter === '뉴구절' && v.뉴구절여부) || (filters.typeFilter === '최근구절' && v.최근구절여부) || (filters.typeFilter === '오답구절' && v.오답여부) || (filters.typeFilter === '즐겨찾기' && v.즐겨찾기);
      return matchSearch && matchTag && matchCategory && matchSubcategory && matchType;
    });
  }, [allVerses, tagsData, debouncedSearchText, debouncedTagSearchText, filters.selectedCategory, filters.selectedSubcategory, filters.typeFilter]);

  const wakeLockRef = useRef(null);
  const requestWakeLock = useCallback(async () => { try { if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) { console.log(err); } }, []);
  const releaseWakeLock = useCallback(async () => { if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; } }, []);
  useEffect(() => { if (isAutoPlaying) requestWakeLock(); else releaseWakeLock(); return () => releaseWakeLock(); }, [isAutoPlaying, requestWakeLock, releaseWakeLock]);

  const stopAllAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (sequenceTimeoutRef.current) { clearTimeout(sequenceTimeoutRef.current); sequenceTimeoutRef.current = null; }
    setPlayingVerseId(null);
  }, []);

  // 페이지 이동 시 오디오 리소스 해제
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
      if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
    };
  }, []);

  const playVerseSequence = async (verseToRead) => {
    if (!verseToRead) return;
    stopAllAudio();
    setPlayingVerseId(verseToRead.id);

    if (isAutoPlaying && itemRefs.current[verseToRead.id]) {
      itemRefs.current[verseToRead.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const { fontType, ttsOrder, voiceURI, speechRate, ttsInterval, audioPriority } = settings;

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
          const versesKorean = versesPart.split(/[-,\s]+/).filter(Boolean).map(v => `${numberToSinoKorean(v)}절`).join(' ');
          return `${fullBook} ${chapKorean}${chapterUnit} ${versesKorean}`;
        }
      }
      return ref;
    };

    const readableRef = parseReferenceForTTS(verseToRead.장절);
    const match = verseToRead.장절.match(/^([1-3]?\s*[가-힣a-zA-Z\s]+)/);
    const isRefEnglish = match && /^[a-zA-Z0-9\s]+$/.test(match[1].trim());

    const speak = (text, isEnglish, onEnd) => {
      if (!text) { if (onEnd) onEnd(); return; }
      const utterance = new SpeechSynthesisUtterance(text.replace(/[:,-]/g, ' '));
      utterance.lang = isEnglish ? 'en-US' : 'ko-KR';
      utterance.rate = speechRate || 1.0;
      if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (selectedVoice && selectedVoice.lang.startsWith(utterance.lang.split('-')[0])) utterance.voice = selectedVoice;
      }
      utterance.onend = () => { if (onEnd) onEnd(); };
      utterance.onerror = () => { stopAllAudio(); };
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    const audioBlob = await getRecording(verseToRead.id);

    const step1_Ref = () => {
      if (ttsOrder === 'body-only') step3_Body();
      else speak(readableRef, isRefEnglish, () => step2_Wait());
    };

    const step2_Wait = () => {
      if (ttsInterval > 0) {
        sequenceTimeoutRef.current = setTimeout(() => step3_Body(), ttsInterval * 1000);
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
        audio.onended = () => { URL.revokeObjectURL(audioUrl); step4_RefClosing(); };
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
      setPlayingVerseId(null);
      if (isAutoPlaying) {
        setCurrentPlayIndex(prev => prev + 1);
      }
    };

    step1_Ref();
  };

  useEffect(() => {
    if (isAutoPlaying && currentPlayIndex >= 0 && currentPlayIndex < playlist.length) {
      const nextVerse = playlist[currentPlayIndex];

      const globalIndex = filteredVerses.findIndex(v => v.id === nextVerse.id);
      if (globalIndex !== -1) {
        const targetPage = Math.floor(globalIndex / pagination.rowsPerPage);
        if (targetPage !== pagination.page) {
          setPagination(prev => ({ ...prev, page: targetPage }));
        }
      }
      playVerseSequence(nextVerse);

    } else if (isAutoPlaying && currentPlayIndex >= playlist.length && playlist.length > 0) {
      setIsAutoPlaying(false);
      setCurrentPlayIndex(-1);
      showSnackbar('연속 재생이 완료되었습니다.', 'success');
    }
  }, [isAutoPlaying, currentPlayIndex, playlist, filteredVerses, pagination.rowsPerPage]);

  const handlePlaySingle = (verse) => {
    if (playingVerseId === verse.id) {
      stopAllAudio();
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(false);
      playVerseSequence(verse);
    }
  };

  const handleStartAutoPlay = () => {
    if (isAutoPlaying) {
      stopAllAudio();
      setIsAutoPlaying(false);
    } else {
      if (filteredVerses.length === 0) { showSnackbar('재생할 구절이 없습니다.', 'warning'); return; }

      if (currentPlayIndex > -1 && playlist.length > 0) {
        setIsAutoPlaying(true);
        showSnackbar(`이어듣기를 시작합니다. (${currentPlayIndex + 1}/${playlist.length})`, 'info');
      } else {
        setPlaylist(filteredVerses);
        setCurrentPlayIndex(0);
        setIsAutoPlaying(true);
        showSnackbar(`총 ${filteredVerses.length}개 구절 연속 재생을 시작합니다.`, 'info');
      }
    }
  };

  const handleStopAutoPlay = () => {
    stopAllAudio();
    setIsAutoPlaying(false);
    setCurrentPlayIndex(-1);
    setPlaylist([]);
  };

  // --- [수정] 자연스러운 목소리 + 128kbps 고음질 녹음 설정 ---
  const handleRecord = async (verseId, isRecordingNow, setLocalRecordingState) => {
    if (isRecordingNow) {
      mediaRecorderRef.current.stop();
      setLocalRecordingState(false);
    } else {
      if (playingVerseId) stopAllAudio();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: true,
            autoGainControl: false, // 목소리 울렁거림 방지
            sampleRate: 44100,
            channelCount: 1
          }
        });

        const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 }
          : {};

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await saveRecording(verseId, audioBlob);
          stream.getTracks().forEach(track => track.stop()); // 권한 해제
        };
        mediaRecorder.start();
        setLocalRecordingState(true);
      } catch (err) { showSnackbar('마이크 권한이 필요합니다.', 'error'); }
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, verseId: null, setHasRecording: null });

  const handleDeleteRecord = (verseId, setHasRecording) => {
    setDeleteConfirm({ open: true, verseId, setHasRecording });
  };

  const doDeleteRecord = async () => {
    if (deleteConfirm.verseId) {
      await deleteRecording(deleteConfirm.verseId);
      deleteConfirm.setHasRecording?.(false);
    }
    setDeleteConfirm({ open: false, verseId: null, setHasRecording: null });
  };

  useEffect(() => {
    const loadSavedState = () => {
      const savedState = loadDataFromLocal(VERSELIST_STATE_KEY);
      if (savedState && Object.keys(savedState).length > 0) {
        setFilters({ searchText: savedState.searchText || '', tagSearchText: savedState.tagSearchText || '', selectedCategory: savedState.selectedCategory || '전체', selectedSubcategory: savedState.selectedSubcategory || '전체', typeFilter: savedState.typeFilter || '전체' });
        setViewType(savedState.viewType || 'card');
        setPagination({ page: savedState.page || 0, rowsPerPage: savedState.rowsPerPage || 12 });
      }
      setIsInitialStateApplied(true);
    };
    loadSavedState();
  }, []);

  useEffect(() => {
    if (!isInitialStateApplied) return;
    const stateToSave = { ...filters, viewType, ...pagination };
    const handler = setTimeout(() => saveDataToLocal(VERSELIST_STATE_KEY, stateToSave), 500);
    return () => clearTimeout(handler);
  }, [filters, viewType, pagination, isInitialStateApplied]);

  const handleStatusToggle = (verseId, field) => {
    const verse = allVerses.find(v => v.id === verseId);
    if (!verse) return;
    updateVerseStatus(verseId, { [field]: !verse[field] });
  };

  const handleTagDialogOpen = (verse) => { setSelectedVerseForTags(verse); setTagDialogOpen(true); };
  const handleTagDialogClose = () => { setTagDialogOpen(false); };
  const handleCopyVerse = (verseToCopy) => {
    if (!verseToCopy) return;
    const textToCopy = `${verseToCopy.장절}\n${verseToCopy.본문}`;
    navigator.clipboard.writeText(textToCopy).then(() => showSnackbar('구절이 복사되었습니다.', 'info'));
  };
  const handleCardExpand = (verseId) => setExpandedCardId(prevId => (prevId === verseId ? null : verseId));
  const handleFilterChange = (field, value) => { setFilters(prev => ({ ...prev, [field]: value })); setPagination(prev => ({ ...prev, page: 0 })); };

  const handleChangePage = (event, newPage) => setPagination(prev => ({ ...prev, page: newPage }));
  const handleChangeRowsPerPage = (event) => setPagination({ page: 0, rowsPerPage: parseInt(event.target.value, 10) });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="subtitle1">총 <strong>{filteredVerses.length}</strong>개 구절</Typography>

        <Box display="flex" gap={1}>
          <Button
            variant={isAutoPlaying ? "contained" : "outlined"}
            color={isAutoPlaying ? "warning" : "primary"}
            startIcon={isAutoPlaying ? <PauseIcon /> : <PlaylistPlayIcon />}
            onClick={handleStartAutoPlay}
            size="small"
          >
            {isAutoPlaying ? "일시정지" : (currentPlayIndex > -1 ? "이어듣기" : "전체 듣기")}
          </Button>

          {(isAutoPlaying || currentPlayIndex > -1) && (
            <Tooltip title="재생 목록 초기화">
              <IconButton size="small" color="error" onClick={handleStopAutoPlay}><StopIcon /></IconButton>
            </Tooltip>
          )}

          <ToggleButtonGroup value={viewType} exclusive onChange={(e, newView) => newView && setViewType(newView)} aria-label="보기 방식 선택" size="small">
            <ToggleButton value="list"><ViewListIcon /></ToggleButton>
            <ToggleButton value="card"><ViewModuleIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="전체 검색" variant="outlined" value={filters.searchText} onChange={(e) => handleFilterChange('searchText', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="태그 검색" variant="outlined" value={filters.tagSearchText} onChange={(e) => handleFilterChange('tagSearchText', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>카테고리</InputLabel><Select value={filters.selectedCategory} onChange={(e) => handleFilterChange('selectedCategory', e.target.value)} label="카테고리">{categoryList.map(cat => (<MenuItem key={cat} value={cat}>{cat}</MenuItem>))}</Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>소카테고리</InputLabel><Select value={filters.selectedSubcategory} onChange={(e) => handleFilterChange('selectedSubcategory', e.target.value)} label="소카테고리">{subcategoryList.map(sub => (<MenuItem key={sub} value={sub}>{sub}</MenuItem>))}</Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>유형 필터</InputLabel><Select value={filters.typeFilter} onChange={(e) => handleFilterChange('typeFilter', e.target.value)} label="유형 필터">{['전체', '미암송', '뉴구절', '최근구절', '오답구절', '즐겨찾기'].map(f => (<MenuItem key={f} value={f}>{f}</MenuItem>))}</Select></FormControl></Grid>
        </Grid>
      </Paper>

      {(isAutoPlaying || currentPlayIndex > -1) && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <Typography variant="caption" align="center" display="block" gutterBottom>
            {isAutoPlaying ? "재생 중" : "일시정지"}: {currentPlayIndex + 1} / {playlist.length} - {playlist[currentPlayIndex]?.장절 || ""}
          </Typography>
          <LinearProgress variant="determinate" value={playlist.length > 0 ? ((currentPlayIndex + 1) / playlist.length) * 100 : 0} color={isAutoPlaying ? "primary" : "warning"} />
        </Box>
      )}

      {viewType === 'list' ? (
        <Paper elevation={3}>
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead><TableRow sx={{ "& th": { fontWeight: 'bold' } }}><TableCell>제목 / 컨트롤</TableCell><TableCell>장절</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredVerses.slice(pagination.page * pagination.rowsPerPage, (pagination.page + 1) * pagination.rowsPerPage).map((v) => (
                  <React.Fragment key={v.id}>
                    <tr ref={el => itemRefs.current[v.id] = el} style={{ display: 'none' }} />
                    <VerseRow
                      verse={v} allVerses={allVerses} tags={tagsData[v.id]}
                      onStatusToggle={handleStatusToggle} onTagDialogOpen={handleTagDialogOpen} onCopyVerse={handleCopyVerse}
                      isPlaying={playingVerseId === v.id} onPlay={handlePlaySingle} onRecord={handleRecord} onDeleteRecord={handleDeleteRecord}
                      listFontSize={listFontSize}
                    />
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[12, 25, 50, 100]} component="div" count={filteredVerses.length} rowsPerPage={pagination.rowsPerPage} page={pagination.page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
        </Paper>
      ) : (
        <Box>
          <Grid container spacing={2}>
            {filteredVerses.slice(pagination.page * pagination.rowsPerPage, (pagination.page + 1) * pagination.rowsPerPage).map(v => (
              <Grid item xs={12} sm={6} md={4} key={v.id} ref={el => itemRefs.current[v.id] = el}>
                <VerseItem
                  verse={v} allVerses={allVerses} tags={tagsData[v.id]}
                  onStatusToggle={handleStatusToggle} onTagDialogOpen={handleTagDialogOpen} onCopyVerse={handleCopyVerse}
                  isPlaying={playingVerseId === v.id} onPlay={handlePlaySingle} onRecord={handleRecord} onDeleteRecord={handleDeleteRecord}
                  listFontSize={listFontSize}
                />
              </Grid>
            ))}
          </Grid>
          <TablePagination rowsPerPageOptions={[12, 24, 48, 96]} component="div" count={filteredVerses.length} rowsPerPage={pagination.rowsPerPage} page={pagination.page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
        </Box>
      )}

      <TagDialog open={tagDialogOpen} onClose={handleTagDialogClose} verse={selectedVerseForTags} tags={tagsData} onSaveTags={updateTags} />

      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, verseId: null, setHasRecording: null })}>
        <DialogContent>
          <DialogContentText>녹음 파일을 삭제하시겠습니까?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, verseId: null, setHasRecording: null })}>취소</Button>
          <Button onClick={doDeleteRecord} variant="contained" color="error" autoFocus>삭제</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default VerseList;