// src/components/TagDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Chip,
} from '@mui/material';

/**
 * 구절에 태그를 추가하거나 삭제하는 다이얼로그 UI 컴포넌트입니다.
 */
const TagDialog = ({ open, onClose, verse, tags, onSaveTags }) => {
  const [currentTag, setCurrentTag] = useState('');
  const [verseTags, setVerseTags] = useState([]);

  useEffect(() => {
    if (verse) {
      setVerseTags(tags[verse.id] || []);
    }
  }, [verse, tags]);

  const handleAddTag = () => {
    if (!verse || !currentTag.trim()) return;
    const newTags = [...verseTags, currentTag.trim()];
    onSaveTags(verse.id, newTags);
    setCurrentTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!verse) return;
    const newTags = verseTags.filter(tag => tag !== tagToRemove);
    onSaveTags(verse.id, newTags);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>태그 관리: {verse?.장절}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {verseTags.map(tag => (
            <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} />
          ))}
        </Box>
        <Box display="flex" gap={1}>
          <TextField
            autoFocus
            margin="dense"
            label="새 태그"
            type="text"
            fullWidth
            variant="standard"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button onClick={handleAddTag} variant="contained" sx={{ alignSelf: 'flex-end' }}>
            추가
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagDialog;
