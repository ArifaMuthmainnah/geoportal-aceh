import MapView from '../map/MapView'

function WebGIS() {
  return (
    <div className="webgis-page">
      {/* UPDATE: Kita ubah section header agar mirip Hero Home */}
      <section className="webgis-hero-section">
        <div className="container">
          <div className="webgis-hero-content">
            <span className="webgis-eyebrow">GEOPORTAL ACEH</span>
            <h1>WebGIS <span>Aceh</span></h1>
            <p>
              Jelajahi informasi geospasial Provinsi Aceh melalui peta interaktif 
              untuk mendukung pembangunan berbasis data.
            </p>
          </div>
        </div>
      </section>

      <section className="webgis-map-section">
        <div className="webgis-map-wrapper">
          <MapView />
        </div>
      </section>
    </div>
  )
}

export default WebGIS