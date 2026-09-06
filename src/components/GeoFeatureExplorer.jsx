import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// =====================================================
// SESI 6 (revisi): PETA "HERO" DI ATAS TAB INFO/LOCATION/
// ATTRIBUTES/ASSETS — dibuat semirip mungkin dengan tampilan
// embed_url data API lama: peta interaktif + panel info di
// kanan atas yang menampilkan Lat/Long dan SEMUA atribut fitur
// yang diklik. Tab Location TETAP statis seperti sebelumnya —
// komponen ini TIDAK dipakai di sana.
// =====================================================

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
  }, [geojson, map])

  return null

}

function labelFor(key, attributeMeta) {
  const found = attributeMeta.find((a) => a.name === key)
  if (found && found.label && found.label.trim()) return found.label.trim()
  return key
}

const featureStyle = { color: '#0b5cab', weight: 3, fillColor: '#3a6ea5', fillOpacity: 0.25 }

function pointToLayer(feature, latlng) {
  return L.circleMarker(latlng, { radius: 6, color: '#0b5cab', weight: 2, fillColor: '#1677c8', fillOpacity: 0.9 })
}

function GeoFeatureExplorer({ geojson, title, attributes = [] }) {

  const [selected, setSelected] = useState(null) // { properties, latlng }
  const [panelOpen, setPanelOpen] = useState(true)

  const attributeMeta = Array.isArray(attributes) ? attributes : []

  function onEachFeature(feature, layer) {
    layer.on('click', (event) => {
      setSelected({ properties: feature.properties || {}, latlng: event.latlng })
      setPanelOpen(true)
    })
  }

  if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
    return null
  }

  const entries = selected
    ? Object.entries(selected.properties).filter(([key]) => key !== '_record')
    : []

  return (

    <div className="dataset-map-wrapper geo-explorer">

      <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GeoJSON data={geojson} style={featureStyle} pointToLayer={pointToLayer} onEachFeature={onEachFeature} />
        <FitToGeoJson geojson={geojson} />
      </MapContainer>

      {panelOpen && (

        <div className="geo-explorer-panel">

          <div className="geo-explorer-panel-row geo-explorer-panel-title">
            <span className="geo-explorer-pin">📍</span>
            <strong>{title}</strong>
            <button type="button" className="geo-explorer-close" onClick={() => setPanelOpen(false)} aria-label="Tutup panel">×</button>
          </div>

          <div className="geo-explorer-panel-row geo-explorer-panel-coords">
            <span className="geo-explorer-pin">📍</span>
            <span>
              {selected
                ? `Lat: ${selected.latlng.lat.toFixed(3)} - Long: ${selected.latlng.lng.toFixed(3)}`
                : 'Klik titik/garis pada peta untuk melihat detail'}
            </span>
          </div>

          {entries.length > 0 && (
            <div className="geo-explorer-panel-body">
              {entries.map(([key, value]) => (
                <div className="geo-explorer-attr-row" key={key}>
                  <span>{labelFor(key, attributeMeta)}:</span>
                  <strong>{value === null || value === '' ? '-' : String(value)}</strong>
                </div>
              ))}
            </div>
          )}

        </div>

      )}

      {!panelOpen && (
        <button
          type="button"
          className="geo-explorer-reopen"
          onClick={() => setPanelOpen(true)}
          aria-label="Buka info panel"
        >
          📍
        </button>
      )}

    </div>

  )

}

export default GeoFeatureExplorer