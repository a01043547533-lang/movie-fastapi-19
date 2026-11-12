import { useRef, useState } from 'react'
import { img } from '../api'
import { ChevronLeft, ChevronRight } from './Icons'

/**
 * 가로 슬라이드 한 줄.
 * variant: 'poster'(세로 포스터) | 'rank'(TOP 20 숫자) | 'wide'(가로형 썸네일)
 */
export default function Row({ id, title, items = [], variant = 'poster', badge, onSelect }) {
  const trackRef = useRef(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  if (!items.length) return null

  const updateEdge = () => {
    const el = trackRef.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }

  const slide = (dir) => {
    const el = trackRef.current
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section id={id} className={`row row--${variant}`}>
      <h3 className="row__title">{title}</h3>
      <div className="row__body">
        {!edge.start && (
          <button className="row__arrow row__arrow--prev" onClick={() => slide(-1)} aria-label="이전"><ChevronLeft /></button>
        )}
        <ul className="row__track" ref={trackRef} onScroll={updateEdge}>
          {items.map((item, i) => (
            <li key={`${item.media_type}-${item.id}`} className="card" onClick={() => onSelect(item)}>
              {variant === 'rank' && <span className="card__rank">{i + 1}</span>}
              <div className="card__thumb">
                <img
                  src={variant === 'wide' ? img(item.backdrop_path || item.poster_path, 'w780') : img(item.poster_path, 'w342')}
                  alt={item.title}
                  loading="lazy"
                />
                {badge && <span className="card__badge">{badge}</span>}
                {variant !== 'wide' && item.vote_average >= 8 && <span className="card__badge card__badge--hot">인기</span>}
              </div>
              {variant !== 'rank' && <p className="card__title">{item.title}</p>}
            </li>
          ))}
        </ul>
        {!edge.end && (
          <button className="row__arrow row__arrow--next" onClick={() => slide(1)} aria-label="다음"><ChevronRight /></button>
        )}
      </div>
    </section>
  )
}
