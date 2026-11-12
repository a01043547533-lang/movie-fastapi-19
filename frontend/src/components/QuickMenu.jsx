import { useMemo } from 'react'
import { img } from '../api'

/**
 * 배너와 콘텐츠 사이의 동그란 바로가기 아이콘 줄 (TVING 메인 참고)
 * - type 'cat'  : 그라데이션 원 + 글자 로고 → 메뉴 페이지 이동 또는 해당 콘텐츠 줄로 스크롤
 * - type 'item' : 작품 포스터를 동그랗게 → 상세 창 열기
 */
const CATS = {
  original: { label: '오리지널', mark: 'ORIGINAL', bg: 'linear-gradient(135deg,#ff153c,#ff4fa3)', row: 'trending' },
  soon: { label: '공개예정', mark: 'SOON', bg: 'linear-gradient(135deg,#ffb300,#ff6a00)', row: 'upcoming' },
  movie: { label: '영화', mark: 'MOVIE', bg: 'linear-gradient(135deg,#2f6bff,#00c2ff)', page: 'movie' },
  kdrama: { label: 'K-드라마', mark: 'K·D', bg: 'linear-gradient(135deg,#00b37e,#00e0c6)', page: 'drama' },
  top: { label: '오늘의\nTOP 20', mark: 'TOP', bg: 'linear-gradient(135deg,#3a3a3a,#111)', row: 'top20' },
  now: { label: '지금 극장\n상영작', mark: 'NOW', bg: 'linear-gradient(135deg,#ff3d3d,#8b0000)', row: 'now_playing' },
  series: { label: '해외\n시리즈', mark: 'SERIES', bg: 'linear-gradient(135deg,#7b2ff7,#f107a3)', row: 'popular_tv' },
  best: { label: '평점 높은\n명작', mark: 'BEST', bg: 'linear-gradient(135deg,#d4a017,#7a5a00)', row: 'top_rated' },
  ani: { label: '애니메이션', mark: 'ANI', bg: 'linear-gradient(135deg,#ffe000,#ff9f00)', page: 'anime', dark: true },
  pick: { label: '오늘 뭐 볼까?', mark: 'PICK', bg: 'linear-gradient(135deg,#a020f0,#5b21ff)', pick: true },
}

export default function QuickMenu({ home, onSelect, onNavigate }) {
  const items = useMemo(() => {
    const first = (key, n = 0) => home[key]?.[n]
    const cat = (k) => ({ type: 'cat', key: k, ...CATS[k] })
    const item = (it, badge) => it && { type: 'item', key: `i-${it.id}`, label: it.title, data: it, badge }
    return [
      cat('original'),
      item(first('korean_drama'), true),
      cat('soon'),
      cat('movie'),
      item(first('top20'), false),
      cat('kdrama'),
      cat('top'),
      item(first('animation'), true),
      cat('now'),
      cat('series'),
      item(first('popular_tv', 1), false),
      cat('best'),
      cat('ani'),
      cat('pick'),
    ].filter(Boolean)
  }, [home])

  const handle = (it) => {
    if (it.type === 'item') return onSelect(it.data)
    if (it.page) return onNavigate(it.page)
    if (it.pick) {
      const pool = home.trending || []
      return pool.length && onSelect(pool[Math.floor(Math.random() * pool.length)])
    }
    document.getElementById(`row-${it.row}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="quick" aria-label="바로가기">
      <ul className="quick__list">
        {items.map((it) => (
          <li key={it.key}>
            <button type="button" className="quick__btn" onClick={() => handle(it)}>
              <span className="quick__circle" style={it.type === 'cat' ? { background: it.bg } : undefined}>
                {it.type === 'item' ? (
                  <img src={img(it.data.poster_path, 'w185')} alt="" loading="lazy" />
                ) : (
                  <span className={`quick__mark ${it.mark.length > 5 ? 'is-long' : ''} ${it.dark ? 'is-dark' : ''}`}>{it.mark}</span>
                )}
              </span>
              {it.badge && <span className="quick__badge">N</span>}
              <span className="quick__label">{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
