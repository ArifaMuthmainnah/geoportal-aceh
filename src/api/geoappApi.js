import { apiGet, apiGetAll, } from './apiClient'

export function getGeoapps(query = '') {
  return apiGet(`geoapps${query}`)
}

export function getAllGeoapps() {
  return apiGetAll('geoapps')
}