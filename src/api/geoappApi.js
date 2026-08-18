import {
  apiGet,
  apiGetAll,
} from './apiClient'


// =====================================================
// GEOAPP LIST
// =====================================================

export function getGeoapps(query = '') {
  return apiGet(`geoapps${query}`)
}


// =====================================================
// ALL GEOAPPS
// =====================================================

export function getAllGeoapps() {
  return apiGetAll('geoapps')
}


// =====================================================
// DETAIL GEOAPP
// =====================================================

export function getGeoappDetail(id) {
  return apiGet(`geoapps/${id}`)
}