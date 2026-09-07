import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  loginApi,
  getCurrentUser,
} from '../api/authApi'


const AuthContext =
  createContext(null)


const TOKEN_KEY =
  'geoportal_auth_token'

const USER_KEY =
  'geoportal_current_user'


// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({
  children,
}) {

  const [
    currentUser,
    setCurrentUser
  ] = useState(null)


  const [
    loading,
    setLoading
  ] = useState(true)


  // ===================================================
  // RESTORE SESSION
  // ===================================================

  useEffect(() => {

    async function restoreSession() {

      const token =
        sessionStorage.getItem(
          TOKEN_KEY
        )


      if (!token) {

        setLoading(false)

        return

      }


      try {

        const response =
          await getCurrentUser(
            token
          )


        if (
          !response.success ||
          !response.user
        ) {

          throw new Error(
            'Session tidak valid.'
          )

        }


        setCurrentUser(
          response.user
        )


        sessionStorage.setItem(
          USER_KEY,
          JSON.stringify(
            response.user
          )
        )

      } catch (error) {

        console.error(
          'Session tidak valid:',
          error
        )


        sessionStorage.removeItem(
          TOKEN_KEY
        )

        sessionStorage.removeItem(
          USER_KEY
        )

        setCurrentUser(null)

      } finally {

        setLoading(false)

      }

    }


    restoreSession()

  }, [])


  // ===================================================
  // LOGIN
  // ===================================================

  async function login(
    username,
    password
  ) {

    const response =
      await loginApi(
        username,
        password
      )


    if (
      !response.success ||
      !response.token ||
      !response.user
    ) {

      throw new Error(
        response.message ||
        'Login gagal.'
      )

    }


    sessionStorage.setItem(
      TOKEN_KEY,
      response.token
    )


    sessionStorage.setItem(
      USER_KEY,
      JSON.stringify(
        response.user
      )
    )


    setCurrentUser(
      response.user
    )


    return response.user

  }


  // ===================================================
  // LOGOUT
  // ===================================================

  function logout() {

    sessionStorage.removeItem(
      TOKEN_KEY
    )

    sessionStorage.removeItem(
      USER_KEY
    )

    setCurrentUser(null)

  }

    // ===================================================
  // REFRESH (setelah admin edit profil sendiri)
  // ===================================================

  async function refreshCurrentUser() {

    const token = sessionStorage.getItem(TOKEN_KEY)

    if (!token) return

    try {

      const response = await getCurrentUser(token)

      if (response.success && response.user) {
        setCurrentUser(response.user)
        sessionStorage.setItem(USER_KEY, JSON.stringify(response.user))
      }

    } catch (error) {
      console.error('Gagal refresh user:', error)
    }

  }


  // ===================================================
  // VALUE
  // ===================================================

  const value = {

    currentUser,

    loading,

    isAuthenticated:
      Boolean(currentUser),

    isAdmin:
      currentUser?.role ===
      'admin',

    isOperator:
      currentUser?.role ===
      'operator',

    login,

    logout,

    refreshCurrentUser

  }


  return (

    <AuthContext.Provider
      value={value}
    >

      {children}

    </AuthContext.Provider>

  )

}


// =====================================================
// HOOK
// =====================================================

export function useAuth() {

  return useContext(
    AuthContext
  )

}