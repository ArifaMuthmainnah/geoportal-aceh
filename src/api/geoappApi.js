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
// SESI 11 (FIX): DETAIL APLIKASI API LAMA UNTUK ADMIN
// =====================================================

export async function getAdminGeoappDetailRaw(id) {

  const response = await apiGet(`admin/geoapps/${id}`)

  return response?.geoapp || response

}

// =====================================================
// EDIT TAMPILAN APLIKASI DARI API LAMA (LOKAL SAJA)
// =====================================================
//
// SESI 11: sekarang juga mengirim keywords & extraMetadata
// (format SAMA seperti buildExtraMetadata() untuk data
// upload-an), supaya form Edit Data untuk data API bisa
// selengkap form Edit data upload-an.
//
// =====================================================

export function updateGeoapp(pk, data) {

  return authPost('/proxy/overrides', {
    resource_type: 'geoapp',
    external_id: pk,
    title_override: data.title,
    abstract_override: data.abstract,
    category_override: data.category,
    keywords_override: data.keywords || null,
    extra_metadata_override: data.extraMetadata || null,
  })

}

export function hideGeoapp(pk) {

  return authPost('/proxy/overrides', {
    resource_type: 'geoapp',
    external_id: pk,
    is_hidden: true,
  })

}

export function restoreGeoapp(pk) {

  return authDelete(
    `/proxy/overrides/geoapp/${pk}`
  )

}