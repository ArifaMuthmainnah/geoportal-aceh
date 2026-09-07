import {
  authGet,
  authPatch,
  authDelete,
  authPostFile,
  authPatchFile,
} from './apiClient'


// =====================================================
// UPLOAD RESOURCE (MENDUKUNG BANYAK FILE)
// =====================================================

export function uploadMyDataset({
  files,
  thumbnailFile,
  title,
  abstract,
  resourceType = 'dataset',
  subType,
  category,
  keywords,
  externalUrl,
  extraMetadata,
}) {

  const formData = new FormData()

  if (Array.isArray(files)) {
    files.forEach((file) => formData.append('base_file', file))
  }

  if (thumbnailFile) {
    formData.append('thumbnail', thumbnailFile)
  }

  formData.append('title', title || '')
  formData.append('abstract', abstract || '')
  formData.append('resource_type', resourceType || 'dataset')
  formData.append('category', category || '')
  formData.append('keywords', keywords || '')

  if (subType) {
    formData.append('sub_type', subType)
  }

  if (externalUrl && externalUrl.trim()) {
    formData.append('external_url', externalUrl.trim())
  }

  if (extraMetadata) {
    formData.append('extra_metadata', extraMetadata)
  }

  return authPostFile('/datasets', formData)

}


// =====================================================
// SESI 6: EDIT + GANTI FILE SEKALIGUS
// Dipakai EditMyDataset.jsx ketika user memilih file baru
// (shapefile atau assets) saat mengedit data — file lama
// otomatis dihapus & diganti yang baru di backend.
// =====================================================

export function updateMyDatasetWithFiles(id, {
  title,
  abstract,
  category,
  keywords,
  externalUrl,
  extraMetadata,
  subType,
  files,
  thumbnailFile,
  removeFiles,
  // SESI 10 (FIX): resourceType sekarang juga boleh diubah oleh
  // PEMILIK data (operator), bukan admin saja — backend hanya
  // mengizinkannya selama data belum dipublikasikan (lihat
  // EditMyDataset.jsx). isPublished tetap HANYA berlaku untuk
  // admin (backend mengabaikannya untuk operator biasa) — dipakai
  // halaman Edit Data admin (EditDatasetAdmin.jsx) supaya status
  // publish bisa diubah sekalian saat mengganti file, tanpa perlu
  // request terpisah.
  resourceType,
  isPublished,
}) {

  const formData = new FormData()

  if (title !== undefined) formData.append('title', title)
  if (abstract !== undefined) formData.append('abstract', abstract)
  if (category !== undefined) formData.append('category', category)
  if (keywords !== undefined) formData.append('keywords', keywords)
  if (externalUrl !== undefined) formData.append('external_url', externalUrl || '')
  if (extraMetadata !== undefined && extraMetadata !== null) formData.append('extra_metadata', extraMetadata)
  if (subType !== undefined) formData.append('sub_type', subType)
  if (removeFiles) formData.append('remove_files', 'true')
  if (resourceType !== undefined) formData.append('resource_type', resourceType)
  if (isPublished !== undefined) formData.append('is_published', isPublished ? 'true' : 'false')

  if (Array.isArray(files)) {
    files.forEach((file) => formData.append('base_file', file))
  }

  if (thumbnailFile) {
    formData.append('thumbnail', thumbnailFile)
  }

  return authPatchFile(`/datasets/${id}`, formData)

}


// =====================================================
// DATA MILIK USER
// =====================================================

export async function getMyDatasets() {
  const response = await authGet('/datasets/mine')
  return response?.datasets || []
}

export async function getMyDatasetsByType(resourceType) {
  const response = await authGet(`/datasets/mine/${resourceType}`)
  return response?.datasets || []
}


// =====================================================
// DETAIL MILIK SENDIRI (TIDAK PERLU PUBLISHED) — #15
// =====================================================

export async function getMyDatasetDetail(id) {
  const response = await authGet(`/datasets/mine/detail/${id}`)
  return response?.dataset || null
}


// =====================================================
// SEMUA DATASET ADMIN
// =====================================================

export async function getAllOwnDatasets() {
  const response = await authGet('/datasets')
  return response?.datasets || []
}

export async function getAdminDatasetsByType(resourceType) {
  const response = await authGet(`/datasets/admin/${resourceType}`)
  return response?.datasets || []
}


// =====================================================
// DETAIL UNTUK ADMIN (TIDAK PERLU PUBLISHED) — #15
// =====================================================

export async function getAdminDatasetDetail(id) {
  const response = await authGet(`/datasets/admin/detail/${id}`)
  return response?.dataset || null
}


// =====================================================
// SESI 6: SEMUA DATA (ADMIN + OPERATOR, MODE LIHAT SAJA)
// =====================================================

export async function getAllVisibleDatasets() {
  const response = await authGet('/datasets/all-visible')
  return response?.datasets || []
}

export async function getDatasetViewDetail(id) {
  const response = await authGet(`/datasets/view/${id}`)
  return response?.dataset || null
}


// =====================================================
// UPDATE / DELETE
// =====================================================

export function updateMyDataset(id, data) {
  return authPatch(`/datasets/${id}`, data)
}

export function deleteMyDataset(id) {
  return authDelete(`/datasets/${id}`)
}


// =====================================================
// DATASET PUBLIK
// =====================================================

export async function getPublishedDatasets() {
  const response = await authGet('/datasets/published')
  return response?.datasets || []
}

export async function getPublishedByType(resourceType) {
  const response = await authGet(`/datasets/public/${resourceType}`)
  return response?.datasets || []
}

export async function getPublishedDetail(id) {
  const response = await authGet(`/datasets/public/detail/${id}`)
  return response?.dataset || null
}