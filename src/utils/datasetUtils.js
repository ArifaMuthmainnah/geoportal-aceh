export const CATEGORY_MAP = {
  society: 'Sosial',
  social: 'Sosial',
  biota: 'Biota',
  environment: 'Lingkungan',
  imagery_basemaps_earth_cover: 'Citra, Basemap & Tutupan Lahan',
  location: 'Lokasi',
  boundaries: 'Batas Wilayah',
  planning_cadastre: 'Perencanaan & Kadaster',
  planningCadastre: 'Perencanaan & Kadaster',
  structure: 'Struktur',
  transportation: 'Transportasi',
  utilities_communication:'Utilitas & Komunikasi',
  utilitiesCommunication: 'Utilitas & Komunikasi',
  economy: 'Ekonomi',
  farming: 'Pertanian',
  health: 'Kesehatan',
  intelligence_military: 'Intelijen & Militer',
  ocean: 'Kelautan',
  oceans: 'Kelautan',
  inland_water: 'Perairan Darat',
  inland_waters: 'Perairan Darat',
  inlandWaters: 'Perairan Darat',
  climatology_meteorology_atmosphere: 'Klimatologi, Meteorologi & Atmosfer',
  geoscientific_information: 'Informasi Geosains',
  geoscientificInformation: 'Informasi Geosains',
  elevation: 'Elevasi',
  population: 'Kependudukan',
}

export function mapCategory(identifier) {
  if (!identifier) {
    return 'Umum'
  }

  const key = String(identifier).trim()

  if (CATEGORY_MAP[key]) {
    return CATEGORY_MAP[key]
  }

  const normalizedKey = key.toLowerCase()
  const matchedKey = Object.keys(CATEGORY_MAP).find(
    (item) => item.toLowerCase() === normalizedKey
  )

  if (matchedKey) {
    return CATEGORY_MAP[matchedKey]
  }

  return key
}

export const RESOURCE_TYPE_LABELS = {
  dataset: 'Dataset',
  dashboard: 'Dashboard',
  application: 'Aplikasi',
  map: 'Peta',
  document: 'Dokumen',
  informasi: 'Informasi',
}

export function getResourceTypeLabel(resourceType) {
  return RESOURCE_TYPE_LABELS[resourceType] || 'Dataset'
}

export const OWNER_NAME_MAP = {
  'Badan Pusat Statistik BPS Republik Indonesia dan Badan Kependudukan dan Keluarga Berencana Nasional BKKBN':
    'BPS & BKKBN',

  'Badan Pusat Statistik BPS Republik Indonesia':
    'BPS RI',

  'Badan Kependudukan dan Keluarga Berencana Nasional':
    'BKKBN',

  'Dinas Pemberdayaan Masyarakat dan Gampong Aceh':
    'DPMG Aceh',

  'Badan Perencanaan Pembangunan Daerah Aceh':
    'Bappeda Aceh',

  'Badan Perencanaan Pembangunan Daerah':
    'Bappeda',

  'Dinas Kesehatan Aceh':
    'Dinkes Aceh',

  'Dinas Pendidikan Aceh':
    'Disdik Aceh',

  'Dinas Perhubungan Aceh':
    'Dishub Aceh',

  'Dinas Pekerjaan Umum dan Penataan Ruang Aceh':
    'PUPR Aceh',
}

function normalizeOwnerName(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\./g, '')
    .trim()
}

export function getOwnerFullName(owner) {
  if (!owner) {
    return 'Tidak diketahui'
  }

  const fullName = [
    owner.first_name,
    owner.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return (
    fullName ||
    owner.username ||
    'Tidak diketahui'
  )
}

export function getOwnerName(owner) {
  const fullName = getOwnerFullName(owner)

  const normalizedName =
    normalizeOwnerName(fullName)

  return (
    OWNER_NAME_MAP[fullName] ||
    OWNER_NAME_MAP[normalizedName] ||
    fullName
  )
}

export function getOwnerAvatar(owner) {
  return owner?.avatar || null
}

export function stripHtml(html) {
  if (!html) {
    return ''
  }

  const doc =
    new DOMParser().parseFromString(
      html,
      'text/html'
    )

  return doc.body.textContent || ''
}

export const INFORMASI_SEEN_STORAGE_KEYS = {
  berita: 'geoportal_informasi_seen_berita',
  agenda: 'geoportal_informasi_seen_agenda',
  pemberitahuan: 'geoportal_informasi_seen_pemberitahuan',
}

export function getInformasiSeenAt(subType) {
  try {
    const key = INFORMASI_SEEN_STORAGE_KEYS[subType]
    if (!key) return 0
    const raw = window.localStorage.getItem(key)
    return raw ? Number(raw) : 0
  } catch {
    return 0
  }
}

export function markInformasiSeenNow(subType) {
  try {
    const key = INFORMASI_SEEN_STORAGE_KEYS[subType]
    if (!key) return
    window.localStorage.setItem(key, String(Date.now()))
  } catch {
    // localStorage tidak tersedia (mode privat dll), abaikan saja
  }
}

export function hasUnseenInformasi(subType, items) {
  if (!Array.isArray(items) || items.length === 0) return false

  const seenAt = getInformasiSeenAt(subType)

  return items.some((item) => {
    const created = item?.created_at ? new Date(item.created_at).getTime() : 0
    return created > seenAt
  })
}