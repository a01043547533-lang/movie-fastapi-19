#!/usr/bin/env bash
# 서버(EC2)에서 실행되는 배포 스크립트
# /tmp/movie-app.tgz 를 풀어 새 버전으로 교체하고, 실패하면 이전 버전으로 되돌립니다.
set -euo pipefail

APP="$HOME/movie-app"        # 현재 버전
NEW="$HOME/movie-app.new"    # 새로 올라온 버전
PREV="$HOME/movie-app.prev"  # 직전 버전 (되돌리기용)
PKG=/tmp/movie-app.tgz
COMPOSE="docker compose -p movie-app"

log() { echo "[deploy] $*"; }

wait_healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS http://localhost/api/health >/dev/null 2>&1; then return 0; fi
    sleep 3
  done
  return 1
}

# 1) 새 버전 풀기 + 서버에만 있는 .env 복사
[ -f "$APP/backend/.env" ] || { log "오류: $APP/backend/.env 가 없습니다"; exit 1; }
rm -rf "$NEW" && mkdir -p "$NEW"
tar xzf "$PKG" -C "$NEW"
install -m 600 "$APP/backend/.env" "$NEW/backend/.env"

# 2) 폴더 교체 (현재 → prev, new → 현재)
rm -rf "$PREV"
mv "$APP" "$PREV"
mv "$NEW" "$APP"

# 3) 컨테이너 다시 빌드·실행
log "빌드 및 실행"
cd "$APP"
if $COMPOSE up -d --build --remove-orphans && wait_healthy; then
  log "성공"
  $COMPOSE ps
  docker image prune -f >/dev/null   # 쓰지 않는 옛 이미지 정리 (디스크 확보)
  rm -f "$PKG"
else
  log "실패 → 이전 버전으로 되돌립니다"
  $COMPOSE logs --tail=50 || true
  cd "$HOME"
  rm -rf "$APP.failed" && mv "$APP" "$APP.failed"
  mv "$PREV" "$APP"
  cd "$APP" && $COMPOSE up -d --build --remove-orphans
  exit 1
fi
