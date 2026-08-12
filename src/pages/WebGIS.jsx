import MapView from '../map/MapView'

function WebGIS() {
  return (
    <div>

      <section className="container py-4">

        <h1 className="fw-bold">
          WebGIS Aceh
        </h1>

        <p className="text-muted">
          Peta interaktif informasi geospasial Aceh.
        </p>

      </section>

      <div className="container-fluid px-0">
        <MapView />
      </div>

    </div>
  )
}

export default WebGIS