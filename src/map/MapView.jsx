import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
  } from 'react-leaflet'
  
  import 'leaflet/dist/leaflet.css'
  
  function MapView() {
    const center = [5.55, 95.32]
  
    return (
      <MapContainer
        center={center}
        zoom={8}
        style={{ height: '600px', width: '100%' }}
      >
  
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
  
        <Marker position={center}>
          <Popup>
            Aceh
          </Popup>
        </Marker>
  
      </MapContainer>
    )
  }
  
  export default MapView