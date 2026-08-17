const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiGet(endpoint) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`
  )

  if (!response.ok) {
    throw new Error('Gagal mengambil data')
  }

  return response.json()
}