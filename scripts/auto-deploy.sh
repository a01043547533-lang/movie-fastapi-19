#!/usr/bin/env bash
# 서버(EC2)에서 1분마다 실행 (systemd 타이머: movie-auto-deploy.timer)
# GitHub main 브랜치에 새 커밋이 있고, 그 커밋의 CI(빌드 확인)가 성공했으면 배포합니다.
# 배포 후 상태 확인에 실패하면 직전 커밋으로 자동으로 되돌립니다.
#   기록 보기: journalctl -u movie-auto-deploy -f
set -euo pipefail

APP="$HOME/movie-app"
REPO="a01043547533-lang/movie-fastapi-19"
BRANCH=main
STATE="$HOME/.movie-deploy"          # 잠금 파일, 건너뛴 커밋 기록
NO_CI_WAIT=600                       # CI 결과가 10분 넘게 없으면 그냥 배포
COMPOSE="docker compose -p movie-app"

log() { echo "[auto-deploy] $*"; }
mkdir -p "$STATE"
exec 9>"$STATE/lock"; flock -n 9 || exit 0     # 이전 실행이 아직 진행 중이면 건너뜀

cd "$APP"
git fetch -q origin "$BRANCH"
CUR=$(git rev-parse HEAD)
NEW=$(git rev-parse "origin/$BRANCH")
[ "$CUR" = "$NEW" ] && exit 0
[ "$(cat "$STATE/skipped" 2>/dev/null)" = "$NEW" ] && exit 0

# CI 결과 확인 (공개 저장소라 로그인 없이 조회 가능)
CI=$(curl -fsS -m 15 -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/commits/$NEW/check-runs" | python3 -c '
import json, sys
runs = json.load(sys.stdin).get("check_runs", [])
if not runs: print("none")
elif any(r["status"] != "completed" for r in runs): print("pending")
elif all(r["conclusion"] in ("success", "skipped", "neutral") for r in runs): print("success")
else: print("failure")') || CI=error

AGE=$(( $(date +%s) - $(git log -1 --format=%ct "$NEW") ))
case "$CI" in
  success) ;;
  failure) log "${NEW:0:7} CI 실패 → 배포하지 않음"; echo "$NEW" > "$STATE/skipped"; exit 0 ;;
  none|error)
    [ "$AGE" -lt "$NO_CI_WAIT" ] && exit 0
    log "${NEW:0:7} CI 결과 없음(${AGE}초) → 그대로 배포" ;;
  *) exit 0 ;;   # pending: 다음 실행에서 다시 확인
esac

wait_healthy() {
  for _ in $(seq 1 30); do
    curl -fsS http://localhost/api/health >/dev/null 2>&1 && return 0
    sleep 3
  done
  return 1
}

log "${CUR:0:7} → ${NEW:0:7} 배포 시작: $(git log -1 --format=%s "$NEW")"
git reset -q --hard "$NEW"           # backend/.env 는 git에 없으므로 그대로 유지됨
if $COMPOSE up -d --build --remove-orphans && wait_healthy; then
  log "${NEW:0:7} 배포 성공"
  docker image prune -f >/dev/null
  # 이 스크립트도 최신 버전으로 교체 (실행 중인 파일을 덮지 않도록 mv 사용)
  install -m 755 "$APP/scripts/auto-deploy.sh" "$HOME/bin/movie-auto-deploy.sh.new" \
    && mv "$HOME/bin/movie-auto-deploy.sh.new" "$HOME/bin/movie-auto-deploy.sh"
else
  log "${NEW:0:7} 상태 확인 실패 → ${CUR:0:7} 로 되돌림"
  $COMPOSE logs --tail=40 || true
  echo "$NEW" > "$STATE/skipped"
  git reset -q --hard "$CUR"
  $COMPOSE up -d --build --remove-orphans
  exit 1
fi
