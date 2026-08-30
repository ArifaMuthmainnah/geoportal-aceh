// =====================================================
// API BASE URL
// =====================================================

// API Geoportal Aceh / GeoNode lama
// Digunakan untuk dataset, maps, documents, geoapps, dll.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL


// =====================================================
// AUTH API URL
// =====================================================

// Backend authentication milik project kita
// Contoh:
// http://localhost:5000/api
const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  'http://localhost:5000/api'


// =====================================================
// BUILD GEO API URL
// =====================================================

function buildUrl(endpoint) {

  if (!endpoint) {
    return API_BASE_URL
  }


  // Kalau endpoint sudah berupa URL lengkap
  if (
    endpoint.startsWith('http://') ||
    endpoint.startsWith('https://')
  ) {
    return endpoint
  }


  return `${API_BASE_URL}${endpoint}`
}


// =====================================================
// BUILD AUTH API URL
// =====================================================

function buildAuthUrl(endpoint) {

  if (!endpoint) {
    return AUTH_API_URL
  }


  // Kalau endpoint sudah berupa URL lengkap
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
// Geoportal API lama tetap dipakai seperti sebelumnya.
//
// Kalau nanti API GeoNode lama membutuhkan
// authentication tertentu, bisa ditambahkan di sini.
//
// Untuk sekarang TIDAK menggunakan Basic Auth.
//
// =====================================================

function getGeoAuthHeaders() {

  return {}

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
  // ...isi function yang sudah ada, JANGAN diubah...
}


// =====================================================
// POST FILE (MULTIPART) - GEO API
// =====================================================
//
// Khusus untuk upload file (FormData).
// Tidak set Content-Type manual, karena browser
// akan otomatis menambahkan boundary yang benar.
//
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
//
// Khusus backend authentication.
//
// Backend:
// POST /api/auth/login
// GET  /api/auth/me
//
// Authentication menggunakan JWT Bearer Token.
//
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


  // Kalau sudah login,
  // kirim JWT ke backend.

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
//
// Khusus upload file ke backend kita sendiri
// (bukan ke geoportal lama).
//
// Tidak set Content-Type manual, browser akan
// otomatis menambahkan boundary yang benar.
//
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