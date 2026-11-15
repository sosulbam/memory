// src/components/ActionBar.js
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { IS_LAMP } from '../edition';
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

  if (IS_LAMP) {
    // 등불판: 이모지 없이 같은 모양 단추, 지금 켜진 상태는 채워서 보여 준다(검토 26번)
    const items = [
      ...(verse.mode !== 'pending' ? [
        { field: '뉴구절여부', on: 뉴구절여부, label: '새 구절' },
        { field: '오답여부', on: 오답여부, label: '오답' },
        { field: '최근구절여부', on: 최근구절여부, label: '최근' },
      ] : []),
      { field: '즐겨찾기', on: 즐겨찾기, label: '즐겨찾기' },
      { field: '미암송여부', on: 미암송여부, label: '미암송' },
    ];
    return (
      <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
          {items.map(it => (
            <Button key={it.field} onClick={(e) => handleToggle(e, it.field)} variant={it.on ? 'contained' : 'outlined'} size="small" aria-pressed={!!it.on} sx={{ minWidth: 72 }}>
              {it.label}
            </Button>
          ))}
        </Box>
        <Box display="flex" gap={1} justifyContent="center">
          <Button onClick={handleTagOpen} variant="text" size="small" startIcon={<LocalOfferOutlinedIcon />}>태그</Button>
          <Button onClick={handleCopy} variant="text" size="small" startIcon={<ContentCopyIcon />}>복사</Button>
        </Box>
        <Typography variant="caption" color="text.secondary" align="center">채운 단추가 지금 켜져 있는 상태입니다. 누르면 켜고 끕니다.</Typography>
      </Box>
    );
  }

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