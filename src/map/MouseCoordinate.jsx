import { useState } from 'react'
import { useMapEvents } from 'react-leaflet'

function MouseCoordinate() {
  const [coords, setCoords] = useState({ lat: 5.55, lng: 95.32 })

  useMapEvents({
    mousemove(e) {
      setCoords(e.latlng)
    },
  })

  // Format koordinat agar terlihat profesional (Derajat, Menit, Detik atau Desimal)
  const formatCoord = (c) => c.toFixed(5)

  return (
    <div className="mouse-coordinate-display">
      <span>{formatCoord(coords.lat)}° N</span>
      <span className="coord-separator">|</span>
      <span>{formatCoord(coords.lng)}° E</span>
    </div>
  )
}

export default MouseCoordinate