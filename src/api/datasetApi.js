import {
  apiGet,
  apiGetAll,
  apiPatch,
  apiDelete,
} from './apiClient'


// =====================================================
// DATASET LIST
// =====================================================

export function getDatasets(query = '') {
  return apiGet(`datasets${query}`)
}


// =====================================================
// LATEST DATASET
// =====================================================

export function getLatestDatasets() {
  return apiGet(
    'datasets?page=1&page_size=3'
  )
}


// =====================================================
// ALL DATASETS
// =====================================================

export function getAllDatasets() {
  return apiGetAll('datasets')
}


// =====================================================
// DETAIL
// =====================================================

export function getDatasetDetail(id) {
  return apiGet(
    `datasets/${id}`
  )
}


// =====================================================
// UPDATE DATASET METADATA
// =====================================================

export function updateDataset(
  id,
  data
) {

  return apiPatch(
    `datasets/${id}`,
    data
  )
}


// =====================================================
// DELETE DATASET
// =====================================================

export function deleteDataset(id) {

  return apiDelete(
    `resources/${id}/delete`
  )
}


// =====================================================
// GEOSERVER
// =====================================================

const GEO_SERVER_URL =
  'https://sig.acehprov.go.id/geoserver/ows'

// =====================================================
// DATASET FEATURES / GEOJSON
// =====================================================

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


// =====================================================
// ATTRIBUTES
// =====================================================

export async function getDatasetAttributes(
  alternate
) {

  if (!alternate) {
    return []
  }


  const params =
    new URLSearchParams({
      service: 'WFS',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: alternate,
      outputFormat:
        'application/json',
      maxFeatures: '1',
    })


  const url =
    `${GEO_SERVER_URL}?${params.toString()}`


  const response =
    await fetch(url)


  if (!response.ok) {

    throw new Error(
      'Gagal mengambil atribut dataset'
    )
  }


  const data =
    await response.json()


  const featureProperties =
    data.features?.[0]?.properties


  if (
    featureProperties &&
    Object.keys(featureProperties).length > 0
  ) {

    return Object.keys(
      featureProperties
    ).map((name) => ({

      name,

      label:
        'N/A',

      description:
        'N/A',

    }))

  }


  if (
    Array.isArray(data.fields) &&
    data.fields.length > 0
  ) {

    return data.fields.map(
      (field) => ({

        name:
          field.name ||
          field.attribute ||
          '-',

        label:
          field.label ||
          'N/A',

        description:
          field.description ||
          'N/A',

      })
    )

  }


  try {

    const schemaParams =
      new URLSearchParams({

        service: 'WFS',

        version: '1.0.0',

        request:
          'DescribeFeatureType',

        typeName:
          alternate,

        outputFormat:
          'application/json',

      })


    const schemaUrl =
      `${GEO_SERVER_URL}?${schemaParams.toString()}`


    const schemaResponse =
      await fetch(schemaUrl)


    if (!schemaResponse.ok) {
      throw new Error(
        'Schema tidak dapat dimuat'
      )
    }


    const schemaData =
      await schemaResponse.json()


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

  } catch (error) {

    console.error(
      'Gagal mengambil schema:',
      error
    )

  }


  return []
}
