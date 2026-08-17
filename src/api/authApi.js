const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  'http://localhost:5000/api'


// =====================================================
// LOGIN
// =====================================================

export async function loginApi(
  username,
  password
) {

  const response =
    await fetch(
      `${AUTH_API_URL}/auth/login`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Accept:
            'application/json',
        },

        body:
          JSON.stringify({
            username,
            password,
          }),
      }
    )


  const text =
    await response.text()


  let data = {}


  try {

    data =
      text
        ? JSON.parse(text)
        : {}

  } catch {

    data = {
      message: text,
    }

  }


  if (!response.ok) {

    throw new Error(
      data?.message ||
      'Login gagal.'
    )

  }


  return data

}


// =====================================================
// CURRENT USER
// =====================================================

export async function getCurrentUser(
  token
) {

  const response =
    await fetch(
      `${AUTH_API_URL}/auth/me`,
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',

          Authorization:
            `Bearer ${token}`,
        },
      }
    )


  const text =
    await response.text()


  let data = {}


  try {

    data =
      text
        ? JSON.parse(text)
        : {}

  } catch {

    data = {
      message: text,
    }

  }


  if (!response.ok) {

    throw new Error(
      data?.message ||
      'Session tidak valid.'
    )

  }


  return data

}