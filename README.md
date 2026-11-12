# fastapi-movie-19

TMDB 데이터를 FastAPI로 가져와 React(Vite)로 TVING 스타일 화면을 그리는 프로젝트.

## 1. 키 넣기
`backend/.env` 를 열어 TMDB 키를 붙여 넣는다 (https://www.themoviedb.org/settings/api).
- `TMDB_API_KEY` : API 키
- `TMDB_READ_ACCESS_TOKEN` : API 읽기 액세스 토큰 (둘 중 하나만 있어도 됨, 토큰 우선. 키를 바꿔도 서버 재시작 불필요)

## 2. 백엔드 실행 (터미널 1)
```
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```
처음이면 `python -m venv venv` → `pip install -r requirements.txt` 먼저.

## 3. 프론트 실행 (터미널 2)
```
cd frontend
npm install
npm run dev
```
http://localhost:5173 접속

## API
| 경로 | 설명 |
|---|---|
| GET /api/health | 키 설정 여부 |
| GET /api/home | 메인 화면 전체 섹션 (배너·TOP20·인기영화 등) |
| GET /api/{movie\|tv}/{id} | 상세 (출연진·예고편·비슷한 작품) |
| GET /api/search?q= | 통합 검색 |

## GitHub 자동 배포 (AWS EC2)

`main` 브랜치에 push하면 1~4분 안에 서버(http://3.105.22.205)에 자동 반영됩니다.

```
git add . && git commit -m "변경 내용" && git push
```

동작 방식
1. GitHub Actions(`.github/workflows/ci.yml`)가 프론트 빌드·백엔드·도커 빌드를 확인
2. 서버가 1분마다 GitHub를 확인 (`scripts/auto-deploy.sh`, systemd 타이머)
   - 새 커밋의 CI가 **성공**이면 `git reset --hard` → `docker compose up -d --build`
   - CI가 실패한 커밋은 배포하지 않음
   - 배포 후 `/api/health` 확인에 실패하면 **직전 커밋으로 자동 복구**
3. TMDB 키(`backend/.env`)는 서버에만 있고 GitHub에는 올라가지 않음

GitHub Secret이나 SSH 접속이 필요 없습니다.

서버에서 쓰는 명령
```
journalctl -u movie-auto-deploy -f           # 배포 기록 보기
sudo systemctl stop movie-auto-deploy.timer  # 자동 배포 끄기 (start로 다시 켜기)
```
처음 설치: 서버에서 `bash scripts/install-auto-deploy.sh` (이미 설치됨)
