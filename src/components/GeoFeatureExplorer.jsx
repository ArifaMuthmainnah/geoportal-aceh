import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Rectangle, CircleMarker, useMap, useMapEvent } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

function IconZoomFeature({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconHighlight({ size = 15, active = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 13.5L15 8l1 1-5.5 5.5" fill={active ? 'currentColor' : 'none'} />
      <path d="M14 9l1-3.5L18.5 8 15 9z" fill={active ? 'currentColor' : 'none'} />
      <path d="M9.5 13.5L7 20l6.5-2.5" />
    </svg>
  )
}

function IconCoordEdit({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function IconMapQuery({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}

function IconExpandArrows({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 3 3 3 3 8" />
      <polyline points="21 8 21 3 16 3" />
      <polyline points="16 21 21 21 21 16" />
      <polyline points="3 16 3 21 8 21" />
    </svg>
  )
}

function IconBtn({
  tooltip,
  tooltipPosition = 'above',
  onClick,
  disabled = false,
  active = false,
  type = 'button',
  className = '',
  style,
  ariaLabel,
  children,
}) {

  const wrapRef = useRef(null)
  const [tooltipPos, setTooltipPos] = useState(null)

  function showTooltip() {
    if (!tooltip || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    if (tooltipPosition === 'below') {
      setTooltipPos({ left: rect.left + rect.width / 2, top: rect.bottom + 8 })
    } else {
      setTooltipPos({ left: rect.left + rect.width / 2, top: rect.top - 8 })
    }
  }

  function hideTooltip() {
    setTooltipPos(null)
  }

  return (
    <span
      ref={wrapRef}
      className="geo-iconbtn-wrap"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <button
        type={type}
        className={`${className}${active ? ' active' : ''}`}
        style={style}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel || tooltip}
      >
        {children}
      </button>

      {tooltip && tooltipPos && (
        <span
          className={`geo-fixed-tooltip ${tooltipPosition === 'below' ? 'below' : 'above'}`}
          style={{ left: `${tooltipPos.left}px`, top: `${tooltipPos.top}px` }}
        >
          {tooltip}
        </span>
      )}
    </span>
  )
}

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

function MapReady({ onReady }) {
  const map = useMap()
  useEffect(() => { onReady(map) }, [map, onReady])
  return null
}

function FitBounds({ geojson, bbox, skip }) {

  const map = useMap()

  useEffect(() => {
    if (skip) return

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

  }, [geojson, bbox, skip, map])

  return null

}

function QueryClickHandler({ active, onQuery }) {
  useMapEvent('click', (event) => {
    if (active) onQuery(event.latlng)
  })
  return null
}

function FocusFeature({ focusFeature, onFocus }) {

  const map = useMap()

  useEffect(() => {

    if (!focusFeature?.feature) return

    try {

      const layer = L.geoJSON(focusFeature.feature)
      const bounds = layer.getBounds()

      if (!bounds.isValid()) return

      map.fitBounds(bounds, { maxZoom: 17, padding: [40, 40] })

      const isSingleFeature =
        focusFeature.feature.type === 'Feature' ||
        (focusFeature.feature.type === 'FeatureCollection' &&
          Array.isArray(focusFeature.feature.features) &&
          focusFeature.feature.features.length === 1)

      if (isSingleFeature) {

        const feature =
          focusFeature.feature.type === 'Feature'
            ? focusFeature.feature
            : focusFeature.feature.features[0]

        onFocus({
          properties: feature.properties || {},
          latlng: bounds.getCenter(),
          bounds,
          layer: null,
        })

      }

    } catch (err) {
      console.error('Gagal fokus ke fitur:', err)
    }

  }, [focusFeature, map])

  return null

}

function labelFor(key, attributeMeta) {
  const found = attributeMeta.find((a) => a.name === key)
  if (found && found.label && found.label.trim()) return found.label.trim()
  return key
}

const featureStyle = { color: '#0b5cab', weight: 3, fillColor: '#3a6ea5', fillOpacity: 0.25 }
const bboxOnlyStyle = { color: '#16325c', weight: 2, fillColor: '#16325c', fillOpacity: 0.05 }
const highlightStyle = { color: '#f59e0b', weight: 4, fillColor: '#fbbf24', fillOpacity: 0.45 }

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

function GeoFeatureExplorer({ geojson, bbox, title, attributes = [], focusFeature = null }) {

  const hasFeatures = Boolean(geojson && Array.isArray(geojson.features) && geojson.features.length > 0)
  const hasBboxOnly = !hasFeatures && Boolean(bbox)
  const [selected, setSelected] = useState(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [basemap, setBasemap] = useState('osm')
  const [leafletMap, setLeafletMap] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchError, setSearchError] = useState('')
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  const [highlightOn, setHighlightOn] = useState(false)
  const highlightedLayerRef = useRef(null)
  const [showAddressPopup, setShowAddressPopup] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [addressInfo, setAddressInfo] = useState(null)
  const [showCoordEditor, setShowCoordEditor] = useState(false)
  const [coordLatInput, setCoordLatInput] = useState('')
  const [coordLngInput, setCoordLngInput] = useState('')
  const [manualPoint, setManualPoint] = useState(null)
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false)
  const [queryMode, setQueryMode] = useState(false)
  const attributeMeta = Array.isArray(attributes) ? attributes : []

  useEffect(() => {

    function handleAfterPrint() {
      document.body.classList.remove('geo-print-only')
    }

    window.addEventListener('afterprint', handleAfterPrint)

    return () => window.removeEventListener('afterprint', handleAfterPrint)

  }, [])

  function handlePrintMap() {
    document.body.classList.add('geo-print-only')
    window.print()
  }

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

  function resetPopovers() {
    setShowAddressPopup(false)
    setAddressInfo(null)
    setAddressError('')
    setShowCoordEditor(false)
  }

  function onEachFeature(feature, layer) {

    let bounds = null
    try {
      const b = layer.getBounds ? layer.getBounds() : null
      if (b && b.isValid && b.isValid()) bounds = b
    } catch { bounds = null }

    layer.on('click', (event) => {
      resetPopovers()
      setSelected({ properties: feature.properties || {}, latlng: event.latlng, bounds, layer })
      setPanelOpen(true)
    })
  }

  useEffect(() => {

    if (highlightedLayerRef.current && highlightedLayerRef.current.setStyle) {
      try { highlightedLayerRef.current.setStyle(featureStyle) } catch {}
    }
    highlightedLayerRef.current = null

    if (highlightOn && selected?.layer && selected.layer.setStyle) {
      try {
        selected.layer.setStyle(highlightStyle)
        if (selected.layer.bringToFront) selected.layer.bringToFront()
      } catch {}
      highlightedLayerRef.current = selected.layer
    }

  }, [selected, highlightOn])

  function handleBboxClick(event) {
    resetPopovers()
    setSelected({ properties: { Informasi: 'Area cakupan data (bounding box)' }, latlng: event.latlng, bounds: null, layer: null })
    setPanelOpen(true)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    setTopMenuOpen(false)

    const term = searchTerm.trim().toLowerCase()
    if (!term) return

    const match = featureIndex.find(({ feature }) => {
      const props = feature.properties || {}
      return Object.values(props).some((value) => String(value ?? '').toLowerCase().includes(term))
    })

    if (match && leafletMap) {
      if (match.bounds) leafletMap.fitBounds(match.bounds, { maxZoom: 15, padding: [40, 40] })
      const center = match.bounds ? match.bounds.getCenter() : leafletMap.getCenter()
      resetPopovers()
      setSelected({ properties: match.feature.properties || {}, latlng: center, bounds: match.bounds, layer: null })
      setPanelOpen(true)
      setSearchError('')
    } else {
      setSearchError('Fitur tidak ditemukan.')
    }
  }

  function handleResetView() {
    setZoomMenuOpen(false)
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

  function handleZoomToFeature() {
    if (!leafletMap || !selected) return
    try {
      if (selected.bounds && selected.bounds.isValid && selected.bounds.isValid()) {
        leafletMap.fitBounds(selected.bounds, { maxZoom: 17, padding: [40, 40] })
      } else if (selected.latlng) {
        leafletMap.setView(selected.latlng, Math.max(leafletMap.getZoom(), 15))
      }
    } catch (err) {
      console.error('Gagal zoom ke fitur:', err)
    }
  }

  async function handleToggleAddressInfo() {

    const next = !showAddressPopup
    setShowCoordEditor(false)
    setShowAddressPopup(next)

    if (!next || !selected?.latlng) return

    setAddressLoading(true)
    setAddressError('')
    setAddressInfo(null)

    try {

      const { lat, lng } = selected.latlng

      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`

      const response = await fetch(url, { headers: { 'Accept-Language': 'id' } })

      if (!response.ok) {
        throw new Error('Gagal mengambil data alamat.')
      }

      const data = await response.json()
      const addr = data.address || {}

      setAddressInfo({
        gampong: addr.village || addr.hamlet || addr.suburb || addr.neighbourhood || '-',
        kecamatan: addr.suburb || addr.city_district || addr.municipality || addr.town || '-',
        kabKota: addr.city || addr.county || addr.regency || '-',
        provinsi: addr.state || '-',
      })

    } catch (err) {

      console.error('Gagal mengambil info alamat:', err)
      setAddressError('Gagal mengambil info alamat dari titik ini. Coba lagi.')

    } finally {

      setAddressLoading(false)

    }

  }

  function handleToggleCoordEditor() {
    const next = !showCoordEditor
    setShowAddressPopup(false)
    setShowCoordEditor(next)
    if (next) {
      setCoordLatInput(selected?.latlng ? selected.latlng.lat.toFixed(6) : '')
      setCoordLngInput(selected?.latlng ? selected.latlng.lng.toFixed(6) : '')
    }
  }

  function handleApplyCoordEditor(event) {
    event.preventDefault()

    const lat = parseFloat(coordLatInput)
    const lng = parseFloat(coordLngInput)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const latlng = L.latLng(lat, lng)

    setManualPoint(latlng)
    setSelected({
      properties: { Informasi: 'Titik hasil input manual (Coordinate Editor)' },
      latlng,
      bounds: null,
      layer: null,
    })
    setPanelOpen(true)

    if (leafletMap) {
      leafletMap.setView(latlng, Math.max(leafletMap.getZoom(), 14))
    }
  }


  function handleQueryClick(latlng) {

    resetPopovers()

    if (hasFeatures && featureIndex.length > 0) {

      let closest = null
      let closestDist = Infinity

      featureIndex.forEach(({ feature, bounds }) => {
        if (!bounds) return
        const center = bounds.getCenter()
        const dist = latlng.distanceTo(center)
        if (dist < closestDist) {
          closestDist = dist
          closest = { feature, bounds }
        }
      })

      if (closest) {
        setSelected({
          properties: closest.feature.properties || {},
          latlng: closest.bounds.getCenter(),
          bounds: closest.bounds,
          layer: null,
        })
        setPanelOpen(true)
      }

    } else if (hasBboxOnly) {

      setSelected({ properties: { Informasi: 'Area cakupan data (bounding box)' }, latlng, bounds: null, layer: null })
      setPanelOpen(true)

    }

  }

  function handleExternalFocus(sel) {
    resetPopovers()
    setSelected(sel)
    setPanelOpen(true)
  }

  if (!hasFeatures && !hasBboxOnly) return null

  const entries = selected
    ? Object.entries(selected.properties).filter(([key]) => key !== '_record')
    : []

  const activeBasemap = BASEMAPS[basemap] || BASEMAPS.osm

  return (

    <div className="dataset-map-wrapper geo-explorer">

      <div className={`geo-explorer-map-area${queryMode ? ' query-mode' : ''}`}>

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

          {manualPoint && (
            <CircleMarker
              center={manualPoint}
              radius={8}
              pathOptions={{ color: '#e11d48', weight: 3, fillColor: '#fb7185', fillOpacity: 0.9 }}
            />
          )}

          <FitBounds geojson={geojson} bbox={bbox} skip={Boolean(focusFeature)} />
          <MapReady onReady={setLeafletMap} />
          <QueryClickHandler active={queryMode} onQuery={handleQueryClick} />
          <FocusFeature focusFeature={focusFeature} onFocus={handleExternalFocus} />

        </MapContainer>

        <div className="geo-explorer-toolbar">

          <IconBtn
            className="geo-toolbar-icon"
            tooltip="Ganti tampilan dasar peta"
            tooltipPosition="below"
            onClick={() => setBasemap((current) => (current === 'osm' ? 'topo' : 'osm'))}
          >
            <IconLayers />
          </IconBtn>

          <form className="geo-explorer-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => { setSearchTerm(event.target.value); setSearchError('') }}
              placeholder="Search by location name"
              aria-label="Cari fitur pada peta"
            />
            <IconBtn className="geo-toolbar-icon" tooltip="Pengaturan peta" tooltipPosition="below">
              <IconSettings />
            </IconBtn>
            <IconBtn className="geo-toolbar-icon" tooltip="Cari fitur" tooltipPosition="below" type="submit">
              <IconSearch />
            </IconBtn>
            <IconBtn
              className="geo-toolbar-icon"
              tooltip="Menu lainnya"
              tooltipPosition="below"
              onClick={() => setTopMenuOpen((current) => !current)}
            >
              <IconMenu />
            </IconBtn>
          </form>

          {searchError && <div className="geo-explorer-search-error">{searchError}</div>}

          {topMenuOpen && (
            <div className="geo-explorer-menu">
              {hasFeatures && (
                <button type="button" onClick={() => { setTopMenuOpen(false); downloadGeojson(geojson, title) }}>
                  Unduh GeoJSON
                </button>
              )}
            </div>
          )}

        </div>

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

        <div className="geo-explorer-zoom">

          <button type="button" className="geo-zoom-btn" aria-label="Perbesar peta" onClick={() => leafletMap?.zoomIn()}>+</button>
          <button type="button" className="geo-zoom-btn" aria-label="Perkecil peta" onClick={() => leafletMap?.zoomOut()}>−</button>

          {zoomMenuOpen && (
            <>
              <IconBtn
                className="geo-zoom-btn"
                tooltip="Query objects on map"
                active={queryMode}
                onClick={() => setQueryMode((current) => !current)}
              >
                <IconMapQuery size={16} />
              </IconBtn>
              <IconBtn
                className="geo-zoom-btn"
                tooltip="Zoom to initial view"
                onClick={handleResetView}
              >
                <IconExpandArrows size={14} />
              </IconBtn>
            </>
          )}

          <IconBtn className="geo-zoom-btn geo-zoom-3d" tooltip="Tampilan 3D segera hadir">3D</IconBtn>
          <IconBtn className="geo-zoom-btn" tooltip="Opsi lainnya" onClick={() => setZoomMenuOpen((c) => !c)}>⋯</IconBtn>

        </div>

      </div>

      {panelOpen ? (

        <aside className="geo-explorer-sidebar">

          <div className="geo-sidebar-header">

            <span className="geo-sidebar-pin"><IconPin /></span>

            <div className="geo-sidebar-header-actions">

              <IconBtn
                className="geo-sidebar-header-btn"
                tooltip={highlightOn ? 'Matikan Highlight features' : 'Highlight features'}
                tooltipPosition="below"
                active={highlightOn}
                onClick={() => setHighlightOn((current) => !current)}
              >
                <IconHighlight active={highlightOn} />
              </IconBtn>

              <IconBtn
                className="geo-sidebar-header-btn"
                tooltip="Zoom to feature"
                tooltipPosition="below"
                onClick={handleZoomToFeature}
                disabled={!selected}
              >
                <IconZoomFeature />
              </IconBtn>

              <span className="geo-sidebar-header-divider" />

              <IconBtn
                className="geo-sidebar-print"
                tooltip="Cetak"
                tooltipPosition="below"
                onClick={handlePrintMap}
              >
                <IconPrinter />
              </IconBtn>

              <button type="button" className="geo-sidebar-close" onClick={() => setPanelOpen(false)} aria-label="Tutup panel">×</button>

            </div>

          </div>

          <div className="geo-sidebar-layer-row">
            <span className="geo-sidebar-layer-icon"><IconLayers size={14} /></span>
            <strong>{title}</strong>
            <span className="geo-sidebar-chevron">▾</span>
            <IconBtn
              className="geo-sidebar-folder"
              tooltip="Unduh GeoJSON layer ini"
              onClick={() => downloadGeojson(geojson, title)}
              disabled={!hasFeatures}
            >
              <IconFolder />
            </IconBtn>
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
            <IconBtn
              className="geo-sidebar-info-btn"
              tooltip="More info (alamat titik)"
              active={showAddressPopup}
              onClick={handleToggleAddressInfo}
              disabled={!selected?.latlng}
            >
              <IconInfo />
            </IconBtn>
            <IconBtn
              className="geo-sidebar-globe-btn"
              tooltip="Show Coordinate Editor"
              active={showCoordEditor}
              onClick={handleToggleCoordEditor}
            >
              <IconCoordEdit />
            </IconBtn>
          </div>

          {showAddressPopup && (
            <div className="geo-address-popover">
              {addressLoading ? (
                <p>Memuat info alamat…</p>
              ) : addressError ? (
                <p className="geo-popover-error">{addressError}</p>
              ) : addressInfo ? (
                <>
                  <div><span>Gampong</span><strong>{addressInfo.gampong}</strong></div>
                  <div><span>Kecamatan</span><strong>{addressInfo.kecamatan}</strong></div>
                  <div><span>Kab/Kota</span><strong>{addressInfo.kabKota}</strong></div>
                  <div><span>Provinsi</span><strong>{addressInfo.provinsi}</strong></div>
                </>
              ) : (
                <p>Klik salah satu titik/fitur pada peta dulu untuk melihat alamatnya.</p>
              )}
            </div>
          )}

          {showCoordEditor && (
            <form className="geo-coord-editor" onSubmit={handleApplyCoordEditor}>
              <label>
                Lat
                <input type="number" step="any" value={coordLatInput} onChange={(e) => setCoordLatInput(e.target.value)} />
              </label>
              <label>
                Long
                <input type="number" step="any" value={coordLngInput} onChange={(e) => setCoordLngInput(e.target.value)} />
              </label>
              <button type="submit">Terapkan</button>
            </form>
          )}

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