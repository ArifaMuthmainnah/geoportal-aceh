import { Link } from 'react-router'

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div className="container">

        <Link className="navbar-brand fw-bold" to="/">
          Geoportal Aceh
        </Link>

        <div className="navbar-nav ms-auto">

          <Link className="nav-link" to="/">
            Home
          </Link>

          <Link className="nav-link" to="/katalog">
            Katalog
          </Link>

          <Link className="nav-link" to="/webgis">
            WebGIS
          </Link>

          <Link className="nav-link" to="/aplikasi">
            Aplikasi
          </Link>

          <Link className="nav-link" to="/jign">
            JIGN
          </Link>

          <Link className="nav-link" to="/informasi">
            Informasi
          </Link>

        </div>

      </div>
    </nav>
  )
}

export default Navbar