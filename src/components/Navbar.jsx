import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

function Navbar() {

  const [open, setOpen] = useState(false)

  const {
    currentUser,
    logout,
  } = useAuth()


  const handleLogout = () => {

    const confirmLogout =
      window.confirm(
        'Apakah Anda yakin ingin keluar?'
      )

    if (confirmLogout) {
      logout()
    }

  }


  return (
    <header className="site-header">

      {/* =====================================================
          TOPBAR
          HANYA LOGIN / USER
      ===================================================== */}

      <div className="navbar-topbar">

        <div className="container navbar-topbar-inner">

          {/* Kiri sengaja kosong */}

          <div />

          {/* ================================
              BELUM LOGIN
          ================================= */}

          {!currentUser && (

            <Link
              to="/login"
              className="navbar-login-button"
            >

              <span className="navbar-login-icon">
                ♙
              </span>

              <span>
                Login
              </span>

            </Link>

          )}


          {/* ================================
              SUDAH LOGIN
          ================================= */}

          {currentUser && (

            <div className="navbar-user-area">

              <Link
                to="/admin"
                className="navbar-user-link"
              >

                <span className="navbar-user-icon">
                  ♙
                </span>

                <span>
                  {currentUser.username ||
                    currentUser.name ||
                    'Admin'}
                </span>

              </Link>


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


      {/* =====================================================
          MAIN NAVBAR
      ===================================================== */}

      <nav className="navbar navbar-expand-lg bg-white border-bottom">

        <div className="container">


          {/* ================================
              BRAND
          ================================= */}

          <Link
            className="navbar-brand fw-bold"
            to="/"
          >
            Geoportal Aceh
          </Link>


          {/* ================================
              NAVIGATION
          ================================= */}

          <div className="navbar-nav ms-auto align-items-lg-center">


            <Link
              className="nav-link"
              to="/"
            >
              Home
            </Link>


            <Link
              className="nav-link"
              to="/katalog"
            >
              Data
            </Link>


            <Link
              className="nav-link"
              to="/webgis"
            >
              WebGIS
            </Link>


            <Link
              className="nav-link"
              to="/aplikasi"
            >
              Aplikasi
            </Link>


            <Link
              className="nav-link"
              to="/jign"
            >
              JIGN
            </Link>


            {/* ================================
                INFORMASI
            ================================= */}

            <div
              className="nav-item dropdown"
              style={{
                position: 'relative',
              }}
            >

              <button
                type="button"
                className="nav-link dropdown-toggle border-0 bg-transparent"
                onClick={() =>
                  setOpen(!open)
                }
                aria-expanded={open}
              >
                Informasi
              </button>


              {open && (

                <ul
                  className="dropdown-menu show"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    left: 'auto',
                    marginTop: '4px',
                  }}
                >

                  <li>

                    <Link
                      className="dropdown-item"
                      to="/informasi/berita"
                      onClick={() =>
                        setOpen(false)
                      }
                    >
                      Berita
                    </Link>

                  </li>


                  <li>

                    <Link
                      className="dropdown-item"
                      to="/informasi/agenda"
                      onClick={() =>
                        setOpen(false)
                      }
                    >
                      Agenda
                    </Link>

                  </li>


                  <li>

                    <Link
                      className="dropdown-item"
                      to="/informasi/pemberitahuan"
                      onClick={() =>
                        setOpen(false)
                      }
                    >
                      Pemberitahuan
                    </Link>

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