import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Rectangle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// =====================================================
// SESI 7 (revisi besar): PETA "HERO" DI ATAS TAB INFO/
// LOCATION/ATTRIBUTES/ASSETS.
//
// Dibuat SEMIRIP MUNGKIN dengan tampilan iframe data API
// lama (lihat 06_peta_di_halaman_detail.jpeg):
//  - toolbar atas: ganti basemap, kotak pencarian, gear,
//    menu (hamburger)
//  - kontrol zoom custom (+ / − / 3D / ⋯) pojok kanan bawah
//  - mini peta ikhtisar pojok kiri bawah
//  - panel info di kanan yang SEKARANG TINGGINYA PENUH
//    (bukan cuma kartu kecil melayang setengah tinggi lagi)
//
// Dipakai untuk data upload sendiri (own-*) yang TIDAK
// punya embed_url — baik itu shapefile lengkap (geojson
// berisi fitur), maupun yang cuma py bounding box saja
// (tanpa rincian geometri per-fitur, misalnya dataset yang
// hanya menyimpan cakupan area).
// =====================================================

function IconPin({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.4" />
    </svg>
  )
}

function IconLayers({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function IconSettings({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconSearch({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconMenu({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  )
}

function IconPrinter({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

function IconFolder({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconInfo({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function IconGlobe({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

// =====================================================
// BASEMAP (2 pilihan, bisa ditoggle lewat ikon layers)
// =====================================================

const BASEMAPS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap',
  },
}

// =====================================================
// FIT KE GEOJSON / BBOX + TANGKAP INSTANCE PETA
// =====================================================

function MapReady({ onReady }) {
  const map = useMap()
  useEffect(() => { onReady(map) }, [map, onReady])
  return null
}

function FitBounds({ geojson, bbox }) {

  const map = useMap()

  useEffect(() => {

    try {

      if (geojson && Array.isArray(geojson.features) && geojson.features.length > 0) {
        const layer = L.geoJSON(geojson)
        const bounds = layer.getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24] })
          return
        }
      }

      if (bbox) {
        const bounds = L.latLngBounds([bbox.minLat, bbox.minLon], [bbox.maxLat, bbox.maxLon])
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] })
      }

    } catch (err) {
      console.error('Gagal menyesuaikan tampilan peta:', err)
    }

  }, [geojson, bbox, map])

  return null

}

function labelFor(key, attributeMeta) {
  const found = attributeMeta.find((a) => a.name === key)
  if (found && found.label && found.label.trim()) return found.label.trim()
  return key
}

const featureStyle = { color: '#0b5cab', weight: 3, fillColor: '#3a6ea5', fillOpacity: 0.25 }
const bboxOnlyStyle = { color: '#16325c', weight: 2, fillColor: '#16325c', fillOpacity: 0.05 }

function pointToLayer(feature, latlng) {
  return L.circleMarker(latlng, { radius: 6, color: '#0b5cab', weight: 2, fillColor: '#1677c8', fillOpacity: 0.9 })
}

function downloadGeojson(geojson, title) {
  try {
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'data').replace(/[^a-z0-9-_]+/gi, '_')}.geojson`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Gagal mengunduh GeoJSON:', err)
  }
}

function GeoFeatureExplorer({ geojson, bbox, title, attributes = [] }) {

  const hasFeatures = Boolean(geojson && Array.isArray(geojson.features) && geojson.features.length > 0)
  const hasBboxOnly = !hasFeatures && Boolean(bbox)

  const [selected, setSelected] = useState(null) // { properties, latlng }
  const [panelOpen, setPanelOpen] = useState(true)
  const [basemap, setBasemap] = useState('osm')
  const [leafletMap, setLeafletMap] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchError, setSearchError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const attributeMeta = Array.isArray(attributes) ? attributes : []

  // Indeks fitur + bounds masing-masing, dipakai kotak pencarian
  const featureIndex = useMemo(() => {
    if (!hasFeatures) return []
    return geojson.features.map((feature) => {
      let bounds = null
      try {
        const layer = L.geoJSON(feature)
        const b = layer.getBounds()
        if (b.isValid()) bounds = b
      } catch { bounds = null }
      return { feature, bounds }
    })
  }, [geojson, hasFeatures])

  function onEachFeature(feature, layer) {
    layer.on('click', (event) => {
      setSelected({ properties: feature.properties || {}, latlng: event.latlng })
      setPanelOpen(true)
    })
  }

  function handleBboxClick(event) {
    setSelected({ properties: { Informasi: 'Area cakupan data (bounding box)' }, latlng: event.latlng })
    setPanelOpen(true)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    setMenuOpen(false)

    const term = searchTerm.trim().toLowerCase()
    if (!term) return

    const match = featureIndex.find(({ feature }) => {
      const props = feature.properties || {}
      return Object.values(props).some((value) => String(value ?? '').toLowerCase().includes(term))
    })

    if (match && leafletMap) {
      if (match.bounds) leafletMap.fitBounds(match.bounds, { maxZoom: 15, padding: [40, 40] })
      const center = match.bounds ? match.bounds.getCenter() : leafletMap.getCenter()
      setSelected({ properties: match.feature.properties || {}, latlng: center })
      setPanelOpen(true)
      setSearchError('')
    } else {
      setSearchError('Fitur tidak ditemukan.')
    }
  }

  function handleResetView() {
    setMenuOpen(false)
    if (!leafletMap) return
    try {
      if (hasFeatures) {
        const layer = L.geoJSON(geojson)
        const bounds = layer.getBounds()
        if (bounds.isValid()) leafletMap.fitBounds(bounds, { padding: [24, 24] })
      } else if (bbox) {
        const bounds = L.latLngBounds([bbox.minLat, bbox.minLon], [bbox.maxLat, bbox.maxLon])
        if (bounds.isValid()) leafletMap.fitBounds(bounds, { padding: [24, 24] })
      }
    } catch (err) {
      console.error('Gagal mereset tampilan peta:', err)
    }
  }

  if (!hasFeatures && !hasBboxOnly) return null

  const entries = selected
    ? Object.entries(selected.properties).filter(([key]) => key !== '_record')
    : []

  const activeBasemap = BASEMAPS[basemap] || BASEMAPS.osm

  return (

    <div className="dataset-map-wrapper geo-explorer">

      <div className="geo-explorer-map-area">

        <MapContainer center={[4.5, 96.8]} zoom={7} zoomControl={false} style={{ height: '100%', width: '100%' }}>

          <TileLayer key={basemap} attribution={activeBasemap.attribution} url={activeBasemap.url} />

          {hasFeatures && (
            <GeoJSON
              data={geojson}
              style={featureStyle}
              pointToLayer={pointToLayer}
              onEachFeature={onEachFeature}
            />
          )}

          {hasBboxOnly && bbox && (
            <Rectangle
              bounds={[[bbox.minLat, bbox.minLon], [bbox.maxLat, bbox.maxLon]]}
              pathOptions={bboxOnlyStyle}
              eventHandlers={{ click: handleBboxClick }}
            />
          )}

          <FitBounds geojson={geojson} bbox={bbox} />
          <MapReady onReady={setLeafletMap} />

        </MapContainer>

        {/* ================= TOOLBAR ATAS ================= */}
        <div className="geo-explorer-toolbar">

          <button
            type="button"
            className="geo-toolbar-icon icon-tooltip-btn"
            data-tooltip="Ganti tampilan dasar peta"
            onClick={() => setBasemap((current) => (current === 'osm' ? 'topo' : 'osm'))}
          >
            <IconLayers />
          </button>

          <form className="geo-explorer-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => { setSearchTerm(event.target.value); setSearchError('') }}
              placeholder="Search by location name"
              aria-label="Cari fitur pada peta"
            />
            <button type="button" className="geo-toolbar-icon icon-tooltip-btn" data-tooltip="Pengaturan peta">
              <IconSettings />
            </button>
            <button type="submit" className="geo-toolbar-icon icon-tooltip-btn" data-tooltip="Cari fitur">
              <IconSearch />
            </button>
            <button
              type="button"
              className="geo-toolbar-icon icon-tooltip-btn"
              data-tooltip="Menu lainnya"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <IconMenu />
            </button>
          </form>

          {searchError && <div className="geo-explorer-search-error">{searchError}</div>}

          {menuOpen && (
            <div className="geo-explorer-menu">
              <button type="button" onClick={handleResetView}>Reset tampilan peta</button>
              {hasFeatures && (
                <button type="button" onClick={() => { setMenuOpen(false); downloadGeojson(geojson, title) }}>
                  Unduh GeoJSON
                </button>
              )}
            </div>
          )}

        </div>

        {/* ============ MINI PETA IKHTISAR (kiri bawah) ============ */}
        <div className="geo-explorer-minimap">
          <MapContainer
            center={[4.5, 96.9]}
            zoom={5}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
            attributionControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </MapContainer>
        </div>

        {/* ============ KONTROL ZOOM CUSTOM (kanan bawah) ============ */}
        <div className="geo-explorer-zoom">
          <button type="button" className="geo-zoom-btn" aria-label="Perbesar peta" onClick={() => leafletMap?.zoomIn()}>+</button>
          <button type="button" className="geo-zoom-btn" aria-label="Perkecil peta" onClick={() => leafletMap?.zoomOut()}>−</button>
          <button type="button" className="geo-zoom-btn geo-zoom-3d icon-tooltip-btn" data-tooltip="Tampilan 3D segera hadir">3D</button>
          <button type="button" className="geo-zoom-btn icon-tooltip-btn" data-tooltip="Opsi lainnya" onClick={() => setMenuOpen((c) => !c)}>⋯</button>
        </div>

      </div>

      {/* ================= PANEL INFO (FULL HEIGHT) ================= */}

      {panelOpen ? (

        <aside className="geo-explorer-sidebar">

          <div className="geo-sidebar-header">
            <span className="geo-sidebar-pin"><IconPin /></span>
            <button type="button" className="geo-sidebar-print icon-tooltip-btn" data-tooltip="Cetak" onClick={() => window.print()}>
              <IconPrinter />
            </button>
            <button type="button" className="geo-sidebar-close" onClick={() => setPanelOpen(false)} aria-label="Tutup panel">×</button>
          </div>

          <div className="geo-sidebar-layer-row">
            <span className="geo-sidebar-layer-icon"><IconLayers size={14} /></span>
            <strong>{title}</strong>
            <span className="geo-sidebar-chevron">▾</span>
            <button type="button" className="geo-sidebar-folder icon-tooltip-btn" data-tooltip="Buka folder layer">
              <IconFolder />
            </button>
          </div>

          <div className="geo-sidebar-coords-row">
            <span className="geo-sidebar-pin-small"><IconPin size={13} /></span>
            <span>
              {selected?.latlng
                ? `Lat: ${selected.latlng.lat.toFixed(3)} - Long: ${selected.latlng.lng.toFixed(3)}`
                : hasFeatures
                  ? 'Klik titik/garis/area pada peta untuk melihat detail'
                  : 'Klik area pada peta untuk melihat cakupan data'}
            </span>
            <button type="button" className="geo-sidebar-info-btn icon-tooltip-btn" data-tooltip="Informasi fitur">
              <IconInfo />
            </button>
            <button type="button" className="geo-sidebar-globe-btn icon-tooltip-btn" data-tooltip="Buka tampilan penuh">
              <IconGlobe />
            </button>
          </div>

          <div className="geo-sidebar-body">
            {entries.length > 0 ? (
              entries.map(([key, value]) => (
                <div className="geo-explorer-attr-row" key={key}>
                  <span>{labelFor(key, attributeMeta)}:</span>
                  <strong>{value === null || value === '' ? '-' : String(value)}</strong>
                </div>
              ))
            ) : (
              <p className="geo-sidebar-placeholder">
                {hasFeatures
                  ? 'Klik salah satu titik/garis/area pada peta untuk melihat rincian atributnya di sini.'
                  : 'Area cakupan data ini digambarkan sebagai kotak batas (bounding box). Rincian atribut per-fitur tidak tersedia untuk data jenis ini.'}
              </p>
            )}
          </div>

        </aside>

      ) : (

        <button
          type="button"
          className="geo-explorer-reopen"
          onClick={() => setPanelOpen(true)}
          aria-label="Buka info panel"
        >
          <IconPin />
        </button>

      )}

    </div>

  )

}

export default GeoFeatureExplorer