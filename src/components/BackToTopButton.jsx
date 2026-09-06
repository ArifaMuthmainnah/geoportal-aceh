import { Link } from 'react-router'

function BackToTopButton({ to, label = 'Kembali', className = '' }) {

  return (
    <Link
      to={to}
      className={`icon-tooltip-btn detail-back-top ${className}`}
      data-tooltip={label}
      aria-label={label}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </Link>
  )

}

export default BackToTopButton