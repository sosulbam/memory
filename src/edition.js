// 빌드 판(edition) — 같은 코드로 두 가지를 낸다.
//  · 기본(Netlify, scripture-memory-sta.netlify.app): 기본 구절 869개가 처음부터 들어 있는 종전 공개판
//  · lamp(등불 암송, apps.sosulbaram.com/amsong): 빈 상태로 시작, 「암송 팩」에서 골라 넣는다
// lamp 빌드는 scripts/build-lamp.sh 로만 만든다(REACT_APP_EDITION=lamp, PUBLIC_URL=/amsong).
export const IS_LAMP = process.env.REACT_APP_EDITION === 'lamp';
export const APP_NAME = IS_LAMP ? '등불 암송' : '말씀사랑';
export const PUBLIC_URL = process.env.PUBLIC_URL || '';

// 등불판 버전(설정 맨 아래에 한 줄로 보인다) — 배포할 때 올린다
export const LAMP_VERSION = '1.3 (2026-11-26)';

// 등불판 겉모양(먹색·아이보리·명조·평평한 테마) — 2026-11-16 부장님 「암송도 기존의 앱을 그대로」로 끔.
// 끄면 화면은 기존 암송앱 그대로, 등불에서 넣은 기능(팩·일정 창·다시/외웠어요·초기화 3택 등)은 IS_LAMP 로 남는다.
export const LAMP_LOOK = false && IS_LAMP;
