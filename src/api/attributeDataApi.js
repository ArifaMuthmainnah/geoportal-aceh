import {
  authGet,
  authPatch,
  authPost,
} from './apiClient'

import { getDatasetFeatures } from './datasetApi'

export { getDatasetFeatures }
export function featuresToRows(featureCollection) {

  const features =
    Array.isArray(featureCollection?.features)
      ? featureCollection.features
      : []

  return features.map((feature, index) => ({
    _key:
      feature?.id !== undefined && feature?.id !== null && feature?.id !== ''
        ? String(feature.id)
        : `row-${index}`,
    properties: { ...(feature?.properties || {}) },
    _hasGeometry: Boolean(feature?.geometry),
    _geometry: feature?.geometry || null,
  }))

}

export function rowsToFeatures(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    type: 'Feature',
    geometry: row._geometry || null,
    properties: { ...(row.properties || {}) },
  }))
}

export function saveOwnAttributeRows(id, rows) {
  return authPatch(`/datasets/${id}/attribute-data`, {
    features: rowsToFeatures(rows),
  })
}

export async function getAttributeDataOverride(resourceType, externalId) {
  const response = await authGet(`/proxy/attribute-data/${resourceType}/${externalId}`)
  return response?.attribute_data || null
}

export function saveAttributeDataOverride(resourceType, externalId, overrideData) {
  return authPost('/proxy/attribute-data', {
    resource_type: resourceType,
    external_id: externalId,
    attribute_data: JSON.stringify(
      overrideData || { edited: {}, deleted: [], added: [] }
    ),
  })
}

function parseOverride(overrideRaw) {

  if (!overrideRaw) {
    return { edited: {}, deleted: [], added: [] }
  }

  try {

    const parsed =
      typeof overrideRaw === 'string'
        ? JSON.parse(overrideRaw)
        : overrideRaw

    return {
      edited: parsed.edited || {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
      added: Array.isArray(parsed.added) ? parsed.added : [],
    }

  } catch {
    return { edited: {}, deleted: [], added: [] }
  }

}

export function mergeAttributeOverride(rawFeatureCollection, overrideRaw) {

  const baseRows = featuresToRows(rawFeatureCollection)
  const { edited, deleted, added } = parseOverride(overrideRaw)

  const rows = baseRows
    .filter((row) => !deleted.includes(row._key))
    .map((row) =>
      edited[row._key]
        ? { ...row, properties: { ...row.properties, ...edited[row._key] } }
        : row
    )

  added.forEach((row) => {
    rows.push({
      _key: row._key,
      properties: { ...(row.properties || {}) },
      _hasGeometry: false,
      _geometry: null,
      _isAdded: true,
    })
  })

  return rows

}

export function buildAttributeOverride(rawFeatureCollection, nextRows) {

  const baseRows = featuresToRows(rawFeatureCollection)
  const baseMap = new Map(baseRows.map((row) => [row._key, row]))

  const edited = {}
  const added = []
  const keptKeys = new Set()

  ;(nextRows || []).forEach((row) => {

    keptKeys.add(row._key)

    const original = baseMap.get(row._key)

    if (!original) {
      added.push({ _key: row._key, properties: row.properties })
      return
    }

    const diff = {}

    Object.keys(row.properties || {}).forEach((key) => {
      const oldVal = original.properties?.[key]
      const newVal = row.properties[key]
      if (String(oldVal ?? '') !== String(newVal ?? '')) {
        diff[key] = newVal
      }
    })

    if (Object.keys(diff).length > 0) {
      edited[row._key] = diff
    }

  })

  const deleted = baseRows
    .map((row) => row._key)
    .filter((key) => !keptKeys.has(key))

  return { edited, deleted, added }

}