"""TMDB 데이터를 가져와 프론트(React)에 전달하는 FastAPI 서버."""
import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(ENV_PATH)

TMDB_BASE = "https://api.themoviedb.org/3"
PLACEHOLDER = "여기에"


def keys() -> tuple[str, str]:
    """(API_KEY, READ_TOKEN). .env를 매번 다시 읽어서, 키를 바꿔도 서버 재시작이 필요 없다."""
    env = {**os.environ, **{k: v or "" for k, v in dotenv_values(ENV_PATH).items()}}

    def clean(name: str) -> str:
        v = env.get(name, "").strip().strip('"').strip("'")
        return "" if v.startswith(PLACEHOLDER) else v

    return clean("TMDB_API_KEY"), clean("TMDB_READ_ACCESS_TOKEN")


LANGUAGE = os.getenv("TMDB_LANGUAGE", "ko-KR")
REGION = os.getenv("TMDB_REGION", "KR")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global client
    client = httpx.AsyncClient(
        base_url=TMDB_BASE, headers={"accept": "application/json"}, timeout=10
    )
    yield
    await client.aclose()


app = FastAPI(title="Movie API (TMDB)", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["GET"],
    allow_headers=["*"],
)


async def tmdb(path: str, **params) -> dict:
    """TMDB 호출 공통 함수. 토큰이 없으면 api_key 쿼리로 인증한다."""
    api_key, read_token = keys()
    if not (api_key or read_token):
        raise HTTPException(500, "backend/.env에 TMDB 키가 설정되지 않았습니다.")
    params.setdefault("language", LANGUAGE)
    params = {k: v for k, v in params.items() if v is not None}  # language=None → 언어 필터 없음
    headers = {}
    if read_token:
        headers["Authorization"] = f"Bearer {read_token}"
    else:
        params["api_key"] = api_key
    res = await client.get(path, params=params, headers=headers)
    if res.status_code != 200:
        raise HTTPException(res.status_code, res.json().get("status_message", "TMDB 오류"))
    return res.json()


def slim(item: dict, media_type: str | None = None) -> dict:
    """프론트에서 쓰는 필드만 골라낸다 (영화/TV 공통 형태)."""
    mt = item.get("media_type") or media_type or ("tv" if "first_air_date" in item else "movie")
    return {
        "id": item["id"],
        "media_type": mt,
        "title": item.get("title") or item.get("name"),
        "original_title": item.get("original_title") or item.get("original_name"),
        "overview": item.get("overview", ""),
        "poster_path": item.get("poster_path"),
        "backdrop_path": item.get("backdrop_path"),
        "release_date": item.get("release_date") or item.get("first_air_date"),
        "vote_average": round(item.get("vote_average", 0), 1),
        "genre_ids": item.get("genre_ids", []),
        "adult": item.get("adult", False),
    }


def slim_list(data: dict, media_type: str | None = None) -> list[dict]:
    return [
        slim(i, media_type)
        for i in data.get("results", [])
        if i.get("media_type", media_type) in ("movie", "tv", None) and i.get("poster_path")
    ]


# ---------------------------------------------------------------- 엔드포인트

@app.get("/api/health")
async def health():
    return {"ok": True, "key_configured": any(keys())}


@app.get("/api/home")
async def home():
    """메인 화면에 필요한 모든 섹션을 한 번에 병렬로 가져온다."""
    sections = {
        "trending": ("/trending/all/day", None, {}),
        "top20": ("/trending/movie/week", "movie", {}),
        "now_playing": ("/movie/now_playing", "movie", {"region": REGION}),
        "popular_movies": ("/movie/popular", "movie", {"region": REGION}),
        "popular_tv": ("/tv/popular", "tv", {}),
        "korean_drama": ("/discover/tv", "tv", {"with_original_language": "ko", "sort_by": "popularity.desc"}),
        "top_rated": ("/movie/top_rated", "movie", {}),
        "upcoming": ("/movie/upcoming", "movie", {"region": REGION}),
        "animation": ("/discover/movie", "movie", {"with_genres": "16", "sort_by": "popularity.desc"}),
    }
    results = await asyncio.gather(
        *(tmdb(path, **params) for path, _, params in sections.values())
    )
    data = {
        key: slim_list(res, mt)
        for (key, (_, mt, _)), res in zip(sections.items(), results)
    }
    data["top20"] = data["top20"][:20]
    # 히어로 배너: 배경 이미지가 있는 트렌딩 작품 상위 7개 + 제목 로고 이미지
    hero = [dict(i) for i in data["trending"] if i["backdrop_path"]][:7]
    logos = await asyncio.gather(*(title_logo(i["media_type"], i["id"]) for i in hero))
    for item, logo in zip(hero, logos):
        item["logo_path"] = logo
    data["hero"] = hero
    return data


# 상단 메뉴별 페이지 구성: (줄 key, 줄 제목, TMDB 경로, media_type, 추가 파라미터)
KO_TV = {"with_original_language": "ko", "sort_by": "popularity.desc"}
CATEGORIES = {
    "drama": ("드라마", [
        ("k_drama", "요즘 뜨는 한국 드라마", "/discover/tv", "tv", {**KO_TV, "with_genres": "18"}),
        ("k_comedy", "코믹 드라마", "/discover/tv", "tv", {**KO_TV, "with_genres": "18,35"}),
        ("k_crime", "범죄·스릴러 드라마", "/discover/tv", "tv", {**KO_TV, "with_genres": "80|9648"}),
        ("k_best", "평점 높은 한국 드라마", "/discover/tv", "tv", {**KO_TV, "with_genres": "18", "sort_by": "vote_average.desc", "vote_count.gte": "100"}),
        ("us_drama", "해외 인기 드라마", "/discover/tv", "tv", {"with_genres": "18", "sort_by": "popularity.desc", "without_original_language": "ko"}),
        ("jp_drama", "일본 드라마", "/discover/tv", "tv", {"with_original_language": "ja", "with_genres": "18", "sort_by": "popularity.desc", "without_genres": "16"}),
    ]),
    "variety": ("예능", [
        ("k_variety", "요즘 화제의 예능", "/discover/tv", "tv", {**KO_TV, "with_genres": "10764|35", "without_genres": "18"}),
        ("k_reality", "리얼리티 예능", "/discover/tv", "tv", {**KO_TV, "with_genres": "10764"}),
        ("k_talk", "토크쇼", "/discover/tv", "tv", {**KO_TV, "with_genres": "10767"}),
        ("k_variety_best", "많이 본 레전드 예능", "/discover/tv", "tv", {**KO_TV, "with_genres": "10764|35", "without_genres": "18", "sort_by": "vote_count.desc"}),
        ("global_reality", "해외 리얼리티", "/discover/tv", "tv", {"with_genres": "10764", "sort_by": "popularity.desc", "without_original_language": "ko"}),
    ]),
    "movie": ("영화", [
        ("now_playing", "지금 극장 상영작", "/movie/now_playing", "movie", {"region": REGION}),
        ("popular", "인기 영화", "/movie/popular", "movie", {"region": REGION}),
        ("k_movie", "한국 영화", "/discover/movie", "movie", {"with_original_language": "ko", "sort_by": "popularity.desc"}),
        ("action", "액션 영화", "/discover/movie", "movie", {"with_genres": "28", "sort_by": "popularity.desc"}),
        ("comedy", "코미디 영화", "/discover/movie", "movie", {"with_genres": "35", "sort_by": "popularity.desc"}),
        ("romance", "로맨스 영화", "/discover/movie", "movie", {"with_genres": "10749", "sort_by": "popularity.desc"}),
        ("horror", "공포·스릴러 영화", "/discover/movie", "movie", {"with_genres": "27|53", "sort_by": "popularity.desc"}),
        ("top_rated", "평점 높은 명작", "/movie/top_rated", "movie", {}),
        ("upcoming", "개봉 예정", "/movie/upcoming", "movie", {"region": REGION}),
    ]),
    "anime": ("애니", [
        ("anime_tv", "인기 TV 애니메이션", "/discover/tv", "tv", {"with_genres": "16", "with_original_language": "ja", "sort_by": "popularity.desc"}),
        ("anime_movie", "극장판 애니메이션", "/discover/movie", "movie", {"with_genres": "16", "with_original_language": "ja", "sort_by": "popularity.desc"}),
        ("family_ani", "온 가족 애니메이션", "/discover/movie", "movie", {"with_genres": "16,10751", "sort_by": "popularity.desc"}),
        ("kids", "어린이 애니메이션", "/discover/tv", "tv", {"with_genres": "10762", "sort_by": "popularity.desc"}),
        ("anime_best", "평점 높은 애니메이션", "/discover/movie", "movie", {"with_genres": "16", "sort_by": "vote_average.desc", "vote_count.gte": "1000"}),
    ]),
    "docu": ("다큐", [
        ("docu_tv", "인기 다큐 시리즈", "/discover/tv", "tv", {"with_genres": "99", "sort_by": "popularity.desc"}),
        ("docu_movie", "다큐멘터리 영화", "/discover/movie", "movie", {"with_genres": "99", "sort_by": "popularity.desc"}),
        ("k_docu", "한국 다큐멘터리", "/discover/tv", "tv", {**KO_TV, "with_genres": "99"}),
        ("docu_best", "평점 높은 다큐멘터리", "/discover/movie", "movie", {"with_genres": "99", "sort_by": "vote_average.desc", "vote_count.gte": "300"}),
    ]),
}


@app.get("/api/category/{name}")
async def category(name: str):
    """상단 메뉴 페이지: 배너 + 여러 콘텐츠 줄."""
    if name not in CATEGORIES:
        raise HTTPException(404, "없는 메뉴입니다.")
    title, rows = CATEGORIES[name]
    results = await asyncio.gather(*(tmdb(path, **params) for _, _, path, _, params in rows))
    sections = [
        {"key": key, "title": row_title, "items": slim_list(res, mt)}
        for (key, row_title, _, mt, _), res in zip(rows, results)
    ]
    sections = [s for s in sections if s["items"]]

    # 배너: 각 줄의 상위 작품 중 배경 이미지 있는 것, 중복 없이 6개
    hero, seen = [], set()
    for rank in range(3):
        for s in sections:
            if len(s["items"]) > rank:
                it = s["items"][rank]
                if it["backdrop_path"] and it["id"] not in seen and len(hero) < 6:
                    seen.add(it["id"])
                    hero.append(dict(it))
    logos = await asyncio.gather(*(title_logo(i["media_type"], i["id"]) for i in hero))
    for item, logo in zip(hero, logos):
        item["logo_path"] = logo
    return {"name": name, "title": title, "hero": hero, "sections": sections}


async def title_logo(media_type: str, item_id: int) -> str | None:
    """작품 제목 로고(투명 PNG). 한국어 → 영어 → 언어없음 순으로 고른다."""
    try:
        res = await tmdb(
            f"/{media_type}/{item_id}/images", language=None, include_image_language="ko,en,null"
        )
    except HTTPException:
        return None
    logos = res.get("logos", [])
    for lang in ("ko", "en", None):
        for logo in logos:
            if logo.get("iso_639_1") == lang:
                return logo["file_path"]
    return None


@app.get("/api/{media_type}/{item_id}")
async def detail(media_type: str, item_id: int):
    """상세 정보 + 출연진 + 예고편 + 비슷한 작품."""
    if media_type not in ("movie", "tv"):
        raise HTTPException(404, "movie 또는 tv만 지원합니다.")
    info = await tmdb(
        f"/{media_type}/{item_id}",
        append_to_response="credits,videos,similar,release_dates,content_ratings",
        include_video_language="ko,en",
    )
    videos = info.get("videos", {}).get("results", [])
    trailer = next(
        (v for v in videos if v["site"] == "YouTube" and v["type"] in ("Trailer", "Teaser")),
        None,
    )
    return {
        **slim(info, media_type),
        "genres": [g["name"] for g in info.get("genres", [])],
        "runtime": info.get("runtime") or (info.get("episode_run_time") or [None])[0],
        "tagline": info.get("tagline", ""),
        "seasons": info.get("number_of_seasons"),
        "cast": [
            {"name": c["name"], "character": c.get("character"), "profile_path": c.get("profile_path")}
            for c in info.get("credits", {}).get("cast", [])[:10]
        ],
        "directors": [
            c["name"] for c in info.get("credits", {}).get("crew", []) if c.get("job") == "Director"
        ],
        "trailer_key": trailer["key"] if trailer else None,
        "similar": slim_list(info.get("similar", {}), media_type)[:12],
    }


@app.get("/api/search")
async def search(q: str = Query(..., min_length=1), page: int = 1):
    data = await tmdb("/search/multi", query=q, page=page, include_adult="false")
    return {"results": slim_list(data), "total": data.get("total_results", 0)}
