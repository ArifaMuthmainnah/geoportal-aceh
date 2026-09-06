import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'

function CreateChoiceMenu() {

  const navigate = useNavigate()
  const buttonRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const options = [
    { label: 'Dataset', icon: '◈', path: '/dashboard/create-dataset' },
    { label: 'Peta', icon: '⌖', path: '/dashboard/create-map' },
    { label: 'Dashboard / Aplikasi', icon: '▥', path: '/dashboard/create-dashboard' },
  ]

  function toggleOpen() {

    if (!open && buttonRef.current) {

      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 220
      const left = Math.min(rect.left, window.innerWidth - menuWidth - 16)

      setPos({ top: rect.bottom + 8, left: Math.max(8, left) })

    }

    setOpen((current) => !current)

  }

  function handleSelect(path) {
    setOpen(false)
    navigate(path)
  }

  return (

    <div style={{ position: 'relative', display: 'inline-block' }}>

      <button
        ref={buttonRef}
        type="button"
        className="admin-view-site"
        onClick={toggleOpen}
      >
        + Buat
      </button>

      {open && (

        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          />

          <div
            style={{
              position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000,
              background: '#fff', border: '1px solid #d1d5db', borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '220px', overflow: 'hidden',
            }}
          >
            {options.map((option) => (
              <button
                key={option.path}
                type="button"
                onClick={() => handleSelect(option.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '12px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: '14px',
                  borderBottom: '1px solid #f1f1f1',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </>

      )}

    </div>

  )

}

export default CreateChoiceMenu