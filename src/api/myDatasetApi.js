import {
  authGet,
  authPatch,
  authDelete,
  authPostFile,
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