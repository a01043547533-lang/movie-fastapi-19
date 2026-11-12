import { useEffect, useRef, useState } from 'react'
import { img, searchMulti } from '../api'
import { CloseIcon, SearchIcon } from './Icons'

export default function SearchOverlay({ popular = [], onClose, onSelect }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // 입력이 멈추고 0.35초 뒤 검색
  useEffect(() => {
    const keyword = q.trim()
    if (!keyword) { setResults(null); return }
    setLoading(true)
    const t = setTimeout(() => {
      searchMulti(keyword)
        .then((r) => setResults(r.results))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="search">
      <div className="search__bar">
        <SearchIcon />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          placeholder="제목, 인물명으로 검색해보세요."
        />
        <button className="icon-btn" onClick={onClose} aria-label="검색 닫기"><CloseIcon /></button>
      </div>

      {results === null ? (
        <div className="search__popular">
          <h3>실시간 인기 검색어</h3>
          <ol>
            {popular.slice(0, 10).map((p, i) => (
              <li key={p.id} onClick={() => onSelect(p)}>
                <span className="num">{i + 1}</span>{p.title}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="search__result">
          <h3>
            {loading ? '검색 중…' : <>‘{q}’ 검색 결과 <b>{results.length}</b></>}
          </h3>
          {!loading && results.length === 0 && <p className="search__empty">검색 결과가 없습니다.</p>}
          <ul className="grid">
            {results.map((r) => (
              <li key={`${r.media_type}-${r.id}`} className="card" onClick={() => onSelect(r)}>
                <div className="card__thumb"><img src={img(r.poster_path, 'w342')} alt={r.title} loading="lazy" /></div>
                <p className="card__title">{r.title}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
