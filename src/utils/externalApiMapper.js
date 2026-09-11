function firstNonEmpty(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v
  }
  return ''
}

function extractKeywords(raw) {
  if (Array.isArray(raw)) {
    return raw.map((k) => (typeof k === 'string' ? k : k?.name || '')).filter(Boolean).join(', ')
  }
  if (typeof raw === 'string') return raw
  return ''
}

function extractBbox(data) {
  // GeoNode-style: extent.coords = [minLon, minLat, maxLon, maxLat]
  const coords = data?.extent?.coords || data?.bbox_polygon || data?.bbox
  if (Array.isArray(coords) && coords.length >= 4) {
    return {
      minLon: Number(coords[0]), minLat: Number(coords[1]),
      maxLon: Number(coords[2]), maxLat: Number(coords[3]),
    }
  }
  return null
}

export function mapExternalApiResponse(json) {

  const data =
    json?.dataset || json?.map || json?.document || json?.geoapp ||
    json?.data ||
    (Array.isArray(json?.results) ? json.results[0] : null) ||
    json || {}

  return {
    title: String(firstNonEmpty(data.title, data.judul, data.name, data.nama) || ''),
    abstract: String(firstNonEmpty(data.abstract, data.description, data.deskripsi) || ''),
    category: String(firstNonEmpty(data.category?.identifier, data.category, data.kategori) || ''),
    keywords: extractKeywords(data.keywords),
    thumbnailUrl: firstNonEmpty(data.thumbnail_url, data.thumbnail, data.image) || '',
    sourceLink: firstNonEmpty(data.detail_url, data.link, data.url) || '',
    srid: String(firstNonEmpty(data.srid, data.crs) || ''),
    language: String(firstNonEmpty(data.language) || ''),
    attribution: String(firstNonEmpty(data.attribution) || ''),
    purpose: String(firstNonEmpty(data.purpose) || ''),
    supplementalInformation: String(firstNonEmpty(data.supplemental_information) || ''),
    bbox: extractBbox(data),
    raw: data,
  }

}