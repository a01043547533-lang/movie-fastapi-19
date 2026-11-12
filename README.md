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

`main` 브랜치에 push하면 GitHub Actions가 서버(http://3.105.22.205)에 자동 배포합니다.

```
git add . && git commit -m "변경 내용" && git push
```

동작 순서 (`.github/workflows/deploy.yml`)
1. 프론트 빌드·백엔드 문법 확인 (실패하면 서버는 건드리지 않음)
2. 코드 묶음을 SSH로 업로드 → 서버에서 `scripts/deploy-remote.sh` 실행
   - 서버에만 있는 `backend/.env` 유지, `docker compose up -d --build`
   - 상태 확인 실패 시 **이전 버전으로 자동 복구**
3. 외부에서 화면·API 확인

필요한 GitHub Secrets (Settings > Secrets and variables > Actions)
| 이름 | 값 |
|---|---|
| `EC2_SSH_KEY` | `movie-deploy-key.pem` 파일 내용 전체 |
| `EC2_KNOWN_HOSTS` | `ssh-keyscan 3.105.22.205` 결과 (서버 호스트 키) |

서버 SSH(22번)는 GitHub Actions 접속을 위해 전체(0.0.0.0/0)에 열려 있으며, 비밀번호 로그인은 꺼져 있어 열쇠(.pem)로만 접속됩니다.
