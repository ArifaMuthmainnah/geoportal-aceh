import { useState } from 'react'
import news from '../data/news'

function Berita() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  const categories = [
    'Semua',
    'GEOPORTAL',
    'INFRASTRUKTUR',
    'JIGN',
    'SDM',
  ]

  const filteredNews = news.filter((item) => {
    const keyword = search.toLowerCase().trim()

    const matchSearch =
      item.title.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)

    const matchCategory =
      category === 'Semua' ||
      item.category === category

    return matchSearch && matchCategory
  })

  const featuredNews = news.find((item) => item.featured)

  return (
    <main className="bg-light min-vh-100">

      {/* Header */}
      <section className="bg-white border-bottom">
        <div className="container py-5">

          <div className="mb-2">
            <span className="text-muted small">
              Informasi
            </span>

            <span className="text-muted mx-2">
              /
            </span>

            <span className="text-primary small">
              Berita
            </span>
          </div>

          <h1 className="fw-bold mb-2">
            Berita
          </h1>

          <p className="text-muted mb-0">
            Berita dan perkembangan terbaru seputar informasi
            geospasial Aceh.
          </p>

        </div>
      </section>


      {/* Search */}
      <section className="container">

        <div
          className="bg-white border rounded-3 p-3"
          style={{
            marginTop: '-20px',
            position: 'relative',
            zIndex: 2,
          }}
        >

          <div className="row g-3 align-items-center">

            <div className="col-lg-8">

              <input
                type="text"
                className="form-control"
                placeholder="Cari berita..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

            </div>

            <div className="col-lg-4">

              <p className="text-muted small mb-0 text-lg-end">
                Menampilkan {filteredNews.length} berita
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* Featured News */}
      {featuredNews && search.trim() === '' && category === 'Semua' && (

        <section className="container pt-5">

          <div className="mb-4">

            <span className="text-primary small fw-semibold">
              INFORMASI TERKINI
            </span>

            <h2 className="fw-bold mt-1">
              Berita Utama
            </h2>

          </div>


          <article className="card border-0 shadow-sm overflow-hidden">

            <div className="row g-0">

              <div className="col-lg-6">

                <div
                  className="d-flex align-items-center justify-content-center h-100"
                  style={{
                    minHeight: '320px',
                    background:
                      'linear-gradient(135deg, #0f5132, #198754)',
                  }}
                >

                  <div className="text-center text-white px-4">

                    <div
                      className="fw-semibold"
                      style={{
                        fontSize: '18px',
                        letterSpacing: '2px',
                      }}
                    >
                      GEOPORTAL ACEH
                    </div>

                    <div className="small opacity-75 mt-2">
                      Informasi Geospasial
                    </div>

                  </div>

                </div>

              </div>


              <div className="col-lg-6">

                <div className="p-4 p-lg-5">

                  <div className="d-flex gap-2 align-items-center mb-3">

                    <span className="badge bg-primary-subtle text-primary">
                      {featuredNews.category}
                    </span>

                    <small className="text-muted">
                      {featuredNews.date}
                    </small>

                  </div>

                  <h2 className="fw-bold mb-3">
                    {featuredNews.title}
                  </h2>

                  <p className="text-muted mb-4">
                    {featuredNews.description}
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                  >
                    Baca Selengkapnya
                  </button>

                </div>

              </div>

            </div>

          </article>

        </section>

      )}


      {/* Category */}
      <section className="container pt-5 pb-4">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3">

          <div>

            <h2 className="fw-bold mb-1">
              Berita Terbaru
            </h2>

            <p className="text-muted small mb-0">
              Temukan berita berdasarkan kategori informasi.
            </p>

          </div>


          <div className="d-flex flex-wrap gap-2">

            {categories.map((item) => (

              <button
                key={item}
                type="button"
                className={`btn btn-sm px-3 ${
                  category === item
                    ? 'btn-primary'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>

            ))}

          </div>

        </div>

      </section>


      {/* News Cards */}
      <section className="container pb-5">

        {filteredNews.length > 0 ? (

          <div className="row g-4">

            {filteredNews.map((item) => (

              <div
                className="col-md-6 col-lg-4"
                key={item.id}
              >

                <article className="card h-100 border-0 shadow-sm">

                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      height: '180px',
                      background:
                        'linear-gradient(135deg, #e9f5ef, #d1e7dd)',
                    }}
                  >

                    <span className="text-success small fw-semibold">
                      INFORMASI GEOSPASIAL
                    </span>

                  </div>


                  <div className="card-body p-4 d-flex flex-column">

                    <div className="d-flex justify-content-between mb-3">

                      <span className="text-primary small fw-semibold">
                        {item.category}
                      </span>

                      <span className="text-muted small">
                        {item.date}
                      </span>

                    </div>


                    <h5 className="fw-semibold mb-3">
                      {item.title}
                    </h5>


                    <p className="text-muted small flex-grow-1">
                      {item.description}
                    </p>


                    <button
                      type="button"
                      className="btn btn-link text-primary text-decoration-none p-0 text-start fw-semibold"
                    >
                      Baca selengkapnya
                    </button>

                  </div>

                </article>

              </div>

            ))}

          </div>

        ) : (

          <div className="bg-white border rounded-3 text-center py-5">

            <h5 className="fw-semibold">
              Berita tidak ditemukan
            </h5>

            <p className="text-muted small mb-0">
              Coba gunakan kata kunci atau kategori yang berbeda.
            </p>

          </div>

        )}

      </section>

    </main>
  )
}

export default Berita