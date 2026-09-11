import { useEffect } from 'react'
import { MapContainer, TileLayer, Rectangle, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const crosshairIcon = L.divIcon({
  className: 'location-crosshair-icon',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function FitToBounds({ bounds, center }) {

  const map = useMap()

  useEffect(() => {

    try {

      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [26, 26] })
        return
      }

      if (center) {
        map.setView(center, 6)
      }

    } catch (err) {
      console.error('Gagal menyesuaikan tampilan peta lokasi:', err)
    }

  }, [bounds, center, map])

  return null

}

function LocationBoundsMap({ bbox, center, height = 300, className = '' }) {

  if (!center) return null

  const centerPoint = [center.lat, center.lon]

  const rectBounds =
    bbox
      ? L.latLngBounds(
          [bbox.minLat, bbox.minLon],
          [bbox.maxLat, bbox.maxLon]
        )
      : null

  return (

    <div
      className={
        `dataset-location-image location-bounds-map location-bounds-map-static ${className}`.trim()
      }
      style={{ height }}
    >

      <MapContainer
        center={centerPoint}
        zoom={6}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        tap={false}
        inertia={false}
        style={{ height: '100%', width: '100%' }}
      >

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {rectBounds && (
          <Rectangle
            bounds={rectBounds}
            pathOptions={{ color: '#16325c', weight: 2, fillColor: '#16325c', fillOpacity: 0.05 }}
          />
        )}

        <Marker position={centerPoint} icon={crosshairIcon} />

        <FitToBounds bounds={rectBounds} center={centerPoint} />

      </MapContainer>

    </div>

  )

}

export default LocationBoundsMap