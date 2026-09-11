import { authPost } from './apiClient'

export async function fetchExternalApiData(url) {
  const response = await authPost('/external/fetch', { url })
  return response?.data
}