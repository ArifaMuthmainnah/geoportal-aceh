import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router'

import { useAuth } from '../context/AuthContext'


// =====================================================
// PROTECTED ROUTE
// =====================================================
//
// Digunakan untuk halaman yang hanya boleh diakses
// oleh user yang sudah login.
//
// Contoh:
//
// <Route path="/dashboard" element={<ProtectedRoute />} />
//
// =====================================================

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


  // ===================================================
  // CEK SESSION
  // ===================================================

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


  // ===================================================
  // BELUM LOGIN
  // ===================================================

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


  // ===================================================
  // ADMIN ONLY
  // ===================================================
  //
  // Kalau halaman hanya untuk admin,
  // cek role user.
  //
  // Operator tidak boleh masuk.
  //
  // ===================================================

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


  // ===================================================
  // RENDER CHILDREN
  // ===================================================

  if (children) {

    return children

  }


  // ===================================================
  // RENDER OUTLET
  // ===================================================

  return <Outlet />

}


export default ProtectedRoute