import { useCallback, useEffect, useState } from 'react'
import { fetchHome } from './api'
import Header, { MENUS } from './components/Header'
import HeroBanner from './components/HeroBanner'
import QuickMenu from './components/QuickMenu'
import Row from './components/Row'
import CategoryPage from './components/CategoryPage'
import Footer from './components/Footer'
import DetailModal from './components/DetailModal'
import SearchOverlay from './components/SearchOverlay'

// 메인 화면 줄 구성 (key는 백엔드 /api/home 응답 키)
const ROWS = [
  { key: 'trending', title: '오늘 가장 많이 본 작품' },
  { key: 'top20', title: '이번 주 영화 TOP 20', variant: 'rank' },
  { key: 'now_playing', title: '지금 극장 상영작', variant: 'wide' },
  { key: 'korean_drama', title: '요즘 뜨는 한국 드라마' },
  { key: 'popular_movies', title: '인기 영화' },
  { key: 'popular_tv', title: '인기 해외 시리즈' },
  { key: 'upcoming', title: '곧 개봉하는 영화', badge: '개봉예정' },
  { key: 'top_rated', title: '평점 높은 명작 영화' },
  { key: 'animation', title: '인기 애니메이션 영화' },
]

// 주소의 #/drama 같은 해시로 현재 페이지를 정한다 (뒤로가기 지원)
const pageFromHash = () => {
  const key = window.location.hash.replace(/^#\/?/, '')
  return MENUS.some((m) => m.key === key) ? key : 'home'
}

export default function App() {
  const [page, setPage] = useState(pageFromHash)
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchHome().then(setHome).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    const onHash = () => { setPage(pageFromHash()); setSearching(false); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((next) => {
    const hash = next === 'home' ? '#/' : `#/${next}`
    if (window.location.hash === hash || (next === 'home' && !window.location.hash)) {
      setSearching(false); window.scrollTo({ top: 0, behavior: 'smooth' })  // 같은 메뉴 다시 누르면 맨 위로
    } else {
      window.location.hash = hash
    }
  }, [])

  const openDetail = useCallback((item) => setSelected(item), [])
  const closeDetail = useCallback(() => setSelected(null), [])

  return (
    <div className="app">
      <Header current={page} searching={searching} onNavigate={navigate} onSearch={() => { setSearching(true); window.scrollTo(0, 0) }} />

      {searching ? (
        <SearchOverlay popular={home?.trending} onClose={() => setSearching(false)} onSelect={openDetail} />
      ) : page !== 'home' ? (
        <main><CategoryPage name={page} onSelect={openDetail} /></main>
      ) : (
        <main>
          {error && (
            <div className="error-box">
              <p>데이터를 불러오지 못했습니다.</p>
              <p className="error-box__msg">{error}</p>
              <p className="error-box__hint">백엔드 서버(8000번)가 켜져 있는지, backend/.env 에 TMDB 키가 들어있는지 확인해 주세요.</p>
            </div>
          )}
          {!home && !error && <div className="loading"><span /></div>}
          {home && (
            <>
              <HeroBanner items={home.hero} onSelect={openDetail} />
              <QuickMenu home={home} onSelect={openDetail} onNavigate={navigate} />
              <div className="rows">
                {ROWS.map((r) => (
                  <Row key={r.key} id={`row-${r.key}`} title={r.title} items={home[r.key]} variant={r.variant} badge={r.badge} onSelect={openDetail} />
                ))}
              </div>
            </>
          )}
        </main>
      )}

      <Footer />
      {selected && <DetailModal item={selected} onClose={closeDetail} onSelect={openDetail} />}
    </div>
  )
}
