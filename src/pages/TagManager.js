// src/pages/TagManager.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, List, ListItem, ListItemText,
  CircularProgress, Chip, Collapse, Divider, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { loadDataFromLocal, saveDataToLocal } from '../api/localStorageApi';
import { VERSES_DATA_KEY, TAGS_DATA_KEY } from '../constants';

function TagManager() {
  const [verses, setVerses] = useState([]);
  const [tagsData, setTagsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [tagSearchText, setTagSearchText] = useState('');
  const [expandedTags, setExpandedTags] = useState(new Set());
  const [expandedVerses, setExpandedVerses] = useState(new Set());

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [currentTagInput, setCurrentTagInput] = useState('');
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const loadData = useCallback(() => {
    setIsLoading(true);
    const versesData = loadDataFromLocal(VERSES_DATA_KEY);
    const serverTagsData = loadDataFromLocal(TAGS_DATA_KEY);
    setVerses(Array.isArray(versesData) ? versesData : []);
    setTagsData(serverTagsData || {});
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveTags = useCallback(async (verseId, newTags) => {
    const newTagsData = { ...tagsData, [verseId]: newTags };
    setTagsData(newTagsData);
    saveDataToLocal(TAGS_DATA_KEY, newTagsData);
    showSnackbar('태그가 성공적으로 저장되었습니다.');
  }, [tagsData]);

  const tagsWithVerses = useMemo(() => {
    const mapping = {};
    Object.keys(tagsData).forEach(verseId => {
      const verse = verses.find(v => v.id === verseId);
      if (verse) {
        tagsData[verseId].forEach(tag => {
          if (!mapping[tag]) mapping[tag] = [];
          mapping[tag].push(verse);
        });
      }
    });
    return Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0]));
  }, [verses, tagsData]);

  const filteredTags = useMemo(() => {
    if (!tagSearchText) return tagsWithVerses;
    return tagsWithVerses.filter(([tag]) => tag.toLowerCase().includes(tagSearchText.toLowerCase()));
  }, [tagsWithVerses, tagSearchText]);

  const handleToggleExpand = (tag) => {
    setExpandedTags(prev => {
      const newSet = new Set(prev);
      newSet.has(tag) ? newSet.delete(tag) : newSet.add(tag);
      return newSet;
    });
  };

  const handleToggleVerseText = (verseId) => {
    setExpandedVerses(prev => {
        const newSet = new Set(prev);
        newSet.has(verseId) ? newSet.delete(verseId) : newSet.add(verseId);
        return newSet;
    });
  };
  
  const handleOpenEditDialog = (verse) => {
    setSelectedVerse(verse);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedVerse(null);
    setCurrentTagInput('');
  };

  const handleAddTag = () => {
    if (!selectedVerse || !currentTagInput.trim()) return;
    const verseId = selectedVerse.id;
    const currentTags = tagsData[verseId] || [];
    const newTag = currentTagInput.trim();
    if (!currentTags.includes(newTag)) {
        handleSaveTags(verseId, [...currentTags, newTag]);
    }
    setCurrentTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!selectedVerse) return;
    const verseId = selectedVerse.id;
    const currentTags = tagsData[verseId] || [];
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    handleSaveTags(verseId, newTags);
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
        
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <TextField fullWidth label="태그 검색" value={tagSearchText} onChange={(e) => setTagSearchText(e.target.value)} />
        </Paper>

        {filteredTags.length > 0 ? (
            <Paper elevation={2}>
                <List>
                    {filteredTags.map(([tag, verseObjects], index) => (
                        <React.Fragment key={tag}>
                            <ListItem button onClick={() => handleToggleExpand(tag)}>
                                <ListItemText primary={<Chip label={`${tag} (${verseObjects.length})`} color="primary" />} />
                                {expandedTags.has(tag) ? <ExpandLess /> : <ExpandMore />}
                            </ListItem>
                            <Collapse in={expandedTags.has(tag)} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    <ListItem sx={{ pl: 4, display: 'block' }}>
                                        {verseObjects.map((verse) => (
                                            <Box key={verse.id} sx={{ mb: 1 }}>
                                                <Chip 
                                                    label={verse.장절} 
                                                    size="small" 
                                                    onClick={() => handleToggleVerseText(verse.id)} 
                                                    onDelete={() => handleOpenEditDialog(verse)} 
                                                    deleteIcon={<EditIcon />} 
                                                />
                                                <Collapse in={expandedVerses.has(verse.id)}>
                                                    <Paper variant="outlined" sx={{ p: 1.5, mt: 1, whiteSpace: 'pre-line' }}>
                                                        <Typography variant="body2">{verse.본문}</Typography>
                                                    </Paper>
                                                </Collapse>
                                            </Box>
                                        ))}
                                    </ListItem>
                                </List>
                            </Collapse>
                            {index < filteredTags.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        ) : (
            <Typography align="center" color="text.secondary" sx={{ mt: 5 }}>검색된 태그가 없습니다.</Typography>
        )}
        
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="xs">
            <DialogTitle>태그 수정: {selectedVerse?.제목}</DialogTitle>
            <DialogContent>
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {(tagsData[selectedVerse?.id] || []).map(tag => (
                    <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} />
                    ))}
                </Box>
                <Box display="flex" gap={1}>
                    <TextField
                    autoFocus
                    margin="dense"
                    label="새 태그 추가"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={currentTagInput}
                    onChange={(e) => setCurrentTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} sx={{alignSelf: 'flex-end'}}>추가</Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseEditDialog}>닫기</Button>
            </DialogActions>
        </Dialog>
    </Container>
  );
}

export default TagManager;