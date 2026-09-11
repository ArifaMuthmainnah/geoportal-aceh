import { authGet, authPatch, authPost } from './apiClient'

export function saveMapLayers(id, layers) {
  return authPatch(`/datasets/${id}/map-layers`, { layers })
}

export async function getMapLayersOverride(resourceType, externalId) {

  const response = await authGet(`/proxy/map-layers/${resourceType}/${externalId}`)
  const raw = response?.map_layers

  if (!raw) return []

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }

}

export function saveMapLayersOverride(resourceType, externalId, layers) {
  return authPost('/proxy/map-layers', {
    resource_type: resourceType,
    external_id: externalId,
    map_layers: JSON.stringify(layers || []),
  })
}