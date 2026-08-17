import { NavLink } from 'react-router'

function LoginNavbar() {

  return (

    <header className="login-navbar">

      <div className="login-navbar-inner">


        {/* =================================================
            BRAND
        ================================================= */}

        <NavLink
          to="/"
          className="login-navbar-brand"
        >

          <div className="login-navbar-logo">
            GA
          </div>

          <div className="login-navbar-brand-text">

            <strong>
              Geoportal Aceh
            </strong>

            <span>
              Informasi Geospasial Aceh
            </span>

          </div>

        </NavLink>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="login-navbar-menu">


          {/* HOME */}

          <NavLink
            to="/"
            className="login-nav-link"
          >
            Home
          </NavLink>


          {/* LAYERS */}

          <NavLink
            to="/login/layers"
            className={({ isActive }) =>
              `login-nav-link ${
                isActive ? 'active' : ''
              }`
            }
          >
            Layers
          </NavLink>


          {/* CSRT */}

          <NavLink
            to="/login/csrt"
            className={({ isActive }) =>
              `login-nav-link ${
                isActive ? 'active' : ''
              }`
            }
          >
            CSRT
          </NavLink>


          {/* KARTOGRAFI */}

          <NavLink
            to="/login/kartografi"
            className={({ isActive }) =>
              `login-nav-link ${
                isActive ? 'active' : ''
              }`
            }
          >
            Kartografi
          </NavLink>


          {/* LOGIN */}

          <NavLink
            to="/login"
            end
            className={({ isActive }) =>
              `login-nav-link login-nav-login ${
                isActive ? 'active' : ''
              }`
            }
          >
            Login
          </NavLink>

        </nav>

      </div>

    </header>

  )
}

export default LoginNavbar