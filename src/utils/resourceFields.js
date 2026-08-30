// =====================================================
// DEFINISI FIELD PER RESOURCE TYPE
// =====================================================
//
// Menentukan field metadata tambahan apa yang perlu
// diisi user tergantung jenis resource yang dipilih,
// supaya halaman detail (dataset/aplikasi) punya data
// selengkap yang ditampilkan untuk data dari API lama.
//
// =====================================================

export const RESOURCE_TYPE_OPTIONS = [
  { value: 'dataset', label: 'Dataset' },
  { value: 'dashboard', label: 'Dashboard / Aplikasi' },
  { value: 'webgis', label: 'WebGIS' },
]

// =====================================================
// CONTENT TYPE YANG DIIZINKAN PER RESOURCE TYPE
// =====================================================

export const CONTENT_TYPE_OPTIONS_BY_RESOURCE = {
  dataset: ['file', 'link'],
  dashboard: ['link', 'file'],
  webgis: ['link', 'file'],
}

// =====================================================
// METADATA FIELDS TAMBAHAN (DATASET)
// =====================================================
//
// Field-field ini hanya relevan untuk resource_type
// 'dataset', supaya tab Info & Location di halaman
// detail dataset bisa terisi lengkap.
//
// =====================================================

// =====================================================
// DAFTAR KATEGORI TETAP (UNTUK DROPDOWN)
// =====================================================

export const CATEGORY_OPTIONS = [
  'society',
  'biota',
  'environment',
  'imagery_basemaps_earth_cover',
  'location',
  'boundaries',
  'planning_cadastre',
  'structure',
  'transportation',
  'utilities_communication',
  'economy',
  'farming',
  'health',
  'intelligence_military',
  'oceans',
  'inland_waters',
  'climatology_meteorology_atmosphere',
  'geoscientific_information',
  'elevation',
  'population',
]

export const DATASET_METADATA_FIELDS = [
  { key: 'region', label: 'Wilayah / Region', type: 'text', placeholder: 'mis: Kabupaten Aceh Besar' },
  { key: 'language', label: 'Bahasa', type: 'text', placeholder: 'Indonesia' },
  { key: 'srid', label: 'Sistem Koordinat (CRS)', type: 'text', placeholder: 'EPSG:4326' },
  { key: 'attribution', label: 'Atribusi', type: 'text' },
  { key: 'purpose', label: 'Tujuan', type: 'textarea' },
  { key: 'supplemental_information', label: 'Informasi Tambahan', type: 'textarea' },
  { key: 'constraints_other', label: 'Batasan Penggunaan', type: 'textarea' },
]

// =====================================================
// BOUNDING BOX FIELDS (DATASET)
// =====================================================

export const DATASET_BBOX_FIELDS = [
  { key: 'bbox_min_lon', label: 'Min Longitude' },
  { key: 'bbox_min_lat', label: 'Min Latitude' },
  { key: 'bbox_max_lon', label: 'Max Longitude' },
  { key: 'bbox_max_lat', label: 'Max Latitude' },
]

// =====================================================
// APAKAH RESOURCE TYPE INI BISA PUNYA ATTRIBUTE TABLE
// =====================================================

export function supportsAttributeTable(resourceType) {
  return resourceType === 'dataset'
}

// =====================================================
// BANGUN extra_metadata (STRING JSON) DARI FORM STATE
// =====================================================

export function buildExtraMetadata({
  resourceType,
  region,
  language,
  srid,
  attribution,
  purpose,
  supplementalInformation,
  constraintsOther,
  bbox,
  attributes,
}) {

  const metadata = {}

  if (resourceType === 'dataset') {

    if (region) metadata.region = region
    if (language) metadata.language = language
    if (srid) metadata.srid = srid
    if (attribution) metadata.attribution = attribution
    if (purpose) metadata.purpose = purpose
    if (supplementalInformation) metadata.supplemental_information = supplementalInformation
    if (constraintsOther) metadata.constraints_other = constraintsOther

    const hasBbox =
      bbox &&
      (bbox.minLon || bbox.minLat || bbox.maxLon || bbox.maxLat)

    if (hasBbox) {
      metadata.bbox = {
        minLon: Number(bbox.minLon) || 0,
        minLat: Number(bbox.minLat) || 0,
        maxLon: Number(bbox.maxLon) || 0,
        maxLat: Number(bbox.maxLat) || 0,
      }
    }

    if (Array.isArray(attributes) && attributes.length > 0) {
      metadata.attributes = attributes.filter(
        (attribute) => attribute.name && attribute.name.trim()
      )
    }

  }

  return Object.keys(metadata).length > 0
    ? JSON.stringify(metadata)
    : null

}

// =====================================================
// PARSE extra_metadata (STRING JSON) -> OBJECT AMAN
// =====================================================

export function parseExtraMetadata(raw) {

  if (!raw) {
    return {}
  }

  if (typeof raw === 'object') {
    return raw
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }

}