// src/pages/VerseManager.js
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Box, Button, Container, Typography, Input, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Grid, CircularProgress, Alert, Snackbar, Dialog, DialogActions,
  DialogContent, DialogTitle, Chip, IconButton, TablePagination, Stack, Autocomplete, ToggleButtonGroup,
  ToggleButton, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Collapse,
  FormGroup, FormControlLabel, Checkbox
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

import { DataContext } from '../contexts/DataContext';
import { saveDataToLocal } from '../api/localStorageApi';
import { VERSES_DATA_KEY, TAGS_DATA_KEY, REVIEW_STATUS_KEY, REVIEW_LOG_KEY, TURN_SCHEDULE_KEY, LAST_APP_STATE_KEY } from '../constants';

function VerseRow({ verse, onEdit, onDelete, onTagOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>{verse.제목}</TableCell>
        <TableCell onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>{verse.장절}</TableCell>
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
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: 1.6 }}>{verse.본문}</Typography>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function VerseManager() {
  const { isLoading, originalVerses, tagsData, loadData, reviewStatusData } = useContext(DataContext);

  const [verses, setVerses] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newVerse, setNewVerse] = useState({ 
    카테고리: '', 소카테고리: '', 제목: '', 장절: '', 본문: '', 
    미암송여부: false, 뉴구절여부: false, 즐겨찾기: false 
  });
  const [editingId, setEditingId] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 10 });
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditVerse, setTagEditVerse] = useState(null);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedFile, setSelectedFile] = useState(null);

  const [viewType, setViewType] = useState('list');
  const [filters, setFilters] = useState({ searchText: '', tagSearchText: '', selectedCategory: '전체', selectedSubcategory: '전체', typeFilter: '전체' });
  const [expandedCardId, setExpandedCardId] = useState(null);


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
      미암송여부: false, 뉴구절여부: false, 즐겨찾기: false 
    }); 
    setEditingId(null); 
  };

  const handleSaveData = useCallback(async (key, dataToSave, successMessage) => {
    setIsSaving(true);
    saveDataToLocal(key, dataToSave);
    if (successMessage) showSnackbar(successMessage);
    await loadData();
    setIsSaving(false);
    return true; // 로컬 저장은 성공으로 간주
  }, [loadData, showSnackbar]);

  const handleAddOrUpdateVerse = async () => {
    if (!newVerse.제목 || !newVerse.본문 || !newVerse.카테고리 || !newVerse.장절) { showSnackbar('카테고리, 제목, 장절, 본문은 필수입니다.', 'warning'); return; }
    const updatedVerses = editingId ? verses.map((v) => v.id === editingId ? { ...v, ...newVerse } : v) : [...verses, { ...newVerse, id: generateId(), 번호: String(verses.length + 1) }];
    const successMsg = editingId ? '구절이 수정되었습니다.' : '새 구절이 추가되었습니다.';
    if (await handleSaveData(VERSES_DATA_KEY, updatedVerses, successMsg)) resetForm();
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

  const handleEdit = (verse) => { setEditingId(verse.id); setNewVerse(verse); window.scrollTo({ top: 0, behavior: 'smooth' }); };
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
    const ws = XLSX.utils.aoa_to_sheet([['id', '번호', '카테고리', '소카테고리', '제목', '장절', '본문', '태그', '미암송여부', '뉴구절여부', '오답여부', '즐겨찾기', '최근구절여부', 'currentReviewTurn', 'maxCompletedTurn', 'currentReviewTurnForNew', 'maxCompletedTurnForNew', 'currentReviewTurnForRecent', 'maxCompletedTurnForRecent', '복습여부', '뉴구절복습여부', '오답복습여부', '최근구절복습여부', '즐겨찾기복습여부', '복습날짜']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VerseTemplate');
    XLSX.writeFile(wb, 'verse_template.xlsx');
  };

  const handleDataDownload = () => {
    if (!originalVerses?.length) { alert('다운로드할 데이터가 없습니다.'); return; }
    const dataToExport = originalVerses.map(v => ({ ...v, ...reviewStatusData[v.id], 태그: (tagsData[v.id] || []).join(', ') }));
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
    if (!selectedFile) {
      showSnackbar('업로드할 파일을 먼저 선택해주세요.', 'warning');
      return;
    }
    if (!window.confirm('엑셀 파일을 업로드합니다. ID가 동일한 구절은 건너뜁니다. 계속하시겠습니까?')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const newVersesData = XLSX.utils.sheet_to_json(worksheet);

        if (newVersesData.length === 0) {
          showSnackbar('파일에 데이터가 없습니다.', 'warning');
          return;
        }

        setIsSaving(true);
        const updatedVerses = [...originalVerses];
        const updatedTags = { ...tagsData };
        const existingVerseIds = new Set(updatedVerses.map(v => v.id));
        let addedCount = 0;
        let skippedCount = 0;

        newVersesData.forEach((row, i) => {
          const { 태그, ...verseData } = row;

          if (!verseData.장절 || !verseData.본문) {
            console.warn(`Row ${i + 2} skipped: '장절' or '본문' is missing.`);
            return;
          }

          // ID가 존재하고, 이미 있는 ID라면 건너뛰기
          if (verseData.id && existingVerseIds.has(verseData.id)) {
            skippedCount++;
            return;
          }

          // ID가 없거나 새로운 ID인 경우 추가
          const newId = verseData.id || generateId();
          
          const newVerseEntry = {
            ...verseData,
            id: newId,
            번호: String(originalVerses.length + addedCount + 1),
          };

          updatedVerses.push(newVerseEntry);
          existingVerseIds.add(newId); // 새로 추가된 ID도 중복 체크 대상에 포함
          addedCount++;
          
          // 태그 처리
          if (태그 && typeof 태그 === 'string') {
            updatedTags[newId] = [...new Set(태그.split(',').map(t => t.trim()).filter(Boolean))];
          }
        });

        saveDataToLocal(VERSES_DATA_KEY, updatedVerses);
        saveDataToLocal(TAGS_DATA_KEY, updatedTags);
        
        await loadData();
        showSnackbar(`업로드 완료: ${addedCount}개 추가, ${skippedCount}개 건너뜀`, 'success');

      } catch (error) {
        console.error("File upload error:", error);
        showSnackbar('파일 처리 중 오류가 발생했습니다.', 'error');
      } finally {
        setIsSaving(false);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if(fileInput) fileInput.value = '';
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };
  
  const handleResetAllData = () => {
    if (window.confirm('정말로 모든 구절, 태그, 복습 기록, 설정 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        setIsSaving(true);
        localStorage.removeItem(VERSES_DATA_KEY);
        localStorage.removeItem(TAGS_DATA_KEY);
        localStorage.removeItem(REVIEW_STATUS_KEY);
        localStorage.removeItem(REVIEW_LOG_KEY);
        localStorage.removeItem(TURN_SCHEDULE_KEY);
        localStorage.removeItem(LAST_APP_STATE_KEY);
        showSnackbar('모든 데이터가 초기화되었습니다. 페이지를 새로고침합니다.', 'success');
        setTimeout(() => window.location.reload(), 1500);
    }
  };


  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };
  
  const handleCardExpand = (verseId) => {
    setExpandedCardId(prevId => (prevId === verseId ? null : prevId));
  };

  const filteredVerses = useMemo(() => {
    if (!verses) return [];
    return verses.filter(v => {
        const searchLower = filters.searchText.toLowerCase();
        const tagSearchLower = filters.tagSearchText.toLowerCase();
        const matchSearch = !searchLower || ['제목', '장절', '본문', '카테고리', '소카테고리'].some(key => (v[key] || '').toLowerCase().includes(searchLower));
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
  }, [verses, filters, tagsData]);

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
                <Grid item xs={12} sm={8}><TextField fullWidth label="본문 (*)" multiline rows={3} value={newVerse.본문} onChange={(e) => setNewVerse({ ...newVerse, 본문: e.target.value })} /></Grid>
                
                <Grid item xs={12}>
                    <FormGroup row>
                        <FormControlLabel control={<Checkbox checked={newVerse.미암송여부 || false} onChange={e => setNewVerse({...newVerse, 미암송여부: e.target.checked})} />} label="미암송" />
                        <FormControlLabel control={<Checkbox checked={newVerse.뉴구절여부 || false} onChange={e => setNewVerse({...newVerse, 뉴구절여부: e.target.checked})} />} label="뉴구절" />
                        <FormControlLabel control={<Checkbox checked={newVerse.즐겨찾기 || false} onChange={e => setNewVerse({...newVerse, 즐겨찾기: e.target.checked})} />} label="즐겨찾기" />
                    </FormGroup>
                </Grid>

            </Grid>
            <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                {editingId && <Button variant="outlined" color="secondary" onClick={resetForm} startIcon={<CancelIcon />}>수정 취소</Button>}
                <Button variant="contained" onClick={handleAddOrUpdateVerse} startIcon={<AddCircleOutlineIcon />} disabled={isSaving}>{editingId ? '구절 수정' : '새 구절 추가'}</Button>
            </Box>
        </Paper>

        <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="stretch">
                <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', gap: 1, height: '100%'}}>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            sx={{ flexGrow: 1, whiteSpace: 'nowrap', textTransform: 'none', color: 'text.secondary', borderColor: 'rgba(0, 0, 0, 0.23)'}}
                        >
                            <Typography noWrap>{selectedFile ? selectedFile.name : '파일을 선택하세요...'}</Typography>
                            <Input type="file" accept=".xlsx, .xls, .csv" hidden onChange={handleFileSelect} />
                        </Button>
                        <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || isSaving}>
                            업로드
                        </Button>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Button fullWidth variant="outlined" startIcon={<DownloadIcon />} onClick={handleTemplateDownload}>템플릿 다운로드</Button>
                        <Button fullWidth variant="outlined" startIcon={<DownloadIcon />} disabled={isSaving} onClick={handleDataDownload}>데이터 다운로드</Button>
                        <Button fullWidth variant="outlined" color="error" startIcon={<RestartAltIcon />} disabled={isSaving} onClick={handleResetAllData}>초기화</Button>
                    </Stack>
                </Grid>
            </Grid>
        </Paper>
        
        <Paper elevation={2} sx={{ p: {xs: 1.5, sm:2, md:3}, mb: 3 }}>
            <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="전체 검색 (제목, 본문 등)" variant="outlined" value={filters.searchText} onChange={(e) => handleFilterChange('searchText', e.target.value)} size="small"/></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="태그로만 검색" variant="outlined" value={filters.tagSearchText} onChange={(e) => handleFilterChange('tagSearchText', e.target.value)} size="small"/></Grid>
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
                            <VerseRow key={v.id} verse={v} onEdit={handleEdit} onDelete={handleDelete} onTagOpen={openTagDialog} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        ) : (
            <Box>
                <Grid container spacing={2}>
                    {filteredVerses.slice(pagination.page * pagination.rowsPerPage, (pagination.page + 1) * pagination.rowsPerPage).map(v => (
                    <Grid item xs={12} sm={6} md={4} key={v.id}>
                        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <CardContent sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => handleCardExpand(v.id)}>
                                <Typography variant="h6" align="center">{v.제목 || "제목 없음"}</Typography>
                                <Typography color="text.secondary" align="left">{v.장절}</Typography>
                                <Typography variant="body1" sx={{ my: 1.5, whiteSpace: 'pre-line', flexGrow: 1 }}>{v.본문}</Typography>
                                {(tagsData[v.id] || []).length > 0 && (<Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{tagsData[v.id].map(tag => <Chip key={tag} label={tag} size="small" />)}</Box>)}
                                <Typography color="text.secondary" align="right" sx={{ mt: 1 }}>{v.장절}</Typography>
                            </CardContent>
                            <Collapse in={expandedCardId === v.id} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', gap: 1, borderTop: '1px solid #eee' }}>
                                    <IconButton size="small" onClick={() => handleEdit(v)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="secondary" onClick={() => openTagDialog(v)}><LabelIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(v.id)}><DeleteIcon fontSize="small" /></IconButton>
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
            <DialogTitle>태그 관리: {tagEditVerse?.제목} ({tagEditVerse?.장절})</DialogTitle>
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