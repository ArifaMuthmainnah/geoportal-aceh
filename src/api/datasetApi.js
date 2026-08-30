import {
  apiGet,
  apiGetAll,
  authPost,
  authDelete,
} from './apiClient'

// =====================================================
// DATASET LIST
// =====================================================

export function getDatasets(query = '') {
  return apiGet(`datasets${query}`)
}

// =====================================================
// LATEST DATASET
// =====================================================

export function getLatestDatasets() {
  return apiGet('datasets?page=1&page_size=3')
}

// =====================================================
// ALL DATASETS
// =====================================================

export function getAllDatasets() {
  return apiGetAll('datasets')
}

// =====================================================
// TOTAL DATASET (untuk statistik, tidak dibatasi page_size kecil)
// =====================================================

export async function getDatasetTotal() {

  const response =
    await apiGet('datasets?page=1&page_size=1')

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

  // Fallback: kalau API tidak memberi field total,
  // hitung dari daftar lengkap (lebih lambat).
  const all = await getAllDatasets()

  return all.length

}


// =====================================================
// TOTAL DATASET SEBENARNYA (PAKAI META DARI API LAMA)
// =====================================================
//
// GeoNode API v2 biasanya mengembalikan field total di
// beberapa kemungkinan nama. Fungsi ini mencoba semua
// kemungkinan supaya statistik akurat, TANPA menarik
// seluruh data (page_size=1 saja, jauh lebih cepat).
//
// =====================================================

export async function getDatasetTotalCount() {

  try {

    const response =
      await apiGet('datasets?page=1&page_size=1')

    const total =
      Number(
        response?.total ??
        response?.count ??
        response?.meta?.total_count ??
        response?.pagination?.total ??
        response?.page_size_total ??
        0
      )

    if (total > 0) {
      return total
    }

  } catch (err) {

    console.error('Gagal mengambil total dataset:', err)

  }

  return 0

}


// =====================================================
// SEMUA DATASET UNTUK ADMIN (TERMASUK YANG DISEMBUNYIKAN)
// =====================================================

export async function getAdminDatasetsRaw() {

  const response =
    await apiGetAll('admin/datasets')

  return response

}

// =====================================================
// DETAIL DATASET
// =====================================================

export function getDatasetDetail(id) {
  return apiGet(`datasets/${id}`)
}

// =====================================================
// EDIT TAMPILAN DATASET DARI API LAMA (LOKAL SAJA)
// =====================================================
//
// PENTING: ini TIDAK mengubah data di server Geoportal
// Aceh lama. Ini hanya menyimpan "override" tampilan di
// web kita sendiri (judul/abstract/kategori atau
// sembunyikan), disimpan di database kita.
//
// =====================================================

export function updateDataset(pk, data) {

  const payload = {
    resource_type: 'dataset',
    external_id: pk,
    title_override: data.title,
    abstract_override: data.abstract,
    category_override: data.category,
  }

  // is_hidden = kebalikan dari is_published, HANYA kalau
  // is_published memang dikirim (jangan sentuh saat cuma
  // edit title/abstract/category).
  if (data.is_published !== undefined) {
    payload.is_hidden = !data.is_published
  }

  return authPost('/proxy/overrides', payload)

}

// =====================================================
// SEMBUNYIKAN DATASET DARI API LAMA (LOKAL SAJA)
// =====================================================
//
// "Hapus" di sini artinya disembunyikan dari web kita.
// Data asli di Geoportal Aceh lama TIDAK terhapus.
//
// =====================================================

export function deleteDataset(pk) {

  return authPost('/proxy/overrides', {
    resource_type: 'dataset',
    external_id: pk,
    is_hidden: true,
  })

}

// =====================================================
// PULIHKAN DATASET API LAMA (batalkan override)
// =====================================================

export function restoreDataset(pk) {

  return authDelete(
    `/proxy/overrides/dataset/${pk}`
  )

}

// =====================================================
// GEOSERVER
// =====================================================

const GEO_SERVER_URL =
  'https://sig.acehprov.go.id/geoserver/ows'

// =====================================================
// HELPER: REQUEST GEOSERVER
// =====================================================

async function fetchGeoServer(params) {
  const url =
    `${GEO_SERVER_URL}?${params.toString()}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `GeoServer error: ${response.status}`
    )
  }

  return response.json()
}

// =====================================================
// ATTRIBUTES
// =====================================================

export async function getDatasetAttributes(alternate) {
  if (!alternate) {
    return []
  }

  try {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: alternate,
      outputFormat: 'application/json',
      maxFeatures: '1',
    })

    const data =
      await fetchGeoServer(params)

    const featureProperties =
      data?.features?.[0]?.properties

    if (
      featureProperties &&
      Object.keys(featureProperties).length > 0
    ) {
      return Object.keys(
        featureProperties
      ).map((name) => ({
        name,
        label: 'N/A',
        description: 'N/A',
      }))
    }

    if (
      Array.isArray(data?.fields) &&
      data.fields.length > 0
    ) {
      return data.fields.map(
        (field) => ({
          name:
            field.name ||
            field.attribute ||
            field.field_name ||
            '-',

          label:
            field.label ||
            field.title ||
            'N/A',

          description:
            field.description ||
            field.desc ||
            'N/A',
        })
      )
    }
  } catch (error) {
    console.warn(
      'GetFeature GeoServer gagal:',
      error
    )
  }

  try {
    const schemaParams =
      new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'DescribeFeatureType',
        typeName: alternate,
        outputFormat: 'application/json',
      })

    const schemaData =
      await fetchGeoServer(
        schemaParams
      )

    const properties =
      schemaData
        ?.featureTypes?.[0]
        ?.properties

    if (
      Array.isArray(properties) &&
      properties.length > 0
    ) {
      return properties.map(
        (property) => ({
          name:
            property.name ||
            property.localName ||
            '-',

          label:
            property.label ||
            'N/A',

          description:
            property.description ||
            'N/A',
        })
      )
    }

    const schemaProperties =
      schemaData
        ?.featureType
        ?.properties

    if (
      Array.isArray(schemaProperties) &&
      schemaProperties.length > 0
    ) {
      return schemaProperties.map(
        (property) => ({
          name:
            property.name ||
            property.localName ||
            '-',

          label:
            property.label ||
            'N/A',

          description:
            property.description ||
            'N/A',
        })
      )
    }

    if (
      Array.isArray(
        schemaData?.featureType
          ?.properties
      )
    ) {
      return schemaData.featureType.properties.map(
        (property) => ({
          name:
            property.name ||
            property.localName ||
            '-',

          label:
            property.label ||
            'N/A',

          description:
            property.description ||
            'N/A',
        })
      )
    }
  } catch (error) {
    console.error(
      'Gagal mengambil schema GeoServer:',
      error
    )
  }

  return []
}