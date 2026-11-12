// 백엔드(FastAPI) 호출 모음. vite proxy가 /api → localhost:8000 으로 넘긴다.
async function get(path) {
  const res = await fetch(`/api${path}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || `요청 실패 (${res.status})`)
  return data
}

export const fetchHome = () => get('/home')
export const fetchCategory = (name) => get(`/category/${name}`)
export const fetchDetail = (type, id) => get(`/${type}/${id}`)
export const searchMulti = (q) => get(`/search?q=${encodeURIComponent(q)}`)

const IMG = 'https://image.tmdb.org/t/p'
export const img = (path, size = 'w500') => (path ? `${IMG}/${size}${path}` : '')

export const GENRES = {
  28: '액션', 12: '모험', 16: '애니메이션', 35: '코미디', 80: '범죄', 99: '다큐멘터리',
  18: '드라마', 10751: '가족', 14: '판타지', 36: '역사', 27: '공포', 10402: '음악',
  9648: '미스터리', 10749: '로맨스', 878: 'SF', 53: '스릴러', 10752: '전쟁', 37: '서부',
  10759: '액션&어드벤처', 10762: '키즈', 10763: '뉴스', 10764: '리얼리티', 10765: 'SF&판타지',
  10766: '연속극', 10767: '토크', 10768: '전쟁&정치', 10770: 'TV 영화',
}
export const genreText = (ids = []) => ids.slice(0, 2).map((g) => GENRES[g]).filter(Boolean).join(' · ')
export const year = (d) => (d ? d.slice(0, 4) : '')
