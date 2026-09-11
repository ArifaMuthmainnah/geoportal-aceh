import {
  authGet,
  authPatch,
  authDelete,
  authPostFile,
  authPatchFile,
} from './apiClient'

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

export async function getMyDatasets() {
  const response = await authGet('/datasets/mine')
  return response?.datasets || []
}

export async function getMyDatasetsByType(resourceType) {
  const response = await authGet(`/datasets/mine/${resourceType}`)
  return response?.datasets || []
}

export async function getMyDatasetDetail(id) {
  const response = await authGet(`/datasets/mine/detail/${id}`)
  return response?.dataset || null
}

export async function getAllOwnDatasets() {
  const response = await authGet('/datasets')
  return response?.datasets || []
}

export async function getAdminDatasetsByType(resourceType) {
  const response = await authGet(`/datasets/admin/${resourceType}`)
  return response?.datasets || []
}

export async function getAdminDatasetDetail(id) {
  const response = await authGet(`/datasets/admin/detail/${id}`)
  return response?.dataset || null
}

export async function getAllVisibleDatasets() {
  const response = await authGet('/datasets/all-visible')
  return response?.datasets || []
}

export async function getDatasetViewDetail(id) {
  const response = await authGet(`/datasets/view/${id}`)
  return response?.dataset || null
}

export function updateMyDataset(id, data) {
  return authPatch(`/datasets/${id}`, data)
}

export function deleteMyDataset(id) {
  return authDelete(`/datasets/${id}`)
}

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