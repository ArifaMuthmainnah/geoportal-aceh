import {
  apiPostFile,
} from './apiClient'


// =====================================================
// UPLOAD DATASET
// =====================================================
//
// Endpoint GeoNode: /uploads
//
// Field yang umum dipakai GeoNode untuk upload:
// - base_file    (file utama, wajib)
// - title
// - abstract (deskripsi)
// - category
// - keywords
//
// Nama field pasti bisa berbeda tergantung versi
// API. Perlu dicek/disesuaikan setelah testing
// pertama.
//
// =====================================================

export function uploadDataset({
  file,
  title,
  abstract,
  category,
  keywords,
}) {

  const formData = new FormData()

  formData.append('base_file', file)

  if (title) {
    formData.append('title', title)
  }

  if (abstract) {
    formData.append('abstract', abstract)
  }

  if (category) {
    formData.append('category', category)
  }

  if (keywords) {
    formData.append('keywords', keywords)
  }

  return apiPostFile('uploads', formData)

}