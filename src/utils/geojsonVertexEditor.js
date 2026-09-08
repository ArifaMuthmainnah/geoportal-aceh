// =====================================================
// SESI 6: UTILITAS EDIT TITIK PADA GEOJSON
// Dipakai EditMyDataset.jsx supaya user bisa menggeser
// titik yang salah langsung di peta, tanpa perlu upload
// ulang seluruh file shapefile.
// =====================================================

// Ubah semua koordinat di dalam GeoJSON jadi daftar "vertex"
// yang bisa digeser satu-satu di peta. Setiap vertex punya
// "path" — alamat persis di dalam struktur GeoJSON supaya bisa
// ditulis kembali lewat applyVertexMove().

export function flattenVertices(geojson) {

  const vertices = []

  if (!geojson || !Array.isArray(geojson.features)) {
    return vertices
  }

  geojson.features.forEach((feature, featureIndex) => {

    const geom = feature?.geometry
    if (!geom) return

    if (geom.type === 'Point') {
      vertices.push({
        id: `${featureIndex}-pt`,
        lat: geom.coordinates[1],
        lng: geom.coordinates[0],
        path: { featureIndex, type: 'Point' },
      })
    }

    if (geom.type === 'MultiPoint') {
      geom.coordinates.forEach((point, pointIndex) => {
        vertices.push({
          id: `${featureIndex}-mp-${pointIndex}`,
          lat: point[1], lng: point[0],
          path: { featureIndex, type: 'MultiPoint', pointIndex },
        })
      })
    }

    if (geom.type === 'LineString') {
      geom.coordinates.forEach((point, pointIndex) => {
        vertices.push({
          id: `${featureIndex}-ls-${pointIndex}`,
          lat: point[1], lng: point[0],
          path: { featureIndex, type: 'LineString', pointIndex },
        })
      })
    }

    if (geom.type === 'MultiLineString') {
      geom.coordinates.forEach((line, lineIndex) => {
        line.forEach((point, pointIndex) => {
          vertices.push({
            id: `${featureIndex}-mls-${lineIndex}-${pointIndex}`,
            lat: point[1], lng: point[0],
            path: { featureIndex, type: 'MultiLineString', lineIndex, pointIndex },
          })
        })
      })
    }

    if (geom.type === 'Polygon') {
      geom.coordinates.forEach((ring, ringIndex) => {
        ring.forEach((point, pointIndex) => {
          vertices.push({
            id: `${featureIndex}-pg-${ringIndex}-${pointIndex}`,
            lat: point[1], lng: point[0],
            path: { featureIndex, type: 'Polygon', ringIndex, pointIndex },
          })
        })
      })
    }

    if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((poly, polyIndex) => {
        poly.forEach((ring, ringIndex) => {
          ring.forEach((point, pointIndex) => {
            vertices.push({
              id: `${featureIndex}-mpg-${polyIndex}-${ringIndex}-${pointIndex}`,
              lat: point[1], lng: point[0],
              path: { featureIndex, type: 'MultiPolygon', polyIndex, ringIndex, pointIndex },
            })
          })
        })
      })
    }

  })

  return vertices

}

export function countVertices(geojson) {
  return flattenVertices(geojson).length
}

// Tulis posisi vertex baru kembali ke GeoJSON (tidak mengubah
// objek asli — mengembalikan salinan baru).

export function applyVertexMove(geojson, path, newLat, newLng) {

  const clone = JSON.parse(JSON.stringify(geojson))
  const feature = clone.features?.[path.featureIndex]

  if (!feature || !feature.geometry) {
    return clone
  }

  const geom = feature.geometry

  if (path.type === 'Point') {
    geom.coordinates = [newLng, newLat]
  } else if (path.type === 'MultiPoint') {
    geom.coordinates[path.pointIndex] = [newLng, newLat]
  } else if (path.type === 'LineString') {
    geom.coordinates[path.pointIndex] = [newLng, newLat]
  } else if (path.type === 'MultiLineString') {
    geom.coordinates[path.lineIndex][path.pointIndex] = [newLng, newLat]
  } else if (path.type === 'Polygon') {
    geom.coordinates[path.ringIndex][path.pointIndex] = [newLng, newLat]
  } else if (path.type === 'MultiPolygon') {
    geom.coordinates[path.polyIndex][path.ringIndex][path.pointIndex] = [newLng, newLat]
  }

  return clone

}