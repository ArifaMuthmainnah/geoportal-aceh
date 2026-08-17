import { apiGet, apiGetAll, } from './apiClient'

export function getOwners(params = '') {
  return apiGet(`owners${params}`)
}

export function getAllOwners() {
  return apiGetAll('owners')
}