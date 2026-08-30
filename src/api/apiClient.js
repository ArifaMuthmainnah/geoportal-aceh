// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL


// =====================================================
// AUTH API URL
// =====================================================

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  'http://localhost:5000/api'


// =====================================================
// BUILD GEO API URL
// =====================================================
//
// PENTING: endpoint (datasets, geoapps, owners, dll)
// sekarang diarahkan ke PROXY backend kita sendiri
// (bukan langsung ke sig.acehprov.go.id), supaya tidak
// diblokir CORS oleh browser. Backend kita yang akan
// meneruskan permintaan ke API lama secara server-to-server.
//
// =====================================================

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


// =====================================================
// BUILD AUTH API URL
// =====================================================

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


// =====================================================
// GET JWT TOKEN
// =====================================================

function getToken() {

  return sessionStorage.getItem(
    'geoportal_auth_token'
  )

}


// =====================================================
// GET AUTH HEADERS UNTUK GEO API
// =====================================================
//
// PERBAIKAN: sekarang endpoint geo (datasets, geoapps,
// dll) ditembak lewat proxy backend kita sendiri, dan
// beberapa di antaranya (/admin/datasets, /admin/geoapps,
// /overrides) DILINDUNGI oleh authenticateToken +
// requireAdmin di backend. Jadi token WAJIB disertakan
// di sini, bukan dikosongkan seperti sebelumnya.
//
// Untuk endpoint publik (datasets, geoapps, owners biasa),
// menyertakan token tetap aman karena backend tidak
// mewajibkannya di situ.
//
// =====================================================

function getGeoAuthHeaders() {

  const token = getToken()

  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }

}


// =====================================================
// GET - GEO API
// =====================================================

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


// =====================================================
// POST - GEO API
// =====================================================

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


// =====================================================
// POST FILE (MULTIPART) - GEO API
// =====================================================

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


// =====================================================
// PATCH - GEO API
// =====================================================

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


// =====================================================
// DELETE - GEO API
// =====================================================

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


// =====================================================
// GET ALL - GEO API
// =====================================================

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


// =====================================================
// AUTH REQUEST
// =====================================================

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


// =====================================================
// AUTH GET
// =====================================================

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


// =====================================================
// AUTH POST
// =====================================================

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


// =====================================================
// AUTH PATCH
// =====================================================

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


// =====================================================
// AUTH DELETE
// =====================================================

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


// =====================================================
// AUTH POST FILE (MULTIPART) - BACKEND SENDIRI
// =====================================================

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