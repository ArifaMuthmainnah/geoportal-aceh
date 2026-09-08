import { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// =====================================================
// SESI 6: PETA PRATINJAU GEOJSON
// Dipakai di halaman Upload (pratinjau langsung setelah
// parsing shapefile) dan tab Location halaman detail
// (Dataset/Peta) untuk menampilkan geometri asli hasil
// upload — bukan cuma kotak bounding box statis.
// Pakai react-leaflet + leaflet yang SUDAH terpasang di
// project ini (dipakai juga oleh MapView.jsx/WebGIS).
// =====================================================

function FitToGeoJson({ geojson }) {

  const map = useMap()

  useEffect(() => {

    if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
      return
    }

    try {
      const layer = L.geoJSON(geojson)
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24] })
      }
    } catch (err) {
      console.error('Gagal menyesuaikan tampilan peta ke data:', err)
    }

  }, [geojson, map])

  return null

}

function onEachFeature(feature, layer) {

  const props = feature?.properties || {}
  const entries = Object.entries(props).filter(([key]) => key !== '_record')

  if (entries.length === 0) {
    layer.bindPopup(`Fitur #${(props._record ?? 0) + 1}`)
    return
  }

  const rows = entries
    .map(([key, value]) => (
      `<tr><td style="padding-right:8px;font-weight:600;">${key}</td><td>${value ?? '-'}</td></tr>`
    ))
    .join('')

  layer.bindPopup(`<table style="font-size:12px;">${rows}</table>`)

}

function pointToLayer(feature, latlng) {
  return L.circleMarker(latlng, {
    radius: 6, color: '#0b5cab', weight: 2, fillColor: '#3a6ea5', fillOpacity: 0.85,
  })
}

const featureStyle = {
  color: '#0b5cab',
  weight: 3,
  fillColor: '#3a6ea5',
  fillOpacity: 0.25,
}

function GeoJsonPreviewMap({ geojson, height = 320, notice }) {

  if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
    return null
  }

  return (

    <div className="dataset-location-image" style={{ padding: 0, overflow: 'hidden' }}>

      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={[0, 0]}
          zoom={2}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON
            data={geojson}
            style={featureStyle}
            pointToLayer={pointToLayer}
            onEachFeature={onEachFeature}
          />
          <FitToGeoJson geojson={geojson} />
        </MapContainer>
      </div>

      {notice && (
        <div style={{ padding: '8px 14px', fontSize: '12px', opacity: 0.75 }}>
          {notice}
        </div>
      )}

    </div>

  )

}

export default GeoJsonPreviewMap