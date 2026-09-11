import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router'

import { useAuth } from '../context/AuthContext'

function ProtectedRoute({
  adminOnly = false,
  children,
}) {

  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth()


  const location =
    useLocation()

  if (loading) {

    return (

      <div
        className="protected-loading"
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >

        <div
          style={{
            textAlign: 'center',
          }}
        >

          <div
            style={{
              fontSize: '32px',
              marginBottom: '12px',
            }}
          >
            ⏳
          </div>

          <p
            style={{
              margin: 0,
            }}
          >
            Memuat sesi...
          </p>

        </div>

      </div>

    )
  }

  if (!isAuthenticated) {

    return (

      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />

    )
  }

  if (
    adminOnly &&
    !isAdmin
  ) {

    return (

      <Navigate
        to="/dashboard"
        replace
      />

    )
  }

  if (children) {

    return children

  }
  
  return <Outlet />

}


export default ProtectedRoute