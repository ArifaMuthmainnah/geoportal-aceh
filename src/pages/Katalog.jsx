import { useState } from 'react'
import datasets from '../data/datasets'

function Katalog() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  const filteredDatasets = datasets.filter((dataset) => {
    const matchSearch = dataset.title
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchCategory =
      category === 'Semua' ||
      dataset.category === category

    return matchSearch && matchCategory
  })

  return (
    <div className="container py-5">

      {/* Header */}
      <div className="mb-4">
        <h1 className="fw-bold">
          Katalog Data
        </h1>

        <p className="text-muted mb-0">
          Temukan dan jelajahi data geospasial Aceh.
        </p>
      </div>


      {/* Search & Filter */}
      <div className="row g-3 mb-3">

        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            placeholder="Cari dataset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Semua">
              Semua Kategori
            </option>

            <option value="Administrasi">
              Administrasi
            </option>

            <option value="Infrastruktur">
              Infrastruktur
            </option>

            <option value="Lingkungan">
              Lingkungan
            </option>

            <option value="Sosial">
              Sosial
            </option>
          </select>
        </div>

      </div>


      {/* Dataset Count */}
      <div className="mb-4">

        <span className="text-muted small">
          Menampilkan {filteredDatasets.length} dataset
        </span>

      </div>


      {/* Dataset Cards */}
      <div className="row g-4">

        {filteredDatasets.map((dataset) => (

          <div
            className="col-md-6 col-lg-4"
            key={dataset.id}
          >

            <div className="card h-100 shadow-sm">

              <div className="card-body">

                {/* Category */}
                <span className="badge text-bg-light mb-3">
                  {dataset.category}
                </span>


                {/* Title */}
                <h5 className="card-title">
                  {dataset.title}
                </h5>


                {/* Description */}
                <p className="card-text text-muted">
                  {dataset.description}
                </p>


                {/* Format */}
                <small className="text-muted">
                  Format: {dataset.format}
                </small>

              </div>

            </div>

          </div>

        ))}


        {/* Empty State */}
        {filteredDatasets.length === 0 && (

          <div className="col-12">

            <div className="text-center py-5">

              <p className="text-muted mb-0">
                Tidak ada dataset yang ditemukan.
              </p>

            </div>

          </div>

        )}

      </div>

    </div>
  )
}

export default Katalog