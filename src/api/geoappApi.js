import {
  apiGet,
  apiGetAll,
  authPost,
  authDelete,
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


// =====================================================
// TOTAL GEOAPP SEBENARNYA
// =====================================================

export async function getGeoappTotalCount() {

  try {

    const response =
      await apiGet('geoapps?page=1&page_size=1')

    const total =
      Number(
        response?.total ??
        response?.count ??
        response?.meta?.total_count ??
        response?.pagination?.total ??
        0
      )

    if (total > 0) {
      return total
    }

  } catch (err) {

    console.error('Gagal mengambil total geoapp:', err)

  }

  return 0

}


// =====================================================
// SEMUA GEOAPP UNTUK ADMIN (TERMASUK YANG DISEMBUNYIKAN)
// =====================================================

export async function getAdminGeoappsRaw() {

  return apiGetAll('admin/geoapps')

}

// =====================================================
// EDIT TAMPILAN APLIKASI DARI API LAMA (LOKAL SAJA)
// =====================================================

export function updateGeoapp(pk, data) {

  return authPost('/proxy/overrides', {
    resource_type: 'geoapp',
    external_id: pk,
    title_override: data.title,
    abstract_override: data.abstract,
    category_override: data.category,
  })

}

// =====================================================
// SEMBUNYIKAN APLIKASI DARI API LAMA (LOKAL SAJA)
// =====================================================

export function hideGeoapp(pk) {

  return authPost('/proxy/overrides', {
    resource_type: 'geoapp',
    external_id: pk,
    is_hidden: true,
  })

}

// =====================================================
// PULIHKAN APLIKASI API LAMA
// =====================================================

export function restoreGeoapp(pk) {

  return authDelete(
    `/proxy/overrides/geoapp/${pk}`
  )

}