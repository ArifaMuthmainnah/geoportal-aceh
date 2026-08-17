import { apiGet, apiGetAll, } from './apiClient'

export function getDocuments(query = '') {
  return apiGet(`documents${query}`)
}

export function getAllDocuments() {
  return apiGetAll('documents')
}