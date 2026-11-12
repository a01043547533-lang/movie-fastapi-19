#!/usr/bin/env bash
# 서버에서 처음 한 번만 실행: ~/movie-app 을 GitHub 저장소와 연결하고 1분 주기 자동 배포를 켭니다.
#   사용법(서버에서): bash install-auto-deploy.sh
set -euo pipefail

APP="$HOME/movie-app"
URL="https://github.com/a01043547533-lang/movie-fastapi-19.git"

# 1) ~/movie-app 을 git 저장소로 교체 (.env 유지)
if [ ! -d "$APP/.git" ]; then
  [ -f "$APP/backend/.env" ] || { echo "오류: $APP/backend/.env 가 없습니다"; exit 1; }
  rm -rf "$APP.git-new"
  git clone -q --branch main "$URL" "$APP.git-new"
  install -m 600 "$APP/backend/.env" "$APP.git-new/backend/.env"
  rm -rf "$APP.old" && mv "$APP" "$APP.old" && mv "$APP.git-new" "$APP"
  (cd "$APP" && docker compose -p movie-app up -d --build --remove-orphans)
  echo "▶ ~/movie-app 을 GitHub 저장소로 교체 (이전 폴더: ~/movie-app.old)"
fi

# 2) 실행 스크립트 복사 (저장소가 갱신되는 도중에도 안전하게 실행되도록 별도 위치)
mkdir -p "$HOME/bin"
install -m 755 "$APP/scripts/auto-deploy.sh" "$HOME/bin/movie-auto-deploy.sh"

# 3) systemd 서비스 + 1분 타이머
sudo tee /etc/systemd/system/movie-auto-deploy.service >/dev/null <<UNIT
[Unit]
Description=movie-app: GitHub main 자동 배포
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
User=$USER
ExecStart=$HOME/bin/movie-auto-deploy.sh
UNIT

sudo tee /etc/systemd/system/movie-auto-deploy.timer >/dev/null <<UNIT
[Unit]
Description=movie-app: 1분마다 GitHub 확인

[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
AccuracySec=5s

[Install]
WantedBy=timers.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now movie-auto-deploy.timer
echo "▶ 자동 배포 켜짐. 기록 보기: journalctl -u movie-auto-deploy -f"
