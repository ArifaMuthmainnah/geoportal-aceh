import { apiGet } from './apiClient'

export function getDatasets() {
  return apiGet('datasets')
}

export function getDatasetDetail(id) {
  return apiGet(`datasets/${id}`)
}
