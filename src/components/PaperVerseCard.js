// src/components/PaperVerseCard.js
// 집중모드 「종이 카드」 보기 — 네비게이토 암송 카드처럼 흰 카드가 묶음으로 겹쳐 있는 모습.
// 사용자 결정(2026-11-07): 애니메이션 없음 · 앞면은 장절만 · 뒷면은 제목·본문·카테고리·장절 전부 · 나눔명조
import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatRefFull } from '../utils/refFormat';

const CARD_FONT = "'Nanum Myeongjo', 'AppleMyungjo', 'Batang', serif";
const PAPER = '#fbfaf5';
const PAPER_EDGE = '#ece8dc';
const INK = '#222120';
const SUB = '#6b665c';

// 글자 크기 설정(작게/보통/크게)
const REF_SIZE = { small: { xs: '1.5rem', sm: '1.9rem' }, medium: { xs: '1.75rem', sm: '2.2rem' }, large: { xs: '2.05rem', sm: '2.5rem' } };
const TITLE_SIZE = { small: { xs: '0.95rem', sm: '1.05rem' }, medium: { xs: '1.05rem', sm: '1.2rem' }, large: { xs: '1.2rem', sm: '1.35rem' } };
const BODY_SIZE = { small: { xs: '0.98rem', sm: '1.08rem' }, medium: { xs: '1.08rem', sm: '1.2rem' }, large: { xs: '1.22rem', sm: '1.35rem' } };

const faceSx = {
  position: 'relative', zIndex: 1, width: '100%', boxSizing: 'border-box',
  background: `radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,.7), transparent 60%), linear-gradient(180deg, ${PAPER}, #f6f3ea)`,
  color: INK, borderRadius: '5px', fontFamily: CARD_FONT, textAlign: 'left',
  boxShadow: `0 0 0 1px ${PAPER_EDGE} inset, 0 1px 1px rgba(0,0,0,.18), 0 10px 22px rgba(0,0,0,.28)`,
  display: 'flex', flexDirection: 'column', gap: 1,
  px: { xs: 2.25, sm: 3 }, py: { xs: 2, sm: 2.5 },
};

// 뒤에 겹친 카드 두 장 (카드 묶음 느낌, 움직임 없음)
const Deck = ({ children }) => (
  <Box sx={{
    position: 'relative', width: 'min(92vw, 560px)',
    '&::before, &::after': {
      content: '""', position: 'absolute', inset: 0, borderRadius: '5px',
      boxShadow: `0 0 0 1px ${PAPER_EDGE} inset, 0 6px 14px rgba(0,0,0,.25)`,
    },
    '&::before': { background: '#efebe0', transform: 'translate(7px, 9px) rotate(2.2deg)' },
    '&::after': { background: '#f3efe5', transform: 'translate(-5px, 5px) rotate(-1.6deg)' },
  }}>
    {children}
  </Box>
);

const WrongStamp = ({ verse }) => (verse?.오답여부 ? (
  <Box component="span" sx={{
    position: 'absolute', top: 10, right: 10, border: '1.5px solid #c6302c', color: '#c6302c',
    fontFamily: 'sans-serif', fontWeight: 700, fontSize: 11, px: 0.75, borderRadius: '3px',
    transform: 'rotate(6deg)', opacity: 0.85,
  }}>오답</Box>
) : null);

// 앞면: 장절만
export const PaperFront = ({ verse, fontSize }) => (
  <Deck>
    <Box sx={{ ...faceSx, minHeight: { xs: 190, sm: 230 }, justifyContent: 'center', alignItems: 'center' }}>
      <Typography component="div" sx={{ fontFamily: CARD_FONT, fontWeight: 800, letterSpacing: '-0.01em', textAlign: 'center', wordBreak: 'keep-all', fontSize: REF_SIZE[fontSize] || REF_SIZE.medium }}>
        {formatRefFull(verse.장절)}
      </Typography>
      <WrongStamp verse={verse} />
    </Box>
  </Deck>
);

// 뒷면: 제목 · 본문 · (아래) 카테고리 · 장절
export const PaperBack = ({ verse, fontSize }) => {
  const sub = verse.소카테고리 && verse.소카테고리 !== verse.카테고리 ? `${verse.카테고리} · ${verse.소카테고리}` : verse.카테고리;
  return (
    <Deck>
      <Box sx={{ ...faceSx, minHeight: { xs: 190, sm: 230 } }}>
        <Typography component="div" sx={{ fontFamily: CARD_FONT, fontWeight: 800, pr: verse.오답여부 ? 5 : 0, fontSize: TITLE_SIZE[fontSize] || TITLE_SIZE.medium }}>
          {verse.제목}
        </Typography>
        <Typography component="div" data-card-scroll sx={{
          fontFamily: CARD_FONT, fontWeight: 400, color: INK, lineHeight: 1.75, textIndent: '1em',
          whiteSpace: 'pre-line', wordBreak: 'keep-all', flex: 1,
          // 긴 구절은 카드 안에서 스크롤 — 카드 아래 음성 버튼 줄이 「상태 변경」과 겹치지 않는 높이
          maxHeight: '38vh', overflowY: 'auto',
          fontSize: BODY_SIZE[fontSize] || BODY_SIZE.medium,
        }}>
          {verse.본문}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 1.5, color: SUB, fontSize: { xs: 12, sm: 13 }, fontFamily: CARD_FONT }}>
          <span>{sub}</span>
          <Box component="span" sx={{ fontWeight: 800, color: INK, whiteSpace: 'nowrap' }}>{formatRefFull(verse.장절)}</Box>
        </Box>
        <WrongStamp verse={verse} />
      </Box>
    </Deck>
  );
};
