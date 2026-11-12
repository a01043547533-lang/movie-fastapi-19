import { useEffect, useState } from 'react'
import { fetchDetail, img, year } from '../api'
import { CloseIcon, HeartIcon, PlayIcon, ShareIcon } from './Icons'

export default function DetailModal({ item, onClose, onSelect }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [showTrailer, setShowTrailer] = useState(false)

  useEffect(() => {
    setDetail(null); setError(''); setShowTrailer(false)
    fetchDetail(item.media_type, item.id).then(setDetail).catch((e) => setError(e.message))
  }, [item])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const d = detail || item

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="닫기"><CloseIcon /></button>

        <div className="modal__visual">
          {showTrailer && detail?.trailer_key ? (
            <iframe
              src={`https://www.youtube.com/embed/${detail.trailer_key}?autoplay=1`}
              title="예고편"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <>
              <img src={img(d.backdrop_path || d.poster_path, 'w1280')} alt="" />
              <div className="modal__shade" />
            </>
          )}
        </div>

        <div className="modal__content">
          <h2 className="modal__title">{d.title}</h2>
          <p className="modal__meta">
            <span className="age">{d.adult ? '19' : 'ALL'}</span>
            {year(d.release_date) && <span>{year(d.release_date)}</span>}
            {detail?.runtime && <span>{detail.runtime}분</span>}
            {detail?.seasons && <span>시즌 {detail.seasons}개</span>}
            {detail?.genres?.length > 0 && <span>{detail.genres.join(' · ')}</span>}
            <span className="score">★ {d.vote_average}</span>
          </p>

          <div className="modal__actions">
            <button
              className="btn-watch"
              onClick={() => setShowTrailer(true)}
              disabled={!detail?.trailer_key}
            >
              <PlayIcon /> {detail?.trailer_key ? '예고편 보기' : '예고편 없음'}
            </button>
            <button className="btn-circle" aria-label="찜"><HeartIcon /></button>
            <button className="btn-circle" aria-label="공유"><ShareIcon /></button>
          </div>

          {error && <p className="modal__error">{error}</p>}
          {detail?.tagline && <p className="modal__tagline">“{detail.tagline}”</p>}
          <p className="modal__overview">{d.overview || '줄거리 정보가 아직 없습니다.'}</p>

          {detail && (
            <dl className="modal__credits">
              {detail.directors.length > 0 && (<><dt>감독</dt><dd>{detail.directors.join(', ')}</dd></>)}
              {detail.cast.length > 0 && (<><dt>출연</dt><dd>{detail.cast.map((c) => c.name).join(', ')}</dd></>)}
            </dl>
          )}

          {detail?.similar?.length > 0 && (
            <>
              <h3 className="modal__subtitle">비슷한 콘텐츠</h3>
              <ul className="modal__similar">
                {detail.similar.map((s) => (
                  <li key={s.id} onClick={() => onSelect(s)}>
                    <img src={img(s.poster_path, 'w342')} alt={s.title} loading="lazy" />
                    <p>{s.title}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
