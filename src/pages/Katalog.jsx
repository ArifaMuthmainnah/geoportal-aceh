import { useState } from 'react'
import datasets from '../data/datasets'

function Katalog() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  const filteredDatasets = datasets.filter((dataset) => {
    const keyword = search.toLowerCase().trim()

    const matchSearch =
      dataset.title.toLowerCase().includes(keyword) ||
      dataset.description.toLowerCase().includes(keyword)

    const matchCategory =
      category === 'Semua' ||
      dataset.category === category

    return matchSearch && matchCategory
  })

  const categories = [
    'Semua',
    'Administrasi',
    'Infrastruktur',
    'Lingkungan',
    'Sosial',
  ]

  return (
    <main className="katalog-page">

      {/* Header */}
      <section className="information-header">
        <div className="container information-header-inner">

          <div className="information-breadcrumb">
            <span className="text-muted">
              Data
            </span>

            <span className="text-muted mx-2">
              /
            </span>

            <span className="current">
              Katalog
            </span>
          </div>

          <h1>
            Katalog Data
          </h1>

          <p>
            Temukan dan jelajahi data geospasial Aceh.
          </p>

        </div>
      </section>


      {/* Search */}
      <section className="container information-toolbar-wrapper">

        <div className="information-toolbar">

          <input
            type="text"
            className="information-search"
            placeholder="Cari dataset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <small className="information-result-count">
            Menampilkan {filteredDatasets.length} dataset
          </small>

        </div>

      </section>


      {/* Content */}
      <section className="container information-content">

        {/* Heading + Filter */}
        <div className="information-section-heading">

          <div>
            <h2>
              Dataset Terbaru
            </h2>

            <p>
              Temukan dataset berdasarkan kategori informasi.
            </p>
          </div>


          <div className="information-categories">

            {categories.map((item) => (

              <button
                key={item}
                type="button"
                className={`information-category ${
                  category === item ? 'active' : ''
                }`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>

            ))}

          </div>

        </div>


        {/* Dataset Cards */}
        {filteredDatasets.length > 0 ? (

          <div className="row g-4">

            {filteredDatasets.map((dataset) => (

              <div
                className="col-md-6 col-lg-4"
                key={dataset.id}
              >

                <article className="card katalog-card h-100">

                  <div className="card-body p-4 d-flex flex-column">

                    <span className="text-primary small fw-semibold mb-3">
                      {dataset.category}
                    </span>

                    <h5 className="fw-semibold mb-3">
                      {dataset.title}
                    </h5>

                    <p className="text-muted small flex-grow-1 mb-4">
                      {dataset.description}
                    </p>

                    <div className="pt-3 border-top">

                      <small className="text-muted">
                        Format: {dataset.format}
                      </small>

                    </div>

                  </div>

                </article>

              </div>

            ))}

          </div>

        ) : (

          <div className="information-empty">

            <h5>
              Dataset tidak ditemukan
            </h5>

            <p>
              Coba gunakan kata kunci atau kategori yang berbeda.
            </p>

          </div>

        )}

      </section>

    </main>
  )
}

export default Katalog