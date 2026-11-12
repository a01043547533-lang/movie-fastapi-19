import { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import { img } from '../api'
import { ChevronLeft, ChevronRight } from './Icons'

/**
 * TVING 메인 배너 캐러셀
 * - 둥근 모서리 카드, 양옆에 이전/다음 카드가 살짝 보임
 * - 왼쪽 아래: 제목 로고(없으면 글자) + 2줄 설명
 * - 좌우 화살표(마우스 올리면 표시) + 오른쪽 아래 점 버튼
 * - 5초 자동 넘김, 무한 반복, 드래그/스와이프 가능
 * 버튼은 React로 직접 그리고 swiper 인스턴스 메서드로 이동시킨다.
 */
export default function HeroBanner({ items, onSelect }) {
  const [swiper, setSwiper] = useState(null)
  const [active, setActive] = useState(0)

  if (!items?.length) return <div className="hero"><div className="hero__card hero__card--empty" /></div>

  const loop = items.length > 2

  const stop = (e) => e.stopPropagation()
  const prev = (e) => { stop(e); swiper?.slidePrev() }
  const next = (e) => { stop(e); swiper?.slideNext() }
  const goTo = (e, i) => { stop(e); loop ? swiper?.slideToLoop(i) : swiper?.slideTo(i) }

  return (
    <section className="hero">
      <Swiper
        modules={[Autoplay]}
        className="hero__swiper"
        slidesPerView="auto"
        centeredSlides
        spaceBetween={12}
        loop={loop}
        speed={700}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onSwiper={setSwiper}
        onSlideChange={(s) => setActive(s.realIndex)}
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} className="hero__slide">
            <div className="hero__card" onClick={() => onSelect(item)}>
              <img className="hero__bg" src={img(item.backdrop_path, 'original')} alt="" />
              <div className="hero__shade" />
              <div className="hero__info">
                {item.logo_path ? (
                  <img className="hero__logo" src={img(item.logo_path, 'w500')} alt={item.title} />
                ) : (
                  <h2 className="hero__title">{item.title}</h2>
                )}
                {item.overview && <p className="hero__desc">{item.overview}</p>}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button type="button" className="hero__nav hero__nav--prev" onClick={prev} aria-label="이전 배너">
        <ChevronLeft />
      </button>
      <button type="button" className="hero__nav hero__nav--next" onClick={next} aria-label="다음 배너">
        <ChevronRight />
      </button>

      <div className="hero__dots">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={`hero__dot ${i === active ? 'is-active' : ''}`}
            onClick={(e) => goTo(e, i)}
            aria-label={`${i + 1}번째 배너`}
          />
        ))}
      </div>
    </section>
  )
}
