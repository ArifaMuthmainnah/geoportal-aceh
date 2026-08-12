import datasets from '../data/datasets'

function Katalog() {
  return (
    <div className="container py-5">

      {/* Header */}
      <div className="mb-4">
        <h1 className="fw-bold">Katalog Data</h1>
        <p className="text-muted">
          Temukan dan jelajahi data geospasial Aceh.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            placeholder="Cari dataset..."
          />
        </div>

        <div className="col-md-4">
          <select className="form-select">
            <option>Semua Kategori</option>
            <option>Administrasi</option>
            <option>Infrastruktur</option>
            <option>Lingkungan</option>
            <option>Sosial</option>
          </select>
        </div>
      </div>

      {/* Dataset Cards */}
      <div className="row g-4">
        {datasets.map((dataset) => (
          <div className="col-md-6 col-lg-4" key={dataset.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">

                <span className="badge text-bg-light mb-3">
                  {dataset.category}
                </span>

                <h5 className="card-title">
                  {dataset.title}
                </h5>

                <p className="card-text text-muted">
                  {dataset.description}
                </p>

                <small className="text-muted">
                  Format: {dataset.format}
                </small>

              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Katalog