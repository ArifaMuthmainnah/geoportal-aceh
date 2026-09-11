const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  'http://localhost:5000/api'

function buildUrl(endpoint) {

  if (!endpoint) {
    return `${AUTH_API_URL}/proxy`
  }

  if (
    endpoint.startsWith('http://') ||
    endpoint.startsWith('https://')
  ) {
    return endpoint
  }

  return `${AUTH_API_URL}/proxy/${endpoint}`
}

function buildAuthUrl(endpoint) {

  if (!endpoint) {
    return AUTH_API_URL
  }

  if (
    endpoint.startsWith('http://') ||
    endpoint.startsWith('https://')
  ) {
    return endpoint
  }

  return `${AUTH_API_URL}${endpoint}`
}

function getToken() {

  return sessionStorage.getItem(
    'geoportal_auth_token'
  )

}

function getGeoAuthHeaders() {

  const token = getToken()

  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }

}

export async function apiGet(endpoint) {

  const response =
    await fetch(
      buildUrl(endpoint),
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',

          ...getGeoAuthHeaders(),
        },
      }
    )

  if (!response.ok) {

    const errorText =
      await response.text()

    console.error(
      'API GET Error:',
      response.status,
      errorText
    )

    throw new Error(
      `Gagal mengambil data (${response.status})`
    )
  }

  return response.json()
}

export async function apiPost(
  endpoint,
  body
) {

  const response =
    await fetch(
      buildUrl(endpoint),
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Accept:
            'application/json',

          ...getGeoAuthHeaders(),
        },

        body:
          JSON.stringify(body),
      }
    )

  if (!response.ok) {

    const errorText =
      await response.text()

    console.error(
      'API POST Error:',
      response.status,
      errorText
    )

    throw new Error(
      `Gagal mengirim data (${response.status})`
    )
  }

  const text =
    await response.text()

  if (!text) {
    return {}
  }

  try {

    return JSON.parse(text)

  } catch {

    return {
      message: text,
    }

  }
}

export async function apiPostFile(
  endpoint,
  formData
) {

  const response =
    await fetch(
      buildUrl(endpoint),
      {
        method: 'POST',

        headers: {
          Accept:
            'application/json',

          ...getGeoAuthHeaders(),
        },

        body: formData,
      }
    )

  if (!response.ok) {

    const errorText =
      await response.text()

    console.error(
      'API UPLOAD Error:',
      response.status,
      errorText
    )

    throw new Error(
      `Gagal mengunggah file (${response.status})`
    )
  }

  const text =
    await response.text()

  if (!text) {
    return {}
  }

  try {

    return JSON.parse(text)

  } catch {

    return {
      message: text,
    }

  }
}

export async function apiPatch(
  endpoint,
  body
) {

  const response =
    await fetch(
      buildUrl(endpoint),
      {
        method: 'PATCH',

        headers: {
          'Content-Type':
            'application/json',

          Accept:
            'application/json',

          ...getGeoAuthHeaders(),
        },

        body:
          JSON.stringify(body),
      }
    )

  if (!response.ok) {

    const errorText =
      await response.text()

    console.error(
      'API PATCH Error:',
      response.status,
      errorText
    )

    throw new Error(
      `Gagal mengubah data (${response.status})`
    )
  }

  const text =
    await response.text()

  if (!text) {
    return {}
  }

  try {

    return JSON.parse(text)

  } catch {

    return {
      message: text,
    }

  }
}

export async function apiDelete(
  endpoint
) {

  const response =
    await fetch(
      buildUrl(endpoint),
      {
        method: 'DELETE',

        headers: {
          Accept:
            'application/json',

          ...getGeoAuthHeaders(),
        },
      }
    )

  if (!response.ok) {

    const errorText =
      await response.text()

    console.error(
      'API DELETE Error:',
      response.status,
      errorText
    )

    throw new Error(
      `Gagal menghapus data (${response.status})`
    )
  }

  return true
}

export async function apiGetAll(
  endpoint,
  options = {}
) {

  const {
    pageSize = 100,
    maxPages = 100,
  } = options

  let page = 1

  let allResults = []

  while (page <= maxPages) {

    const separator =
      endpoint.includes('?')
        ? '&'
        : '?'

    const response =
      await apiGet(
        `${endpoint}${separator}page=${page}&page_size=${pageSize}`
      )

    const results =
      Array.isArray(response)
        ? response
        : response?.results ||
          response?.datasets ||
          response?.geoapps ||
          response?.maps ||
          response?.documents ||
          response?.owners ||
          response?.users ||
          response?.data ||
          []

    allResults = [
      ...allResults,
      ...results,
    ]

    if (results.length === 0) {
      break
    }

    if (results.length < pageSize) {
      break
    }

    const total =
      Number(
        response?.total ??
        response?.count ??
        0
      )

    if (
      total > 0 &&
      allResults.length >= total
    ) {
      break
    }

    page++
  }

  return allResults
}

async function authRequest(
  endpoint,
  options = {}
) {

  const token =
    getToken()


  const headers = {

    'Content-Type':
      'application/json',

    Accept:
      'application/json',

    ...(options.headers || {}),
  }

  if (token) {

    headers.Authorization =
      `Bearer ${token}`

  }

  const response =
    await fetch(
      buildAuthUrl(endpoint),
      {
        ...options,
        headers,
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
      data?.error ||
      `Authentication error (${response.status})`
    )

  }

  return data
}

export function authGet(
  endpoint
) {

  return authRequest(
    endpoint,
    {
      method: 'GET',
    }
  )

}

export function authPost(
  endpoint,
  body
) {

  return authRequest(
    endpoint,
    {
      method: 'POST',

      body:
        JSON.stringify(body),
    }
  )

}

export function authPatch(
  endpoint,
  body
) {

  return authRequest(
    endpoint,
    {
      method: 'PATCH',

      body:
        JSON.stringify(body),
    }
  )

}

export function authDelete(
  endpoint
) {

  return authRequest(
    endpoint,
    {
      method: 'DELETE',
    }
  )

}

export async function authPostFile(
  endpoint,
  formData
) {

  const token = getToken()

  const headers = {
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response =
    await fetch(
      buildAuthUrl(endpoint),
      {
        method: 'POST',
        headers,
        body: formData,
      }
    )

  const text = await response.text()

  let data = {}

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Gagal mengunggah file (${response.status})`
    )
  }

  return data

}

export async function authPatchFile(
  endpoint,
  formData
) {

  const token = getToken()

  const headers = {
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response =
    await fetch(
      buildAuthUrl(endpoint),
      {
        method: 'PATCH',
        headers,
        body: formData,
      }
    )

  const text = await response.text()

  let data = {}

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Gagal memperbarui data (${response.status})`
    )
  }

  return data

}