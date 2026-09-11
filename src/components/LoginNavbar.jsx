import { NavLink } from 'react-router'

function LoginNavbar() {

  return (

    <header className="login-navbar">

      <div className="login-navbar-inner">

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

        <nav className="login-navbar-menu">

          <NavLink
            to="/"
            className="login-nav-link"
          >
            Home
          </NavLink>

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