import {
  apiGet,
  apiGetAll,
  authPost,
  authDelete,
} from './apiClient'

export function getMaps(query = '') {
  return apiGet(`maps${query}`)
}

export function getAllMaps() {
  return apiGetAll('maps')
}

export function getMapDetail(id) {
  return apiGet(`maps/${id}`)
}

export async function getAdminMapsRaw() {
  return apiGetAll('admin/maps')
}

export async function getAdminMapDetailRaw(id) {
  const response = await apiGet(`admin/maps/${id}`)
  return response?.map || response
}

export function updateMap(pk, data) {

  return authPost('/proxy/overrides', {
    resource_type: 'map',
    external_id: pk,
    title_override: data.title,
    abstract_override: data.abstract,
    category_override: data.category,
    keywords_override: data.keywords || null,
    extra_metadata_override: data.extraMetadata || null,
  })

}

export function hideMap(pk) {

  return authPost('/proxy/overrides', {
    resource_type: 'map',
    external_id: pk,
    is_hidden: true,
  })

}

export function restoreMap(pk) {
  return authDelete(`/proxy/overrides/map/${pk}`)
}