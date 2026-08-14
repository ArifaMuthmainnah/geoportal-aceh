import { apiGet } from './apiClient'

export function getDatasets() {
  return apiGet('/datasets')
}