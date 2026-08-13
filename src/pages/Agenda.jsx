import { useState } from 'react'
import agendas from '../data/agendas'

function Agenda() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  const categories = [
    'Semua',
    'GEOPORTAL',
    'INFRASTRUKTUR',
    'JIGN',
    'SDM',
  ]

  const filteredAgendas = agendas.filter((item) => {
    const keyword = search.toLowerCase().trim()

    const matchSearch =
      item.title.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)

    const matchCategory =
      category === 'Semua' ||
      item.category === category

    return matchSearch && matchCategory
  })

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
              Agenda
            </span>
          </div>

          <h1 className="fw-bold mb-2">
            Agenda
          </h1>

          <p className="text-muted mb-0">
            Informasi agenda dan kegiatan terkait geospasial di Aceh.
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

          <div className="row g-3">

            <div className="col-12">

              <input
                type="text"
                className="form-control"
                placeholder="Cari agenda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

            </div>

          </div>

          {/* Jumlah data */}
          <div className="mt-2">

            <small className="text-muted">
              Menampilkan {filteredAgendas.length} agenda
            </small>

          </div>

        </div>

      </section>


      {/* Category */}
      <section className="container pt-5 pb-4">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3">

          <div>

            <h2 className="fw-bold mb-1">
              Agenda Terbaru
            </h2>

            <p className="text-muted small mb-0">
              Temukan agenda berdasarkan kategori informasi.
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


      {/* Agenda Cards */}
      <section className="container pb-5">

        {filteredAgendas.length > 0 ? (

          <div className="row g-4">

            {filteredAgendas.map((item) => (

              <div
                className="col-md-6 col-lg-4"
                key={item.id}
              >

                <article className="card h-100 border-0 shadow-sm">

                  {/* Card Header */}
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      height: '180px',
                      background:
                        'linear-gradient(135deg, #e9f5ef, #d1e7dd)',
                    }}
                  >

                    <span className="text-success fw-semibold">
                      AGENDA GEOSPASIAL
                    </span>

                  </div>


                  {/* Card Body */}
                  <div className="card-body p-4 d-flex flex-column">

                    <div className="d-flex justify-content-between align-items-center mb-3">

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


                    <p className="text-muted small mb-3">
                      {item.description}
                    </p>


                    <div className="small text-muted mb-3">

                      {item.time && (
                        <div className="mb-1">
                          <strong>Waktu:</strong> {item.time}
                        </div>
                      )}

                      {item.location && (
                        <div>
                          <strong>Tempat:</strong> {item.location}
                        </div>
                      )}

                    </div>


                    <button
                      type="button"
                      className="btn btn-link text-primary text-decoration-none p-0 text-start fw-semibold mt-auto"
                    >
                      Lihat detail
                    </button>

                  </div>

                </article>

              </div>

            ))}

          </div>

        ) : (

          <div className="bg-white border rounded-3 text-center py-5">

            <h5 className="fw-semibold">
              Agenda tidak ditemukan
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

export default Agenda