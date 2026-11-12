const LINKS = ['고객문의', '공지사항', '자주 묻는 질문', '이용약관', '개인정보처리방침', '청소년보호정책', '사업자정보확인', '인재채용']

export default function Footer() {
  return (
    <footer className="footer">
      <ul className="footer__links">
        {LINKS.map((l) => (
          <li key={l}><a href="#" onClick={(e) => e.preventDefault()} className={l === '개인정보처리방침' ? 'is-strong' : ''}>{l}</a></li>
        ))}
      </ul>
      <div className="footer__info">
        <p>이 사이트는 학습용 클론 프로젝트입니다. 영화·TV 데이터와 이미지는 TMDB API에서 제공됩니다.</p>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p className="footer__copy">© fastapi-movie-19 · React + FastAPI</p>
      </div>
    </footer>
  )
}
