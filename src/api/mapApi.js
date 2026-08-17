import { apiGet, apiGetAll, } from './apiClient'

export function getMaps(query = '') {
  return apiGet(`maps${query}`)
}

export function getAllMaps() {
  return apiGetAll('maps')
}