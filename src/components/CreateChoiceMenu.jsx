import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

const OPTIONS = [
  { label: 'Dataset', fullLabel: 'Tambah Dataset', icon: '◈', path: '/dashboard/create-dataset' },
  { label: 'Peta', fullLabel: 'Tambah Peta', icon: '⌖', path: '/dashboard/create-map' },
  { label: 'Dashboard', fullLabel: 'Tambah Dashboard / Aplikasi', icon: '▥', path: '/dashboard/create-dashboard' },
  { label: 'Upload', fullLabel: 'Upload File', icon: '⬆', path: '/dashboard/upload' },
  { label: 'API', fullLabel: 'Ambil dari API', icon: '⇩', path: '/dashboard/ambil-api' },
]

const RADIUS = 148

const START_ANGLE = 180
const END_ANGLE = 90

function CreateChoiceMenu() {

  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {

    if (!open) return

    function handleOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }

  }, [open])

  function handleSelect(path) {
    setOpen(false)
    navigate(path)
  }

  const count = OPTIONS.length
  const step = count > 1 ? (END_ANGLE - START_ANGLE) / (count - 1) : 0
  const arcSize = RADIUS + 45

  return (

    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '56px',
        height: '56px',
        zIndex: 1000,
      }}
    >

      {/* Overlay transparan — klik di luar area menutup menu */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(15,39,71,0.10)' }}
        />
      )}

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: `${arcSize}px`,
          height: `${arcSize}px`,
          top: `${28 - arcSize}px`,
          left: `${28 - arcSize}px`,
          borderRadius: '100% 0 0 0',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.20), rgba(15,39,71,0.05))',
          border: '1px solid rgba(37,99,235,0.18)',
          borderRight: 'none',
          borderBottom: 'none',
          zIndex: 999,
          transformOrigin: 'bottom right',
          transform: open ? 'scale(1)' : 'scale(0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: 'none',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
        }}
      />

      <div role="menu" aria-label="Pilihan tambah data">
        {OPTIONS.map((option, index) => {

          const angleDeg = START_ANGLE + step * index
          const angleRad = (angleDeg * Math.PI) / 180

          const offsetX = Math.cos(angleRad) * RADIUS
          const offsetY = -Math.sin(angleRad) * RADIUS

          return (

            <button
              key={option.path}
              type="button"
              role="menuitem"
              title={option.fullLabel}
              aria-label={option.fullLabel}
              onClick={() => handleSelect(option.path)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                background: 'var(--admin-primary, #0f2747)',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(15,39,71,0.35)',
                zIndex: 1000,
                transitionProperty: 'transform, opacity, background',
                transitionDuration: '0.3s, 0.2s, 0.2s',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1), ease, ease',
                transitionDelay: open ? `${index * 0.04}s` : '0s',
                transform: open
                  ? `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`
                  : 'translate(-50%, -50%) scale(0.2)',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none',
              }}
              onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--admin-accent, #2563eb)' }}
              onMouseLeave={(event) => { event.currentTarget.style.background = 'var(--admin-primary, #0f2747)' }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{option.icon}</span>
              <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.2px', lineHeight: 1 }}>
                {option.label}
              </span>
            </button>

          )

        })}
      </div>

      <button
        type="button"
        title="Buat / Tambah Data"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Tutup menu tambah data' : 'Buka menu tambah data'}
        onClick={() => setOpen((current) => !current)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: 'var(--admin-primary, #0f2747)',
          color: '#ffffff',
          fontSize: '26px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1001,
          boxShadow: open
            ? '0 4px 20px rgba(37,99,235,0.55)'
            : '0 4px 14px rgba(0,0,0,0.25)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        +
      </button>

    </div>

  )

}

export default CreateChoiceMenu