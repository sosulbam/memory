#!/bin/bash
# 등불 암송(lamp) 빌드 → build-lamp/   (Netlify 기본판 build/ 와 별개. 기본판은 종전대로 build/)
#  · 빈 상태로 시작, 「암송 팩」 메뉴, /amsong 아래에서 동작
#  · 아이콘: python3 lamp/make_icons.py / 팩: ~/.session-handover/lamp-pack/build_packs.py lamp/packs (개역한글 교정 포함)
set -e
cd "$(dirname "$0")/.."
REACT_APP_EDITION=lamp REACT_APP_SHORT_NAME='등불 암송' PUBLIC_URL=/amsong BUILD_PATH=build-lamp GENERATE_SOURCEMAP=false \
  node node_modules/react-scripts/bin/react-scripts.js build
cp lamp/public/* build-lamp/
mkdir -p build-lamp/packs
cp lamp/packs/*.json build-lamp/packs/
# 기본판 씨앗 구절은 등불판에서 쓰지 않는다(팩으로만 넣는다)
echo '[]' > build-lamp/data/verses.json
# apple-touch-icon 은 180px 전용 파일로
sed -i 's#rel="apple-touch-icon" href="/amsong/logo192.png"#rel="apple-touch-icon" href="/amsong/apple-touch-icon.png"#' build-lamp/index.html
echo "built: $(ls build-lamp/static/js/main.*.js)"
