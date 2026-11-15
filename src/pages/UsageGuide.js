// src/pages/UsageGuide.js
import { IS_LAMP } from '../edition';
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

// 등불판 사용 안내 — 지금 화면 순서대로, 짧게(N12). 없는 기능은 쓰지 않는다
const LAMP_GUIDE = [
  ['처음 시작', [
    '메뉴의 「암송 팩」에서 시리즈를 골라 넣거나, 「구절 관리」에서 구절을 직접 넣습니다.',
    '팩을 넣을 때 「새로 외울 구절」로 넣으면 홈의 「새 구절」에서, 「이미 외운 구절」로 넣으면 「차수별 복습」에서 봅니다.',
    '기록은 이 기기의 브라우저 안에만 저장됩니다. 계정이나 서버는 없습니다.',
  ]],
  ['홈', [
    '위의 세 단추로 복습 방식(차수별 복습 · 새 구절 · 최근 구절)을 고릅니다.',
    '「오늘의 복습」 표에서 지금 방식과 남은 구절 수를 보고 「복습 시작하기」를 누릅니다.',
    '차수별 복습은 차수의 시작일과 마감일을 정하면 하루에 볼 분량을 나눠 줍니다.',
  ]],
  ['복습 화면', [
    '카드를 누르면 앞면(장절)과 뒷면(본문)이 바뀝니다.',
    '「외웠어요」는 완료로 기록하고 다음 구절로 갑니다. 카드를 왼쪽으로 밀어도 같습니다.',
    '「다시」는 기록하지 않고 그 구절을 맨 뒤로 보냅니다.',
    '「상태」에서 새 구절·오답·최근·즐겨찾기·미암송을 켜고 끄고, 태그를 붙이고, 구절을 복사합니다.',
    '카드 아래 단추로 듣기, 내 목소리 녹음, 오디오 파일 넣기, 연속 재생을 합니다. 연속 재생은 듣기만 하고 완료로 기록하지 않습니다.',
    '오른쪽 위 「완료 보기」로 이번 차수에서 마친 구절을 넘겨 봅니다.',
  ]],
  ['차수', [
    '한 차수의 구절을 모두 마치면 다음 차수로 넘어갑니다.',
    '새 구절과 최근 구절은 바로 다음 차수가 시작되고, 차수별 복습은 다음 차수의 일정을 새로 정합니다.',
    '메뉴의 「복습 설정」에서 차수, 분류, 순서, 카드 모양, 한 단어씩 보기를 바꿉니다.',
  ]],
  ['구절 구조 보기', [
    '전체 구절을 큰 분류와 작은 분류로 접고 펴서 봅니다.',
    '「복습 모드」를 켜면 그 자리에서 차례로 복습합니다.',
  ]],
  ['암송 시험 · 통계 · 태그', [
    '암송 시험은 범위와 문항 수를 고른 뒤 제목과 본문을 쓰고 채점합니다. 빠진 글자에는 밑줄이, 다르게 쓴 글자에는 줄이 그어집니다.',
    '통계에서 구절 수와 날마다 복습한 수를 봅니다.',
    '태그 관리에서 붙인 태그를 모아 봅니다.',
  ]],
  ['구절 관리 · 백업', [
    '구절을 직접 넣고 고치고 지웁니다.',
    '엑셀은 「템플릿」을 받아 채운 뒤 올립니다. 더하기, 고쳐 쓰기(같은 구절은 엑셀 내용으로), 모두 바꾸기 가운데 고릅니다.',
    '기기를 바꿀 때는 「전체 백업」으로 받은 파일을 새 기기의 「백업에서 되살리기」에서 「백업파일 선택」 → 「복원하기」로 넣습니다.',
  ]],
  ['설정', [
    '글자 크기, 글꼴, 테마, 화면 위아래 여백을 바꿉니다.',
    '새 버전이 보이지 않으면 「캐시 초기화 및 최신 버전으로 업데이트」를 누릅니다. 구절은 지워지지 않습니다.',
  ]],
];

const LampGuide = () => (
  <Container maxWidth="sm" sx={{ py: 3 }}>
    {LAMP_GUIDE.map(([title, items]) => (
      <Box key={title} component="section" sx={{ mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>{title}</Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.75, lineHeight: 1.7 } }}>
          {items.map((t) => <li key={t}><Typography variant="body2" component="span">{t}</Typography></li>)}
        </Box>
      </Box>
    ))}
  </Container>
);

function UsageGuide() {
  if (IS_LAMP) return <LampGuide />;
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
            <ListItem><ListItemText primary="암송 카드 조작법" secondary={IS_LAMP ? <>• 카드를 누르면 앞면(장절)과 뒷면(본문)이 바뀝니다<br />• 아래 <b>외웠어요</b>: 완료로 기록하고 다음 구절로(카드를 왼쪽으로 밀어도 같음)<br />• 아래 <b>다시</b>: 완료로 기록하지 않고 맨 뒤로 보냄<br />• 카드를 오른쪽으로 밀면 방금 완료한 구절을 다시 봄<br />• 아래 <b>상태</b>(또는 위로 밀기): 새 구절·오답·즐겨찾기·태그·복사<br />• 연속 재생은 듣기만 하며 완료로 기록하지 않음</> : <>• <Chip size="small" label="카드 클릭"/> 또는 <Chip size="small" label="s"/> 키: 정답(본문) 확인<br />• <Chip size="small" label="좌우 스와이프"/> 또는 <Chip size="small" label="Enter"/> 키: 암송 완료 처리 후 다음 카드로 이동<br />• <Chip size="small" label="위로 스와이프"/>: 구절 상태(뉴구절, 오답 등) 변경 메뉴 열기</>} /></ListItem>
        </List>
      </GuideSection>
      
      <GuideSection title="2. 메뉴(☰) 기능 안내">
        <Typography paragraph>
          화면 왼쪽 상단의 햄버거 메뉴(☰)를 통해 앱의 모든 기능에 접근할 수 있습니다.
        </Typography>
        <List dense>
            <ListItem><ListItemText primary="복습 설정" secondary="카테고리별, 뉴구절, 오답, 차수별 등 다양한 복습 모드를 선택할 수 있습니다. 차수별 복습 시에는 목표 차수와 기간 설정도 가능합니다." /></ListItem>
            <ListItem><ListItemText primary="정렬 방식" secondary={<>• <b>순차/랜덤/오래된 순/그룹별 랜덤:</b> 구절이 나타나는 순서를 결정합니다.<br />• <b>오답구절만보기:</b> 선택한 모드(카테고리/차수 등) 내에서 '오답'으로 표시된 구절만 모아서 복습할 수 있는 강력한 기능입니다.</>} /></ListItem>
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