import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    ZoomControl,
  } from 'react-leaflet'

  import MapControls from './MapControls'
  
  import 'leaflet/dist/leaflet.css'
  
  function MapView() {
    const center = [5.55, 95.32]
  
    return (
      <MapContainer
        center={center}
        zoom={8}
        className="map-container"
        zoomControl={false}
      >
  
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

<ZoomControl position="topright" />

<MapControls />
  
  <Marker position={[5.55, 95.32]}>
  <Popup>
    Banda Aceh
  </Popup>
</Marker>

<Marker position={[5.18, 97.15]}>
  <Popup>
    Lhokseumawe
  </Popup>
</Marker>
  

      </MapContainer>
    )
  }
  
  export default MapView