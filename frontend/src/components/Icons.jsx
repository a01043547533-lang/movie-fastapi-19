// 사용하는 아이콘을 인라인 SVG로 모아 둔다
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const SearchIcon = (p) => (
  <svg viewBox="0 0 24 24" width="28" height="28" {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)
export const ChevronLeft = (p) => (
  <svg viewBox="0 0 24 24" width="32" height="32" {...base} {...p}><path d="m15 18-6-6 6-6" /></svg>
)
export const ChevronRight = (p) => (
  <svg viewBox="0 0 24 24" width="32" height="32" {...base} {...p}><path d="m9 18 6-6-6-6" /></svg>
)
export const CloseIcon = (p) => (
  <svg viewBox="0 0 24 24" width="28" height="28" {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const PlayIcon = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" {...p}><path d="M7 4.5v15l13-7.5z" /></svg>
)
export const PauseIcon = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...p}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
)
export const HeartIcon = (p) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...base} {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
)
export const ShareIcon = (p) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...base} {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
)
