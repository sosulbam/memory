// src/pages/VerseManager.js
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  Box, Button, Container, Typography, Input, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Grid, CircularProgress, Alert, Snackbar, Dialog, DialogActions,
  DialogContent, DialogTitle, Chip, IconButton, TablePagination, Stack, Autocomplete, ToggleButtonGroup,
  ToggleButton, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Collapse,
  FormGroup, FormControlLabel, Checkbox, Divider
} from '@mui/material';

import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LabelIcon from '@mui/icons-material/Label';
import CancelIcon from '@mui/icons-material/Cancel';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import DescriptionIcon from '@mui/icons-material/Description';

import { DataContext } from '../contexts/DataContext';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { saveDataToLocal, loadDataFromLocal } from '../api/localStorageApi';
import { getAllRecordings, saveRecording, clearAllRecordings } from '../api/audioStorage';
import { VERSES_DATA_KEY, TAGS_DATA_KEY, REVIEW_STATUS_KEY, REVIEW_LOG_KEY, TURN_SCHEDULE_KEY, LAST_APP_STATE_KEY, THEME_PREFERENCE_KEY } from '../constants';
import { useDebounce } from '../hooks/useDebounce';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MANAGER_FONT_SIZE_MAP = {
  small:  { title: '0.85rem', ref: '0.75rem', body: '0.85rem' },
  medium: { title: '1rem',    ref: '0.875rem', body: '1rem'   },
  large:  { title: '1.2rem',  ref: '1rem',    body: '1.2rem'  },
};

function VerseRow({ verse, onEdit, onDelete, onTagOpen, listFontSize }) {
  const [open, setOpen] = useState(false);
  const fs = MANAGER_FONT_SIZE_MAP[listFontSize] || MANAGER_FONT_SIZE_MAP.medium;
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell onClick={() => setOpen(!open)} sx={{ cursor: 'pointer', fontSize: fs.title }}>{verse.제목}</TableCell>
        <TableCell onClick={() => setOpen(!open)} sx={{ cursor: 'pointer', fontSize: fs.ref }}>{verse.장절}</TableCell>
        <TableCell align="center">
          <IconButton size="small" onClick={() => onEdit(verse)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="secondary" onClick={() => onTagOpen(verse)}><LabelIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(verse.id)}><DeleteIcon fontSize="small" /></IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}>
              <Typography sx={{ whiteSpace: 'pre-line', fontSize: fs.body, lineHeight: 1.6 }}>{verse.본문}</Typography>
              {verse.암송시작일 && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                  암송시작일: {verse.암송시작일}
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function VerseManager() {
  const { isLoading, originalVerses, tagsData, loadData, reviewStatusData, turnScheduleData, reviewLogData } = useContext(DataContext);
  const { settings } = useContext(AppSettingsContext);
  const { listFontSize } = settings;
  const fs = MANAGER_FONT_SIZE_MAP[listFontSize] || MANAGER_FONT_SIZE_MAP.medium;

  const [verses, setVerses] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newVerse, setNewVerse] = useState({
    카테고리: '', 소카테고리: '', 제목: '', 장절: '', 본문: '',
    미암송여부: false, 뉴구절여부: false, 즐겨찾기: false,
    암송시작일: getTodayDateString()
  });
  const [editingId, setEditingId] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 10 });
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditVerse, setTagEditVerse] = useState(null);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState(null);
  const [selectedAudioPackFile, setSelectedAudioPackFile] = useState(null);

  const [viewType, setViewType] = useState('list');
  const [filters, setFilters] = useState({ searchText: '', tagSearchText: '', selectedCategory: '전체', selectedSubcategory: '전체', typeFilter: '전체' });
  const [expandedCardId, setExpandedCardId] = useState(null);

  const debouncedSearchText = useDebounce(filters.searchText, 300);
  const debouncedTagSearchText = useDebounce(filters.tagSearchText, 300);

  useEffect(() => { if (originalVerses) setVerses(originalVerses); }, [originalVerses]);

  const allVerses = useMemo(() => originalVerses || [], [originalVerses]);

  const { categoryList, subcategoryList } = useMemo(() => {
    if (!allVerses) return { categoryList: [], subcategoryList: [] };
    const categories = ['전체', ...new Set(allVerses.map(v => v.카테고리).filter(Boolean))];
    const subcategories = ['전체', ...new Set(allVerses.filter(v => filters.selectedCategory === '전체' || v.카테고리 === filters.selectedCategory).map(v => v.소카테고리).filter(Boolean))];
    return { categoryList: categories, subcategoryList: subcategories };
  }, [allVerses, filters.selectedCategory]);

  const categoryOptions = useMemo(() => {
    if (!originalVerses) return [];
    return [...new Set(originalVerses.map(v => v.카테고리).filter(Boolean))];
  }, [originalVerses]);

  const subcategoryOptions = useMemo(() => {
    if (!originalVerses || !newVerse.카테고리) return [];
    return [...new Set(originalVerses.filter(v => v.카테고리 === newVerse.카테고리 && v.소카테고리).map(v => v.소카테고리))];
  }, [originalVerses, newVerse.카테고리]);

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

  const resetForm = () => {
    setNewVerse({
      카테고리: '', 소카테고리: '', 제목: '', 장절: '', 본문: '',
      미암송여부: false, 뉴구절여부: false, 즐겨찾기: false,
      암송시작일: getTodayDateString()
    });
    setEditingId(null);
  };

  const handleSaveData = useCallback(async (key, dataToSave, successMessage) => {
    setIsSaving(true);
    saveDataToLocal(key, dataToSave);
    if (successMessage) showSnackbar(successMessage);
    await loadData();
    setIsSaving(false);
    return true;
  }, [loadData, showSnackbar]);

  const handleAddOrUpdateVerse = async () => {
    if (!newVerse.제목 || !newVerse.본문 || !newVerse.카테고리 || !newVerse.장절) {
      showSnackbar('카테고리, 제목, 장절, 본문은 필수입니다.', 'warning');
      return;
    }

    let updatedVerses;
    if (editingId) {
      updatedVerses = verses.map((v) => (v.id === editingId ? { ...v, ...newVerse } : v));
    } else {
      const newVerseWithId = { ...newVerse, id: generateId(), 번호: String(verses.length + 1) };
      updatedVerses = [...verses, newVerseWithId];
    }
    if (await handleSaveData(VERSES_DATA_KEY, updatedVerses, editingId ? '구절이 수정되었습니다.' : '새 구절이 추가되었습니다.')) {
      resetForm();
    }
  };

  const handleDelete = async (idToDelete) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    const updatedVerses = verses.filter((v) => v.id !== idToDelete);
    if (await handleSaveData(VERSES_DATA_KEY, updatedVerses, '구절이 삭제되었습니다.')) {
      const newTags = { ...tagsData };
      delete newTags[idToDelete];
      await handleSaveData(TAGS_DATA_KEY, newTags);
    }
  };

  const handleEdit = (verse) => {
    setEditingId(verse.id);
    setNewVerse({ ...verse, 암송시작일: verse.암송시작일 || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openTagDialog = (verse) => { setTagEditVerse(verse); setTagDialogOpen(true); };
  const closeTagDialog = () => { setTagEditVerse(null); setCurrentTagInput(''); setTagDialogOpen(false); };

  const handleAddTag = async () => {
    if (!tagEditVerse || !currentTagInput.trim()) return;
    const { id } = tagEditVerse;
    const currentTags = tagsData[id] || [];
    const newTag = currentTagInput.trim();
    if (currentTags.includes(newTag)) { setCurrentTagInput(''); return; }
    await handleSaveData(TAGS_DATA_KEY, { ...tagsData, [id]: [...currentTags, newTag] }, '태그가 추가되었습니다.');
    setCurrentTagInput('');
  };

  const handleRemoveTag = async (tagToRemove) => {
    if (!tagEditVerse) return;
    const { id } = tagEditVerse;
    const newTags = (tagsData[id] || []).filter(tag => tag !== tagToRemove);
    await handleSaveData(TAGS_DATA_KEY, { ...tagsData, [id]: newTags }, '태그가 삭제되었습니다.');
  };

  const handleTemplateDownload = () => {
    const ws = XLSX.utils.aoa_to_sheet([['id', '번호', '카테고리', '소카테고리', '제목', '장절', '본문', '태그', '미암송여부', '뉴구절여부', '오답여부', '즐겨찾기', '최근구절여부', '암송시작일']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VerseTemplate');
    XLSX.writeFile(wb, 'verse_template.xlsx');
  };

  const handleBulkAudioUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!window.confirm(`총 ${files.length}개의 오디오 파일을 업로드하시겠습니까? (장절이 같은 모든 구절에 적용됩니다)`)) return;

    setIsSaving(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of files) {
        let fileName = file.name.replace(/\.[^/.]+$/, "");
        let cleanName = fileName.split('(')[0].trim();
        const smartName = cleanName.replace(/[\._]/g, ':');
        const removeSpaces = (str) => str.replace(/\s+/g, '');

        let targetVerses = originalVerses.filter(v => {
          const dbRef = removeSpaces(v.장절);
          const fileRef = removeSpaces(smartName);
          return dbRef === fileRef;
        });

        if (targetVerses.length === 0) {
          targetVerses = originalVerses.filter(v => removeSpaces(v.장절) === removeSpaces(cleanName));
        }

        if (targetVerses.length > 0) {
          for (const verse of targetVerses) {
            await saveRecording(verse.id, file);
          }
          successCount += targetVerses.length;
        } else {
          failCount++;
          console.warn(`매칭되는 구절 없음: ${file.name} (변환값: ${smartName})`);
        }
      }
      showSnackbar(`업로드 완료: 총 ${successCount}개 구절에 적용됨 (${failCount}개 파일 실패)`, successCount > 0 ? 'success' : 'warning');
    } catch (error) {
      console.error("Bulk upload error:", error);
      showSnackbar('일괄 업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };

  const handleAudioPackExport = async () => {
    setIsSaving(true);
    try {
      const zip = new JSZip();
      const audioRecordings = await getAllRecordings();
      const audioFolder = zip.folder("audio");
      let audioCount = 0;

      for (const [verseId, blob] of Object.entries(audioRecordings)) {
        if (blob) {
          let ext = 'webm';
          if (blob.type === 'audio/mpeg' || blob.type === 'audio/mp3') ext = 'mp3';
          else if (blob.type === 'audio/wav') ext = 'wav';
          else if (blob.type === 'audio/m4a') ext = 'm4a';

          audioFolder.file(`${verseId}.${ext}`, blob);
          audioCount++;
        }
      }

      if (audioCount === 0) {
        showSnackbar('내보낼 녹음 파일이 없습니다.', 'warning');
        setIsSaving(false);
        return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `verse_audio_pack_${getTodayDateString()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSnackbar(`오디오팩 다운로드 완료 (${audioCount}개 파일)`, 'success');
    } catch (error) {
      console.error("Audio Export Error:", error);
      showSnackbar('오디오팩 내보내기 실패', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioPackFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedAudioPackFile(event.target.files[0]);
    }
  };

  const handleAudioPackImport = async () => {
    if (!selectedAudioPackFile) {
      showSnackbar('가져올 오디오팩(ZIP) 파일을 선택해주세요.', 'warning');
      return;
    }
    if (!window.confirm('선택한 오디오팩의 파일들을 현재 데이터에 병합합니다. (기존 녹음이 있으면 덮어씌워짐) 진행할까요?')) return;

    setIsSaving(true);
    try {
      const zip = await JSZip.loadAsync(selectedAudioPackFile);
      let audioCount = 0;
      const filePromises = [];

      zip.forEach((relativePath, file) => {
        if (!file.dir && !relativePath.startsWith('__MACOSX') && !relativePath.includes('.DS_Store')) {
          const fileName = relativePath.split('/').pop();
          const verseId = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
          const verseExists = originalVerses.some(v => v.id === verseId);

          if (verseExists) {
            const promise = file.async("blob").then(blob => {
              return saveRecording(verseId, blob);
            });
            filePromises.push(promise);
          }
        }
      });

      await Promise.all(filePromises);
      audioCount = filePromises.length;

      if (audioCount > 0) {
        await loadData();
        showSnackbar(`오디오팩 적용 완료! (${audioCount}개 파일)`, 'success');
      } else {
        showSnackbar('적용할 오디오 파일이 없거나 매칭되는 구절 ID가 없습니다.', 'warning');
      }

    } catch (error) {
      console.error("Audio Import Error:", error);
      showSnackbar('오디오팩 가져오기 실패 (올바른 ZIP 파일인가요?)', 'error');
    } finally {
      setIsSaving(false);
      setSelectedAudioPackFile(null);
    }
  };

  // --- [추가] 데이터만 백업하는 기능 ---
  const handleDataOnlyBackup = async () => {
    setIsSaving(true);
    try {
      const zip = new JSZip();

      const backupData = {
        version: 2,
        date: new Date().toISOString(),
        verses: originalVerses || [],
        tags: tagsData || {},
        reviewStatus: reviewStatusData || {},
        reviewLog: reviewLogData || {},
        turnSchedule: turnScheduleData || {},
        settings: loadDataFromLocal(LAST_APP_STATE_KEY) || {},
        theme: loadDataFromLocal(THEME_PREFERENCE_KEY) || {},
      };
      zip.file("data.json", JSON.stringify(backupData, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `verse_data_backup_${getTodayDateString()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSnackbar('데이터 백업 완료 (오디오 제외)', 'success');
    } catch (error) {
      console.error("Data Backup failed:", error);
      showSnackbar('데이터 백업 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFullBackup = async () => {
    setIsSaving(true);
    try {
      const zip = new JSZip();

      const backupData = {
        version: 2,
        date: new Date().toISOString(),
        verses: originalVerses || [],
        tags: tagsData || {},
        reviewStatus: reviewStatusData || {},
        reviewLog: reviewLogData || {},
        turnSchedule: turnScheduleData || {},
        settings: loadDataFromLocal(LAST_APP_STATE_KEY) || {},
        theme: loadDataFromLocal(THEME_PREFERENCE_KEY) || {},
      };
      zip.file("data.json", JSON.stringify(backupData, null, 2));

      const audioRecordings = await getAllRecordings();
      const audioFolder = zip.folder("audio");
      let audioCount = 0;

      for (const [verseId, blob] of Object.entries(audioRecordings)) {
        if (blob) {
          let ext = 'webm';
          if (blob.type === 'audio/mpeg' || blob.type === 'audio/mp3') ext = 'mp3';
          else if (blob.type === 'audio/wav') ext = 'wav';
          else if (blob.type === 'audio/m4a') ext = 'm4a';

          audioFolder.file(`${verseId}.${ext}`, blob);
          audioCount++;
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `verse_full_backup_${getTodayDateString()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSnackbar(`전체 백업 완료 (구절 데이터 + 녹음 파일 ${audioCount}개)`, 'success');
    } catch (error) {
      console.error("Backup failed:", error);
      showSnackbar('백업 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedBackupFile(event.target.files[0]);
    }
  };

  const handleFullRestore = async () => {
    if (!selectedBackupFile) {
      showSnackbar('복원할 ZIP 파일을 선택해주세요.', 'warning');
      return;
    }
    if (!window.confirm('주의: 현재의 모든 데이터가 삭제되고 덮어쓰기 됩니다. 계속하시겠습니까?')) return;

    setIsSaving(true);
    try {
      const zip = await JSZip.loadAsync(selectedBackupFile);

      const dataFile = zip.file("data.json");
      if (!dataFile) throw new Error("백업 파일에 data.json이 없습니다.");

      const dataContent = await dataFile.async("text");
      const backupData = JSON.parse(dataContent);

      if (!backupData.verses) throw new Error('유효하지 않은 데이터 형식입니다.');

      saveDataToLocal(VERSES_DATA_KEY, backupData.verses);
      saveDataToLocal(TAGS_DATA_KEY, backupData.tags || {});
      saveDataToLocal(REVIEW_STATUS_KEY, backupData.reviewStatus || {});
      saveDataToLocal(REVIEW_LOG_KEY, backupData.reviewLog || {});
      saveDataToLocal(TURN_SCHEDULE_KEY, backupData.turnSchedule || {});
      if (backupData.settings) saveDataToLocal(LAST_APP_STATE_KEY, backupData.settings);
      if (backupData.theme) saveDataToLocal(THEME_PREFERENCE_KEY, backupData.theme);

      const audioFolder = zip.folder("audio");
      let audioCount = 0;

      // 오디오 폴더가 있으면 기존 녹음을 지우고 복원, 없으면 기존 녹음 유지 (데이터만 복원했을 수 있음)
      if (audioFolder) {
        await clearAllRecordings();
        const filePromises = [];
        audioFolder.forEach((relativePath, file) => {
          const verseId = relativePath.substring(0, relativePath.lastIndexOf('.')) || relativePath;
          const promise = file.async("blob").then(blob => {
            return saveRecording(verseId, blob);
          });
          filePromises.push(promise);
        });
        await Promise.all(filePromises);
        audioCount = filePromises.length;
      }

      await loadData();
      showSnackbar(`복원 완료! (데이터 + 녹음 파일 ${audioCount}개)`, 'success');
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error("Restore error:", error);
      showSnackbar('파일 복원 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
      setSelectedBackupFile(null);
    }
  };

  const handleDataDownload = () => {
    if (!originalVerses?.length) { alert('다운로드할 데이터가 없습니다.'); return; }
    const dataToExport = originalVerses.map(v => ({
      ...v,
      ...(reviewStatusData[v.id] || {}),
      태그: (tagsData[v.id] || []).join(', ')
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MyVerses');
    XLSX.writeFile(wb, 'recitation_app_all_data.xlsx');
  };

  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) { showSnackbar('업로드할 파일을 선택해주세요.', 'warning'); return; }
    if (!window.confirm('엑셀 파일을 업로드합니다. ID가 동일한 구절은 건너뜁니다.')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const newVersesData = XLSX.utils.sheet_to_json(worksheet);

        if (newVersesData.length === 0) { showSnackbar('데이터가 없습니다.', 'warning'); return; }

        setIsSaving(true);
        const updatedVerses = [...originalVerses];
        const updatedTags = { ...tagsData };
        const existingVerseIds = new Set(updatedVerses.map(v => v.id));
        let addedCount = 0;

        newVersesData.forEach((row) => {
          const { 태그, ...verseData } = row;
          if (!verseData.장절 || !verseData.본문) return;
          if (verseData.id && existingVerseIds.has(verseData.id)) return;

          const newId = verseData.id || generateId();
          updatedVerses.push({ ...verseData, id: newId, 번호: String(originalVerses.length + addedCount + 1) });
          existingVerseIds.add(newId);
          addedCount++;
          if (태그 && typeof 태그 === 'string') updatedTags[newId] = [...new Set(태그.split(',').map(t => t.trim()).filter(Boolean))];
        });

        saveDataToLocal(VERSES_DATA_KEY, updatedVerses);
        saveDataToLocal(TAGS_DATA_KEY, updatedTags);
        await loadData();
        showSnackbar(`${addedCount}개 추가됨`, 'success');

      } catch (error) { showSnackbar('오류 발생', 'error'); }
      finally { setIsSaving(false); setSelectedFile(null); }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleResetAllData = async () => {
    if (window.confirm('정말로 모든 데이터를 삭제하시겠습니까? (녹음 파일 포함, 복구 불가)')) {
      setIsSaving(true);
      localStorage.clear();
      await clearAllRecordings();
      showSnackbar('초기화 완료. 새로고침합니다.', 'success');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleCardExpand = (verseId) => {
    setExpandedCardId(prevId => (prevId === verseId ? null : verseId));
  };

  const filteredVerses = useMemo(() => {
    if (!verses) return [];
    return verses.filter(v => {
      const searchLower = debouncedSearchText.toLowerCase();
      const tagSearchLower = debouncedTagSearchText.toLowerCase();
      const matchSearch = !searchLower ||
        ['제목', '장절', '본문', '카테고리', '소카테고리', '암송시작일'].some(key => (v[key] || '').toLowerCase().includes(searchLower));

      const matchTag = !tagSearchLower || (tagsData[v.id] || []).some(tag => tag.toLowerCase().includes(tagSearchLower));
      const matchCategory = filters.selectedCategory === '전체' || v.카테고리 === filters.selectedCategory;
      const matchSubcategory = filters.selectedSubcategory === '전체' || v.소카테고리 === filters.selectedSubcategory;
      const matchType = filters.typeFilter === '전체' ||
        (filters.typeFilter === '미암송' && v.미암송여부) ||
        (filters.typeFilter === '뉴구절' && v.뉴구절여부) ||
        (filters.typeFilter === '최근구절' && v.최근구절여부) ||
        (filters.typeFilter === '오답구절' && v.오답여부) ||
        (filters.typeFilter === '즐겨찾기' && v.즐겨찾기);
      return matchSearch && matchTag && matchCategory && matchSubcategory && matchType;
    });
  }, [verses, debouncedSearchText, debouncedTagSearchText, filters.selectedCategory, filters.selectedSubcategory, filters.typeFilter, tagsData]);

  const handleChangePage = (event, newPage) => setPagination(p => ({ ...p, page: newPage }));
  const handleChangeRowsPerPage = (event) => setPagination({ page: 0, rowsPerPage: parseInt(event.target.value, 10) });

  if (isLoading) return <Container sx={{ py: 5, textAlign: 'center' }}><CircularProgress /></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>{editingId ? '구절 수정' : '새 구절 추가'}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><Autocomplete freeSolo options={categoryOptions} value={newVerse.카테고리} onInputChange={(e, val) => setNewVerse(p => ({ ...p, 카테고리: val, 소카테고리: e?.type === 'change' ? '' : p.소카테고리 }))} renderInput={(params) => <TextField {...params} label="카테고리 (*)" />} /></Grid>
          <Grid item xs={12} sm={4}><Autocomplete freeSolo options={subcategoryOptions} value={newVerse.소카테고리} disabled={!newVerse.카테고리} onInputChange={(e, val) => setNewVerse(p => ({ ...p, 소카테고리: val }))} renderInput={(params) => <TextField {...params} label="소카테고리" />} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="제목 (*)" value={newVerse.제목} onChange={(e) => setNewVerse({ ...newVerse, 제목: e.target.value })} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="장절 (*)" value={newVerse.장절} onChange={(e) => setNewVerse({ ...newVerse, 장절: e.target.value })} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="암송시작일" type="date" value={newVerse.암송시작일} onChange={(e) => setNewVerse({ ...newVerse, 암송시작일: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="본문 (*)" multiline rows={3} value={newVerse.본문} onChange={(e) => setNewVerse({ ...newVerse, 본문: e.target.value })} /></Grid>
          <Grid item xs={12}><FormGroup row><FormControlLabel control={<Checkbox checked={newVerse.미암송여부 || false} onChange={e => setNewVerse({ ...newVerse, 미암송여부: e.target.checked })} />} label="미암송" /><FormControlLabel control={<Checkbox checked={newVerse.뉴구절여부 || false} onChange={e => setNewVerse({ ...newVerse, 뉴구절여부: e.target.checked })} />} label="뉴구절" /><FormControlLabel control={<Checkbox checked={newVerse.즐겨찾기 || false} onChange={e => setNewVerse({ ...newVerse, 즐겨찾기: e.target.checked })} />} label="즐겨찾기" /></FormGroup></Grid>
        </Grid>
        <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
          {editingId && <Button variant="outlined" color="secondary" onClick={resetForm} startIcon={<CancelIcon />}>수정 취소</Button>}
          <Button variant="contained" onClick={handleAddOrUpdateVerse} startIcon={<AddCircleOutlineIcon />} disabled={isSaving}>{editingId ? '구절 수정' : '새 구절 추가'}</Button>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" gutterBottom>엑셀 구절 관리</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} size="small">
                {selectedFile ? selectedFile.name : '엑셀 파일 선택'}
                <Input type="file" accept=".xlsx, .xls" hidden onChange={handleFileSelect} />
              </Button>
              <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || isSaving} size="small">업로드</Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleTemplateDownload} size="small">템플릿</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDataDownload} size="small">데이터 다운로드</Button>
            </Stack>
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>데이터 전체 백업/복원 (ZIP: 데이터+녹음)</Typography>

            <Button
              component="label"
              variant="outlined"
              color="secondary"
              startIcon={<AudioFileIcon />}
              size="small"
              fullWidth
              sx={{ mb: 2, borderStyle: 'dashed' }}
            >
              오디오 파일 일괄 업로드 (다중 선택)
              <input type="file" hidden multiple accept="audio/*" onChange={handleBulkAudioUpload} />
            </Button>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" color="primary" startIcon={<FolderZipIcon />} size="small" onClick={handleAudioPackExport}>
                오디오팩만 내보내기
              </Button>
              <Button component="label" variant="outlined" color="primary" startIcon={<FolderZipIcon />} size="small">
                오디오팩만 가져오기
                <Input type="file" accept=".zip" hidden onChange={handleAudioPackFileSelect} />
              </Button>
              <Button variant="contained" color="success" size="small" onClick={handleAudioPackImport} disabled={!selectedAudioPackFile}>
                적용
              </Button>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleFullBackup} size="small">전체 백업</Button>
              {/* --- [추가] 데이터만 백업 버튼 --- */}
              <Button variant="outlined" color="primary" startIcon={<DescriptionIcon />} onClick={handleDataOnlyBackup} size="small">데이터만 백업 (JSON)</Button>
              <Button component="label" variant="outlined" color="primary" startIcon={<RestoreIcon />} size="small">
                {selectedBackupFile ? selectedBackupFile.name : '백업파일 선택'}
                <Input type="file" accept=".zip" hidden onChange={handleBackupFileSelect} />
              </Button>
              <Button variant="contained" color="warning" onClick={handleFullRestore} disabled={!selectedBackupFile || isSaving} size="small">복원하기</Button>
            </Stack>
            <Button variant="outlined" color="error" startIcon={<RestartAltIcon />} onClick={handleResetAllData} size="small" sx={{ mt: 1 }}>시스템 초기화</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="전체 검색" variant="outlined" value={filters.searchText} onChange={(e) => handleFilterChange('searchText', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="태그 검색" variant="outlined" value={filters.tagSearchText} onChange={(e) => handleFilterChange('tagSearchText', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>카테고리</InputLabel><Select value={filters.selectedCategory} onChange={(e) => handleFilterChange('selectedCategory', e.target.value)} label="카테고리">{categoryList.map(cat => (<MenuItem key={cat} value={cat}>{cat}</MenuItem>))}</Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>소카테고리</InputLabel><Select value={filters.selectedSubcategory} onChange={(e) => handleFilterChange('selectedSubcategory', e.target.value)} label="소카테고리">{subcategoryList.map(sub => (<MenuItem key={sub} value={sub}>{sub}</MenuItem>))}</Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>유형 필터</InputLabel><Select value={filters.typeFilter} onChange={(e) => handleFilterChange('typeFilter', e.target.value)} label="유형 필터">{['전체', '미암송', '뉴구절', '최근구절', '오답구절', '즐겨찾기'].map(f => (<MenuItem key={f} value={f}>{f}</MenuItem>))}</Select></FormControl></Grid>
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={2}>
        <Typography variant="subtitle2">총 {filteredVerses.length}개 구절</Typography>
        <ToggleButtonGroup value={viewType} exclusive onChange={(e, newView) => newView && setViewType(newView)} aria-label="보기 방식 선택">
          <ToggleButton value="list" aria-label="리스트로 보기"><ViewListIcon /></ToggleButton>
          <ToggleButton value="card" aria-label="카드로 보기"><ViewModuleIcon /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewType === 'list' ? (
        <TableContainer component={Paper} elevation={3}>
          <Table stickyHeader size="small">
            <TableHead><TableRow sx={{ '& th': { fontWeight: 'bold' } }}><TableCell>제목</TableCell><TableCell>장절</TableCell><TableCell align="center">관리</TableCell></TableRow></TableHead>
            <TableBody>
              {filteredVerses.slice(pagination.page * pagination.rowsPerPage, (pagination.page + 1) * pagination.rowsPerPage).map((v) => (
                <VerseRow key={v.id} verse={v} onEdit={handleEdit} onDelete={handleDelete} onTagOpen={openTagDialog} listFontSize={listFontSize} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box>
          <Grid container spacing={2}>
            {filteredVerses.slice(pagination.page * pagination.rowsPerPage, (pagination.page + 1) * pagination.rowsPerPage).map(v => (
              <Grid item xs={12} sm={6} md={4} key={v.id}>
                <Card onClick={() => handleCardExpand(v.id)} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography align="center" sx={{ fontSize: fs.title, fontWeight: 'bold' }}>{v.제목}</Typography>
                    <Typography color="text.secondary" align="left" sx={{ fontSize: fs.ref }}>{v.장절}</Typography>
                    <Typography sx={{ my: 1.5, whiteSpace: 'pre-line', flexGrow: 1, fontSize: fs.body }}>{v.본문}</Typography>
                    {(tagsData[v.id] || []).length > 0 && (<Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{tagsData[v.id].map(tag => <Chip key={tag} label={tag} size="small" />)}</Box>)}
                  </CardContent>
                  <Collapse in={expandedCardId === v.id} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', gap: 1, borderTop: '1px solid #eee' }}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(v); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="secondary" onClick={(e) => { e.stopPropagation(); openTagDialog(v); }}><LabelIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Collapse>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <TablePagination rowsPerPageOptions={[10, 25, 50]} component="div" count={filteredVerses.length} rowsPerPage={pagination.rowsPerPage} page={pagination.page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />

      <Dialog open={tagDialogOpen} onClose={closeTagDialog} fullWidth maxWidth="sm">
        <DialogTitle>태그 관리: {tagEditVerse?.제목}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>{(tagsData[tagEditVerse?.id] || []).map((tag) => <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} />)}</Box>
          <Box display="flex" gap={1} mt={2}>
            <TextField autoFocus margin="dense" label="새 태그" type="text" fullWidth variant="standard" value={currentTagInput} onChange={(e) => setCurrentTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTag()} />
            <Button onClick={handleAddTag} variant="contained" sx={{ alignSelf: 'flex-end' }}>추가</Button>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={closeTagDialog}>닫기</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default VerseManager;