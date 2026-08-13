import MapView from '../map/MapView'
import LayerPanel from '../map/LayerPanel'

function WebGIS() {
  return (
    <div className="webgis-page">

      <section className="webgis-header">

        <div className="container">

          <div className="webgis-header-content">

            <div>
              <span className="webgis-label">
                GEOPORTAL ACEH
              </span>

              <h1>
                WebGIS Aceh
              </h1>

              <p>
                Jelajahi informasi geospasial Provinsi Aceh
                melalui peta interaktif.
              </p>
            </div>

          </div>

        </div>

      </section>

      <section className="webgis-map-section">

        <div className="webgis-map-wrapper">

          <MapView />

          <LayerPanel />

        </div>

      </section>

    </div>
  )
}

export default WebGIS