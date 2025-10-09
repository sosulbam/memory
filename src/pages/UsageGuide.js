// src/pages/UsageGuide.js
import React from 'react';
import { Container, Typography, Box, Divider, Paper, List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function GuideSection({ title, children }) {
  return (
    <Accordion defaultExpanded sx={{ mb: 2, '&:before': { display: 'none' }, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { my: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 3, pb: 3, '& p': { lineHeight: 1.7 }, '& .MuiListItem-root': { alignItems: 'flex-start' } }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

function UsageGuide() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="body1" paragraph align="center" sx={{ mb: 4, color: 'text.secondary', fontSize: '1.1rem' }}>
        하나님의 말씀을 삶의 일부로 만들고, 꾸준한 복습을 통해 마음에 새기는 것을 돕기 위해 만들어졌습니다.<br />
        아래 메뉴별 상세 사용법을 확인하여 주님과 동행하는 귀한 시간에 활용하시기 바랍니다.
      </Typography>
      
      <GuideSection title="1. 홈 화면 (암송 및 복습)">
        <Typography paragraph>
          홈 화면은 매일의 암송과 복습이 이루어지는 핵심 공간입니다. 상단의 즐겨찾기 카드는 앱을 열 때마다 은혜로운 말씀을 보여주며, 하단의 '오늘의 복습' 카드를 통해 본격적인 암송을 시작할 수 있습니다.
        </Typography>
        <List dense>
            <ListItem><ListItemText primary="현재 복습 설정 확인" secondary="'오늘의 복습' 카드에서는 현재 선택된 복습 모드, 정렬 방식, 카테고리, 진행 상태 등 상세한 정보를 한눈에 볼 수 있어, 내가 어떤 설정을 통해 복습하고 있는지 명확히 알 수 있습니다." /></ListItem>
            <ListItem><ListItemText primary="복습 시작하기" secondary="버튼을 누르면 '집중 모드'로 전환되어 다른 메뉴 없이 암송 카드에만 집중할 수 있습니다." /></ListItem>
            <ListItem><ListItemText primary="암송 카드 조작법" secondary={<>• <Chip size="small" label="카드 클릭"/> 또는 <Chip size="small" label="s"/> 키: 정답(본문) 확인<br />• <Chip size="small" label="좌우 스와이프"/> 또는 <Chip size="small" label="Enter"/> 키: 암송 완료 처리 후 다음 카드로 이동<br />• <Chip size="small" label="위로 스와이프"/>: 구절 상태(뉴구절, 오답 등) 변경 메뉴 열기</>} /></ListItem>
        </List>
      </GuideSection>
      
      <GuideSection title="2. 메뉴(☰) 기능 안내">
        <Typography paragraph>
          화면 왼쪽 상단의 햄버거 메뉴(☰)를 통해 앱의 모든 기능에 접근할 수 있습니다.
        </Typography>
        <List dense>
            <ListItem><ListItemText primary="복습 설정" secondary="카테고리별, 뉴구절, 오답, 차수별 등 9가지의 다양한 복습 모드를 선택하고, 구절 순서(순차, 랜덤 등)를 정할 수 있습니다. 차수별 복습 시에는 목표 차수와 기간 설정도 가능합니다." /></ListItem>
            <ListItem><ListItemText primary="테마 설정" secondary="다양한 색상의 테마 중 하나를 선택하여 암송 카드의 배경을 변경할 수 있습니다." /></ListItem>
            <ListItem><ListItemText primary="페이지 이동" secondary="'홈', '구절 목록', '통계' 등 원하는 페이지로 빠르게 이동할 수 있습니다." /></ListItem>
            <ListItem><ListItemText primary="복습 기록 초기화" secondary="필요에 따라 특정 모드(예: 뉴구절)의 복습 기록만 초기화하거나, 전체 복습 상태를 초기화할 수 있습니다. (주의: 통계 기록은 유지됩니다.)" /></ListItem>
        </List>
      </GuideSection>

      <GuideSection title="3. 구절 및 데이터 관리">
        <Typography paragraph>
          '구절 관리', '태그 관리' 페이지에서 암송할 말씀 데이터를 직접 관리하고, '통계' 페이지에서 나의 암송 현황을 확인할 수 있습니다.
        </Typography>
        <List dense>
            <ListItem><ListItemText primary="구절 관리" secondary="개별 구절을 직접 추가/수정/삭제하거나, Excel 파일을 이용해 여러 구절을 한 번에 관리할 수 있습니다. 전체 데이터를 백업하는 기능도 제공합니다." /></ListItem>
            <ListItem><ListItemText primary="태그 관리" secondary="태그를 기준으로 구절들을 모아보고, 각 구절의 태그를 수정할 수 있습니다. 특정 주제와 관련된 말씀을 찾을 때 유용합니다." /></ListItem>
            <ListItem><ListItemText primary="복습 통계" secondary="연속 복습일, 카테고리/차수별 구절 분포, 일일 복습량 등 나의 암송 기록을 시각적인 그래프로 확인하며 동기를 부여받을 수 있습니다." /></ListItem>
        </List>
      </GuideSection>

      <Divider sx={{ my: 4 }} />
      <Typography variant="body2" color="text.secondary" align="center" sx={{ fontStyle: 'italic' }}>
        "주의 말씀의 맛이 내게 어찌 그리 단지요 내 입에 꿀보다 더 다니이다" (시편 119:103)
      </Typography>
    </Container>
  );
}

export default UsageGuide;