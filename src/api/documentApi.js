import {
  apiGet,
  apiGetAll,
  authPost,
  authDelete,
} from './apiClient'

export function getDocuments(query = '') {
  return apiGet(`documents${query}`)
}

export function getAllDocuments() {
  return apiGetAll('documents')
}

export function getDocumentDetail(id) {
  return apiGet(`documents/${id}`)
}

export async function getAdminDocumentsRaw() {
  return apiGetAll('admin/documents')
}

export async function getAdminDocumentDetailRaw(id) {
  const response = await apiGet(`admin/documents/${id}`)
  return response?.document || response
}

export function updateDocument(pk, data) {

  return authPost('/proxy/overrides', {
    resource_type: 'document',
    external_id: pk,
    title_override: data.title,
    abstract_override: data.abstract,
    category_override: data.category,
    keywords_override: data.keywords || null,
    extra_metadata_override: data.extraMetadata || null,
  })

}

export function hideDocument(pk) {

  return authPost('/proxy/overrides', {
    resource_type: 'document',
    external_id: pk,
    is_hidden: true,
  })

}

export function restoreDocument(pk) {
  return authDelete(`/proxy/overrides/document/${pk}`)
}