import { useState } from 'react'
import notifications from '../data/notifications'

function Pemberitahuan() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  const categories = [
    'Semua',
    'GEOPORTAL',
    'INFRASTRUKTUR',
    'JIGN',
    'SDM',
  ]

  const filteredNotifications = notifications.filter((item) => {
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
    <main className="information-page">

      {/* Header */}
      <section className="information-header">

        <div className="container information-header-inner">

          <div className="information-breadcrumb">

            <span className="text-muted">
              Informasi
            </span>

            <span className="text-muted mx-2">
              /
            </span>

            <span className="current">
              Pemberitahuan
            </span>

          </div>

          <h1>
            Pemberitahuan
          </h1>

          <p>
            Informasi pemberitahuan dan pengumuman terkait layanan
            geospasial Aceh.
          </p>

        </div>

      </section>


      {/* Search */}
      <section className="container information-toolbar-wrapper">

        <div className="information-toolbar">

          <input
            type="text"
            className="information-search"
            placeholder="Cari pemberitahuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <small className="information-result-count">
            Menampilkan {filteredNotifications.length} pemberitahuan
          </small>

        </div>

      </section>


      {/* Content */}
      <section className="container information-content">

        {/* Heading + Filter */}
        <div className="information-section-heading">

          <div>

            <h2>
              Pemberitahuan Terbaru
            </h2>

            <p>
              Temukan pemberitahuan berdasarkan kategori informasi.
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


        {/* Notification Cards */}
        {filteredNotifications.length > 0 ? (

          <div className="information-list">

            {filteredNotifications.map((item) => (

              <article
                className="information-card"
                key={item.id}
              >

                {/* Visual */}
                <div className="information-card-visual">

                  <div className="information-card-label">

                    PEMBERITAHUAN

                    <small>
                      GEOPORTAL ACEH
                    </small>

                  </div>

                </div>


                {/* Content */}
                <div className="information-card-body">

                  <div className="information-card-meta">

                    <span className="information-card-category">
                      {item.category}
                    </span>

                    <span className="information-card-date">
                      {item.date}
                    </span>

                  </div>


                  <h5 className="information-card-title">
                    {item.title}
                  </h5>


                  <p className="information-card-description">
                    {item.description}
                  </p>


                  <button
                    type="button"
                    className="information-card-link"
                  >
                    Baca selengkapnya
                    <span>
                      →
                    </span>
                  </button>

                </div>

              </article>

            ))}

          </div>

        ) : (

          <div className="information-empty">

            <h5>
              Pemberitahuan tidak ditemukan
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

export default Pemberitahuan