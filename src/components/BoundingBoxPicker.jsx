import { useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Marker,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// =====================================================
// LOCATION PICKER — KLIK 2 TITIK DI PETA UNTUK BBOX
// =====================================================
//
// Klik pertama = sudut 1, klik kedua = sudut 2.
// Otomatis dihitung jadi bounding box (min/max lat/lon)
// dan dikirim lewat onChange({ minLon, minLat, maxLon, maxLat }).
// Klik ketiga akan mereset dan mulai ulang.
//
// Tidak butuh library tambahan (leaflet-draw dsb) — cukup
// react-leaflet yang sudah dipakai di WebGIS.
//
// =====================================================

function ClickCatcher({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

function BoundingBoxPicker({ initialBbox, onChange }) {

  const center = [5.55, 95.32]

  const [points, setPoints] = useState(() => {

    if (
      initialBbox &&
      (initialBbox.minLon || initialBbox.minLat || initialBbox.maxLon || initialBbox.maxLat)
    ) {
      return [
        [Number(initialBbox.minLat) || 0, Number(initialBbox.minLon) || 0],
        [Number(initialBbox.maxLat) || 0, Number(initialBbox.maxLon) || 0],
      ]
    }

    return []

  })


  function handlePick(point) {

    setPoints((current) => {

      let next

      if (current.length >= 2) {
        next = [point]
      } else {
        next = [...current, point]
      }

      if (next.length === 2) {

        const [p1, p2] = next

        const bbox = {
          minLat: Math.min(p1[0], p2[0]),
          maxLat: Math.max(p1[0], p2[0]),
          minLon: Math.min(p1[1], p2[1]),
          maxLon: Math.max(p1[1], p2[1]),
        }

        onChange(bbox)

      }

      return next

    })

  }


  function handleReset() {
    setPoints([])
    onChange({ minLon: '', minLat: '', maxLon: '', maxLat: '' })
  }


  const rectangleBounds =
    points.length === 2
      ? [points[0], points[1]]
      : null


  return (

    <div>

      <div
        style={{
          height: '320px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #d1d5db',
          position: 'relative',
        }}
      >

        <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          <ClickCatcher onPick={handlePick} />

          {points.map((point, index) => (
            <Marker key={index} position={point} />
          ))}

          {rectangleBounds && (
            <Rectangle
              bounds={rectangleBounds}
              pathOptions={{ color: '#4f46e5', weight: 2 }}
            />
          )}

        </MapContainer>

        <div
          style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 1000,
            background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '6px 12px', border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            ↺ Reset
          </button>
        </div>

      </div>

      <small style={{ display: 'block', marginTop: '8px', opacity: 0.75 }}>
        {points.length === 0 && 'Klik peta untuk menandai sudut pertama area cakupan.'}
        {points.length === 1 && 'Klik sekali lagi untuk menandai sudut kedua.'}
        {points.length === 2 && 'Bounding box tersimpan. Klik lagi untuk mengulang dari awal.'}
      </small>

    </div>

  )

}


export default BoundingBoxPicker