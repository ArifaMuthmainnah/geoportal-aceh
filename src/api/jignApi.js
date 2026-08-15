import { apiGet } from './apiClient'

export function getOwners() {
  return apiGet('owners')
}