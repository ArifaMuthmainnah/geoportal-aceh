import { authPost } from './apiClient'

// =====================================================
// SESI 6: AMBIL DATA DARI API EKSTERNAL
// =====================================================

export async function fetchExternalApiData(url) {
  const response = await authPost('/external/fetch', { url })
  return response?.data
}