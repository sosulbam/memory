// src/components/ActionBar.js
import React from 'react';
import { Box, Button } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ActionBar = ({ verse, onStatusToggle, onTagDialogOpen, onCopy }) => {
  if (!verse) return null;

  const { 뉴구절여부, 오답여부, 최근구절여부, 즐겨찾기, 미암송여부 } = verse;

  const buttonStyle = {
    minWidth: 'auto',
    px: 1.5,
    py: 0.8,
    fontSize: '0.75rem',
  };

  const handleToggle = (e, field) => {
    e.stopPropagation(); // 이벤트 전파 중단
    onStatusToggle(field);
  };

  const handleTagOpen = (e) => {
    e.stopPropagation(); // 이벤트 전파 중단
    onTagDialogOpen();
  };

  const handleCopy = (e) => {
    e.stopPropagation(); // 이벤트 전파 중단
    onCopy();
  };

  return (
    <Box my={2} display="flex" justifyContent="center" gap={1} flexWrap="wrap">
      {verse.mode !== 'pending' && (
        <>
          <Button onClick={(e) => handleToggle(e, '뉴구절여부')} variant="outlined" color="primary" size="small" sx={buttonStyle}>
            {뉴구절여부 ? '🔓뉴해제' : '🔒뉴구절'}
          </Button>
          <Button onClick={(e) => handleToggle(e, '오답여부')} variant="outlined" color="error" size="small" sx={buttonStyle}>
            {오답여부 ? '오답해제' : '🔒오답'}
          </Button>
          <Button onClick={(e) => handleToggle(e, '최근구절여부')} variant="outlined" color="secondary" size="small" sx={buttonStyle}>
            {최근구절여부 ? '🔓최근해제' : '🔒최근'}
          </Button>
        </>
      )}
      <Button onClick={(e) => handleToggle(e, '즐겨찾기')} variant="outlined" color="warning" size="small" sx={buttonStyle}>
        {즐겨찾기 ? '☆즐겨해제' : '⭐즐겨찾기'}
      </Button>
      <Button onClick={(e) => handleToggle(e, '미암송여부')} variant="outlined" color="info" size="small" startIcon={미암송여부 ? <LockOpenIcon /> : <LockIcon />} sx={buttonStyle}>
        {미암송여부 ? '암송시작' : '미암송'}
      </Button>
      <Button onClick={handleTagOpen} variant="outlined" color="success" size="small" sx={buttonStyle}>
        🏷️태그
      </Button>
      <Button onClick={handleCopy} variant="outlined" color="secondary" size="small" startIcon={<ContentCopyIcon />} sx={buttonStyle}>
        복사하기
      </Button>
    </Box>
  );
};

export default ActionBar;