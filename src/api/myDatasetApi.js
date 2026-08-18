import {
  authGet,
  authPatch,
  authDelete,
  authPostFile,
} from './apiClient'


// =====================================================
// UPLOAD DATASET
// =====================================================

export function uploadMyDataset({
  file,
  title,
  abstract,
  category,
  keywords,
}) {

  const formData = new FormData()

  formData.append('base_file', file)

  if (title) formData.append('title', title)
  if (abstract) formData.append('abstract', abstract)
  if (category) formData.append('category', category)
  if (keywords) formData.append('keywords', keywords)

  return authPostFile('/datasets', formData)

}


// =====================================================
// DATASET SAYA
// =====================================================

export async function getMyDatasets() {

  const response = await authGet('/datasets/mine')

  return response?.datasets || []

}


// =====================================================
// SEMUA DATASET (ADMIN)
// =====================================================

export async function getAllOwnDatasets() {

  const response = await authGet('/datasets')

  return response?.datasets || []

}


// =====================================================
// UPDATE / PUBLISH
// =====================================================

export function updateMyDataset(id, data) {
  return authPatch(`/datasets/${id}`, data)
}


// =====================================================
// DELETE
// =====================================================

export function deleteMyDataset(id) {
  return authDelete(`/datasets/${id}`)
}

// =====================================================
// DATASET PUBLIK (PUBLISHED) - UNTUK HOME & KATALOG
// =====================================================

export async function getPublishedDatasets() {

  const response = await authGet('/datasets/published')

  return response?.datasets || []

}