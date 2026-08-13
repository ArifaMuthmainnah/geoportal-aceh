import { useMap } from 'react-leaflet'

function MapControls() {
  const map = useMap()

  const goToAceh = () => {
    map.setView([5.55, 95.32], 8)
  }

  return (
    <div className="map-controls">

      <button
        type="button"
        className="map-control-button"
        onClick={goToAceh}
        title="Kembali ke Aceh"
      >
        ⌖
      </button>

    </div>
  )
}

export default MapControls