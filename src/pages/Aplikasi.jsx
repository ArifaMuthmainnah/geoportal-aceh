import { useMemo, useState } from 'react'
import applications from '../data/applications'

function Aplikasi() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  const categories = [
    'Semua',
    ...new Set(applications.map((app) => app.category)),
  ]

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.description.toLowerCase().includes(search.toLowerCase()) ||
        app.creator.toLowerCase().includes(search.toLowerCase())

      const matchCategory =
        category === 'Semua' ||
        app.category === category

      return matchSearch && matchCategory
    })
  }, [search, category])

  return (
    <main className="applications-page">

      {/* HERO */}
      <section className="applications-hero">
        <div className="container">
          <div className="applications-hero-content">

            <span className="applications-eyebrow">
              GEOPORTAL ACEH
            </span>

            <h1>
              Aplikasi Geospasial
            </h1>

            <p>
              Jelajahi berbagai aplikasi dan layanan
              geospasial yang mendukung pengelolaan
              informasi spasial di Aceh.
            </p>

          </div>
        </div>
      </section>


      {/* SEARCH */}
      <section className="applications-content">

        <div className="container">

          <div className="application-toolbar">

            <div className="application-search">

              <span className="search-icon">
                🔍
              </span>

              <input
                type="text"
                placeholder="Cari aplikasi..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch('')}
                  aria-label="Hapus pencarian"
                >
                  ×
                </button>
              )}

            </div>


            <div className="application-filter">

              <label htmlFor="category">
                Kategori
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

            </div>

          </div>


          {/* RESULT INFO */}
          <div className="application-result-info">

            <div>
              <strong>
                {filteredApplications.length}
              </strong>{' '}
              aplikasi ditemukan
            </div>

            {(search || category !== 'Semua') && (
              <button
                type="button"
                className="reset-filter"
                onClick={() => {
                  setSearch('')
                  setCategory('Semua')
                }}
              >
                Reset filter
              </button>
            )}

          </div>


          {/* CARDS */}
          {filteredApplications.length > 0 ? (

            <div className="applications-grid">

              {filteredApplications.map((application) => (

                <article
                  className="application-card"
                  key={application.id}
                >

                  {/* IMAGE */}
                  <div className="application-image">

                    {application.image ? (

                      <img
                        src={application.image}
                        alt={application.name}
                      />

                    ) : (

                      <div className="application-image-placeholder">

                        <span>
                          GIS
                        </span>

                        <small>
                          Preview Aplikasi
                        </small>

                      </div>

                    )}

                    <span className="application-category">
                      {application.category}
                    </span>

                  </div>


                  {/* CONTENT */}
                  <div className="application-card-body">

                    <h2>
                      {application.name}
                    </h2>

                    <p className="application-description">
                      {application.description}
                    </p>


                    {/* CREATOR */}
                    <div className="application-creator">

                      <div className="creator-icon">
                        👤
                      </div>

                      <div>
                        <span>
                          Dikembangkan oleh
                        </span>

                        <strong>
                          {application.creator}
                        </strong>
                      </div>

                    </div>


                    {/* ACTION */}
                    <a
                      href={application.url}
                      className="application-button"
                    >
                      Buka Aplikasi
                      <span>
                        →
                      </span>
                    </a>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            /* EMPTY STATE */
            <div className="application-empty">

              <div className="empty-icon">
                🔎
              </div>

              <h2>
                Aplikasi tidak ditemukan
              </h2>

              <p>
                Coba gunakan kata kunci atau kategori
                yang berbeda.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCategory('Semua')
                }}
              >
                Tampilkan Semua Aplikasi
              </button>

            </div>

          )}

        </div>

      </section>

    </main>
  )
}

export default Aplikasi