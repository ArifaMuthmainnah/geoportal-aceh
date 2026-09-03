// =====================================================
// DEFINISI FIELD PER RESOURCE TYPE
// =====================================================

export const RESOURCE_TYPE_OPTIONS = [
  { value: 'dataset', label: 'Dataset' },
  { value: 'dashboard', label: 'Dashboard / Aplikasi' },
  { value: 'map', label: 'Peta' },
  { value: 'document', label: 'Dokumen' },
  { value: 'informasi', label: 'Informasi' },
]

export const INFORMASI_SUBTYPE_OPTIONS = [
  { value: 'pemberitahuan', label: 'Pemberitahuan' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'berita', label: 'Berita' },
]

export const CATEGORY_OPTIONS = [
  'society', 'biota', 'environment', 'imagery_basemaps_earth_cover',
  'location', 'boundaries', 'planning_cadastre', 'structure',
  'transportation', 'utilities_communication', 'economy', 'farming',
  'health', 'intelligence_military', 'oceans', 'inland_waters',
  'climatology_meteorology_atmosphere', 'geoscientific_information',
  'elevation', 'population',
]

export const DATASET_BBOX_FIELDS = [
  { key: 'bbox_min_lon', label: 'Min Longitude' },
  { key: 'bbox_min_lat', label: 'Min Latitude' },
  { key: 'bbox_max_lon', label: 'Max Longitude' },
  { key: 'bbox_max_lat', label: 'Max Latitude' },
]

// =====================================================
// TAHAP A: FIELD WIZARD "CREATE DATASET"
// =====================================================

export const DATE_TYPE_OPTIONS = [
  { value: 'publication', label: 'Publication' },
  { value: 'creation', label: 'Creation' },
  { value: 'revision', label: 'Revision' },
]

export const GROUP_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'registered_members', label: 'Registered Members' },
]

export const LICENSE_OPTIONS = [
  { value: '', label: 'Belum ditentukan' },
  { value: 'cc-by', label: 'Creative Commons Attribution (CC-BY)' },
  { value: 'cc-by-sa', label: 'Creative Commons Attribution-ShareAlike (CC-BY-SA)' },
  { value: 'cc-by-nc', label: 'Creative Commons Attribution-NonCommercial (CC-BY-NC)' },
  { value: 'cc0', label: 'CC0 (Public Domain)' },
  { value: 'proprietary', label: 'Proprietary / Hak Cipta Instansi' },
]

// =====================================================
// RESOURCE TYPE YANG PUNYA FITUR TERTENTU
// =====================================================

export function supportsAttributeTable(resourceType) {
  return resourceType === 'dataset'
}

export function supportsBboxLocation(resourceType) {
  return resourceType === 'dataset' || resourceType === 'map'
}

export function supportsLinkedResources(resourceType) {
  return resourceType === 'map'
}

export function supportsEmbedUrl(resourceType) {
  return resourceType === 'dataset' || resourceType === 'map' || resourceType === 'dashboard'
}

export function supportsExtraMetadataForm(resourceType) {
  return ['dataset', 'map', 'document'].includes(resourceType)
}

// =====================================================
// BANGUN extra_metadata (STRING JSON) DARI FORM STATE
// =====================================================

export function buildExtraMetadata({
  resourceType,
  region, language, srid, attribution, purpose,
  supplementalInformation, constraintsOther,
  bbox, attributes, embedUrl, linkedResources,
  dateType, publicationDate, group, license,
}) {

  const metadata = {}

  if (supportsExtraMetadataForm(resourceType)) {

    if (region) metadata.region = region
    if (language) metadata.language = language
    if (srid) metadata.srid = srid
    if (attribution) metadata.attribution = attribution
    if (purpose) metadata.purpose = purpose
    if (supplementalInformation) metadata.supplemental_information = supplementalInformation
    if (constraintsOther) metadata.constraints_other = constraintsOther

    if (supportsBboxLocation(resourceType)) {
      const hasBbox = bbox && (bbox.minLon || bbox.minLat || bbox.maxLon || bbox.maxLat)
      if (hasBbox) {
        metadata.bbox = {
          minLon: Number(bbox.minLon) || 0,
          minLat: Number(bbox.minLat) || 0,
          maxLon: Number(bbox.maxLon) || 0,
          maxLat: Number(bbox.maxLat) || 0,
        }
      }
    }

    if (resourceType === 'dataset' && Array.isArray(attributes) && attributes.length > 0) {
      metadata.attributes = attributes.filter((a) => a.name && a.name.trim())
    }

  }

  if (supportsEmbedUrl(resourceType) && embedUrl && embedUrl.trim()) {
    metadata.embed_url = embedUrl.trim()
  }

  if (supportsLinkedResources(resourceType) && Array.isArray(linkedResources) && linkedResources.length > 0) {
    metadata.linked_resources = linkedResources.filter((r) => r && r.trim())
  }

  // Field khusus wizard "Create Dataset" (Tahap A)
  if (dateType) metadata.date_type = dateType
  if (publicationDate) metadata.publication_date = publicationDate
  if (group) metadata.group = group
  if (license) metadata.license = license

  return Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null

}

export function parseExtraMetadata(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return {} }
}