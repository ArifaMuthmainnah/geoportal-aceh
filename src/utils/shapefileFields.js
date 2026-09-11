export async function extractDbfFieldNames(file) {

  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  if (buffer.byteLength < 32) {
    return []
  }

  const headerSize = view.getUint16(8, true)

  const decoder = new TextDecoder('ascii')

  const fields = []

  let offset = 32

  while (offset + 32 <= headerSize) {

    const byte = view.getUint8(offset)
    if (byte === 0x0d) {
      break
    }

    const nameBytes = new Uint8Array(buffer, offset, 11)
    const rawName = decoder.decode(nameBytes)
    const name = rawName.replace(/\0.*$/, '').trim()

    if (name) {
      fields.push(name)
    }

    offset += 32

  }

  return fields

}

export function findDbfFile(files) {

  if (!Array.isArray(files)) {
    return null
  }

  return (
    files.find((file) =>
      file.name.toLowerCase().endsWith('.dbf')
    ) || null
  )

}

function getExtension(file) {
  const name = file?.name || ''
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

export function findShapefileParts(files) {
  const list = Array.isArray(files) ? files : []
  return {
    shp: list.find((f) => getExtension(f) === 'shp') || null,
    shx: list.find((f) => getExtension(f) === 'shx') || null,
    dbf: list.find((f) => getExtension(f) === 'dbf') || null,
    prj: list.find((f) => getExtension(f) === 'prj') || null,
  }
}

export function hasAnyShapefilePart(files) {
  const { shp, shx, dbf, prj } = findShapefileParts(files)
  return Boolean(shp || shx || dbf || prj)
}

const SHAPE_TYPE_LABELS = {
  0: 'Null', 1: 'Titik (Point)', 3: 'Garis (PolyLine)', 5: 'Poligon (Polygon)',
  8: 'Multi Titik (MultiPoint)', 11: 'Titik (PointZ)', 13: 'Garis (PolyLineZ)',
  15: 'Poligon (PolygonZ)', 18: 'Multi Titik (MultiPointZ)', 21: 'Titik (PointM)',
  23: 'Garis (PolyLineM)', 25: 'Poligon (PolygonM)', 28: 'Multi Titik (MultiPointM)',
  31: 'MultiPatch',
}

export async function readShpHeader(file) {

  const buffer = await file.arrayBuffer()

  if (buffer.byteLength < 100) {
    return null
  }

  const view = new DataView(buffer)
  const fileCode = view.getInt32(0, false) // big-endian

  if (fileCode !== 9994) {
    return null // bukan file .shp yang valid
  }

  const shapeTypeCode = view.getInt32(32, true) // little-endian
  const minLon = view.getFloat64(36, true)
  const minLat = view.getFloat64(44, true)
  const maxLon = view.getFloat64(52, true)
  const maxLat = view.getFloat64(60, true)

  return {
    shapeTypeCode,
    geometryType: SHAPE_TYPE_LABELS[shapeTypeCode] || `Tipe ${shapeTypeCode}`,
    bbox: { minLon, minLat, maxLon, maxLat },
  }

}

function readPointPairs(view, start, numPoints) {
  const points = []
  let offset = start
  for (let i = 0; i < numPoints; i++) {
    const x = view.getFloat64(offset, true)
    const y = view.getFloat64(offset + 8, true)
    points.push([x, y])
    offset += 16
  }
  return points
}

function parseShapeRecordGeometry(view, start, shapeType) {

  if (shapeType === 0) return null // Null shape

  if ([1, 11, 21].includes(shapeType)) {
    const x = view.getFloat64(start + 4, true)
    const y = view.getFloat64(start + 12, true)
    return { type: 'Point', coordinates: [x, y] }
  }

  if ([8, 18, 28].includes(shapeType)) {
    const numPoints = view.getInt32(start + 36, true)
    const points = readPointPairs(view, start + 40, numPoints)
    return { type: 'MultiPoint', coordinates: points }
  }

  if ([3, 13, 23].includes(shapeType)) {

    const numParts = view.getInt32(start + 36, true)
    const numPoints = view.getInt32(start + 40, true)
    const partsStart = start + 44
    const parts = []
    for (let i = 0; i < numParts; i++) {
      parts.push(view.getInt32(partsStart + i * 4, true))
    }

    const pointsStart = partsStart + numParts * 4
    const allPoints = readPointPairs(view, pointsStart, numPoints)
    const lines = parts.map((startIdx, i) => {
      const endIdx = i + 1 < parts.length ? parts[i + 1] : numPoints
      return allPoints.slice(startIdx, endIdx)
    })

    return lines.length === 1
      ? { type: 'LineString', coordinates: lines[0] }
      : { type: 'MultiLineString', coordinates: lines }

  }

  if ([5, 15, 25].includes(shapeType)) {

    const numParts = view.getInt32(start + 36, true)
    const numPoints = view.getInt32(start + 40, true)
    const partsStart = start + 44
    const parts = []
    for (let i = 0; i < numParts; i++) {
      parts.push(view.getInt32(partsStart + i * 4, true))
    }

    const pointsStart = partsStart + numParts * 4
    const allPoints = readPointPairs(view, pointsStart, numPoints)
    const rings = parts.map((startIdx, i) => {
    const endIdx = i + 1 < parts.length ? parts[i + 1] : numPoints
      return allPoints.slice(startIdx, endIdx)
    })

    return rings.length === 1
      ? { type: 'Polygon', coordinates: [rings[0]] }
      : { type: 'MultiPolygon', coordinates: rings.map((ring) => [ring]) }

  }

  return null

}

export async function readShpGeometries(file, options = {}) {

  const maxFeatures = options.maxFeatures || 5000
  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  if (buffer.byteLength < 100) {
    return { type: 'FeatureCollection', features: [] }
  }

  const fileCode = view.getInt32(0, false)
  if (fileCode !== 9994) {
    return { type: 'FeatureCollection', features: [] }
  }

  const fileLengthWords = view.getInt32(24, false)
  const fileLengthBytes = fileLengthWords * 2
  const features = []
  let offset = 100
  let recordIndex = 0

  while (
    offset + 8 <= buffer.byteLength &&
    offset + 8 <= fileLengthBytes &&
    features.length < maxFeatures
  ) {

    const contentLengthWords = view.getInt32(offset + 4, false) // big-endian
    const contentLengthBytes = contentLengthWords * 2
    const contentStart = offset + 8
    const nextOffset = contentStart + contentLengthBytes

    if (contentLengthBytes < 4 || contentStart + 4 > buffer.byteLength) {
      break
    }

    const shapeType = view.getInt32(contentStart, true)

    try {
      const geometry = parseShapeRecordGeometry(view, contentStart, shapeType)
      if (geometry) {
        features.push({ type: 'Feature', properties: { _record: recordIndex }, geometry })
      }
    } catch (err) {
      // Record korup/tidak dikenali -> lewati, lanjut ke record berikutnya
    }

    recordIndex += 1
    offset = nextOffset

    if (contentLengthBytes <= 0) break

  }

  return { type: 'FeatureCollection', features }

}

export async function readDbfRecords(file, options = {}) {

  const maxRecords = options.maxRecords || 5000
  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  if (buffer.byteLength < 32) return []

  const recordCount = view.getUint32(4, true)
  const headerSize = view.getUint16(8, true)
  const recordSize = view.getUint16(10, true)
  const decoder = new TextDecoder('ascii')
  const fields = []
  let offset = 32

  while (offset + 32 <= headerSize) {
    const byte = view.getUint8(offset)
    if (byte === 0x0d) break
    const nameBytes = new Uint8Array(buffer, offset, 11)
    const rawName = decoder.decode(nameBytes)
    const name = rawName.replace(/\0.*$/, '').trim()
    const length = view.getUint8(offset + 16)
    if (name) fields.push({ name, length })
    offset += 32
  }

  const records = []
  let recordOffset = headerSize
  const total = Math.min(recordCount, maxRecords)

  for (let i = 0; i < total; i++) {

    if (recordOffset + recordSize > buffer.byteLength) break

    let fieldOffset = recordOffset + 1 // byte pertama = flag hapus
    const record = {}

    fields.forEach((field) => {
      const bytes = new Uint8Array(buffer, fieldOffset, field.length)
      const raw = decoder.decode(bytes).trim()
      record[field.name] = (raw === '' || raw.toLowerCase() === 'none') ? null : raw
      fieldOffset += field.length
    })

    records.push(record)
    recordOffset += recordSize

  }

  return records

}

export async function readDbfMeta(file) {

  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  if (buffer.byteLength < 32) {
    return { recordCount: 0, fields: [] }
  }

  const DBF_TYPE_LABELS = {
    C: 'Text', N: 'Angka', F: 'Angka Desimal', D: 'Tanggal', L: 'Ya/Tidak', M: 'Memo',
  }

  const recordCount = view.getUint32(4, true)
  const headerSize = view.getUint16(8, true)
  const decoder = new TextDecoder('ascii')
  const fields = []
  let offset = 32

  while (offset + 32 <= headerSize) {

    const byte = view.getUint8(offset)
    if (byte === 0x0d) break

    const nameBytes = new Uint8Array(buffer, offset, 11)
    const rawName = decoder.decode(nameBytes)
    const name = rawName.replace(/\0.*$/, '').trim()
    const typeChar = String.fromCharCode(view.getUint8(offset + 11))
    const length = view.getUint8(offset + 16)

    if (name) {
      fields.push({ name, type: DBF_TYPE_LABELS[typeChar] || typeChar, length })
    }

    offset += 32

  }

  return { recordCount, fields }

}

const KNOWN_GCS_EPSG = {
  'GCS_WGS_1984': 'EPSG:4326',
  'WGS_1984': 'EPSG:4326',
  'GCS_WGS_84': 'EPSG:4326',
}

function parsePrjText(text) {

  const trimmed = (text || '').trim()
  if (!trimmed) return null

  const projMatch = trimmed.match(/PROJCS\["([^"]+)"/i)
  const geogMatch = trimmed.match(/GEOGCS\["([^"]+)"/i)
  const projName = projMatch?.[1] || null
  const geogName = geogMatch?.[1] || null
  const lookupKey = (projName || geogName || '').trim()
  const knownEpsg = KNOWN_GCS_EPSG[lookupKey] || null
  const utmMatch = lookupKey.match(/UTM[_ ]Zone[_ ](\d+)([NS])/i)
  let srid = knownEpsg

  if (!srid && utmMatch) {
    const zone = Number(utmMatch[1])
    const hemisphere = utmMatch[2].toUpperCase()
    srid = hemisphere === 'S'
      ? `EPSG:327${String(zone).padStart(2, '0')}`
      : `EPSG:326${String(zone).padStart(2, '0')}`
  }

  return {
    raw: trimmed,
    name: projName || geogName || 'Tidak diketahui',
    srid: srid || (projName || geogName || 'Tidak diketahui'),
  }

}

export async function readPrjMeta(file) {
  const text = await file.text()
  return parsePrjText(text)
}

export async function buildGeoJsonFromShapefile(files, options = {}) {

  const { shp, dbf } = findShapefileParts(files)
  if (!shp) return null

  const geometryCollection = await readShpGeometries(shp, options)
  let attributeRecords = []

  if (dbf) {
    try {
      attributeRecords = await readDbfRecords(dbf, options)
    } catch (err) {
      console.error('Gagal membaca isi .dbf:', err)
    }
  }

  const features = geometryCollection.features.map((feature, index) => ({
    ...feature,
    properties: { ...(attributeRecords[index] || {}), _record: index },
  }))

  return { type: 'FeatureCollection', features }

}

const MAX_SHP_SIZE_FOR_GEOJSON = 3 * 1024 * 1024 // 3 MB

export async function extractShapefileMetadata(files) {

  const { shp, dbf, prj } = findShapefileParts(files)

  const result = {
    srid: '',
    bbox: null,
    attributes: [],
    geometryType: '',
    recordCount: 0,
    filesUsed: [],
    geojson: null,
    geojsonSkipped: false,
  }

  if (shp) {

    try {
      const shpMeta = await readShpHeader(shp)
      if (shpMeta) {
        result.bbox = shpMeta.bbox
        result.geometryType = shpMeta.geometryType
        result.filesUsed.push(shp.name)
      }
    } catch (err) {
      console.error('Gagal membaca .shp:', err)
    }

    if (shp.size <= MAX_SHP_SIZE_FOR_GEOJSON) {
      try {
        const geojson = await buildGeoJsonFromShapefile(files, { maxFeatures: 3000, maxRecords: 3000 })
        if (geojson && geojson.features.length > 0) {
          result.geojson = geojson
        }
      } catch (err) {
        console.error('Gagal membangun GeoJSON dari shapefile:', err)
      }
    } else {
      result.geojsonSkipped = true
    }

  }

  if (dbf) {
    try {
      const dbfMeta = await readDbfMeta(dbf)
      result.recordCount = dbfMeta.recordCount
      result.attributes = dbfMeta.fields.map((f) => ({
        name: f.name, label: '', description: '', type: f.type,
      }))
      result.filesUsed.push(dbf.name)
    } catch (err) {
      console.error('Gagal membaca .dbf:', err)
    }
  }

  if (prj) {
    try {
      const prjMeta = await readPrjMeta(prj)
      if (prjMeta) {
        result.srid = prjMeta.srid
        result.filesUsed.push(prj.name)
      }
    } catch (err) {
      console.error('Gagal membaca .prj:', err)
    }
  }

  return result

}