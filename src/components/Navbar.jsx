import { useState } from 'react'
import { Link } from 'react-router'

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div className="container">

        {/* Brand */}
        <Link
          className="navbar-brand fw-bold"
          to="/"
        >
          Geoportal Aceh
        </Link>


        {/* Navigation */}
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
            Katalog
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


          {/* Informasi Dropdown */}
          <div
            className="nav-item dropdown"
            style={{ position: 'relative' }}
          >

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
                    onClick={() => setOpen(false)}
                  >
                    Berita
                  </Link>
                </li>


                <li>
                  <Link
                    className="dropdown-item"
                    to="/informasi/agenda"
                    onClick={() => setOpen(false)}
                  >
                    Agenda
                  </Link>
                </li>


                <li>
                  <Link
                    className="dropdown-item"
                    to="/informasi/pemberitahuan"
                    onClick={() => setOpen(false)}
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
  )
}

export default Navbar