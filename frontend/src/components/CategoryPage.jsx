import { useEffect, useState } from 'react'
import { fetchCategory } from '../api'
import HeroBanner from './HeroBanner'
import Row from './Row'

// 상단 메뉴(드라마·예능·영화·애니·다큐) 페이지: 배너 + 콘텐츠 줄
export default function CategoryPage({ name, onSelect }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setData(null); setError('')
    fetchCategory(name)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [name])

  if (error) return <div className="error-box"><p>데이터를 불러오지 못했습니다.</p><p className="error-box__msg">{error}</p></div>
  if (!data) return <div className="loading"><span /></div>

  return (
    <>
      <HeroBanner key={name} items={data.hero} onSelect={onSelect} />
      <div className="rows">
        {data.sections.map((s, i) => (
          <Row
            key={s.key}
            id={`row-${s.key}`}
            title={s.title}
            items={s.items}
            variant={i === 0 ? 'wide' : undefined}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  )
}
