import { useState } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '../context/AuthContext'

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api'
const SERVER_BASE_URL = AUTH_API_URL.replace(/\/api\/?$/, '')

function buildAvatarUrl(path) {
  if (!path) return null
  return `${SERVER_BASE_URL}/uploads/${path}`
}

// =====================================================
// STYLE UNTUK NAV LINK AKTIF (#1)
// =====================================================

function navLinkStyle({ isActive }) {
  return isActive
    ? {
        fontWeight: 700,
        color: '#4f46e5',
        borderBottom: '2px solid #4f46e5',
      }
    : {}
}

function Navbar() {

  const [open, setOpen] = useState(false)

  const {
    currentUser,
    logout,
  } = useAuth()


  const handleLogout = () => {

    const confirmLogout =
      window.confirm('Apakah Anda yakin ingin keluar?')

    if (confirmLogout) {
      logout()
    }

  }


  return (
    <header className="site-header">

      <div className="navbar-topbar">

        <div className="container navbar-topbar-inner">

          <div />

          {!currentUser && (

            <NavLink
              to="/login"
              className="navbar-login-button"
            >
              <span className="navbar-login-icon">♙</span>
              <span>Login</span>
            </NavLink>

          )}


          {currentUser && (

            <div className="navbar-user-area">

              <NavLink
                to={currentUser.role === 'admin' ? '/admin' : '/dashboard'}
                className="navbar-user-link"
              >

                {currentUser.avatar_url ? (
                  <img
                    src={buildAvatarUrl(currentUser.avatar_url)}
                    alt={currentUser.username}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span className="navbar-user-icon">♙</span>
                )}

                <span>
                  {currentUser.username || currentUser.name || 'Admin'}
                </span>

              </NavLink>


              <button
                type="button"
                className="navbar-logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          )}

        </div>

      </div>


      <nav className="navbar navbar-expand-lg bg-white border-bottom">

        <div className="container">

          <NavLink className="navbar-brand fw-bold" to="/">
            Geoportal Aceh
          </NavLink>

          <div className="navbar-nav ms-auto align-items-lg-center">

            <NavLink className="nav-link" to="/" end style={navLinkStyle}>
              Home
            </NavLink>

            <NavLink className="nav-link" to="/katalog" style={navLinkStyle}>
              Data
            </NavLink>

            <NavLink className="nav-link" to="/webgis" style={navLinkStyle}>
              WebGIS
            </NavLink>

            <NavLink className="nav-link" to="/peta" style={navLinkStyle}>
              Peta
            </NavLink>

            <NavLink className="nav-link" to="/dokumen" style={navLinkStyle}>
              Dokumen
            </NavLink>

            <NavLink className="nav-link" to="/aplikasi" style={navLinkStyle}>
              Aplikasi
            </NavLink>

            <NavLink className="nav-link" to="/jign" style={navLinkStyle}>
              JIGN
            </NavLink>


            <div className="nav-item dropdown" style={{ position: 'relative' }}>

              <button
                type="button"
                className="nav-link dropdown-toggle border-0 bg-transparent"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
              >
                Informasi
              </button>

              {open && (

                <ul
                  className="dropdown-menu show"
                  style={{ position: 'absolute', top: '100%', right: 0, left: 'auto', marginTop: '4px' }}
                >

                  <li>
                    <NavLink className="dropdown-item" to="/informasi/berita" onClick={() => setOpen(false)}>
                      Berita
                    </NavLink>
                  </li>

                  <li>
                    <NavLink className="dropdown-item" to="/informasi/agenda" onClick={() => setOpen(false)}>
                      Agenda
                    </NavLink>
                  </li>

                  <li>
                    <NavLink className="dropdown-item" to="/informasi/pemberitahuan" onClick={() => setOpen(false)}>
                      Pemberitahuan
                    </NavLink>
                  </li>

                </ul>

              )}

            </div>

          </div>

        </div>

      </nav>

    </header>
  )
}

export default Navbar