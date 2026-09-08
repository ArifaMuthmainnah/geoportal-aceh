import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { flattenVertices, applyVertexMove, countVertices } from '../utils/geojsonVertexEditor'

// Batas jumlah titik yang masih wajar diedit satu-satu di peta.
// Di atas ini, edit manual per titik dimatikan (disarankan upload
// ulang file shapefile kalau perlu ubah banyak titik sekaligus).
const MAX_EDITABLE_VERTICES = 1000

const vertexIcon = L.divIcon({
  className: 'vertex-edit-marker',
  iconSize: [14, 14],
})

function FitToGeoJson({ geojson }) {

  const map = useMap()

  useEffect(() => {
    if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) return
    try {
      const layer = L.geoJSON(geojson)
      const bounds = layer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] })
    } catch (err) {
      console.error('Gagal menyesuaikan tampilan peta:', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null

}

const baseStyle = { color: '#94a3b8', weight: 2, fillColor: '#cbd5e1', fillOpacity: 0.15, dashArray: '4 4' }

function GeoJsonVertexEditor({ geojson, onChange }) {

  const vertexCount = useMemo(() => countVertices(geojson), [geojson])
  const tooMany = vertexCount > MAX_EDITABLE_VERTICES
  const vertices = useMemo(() => (tooMany ? [] : flattenVertices(geojson)), [geojson, tooMany])

  function handleDragEnd(vertex, event) {
    const { lat, lng } = event.target.getLatLng()
    onChange(applyVertexMove(geojson, vertex.path, lat, lng))
  }

  if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
    return (
      <p style={{ fontSize: '13px', opacity: 0.7 }}>
        Belum ada data geometri untuk diedit. Unggah ulang file shapefile di atas kalau perlu menambahkan.
      </p>
    )
  }

  return (

    <div>

      {tooMany && (
        <div className="admin-alert" style={{ marginBottom: '10px' }}>
          Data ini punya {vertexCount} titik — terlalu banyak untuk diedit satu-satu di peta.
          Kalau ada kesalahan lokasi, unggah ulang file shapefile di atas untuk mengganti seluruh geometrinya.
        </div>
      )}

      <div className="dataset-map-wrapper" style={{ height: 420 }}>
        <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={geojson} style={baseStyle} />
          {vertices.map((vertex) => (
            <Marker
              key={vertex.id}
              position={[vertex.lat, vertex.lng]}
              draggable
              icon={vertexIcon}
              eventHandlers={{ dragend: (event) => handleDragEnd(vertex, event) }}
            />
          ))}
          <FitToGeoJson geojson={geojson} />
        </MapContainer>
      </div>

      {!tooMany && (
        <small style={{ display: 'block', marginTop: '8px', opacity: 0.75 }}>
          Geser titik biru untuk memperbaiki posisi yang salah. Perubahan baru tersimpan permanen
          setelah kamu klik <strong>"Simpan Perubahan"</strong> di bagian paling bawah halaman ini.
        </small>
      )}

    </div>

  )

}

export default GeoJsonVertexEditor