import { useEffect, useState } from 'react'
import { SearchIcon } from './Icons'

// 상단 메뉴 (key는 백엔드 /api/category/{key})
export const MENUS = [
  { key: 'drama', label: '드라마' },
  { key: 'variety', label: '예능' },
  { key: 'movie', label: '영화' },
  { key: 'anime', label: '애니' },
  { key: 'docu', label: '다큐' },
]

export default function Header({ current, onNavigate, onSearch, searching }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (e, page) => { e.preventDefault(); onNavigate(page) }

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header__left">
        <a className="logo" href="#/" onClick={(e) => go(e, 'home')}>TVING</a>
        <nav className="gnb">
          {MENUS.map((m) => (
            <a
              key={m.key}
              href={`#/${m.key}`}
              onClick={(e) => go(e, m.key)}
              className={!searching && current === m.key ? 'is-active' : ''}
              aria-current={!searching && current === m.key ? 'page' : undefined}
            >
              {m.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="header__right">
        <button className={`icon-btn ${searching ? 'is-active' : ''}`} aria-label="검색" onClick={onSearch}><SearchIcon /></button>
        <button className="profile" aria-label="프로필">
          <span className="profile__img" />
        </button>
      </div>
    </header>
  )
}
