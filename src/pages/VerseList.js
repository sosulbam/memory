// src/pages/VerseList.js
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { Container, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card, CardContent, ToggleButton, ToggleButtonGroup, Button, Grid, CircularProgress, Collapse, TablePagination, Chip } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { DataContext } from '../contexts/DataContext';
import { saveDataToLocal, loadDataFromLocal } from '../api/localStorageApi';
import { VERSELIST_STATE_KEY } from '../constants';

import ActionBar from '../components/ActionBar';
import TagDialog from '../components/TagDialog';
import { useSnackbar } from '../contexts/SnackbarContext';

function VerseRow({ verse, allVerses, tags, onStatusToggle, onTagDialogOpen, onCopyVerse }) {
  const [open, setOpen] = useState(false);
  
  const verseWithStatus = useMemo(() => {
    const currentVerse = allVerses.find(v => v.id === verse.id);
    return currentVerse || verse;
  }, [verse, allVerses]);

  return (
    <React.Fragment>
      <TableRow onClick={() => setOpen(!open)} sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }}>
        <TableCell sx={{ minWidth: 200, fontSize: '0.95rem', fontWeight: 500, verticalAlign: 'top' }}>{verse.제목}</TableCell>
        <TableCell sx={{ fontSize: '0.9rem', verticalAlign: 'top', minWidth: 120 }}>{verse.장절}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: 1.6 }}>{verse.본문}</Typography>
              {tags && tags.length > 0 && <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{tags.map(tag => <Chip key={tag} label={tag} size="small" variant="outlined" />)}</Box>}
              <Box mt={2} borderTop={1} borderColor="grey.200">
                <ActionBar 
                    verse={verseWithStatus} 
                    onStatusToggle={(field) => onStatusToggle(verse.id, field)} 
                    onTagDialogOpen={() => onTagDialogOpen(verse)}
                    onCopy={() => onCopyVerse(verse)}
                />
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
  const { showSnackbar } = useSnackbar();
  
  const [filters, setFilters] = useState({ searchText: '', tagSearchText: '', selectedCategory: '전체', selectedSubcategory: '전체', typeFilter: '전체' });
  const [viewType, setViewType] = useState('card');
  const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 12 });
  const [isInitialStateApplied, setIsInitialStateApplied] = useState(false);
  
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedVerseForTags, setSelectedVerseForTags] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);

  useEffect(() => {
    const loadSavedState = () => {
        const savedState = loadDataFromLocal(VERSELIST_STATE_KEY);
        if (savedState && Object.keys(savedState).length > 0) {
            setFilters({
                searchText: savedState.searchText || '',
                tagSearchText: savedState.tagSearchText || '',
                selectedCategory: savedState.selectedCategory || '전체',
                selectedSubcategory: savedState.selectedSubcategory || '전체',
                typeFilter: savedState.typeFilter || '전체',
            });
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

  const handleTagDialogOpen = (verse) => {
    setSelectedVerseForTags(verse);
    setTagDialogOpen(true);
  };

  const handleTagDialogClose = () => {
    setTagDialogOpen(false);
  };

  const handleCopyVerse = (verseToCopy) => {
    if (!verseToCopy) return;
    const textToCopy = `${verseToCopy.장절}\n${verseToCopy.본문}`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showSnackbar('구절이 복사되었습니다.', 'info');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showSnackbar('구절이 복사되었습니다.', 'info');
        } catch (err) {
            console.error('Fallback copy failed', err);
            showSnackbar('복사에 실패했습니다.', 'error');
        }
        document.body.removeChild(textArea);
    }
  };

  const handleCardExpand = (verseId) => {
    setExpandedCardId(prevId => (prevId === verseId ? null : verseId));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const { categoryList, subcategoryList } = useMemo(() => {
    if (!allVerses) return { categoryList: [], subcategoryList: [] };
    const categories = ['전체', ...new Set(allVerses.map(v => v.카테고리).filter(Boolean))];
    const subcategories = ['전체', ...new Set(allVerses.filter(v => filters.selectedCategory === '전체' || v.카테고리 === filters.selectedCategory).map(v => v.소카테고리).filter(Boolean))];
    return { categoryList: categories, subcategoryList: subcategories };
  }, [allVerses, filters.selectedCategory]);
  
  const filteredVerses = useMemo(() => {
    if (!allVerses) return [];
    return allVerses.filter(v => {
        const searchLower = filters.searchText.toLowerCase();
        const tagSearchLower = filters.tagSearchText.toLowerCase();
        
        // --- 👈 [수정] '암송시작일'을 검색 대상에 포함 ---
        const matchSearch = !searchLower || 
            ['제목', '장절', '본문', '카테고리', '소카테고리'].some(key => (v[key] || '').toLowerCase().includes(searchLower)) ||
            (v.암송시작일 && v.암송시작일.toLowerCase().includes(searchLower));
        // --- 👆 [수정] 완료 ---
            
        const matchTag = !tagSearchLower || (tagsData[v.id] || []).some(tag => tag.toLowerCase().includes(tagSearchLower));
        const matchCategory = filters.selectedCategory === '전체' || v.카테고리 === filters.selectedCategory;
        const matchSubcategory = filters.selectedSubcategory === '전체' || v.소카테고리 === filters.selectedSubcategory;
        const matchType = filters.typeFilter === '전체' || 
            (filters.typeFilter === '뉴구절' && v.뉴구절여부) ||
            (filters.typeFilter === '최근구절' && v.최근구절여부) ||
            (filters.typeFilter === '오답구절' && v.오답여부) ||
            (filters.typeFilter === '즐겨찾기' && v.즐겨찾기);
        return matchSearch && matchTag && matchCategory && matchSubcategory && matchType;
    });
  }, [allVerses, tagsData, filters]);

  const handleChangePage = (event, newPage) => setPagination(prev => ({ ...prev, page: newPage }));
  const handleChangeRowsPerPage = (event) => setPagination({ page: 0, rowsPerPage: parseInt(event.target.value, 10) });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <ToggleButtonGroup value={viewType} exclusive onChange={(e, newView) => newView && setViewType(newView)} aria-label="보기 방식 선택">
                <ToggleButton value="list" aria-label="리스트로 보기"><ViewListIcon /></ToggleButton>
                <ToggleButton value="card" aria-label="카드로 보기"><ViewModuleIcon /></ToggleButton>
            </ToggleButtonGroup>
      </Box>

      <Paper elevation={2} sx={{ p: {xs: 1.5, sm:2, md:3}, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="전체 검색 (제목, 본문 등)" variant="outlined" value={filters.searchText} onChange={(e) => handleFilterChange('searchText', e.target.value)} size="small"/></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="태그로만 검색" variant="outlined" value={filters.tagSearchText} onChange={(e) => handleFilterChange('tagSearchText', e.target.value)} size="small"/></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>카테고리</InputLabel><Select value={filters.selectedCategory} onChange={(e) => handleFilterChange('selectedCategory', e.target.value)} label="카테고리">{categoryList.map(cat => (<MenuItem key={cat} value={cat}>{cat}</MenuItem>))}</Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>소카테고리</InputLabel><Select value={filters.selectedSubcategory} onChange={(e) => handleFilterChange('selectedSubcategory', e.target.value)} label="소카테고리">{subcategoryList.map(sub => (<MenuItem key={sub} value={sub}>{sub}</MenuItem>))}</Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>유형 필터</InputLabel><Select value={filters.typeFilter} onChange={(e) => handleFilterChange('typeFilter', e.target.value)} label="유형 필터">{['전체', '뉴구절', '최근구절', '오답구절', '즐겨찾기'].map(f => (<MenuItem key={f} value={f}>{f}</MenuItem>))}</Select></FormControl></Grid>
        </Grid>
      </Paper>
      
      <Typography variant="subtitle1" gutterBottom sx={{mb: 2}}>총 <strong>{filteredVerses.length}</strong>개의 구절이 검색되었습니다.</Typography>

      {viewType === 'list' ? (
        <Paper elevation={3}>
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead><TableRow sx={{ "& th": { fontWeight: 'bold' }}}><TableCell>제목</TableCell><TableCell>장절</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredVerses.slice(pagination.page * pagination.rowsPerPage, (pagination.page + 1) * pagination.rowsPerPage).map((v) => (
                  <VerseRow 
                    key={v.id} 
                    verse={v} 
                    allVerses={allVerses}
                    tags={tagsData[v.id]} 
                    onStatusToggle={handleStatusToggle} 
                    onTagDialogOpen={handleTagDialogOpen}
                    onCopyVerse={handleCopyVerse}
                  />
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
                <Grid item xs={12} sm={6} md={4} key={v.id}>
                    <Card 
                        onClick={() => handleCardExpand(v.id)}
                        sx={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: '1px solid #eee',
                            transition: 'box-shadow 0.3s ease-in-out',
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            }
                        }}>
                        <CardContent sx={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                            <Typography variant="h6" align="center">{v.제목 || "제목 없음"}</Typography>
                            <Typography color="text.secondary" align="left">{v.장절}</Typography>
                            <Typography variant="body1" sx={{ my: 1.5, whiteSpace: 'pre-line', flexGrow: 1 }}>{v.본문}</Typography>
                            {(tagsData[v.id] || []).length > 0 && (<Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{tagsData[v.id].map(tag => <Chip key={tag} label={tag} size="small" />)}</Box>)}
                            <Typography color="text.secondary" align="right" sx={{ mt: 1 }}>{v.장절}</Typography>
                        </CardContent>
                        <Collapse in={expandedCardId === v.id} timeout="auto" unmountOnExit>
                            <Box sx={{p:1, borderTop: '1px solid #eee'}}>
                                <ActionBar 
                                    verse={v}
                                    onStatusToggle={(field) => handleStatusToggle(v.id, field)}
                                    onTagDialogOpen={() => handleTagDialogOpen(v)}
                                    onCopy={() => handleCopyVerse(v)}
                                />
                            </Box>
                        </Collapse>
                    </Card>
                </Grid>
              ))}
            </Grid>
            <TablePagination rowsPerPageOptions={[12, 24, 48, 96]} component="div" count={filteredVerses.length} rowsPerPage={pagination.rowsPerPage} page={pagination.page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
        </Box>
      )}

      <TagDialog 
        open={tagDialogOpen} 
        onClose={handleTagDialogClose} 
        verse={selectedVerseForTags} 
        tags={tagsData} 
        onSaveTags={updateTags} 
      />
    </Container>
  );
}

export default VerseList;