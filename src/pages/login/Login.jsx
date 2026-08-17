import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useAuth } from '../../context/AuthContext'


function Login() {

  const navigate =
    useNavigate()


  const {
    login
  } = useAuth()


  const [
    username,
    setUsername
  ] = useState('')


  const [
    password,
    setPassword
  ] = useState('')


  const [
    error,
    setError
  ] = useState('')


  const [
    loading,
    setLoading
  ] = useState(false)


  // ===================================================
  // SUBMIT
  // ===================================================

  async function handleSubmit(e) {

    e.preventDefault()

    setError('')


    if (
      !username.trim() ||
      !password.trim()
    ) {

      setError(
        'Username dan password wajib diisi.'
      )

      return
    }


    try {

      setLoading(true)


      const user =
        await login(
          username.trim(),
          password
        )


      // ===============================================
      // REDIRECT BERDASARKAN ROLE
      // ===============================================

      if (
        user.role === 'admin'
      ) {

        navigate(
          '/admin',
          {
            replace: true
          }
        )

      } else {

        navigate(
          '/dashboard',
          {
            replace: true
          }
        )

      }

    } catch (error) {

      console.error(
        'Login:',
        error
      )


      setError(
        error.message ||
        'Username atau password salah.'
      )

    } finally {

      setLoading(false)

    }

  }


  return (

    <div className="login-page">

      <main className="login-main">

        <div className="login-container">

          <div className="login-card">

            <div className="login-card-header">

              <div className="login-icon">
                🔐
              </div>


              <h1>
                Login
              </h1>


              <p>
                Masuk ke sistem pengelolaan
                Geoportal Aceh.
              </p>

            </div>


            {error && (

              <div className="login-error">
                {error}
              </div>

            )}


            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              <div className="login-field">

                <label htmlFor="username">
                  Username
                </label>


                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                    )
                  }
                  placeholder="Masukkan username"
                  autoComplete="username"
                  disabled={loading}
                />

              </div>


              <div className="login-field">

                <label htmlFor="password">
                  Password
                </label>


                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={loading}
                />

              </div>


              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >

                {loading
                  ? 'Memproses...'
                  : 'Login'
                }

              </button>

            </form>


            <div className="login-card-footer">

              <span>
                Geoportal Aceh
              </span>


              <span>
                Sistem Informasi Geospasial
              </span>

            </div>

          </div>

        </div>

      </main>

    </div>

  )

}


export default Login