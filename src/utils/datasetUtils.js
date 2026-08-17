// =========================================
// CATEGORY
// =========================================

export const CATEGORY_MAP = {
  // -----------------------------------------
  // Bahasa Indonesia / identifier API
  // -----------------------------------------

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


// =========================================
// CATEGORY MAPPING
// =========================================

export function mapCategory(identifier) {
  if (!identifier) {
    return 'Umum'
  }

  // Pastikan identifier berupa string
  const key = String(identifier).trim()

  // Cari mapping secara langsung
  if (CATEGORY_MAP[key]) {
    return CATEGORY_MAP[key]
  }

  // Cari tanpa membedakan huruf besar/kecil
  const normalizedKey = key.toLowerCase()

  const matchedKey = Object.keys(CATEGORY_MAP).find(
    (item) => item.toLowerCase() === normalizedKey
  )

  if (matchedKey) {
    return CATEGORY_MAP[matchedKey]
  }

  // Kalau API memberikan identifier
  // yang belum ada di mapping,
  // jangan tampilkan identifier Inggris mentah.
  return 'Umum'
}


// =========================================
// OWNER / INSTANSI
// =========================================

// Nama panjang dari API → nama singkat untuk UI
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


// =========================================
// NORMALIZE OWNER NAME
// =========================================

function normalizeOwnerName(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\./g, '')
    .trim()
}


// =========================================
// OWNER FULL NAME
// =========================================

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


// =========================================
// OWNER NAME
// =========================================

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


// =========================================
// OWNER AVATAR
// =========================================

export function getOwnerAvatar(owner) {
  return owner?.avatar || null
}


// =========================================
// DESCRIPTION
// =========================================

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