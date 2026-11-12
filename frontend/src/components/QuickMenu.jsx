import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { img } from '../api'
import { ChevronLeft, ChevronRight } from './Icons'

/**
 * 배너와 콘텐츠 사이의 동그란 바로가기 아이콘 줄 (TVING 메인 참고)
 * - type 'cat'  : 광택 있는 구슬 모양 원 + 글자 로고 → 메뉴 페이지 이동 또는 해당 콘텐츠 줄로 스크롤
 * - type 'item' : 작품 포스터를 동그랗게 → 상세 창 열기
 * orb: [밝은 중심색, 가장자리색, 반사광색], ink: 글자색, sub: 둘째 줄 작은 글자
 */
const CATS = {
  original: { label: '오늘의 인기작', mark: 'HOT', orb: ['#ff2a55', '#e0004e', '#ffb43a'], row: 'trending' },
  soon: { label: '개봉 예정', mark: 'SOON', orb: ['#ffa21f', '#ff6a00', '#ffd36b'], ink: '#2a1200', row: 'upcoming' },
  movie: { label: '영화', mark: 'MOVIE', orb: ['#3d7bff', '#1d3fd8', '#7fd8ff'], page: 'movie' },
  kdrama: { label: '한국 드라마', mark: 'K-DRAMA', orb: ['#16d39a', '#00936e', '#b9ffd9'], page: 'drama' },
  top: { label: '이번 주 TOP 20', mark: 'TOP', sub: '20', orb: ['#3b3b40', '#0b0b0d', '#8a8a95'], row: 'top20' },
  now: { label: '지금 극장 상영작', mark: 'NOW', sub: 'PLAYING', orb: ['#ff3b3b', '#b30012', '#ff9a7a'], row: 'now_playing' },
  series: { label: '해외 시리즈', mark: 'SERIES', orb: ['#b13cff', '#6a12d6', '#ff7ad9'], row: 'popular_tv' },
  best: { label: '평점 높은 명작', mark: 'BEST', orb: ['#f2c24b', '#a8740a', '#fff1b0'], ink: '#2e1d00', row: 'top_rated' },
  ani: { label: '애니메이션', mark: 'ANI', orb: ['#ffe14a', '#ffac00', '#fffbd0'], ink: '#2e1d00', page: 'anime' },
  pick: { label: '오늘 뭐 볼까?', eyes: true, orb: ['#c34dff', '#7a1fe0', '#ff8ff0'], pick: true },
}

const orbStyle = ([c1, c2, hl], ink) => ({ '--c1': c1, '--c2': c2, '--hl': hl, ...(ink && { '--ink': ink }) })

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

  // 화면 밖으로 넘치는 아이콘은 좌우 버튼으로 넘김 (캐러셀처럼)
  const listRef = useRef(null)
  const [edge, setEdge] = useState({ start: true, end: true })
  const updateEdge = useCallback(() => {
    const el = listRef.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    updateEdge()
    const ro = new ResizeObserver(updateEdge)
    ro.observe(el)
    return () => ro.disconnect()
  }, [items, updateEdge])
  const slide = (dir) => {
    const el = listRef.current
    const slot = el.querySelector('li')?.getBoundingClientRect().width || 120
    const cs = getComputedStyle(el)
    const inner = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    el.scrollBy({ left: dir * Math.max(1, Math.round(inner / slot)) * slot, behavior: 'smooth' })   // 한 화면씩
  }

  return (
    <nav className="quick" aria-label="바로가기">
      {!edge.start && (
        <button type="button" className="quick__arrow quick__arrow--prev" onClick={() => slide(-1)} aria-label="이전 바로가기"><ChevronLeft /></button>
      )}
      {!edge.end && (
        <button type="button" className="quick__arrow quick__arrow--next" onClick={() => slide(1)} aria-label="다음 바로가기"><ChevronRight /></button>
      )}
      <ul className="quick__list" ref={listRef} onScroll={updateEdge}>
        {items.map((it) => (
          <li key={it.key}>
            <button type="button" className="quick__btn" onClick={() => handle(it)}>
              <span className="quick__ring">
                {it.type === 'item' ? (
                  <span className="quick__circle is-poster">
                    <img src={img(it.data.poster_path, 'w342')} alt="" loading="lazy" />
                  </span>
                ) : (
                  <span className="quick__circle is-orb" style={orbStyle(it.orb, it.ink)}>
                    {it.eyes ? (
                      <span className="quick__eyes" aria-hidden="true"><i /><i /></span>
                    ) : (
                      <span className={`quick__mark ${it.mark.length > 6 ? 'is-xlong' : it.mark.length > 5 ? 'is-long' : ''}`}>
                        {it.mark}
                        {it.sub && <small>{it.sub}</small>}
                      </span>
                    )}
                  </span>
                )}
                {it.badge && <span className="quick__badge">N</span>}
              </span>
              <span className="quick__label">{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
