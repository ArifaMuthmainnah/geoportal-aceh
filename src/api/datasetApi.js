import {
  apiGet,
  apiGetAll,
  authPost,
  authDelete,
} from './apiClient'

export function getDatasets(query = '') {
  return apiGet(`datasets${query}`)
}

export function getLatestDatasets() {
  return apiGet('datasets?page=1&page_size=3')
}

export function getAllDatasets() {
  return apiGetAll('datasets')
}

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
  const all = await getAllDatasets()

  return all.length

}

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

    console.error(
      'Gagal mengambil total dataset:',
      err
    )

  }

  return 0

}

export async function getAdminDatasetsRaw() {

  const response =
    await apiGetAll('admin/datasets')

  return response

}

export async function getAdminDatasetDetailRaw(id) {

  const response = await apiGet(`admin/datasets/${id}`)

  return response?.dataset || response

}

export function getDatasetDetail(id) {
  return apiGet(`datasets/${id}`)
}

export function updateDataset(pk, data) {

  const payload = {
    resource_type: 'dataset',
    external_id: pk,
    title_override: data.title,
    abstract_override: data.abstract,
    category_override: data.category,
    keywords_override: data.keywords || null,
    extra_metadata_override: data.extraMetadata || null,
  }

  if (data.is_published !== undefined) {
    payload.is_hidden = !data.is_published
  }

  return authPost('/proxy/overrides', payload)

}

export function deleteDataset(pk) {

  return authPost('/proxy/overrides', {
    resource_type: 'dataset',
    external_id: pk,
    is_hidden: true,
  })

}

export function restoreDataset(pk) {

  return authDelete(
    `/proxy/overrides/dataset/${pk}`
  )

}

const GEO_SERVER_URL =
  'https://sig.acehprov.go.id/geoserver/ows'

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

export async function getDatasetFeatures(
  alternate
) {

  if (!alternate) {
    throw new Error(
      'Nama layer GeoServer tidak tersedia.'
    )
  }

  const params =
    new URLSearchParams({
      service: 'WFS',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: alternate,
      outputFormat:
        'application/json',
    })

  const url =
    `${GEO_SERVER_URL}?${params.toString()}`

  const response =
    await fetch(url)

  if (!response.ok) {

    throw new Error(
      `Gagal mengambil layer GIS (${response.status})`
    )
  }

  return response.json()
}

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