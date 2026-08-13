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
            <option value="Semua">Semua Kategori</option>
            <option value="Administrasi">Administrasi</option>
            <option value="Infrastruktur">Infrastruktur</option>
            <option value="Lingkungan">Lingkungan</option>
            <option value="Sosial">Sosial</option>
          </select>
        </div>
      </div>

      {/* Dataset Cards */}
      <div className="row g-4">
        {filteredDatasets.map((dataset) => (
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

        {/* Empty State */}
        {filteredDatasets.length === 0 && (
          <div className="col-12 text-center py-5">
            <p className="text-muted">
              Dataset tidak ditemukan.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

export default Katalog