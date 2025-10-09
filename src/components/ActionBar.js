// src/components/ActionBar.js
import React from 'react';
import { Box, Button } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
// --- 여기를 수정했습니다: ContentCopyIcon 아이콘 import ---
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/**
 * '뉴구절', '오답', '즐겨찾기' 등 구절의 상태를 변경하는
 * 버튼들을 모아놓은 UI 컴포넌트입니다.
 */
// --- 여기를 수정했습니다: onCopy prop 추가 ---
const ActionBar = ({ verse, onStatusToggle, onTagDialogOpen, onCopy }) => {
  if (!verse) return null;

  const { 뉴구절여부, 오답여부, 최근구절여부, 즐겨찾기, 미암송여부 } = verse;

  const buttonStyle = {
    minWidth: 'auto',
    px: 1.5,
    py: 0.8,
    fontSize: '0.75rem',
  };

  return (
    <Box my={2} display="flex" justifyContent="center" gap={1} flexWrap="wrap">
      {verse.mode !== 'pending' && (
        <>
          <Button onClick={() => onStatusToggle('뉴구절여부')} variant="outlined" color="primary" size="small" sx={buttonStyle}>
            {뉴구절여부 ? '🔓뉴해제' : '🔒뉴구절'}
          </Button>
          <Button onClick={() => onStatusToggle('오답여부')} variant="outlined" color="error" size="small" sx={buttonStyle}>
            {오답여부 ? '오답해제' : '🔒오답'}
          </Button>
          <Button onClick={() => onStatusToggle('최근구절여부')} variant="outlined" color="secondary" size="small" sx={buttonStyle}>
            {최근구절여부 ? '🔓최근해제' : '🔒최근'}
          </Button>
        </>
      )}
      <Button onClick={() => onStatusToggle('즐겨찾기')} variant="outlined" color="warning" size="small" sx={buttonStyle}>
        {즐겨찾기 ? '☆즐겨해제' : '⭐즐겨찾기'}
      </Button>
      <Button onClick={() => onStatusToggle('미암송여부')} variant="outlined" color="info" size="small" startIcon={미암송여부 ? <LockOpenIcon /> : <LockIcon />} sx={buttonStyle}>
        {미암송여부 ? '암송시작' : '미암송'}
      </Button>
      <Button onClick={onTagDialogOpen} variant="outlined" color="success" size="small" sx={buttonStyle}>
        🏷️태그
      </Button>
      {/* --- 여기를 수정했습니다: 복사하기 버튼 추가 --- */}
      <Button onClick={onCopy} variant="outlined" color="secondary" size="small" startIcon={<ContentCopyIcon />} sx={buttonStyle}>
        복사하기
      </Button>
    </Box>
  );
};

export default ActionBar;