import { useEffect, useState } from 'react'
import { getPublishedByType } from '../api/myDatasetApi'
import { stripHtml } from '../utils/datasetUtils'

function Pemberitahuan() {

  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function fetchData() {

      try {

        setLoading(true)

        const allInformasi = await getPublishedByType('informasi')

        setItems(
          allInformasi
            .filter((item) => item.sub_type === 'pemberitahuan')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        )

      } catch (err) {

        console.error('Gagal mengambil pemberitahuan:', err)
        setItems([])

      } finally {

        setLoading(false)

      }

    }

    fetchData()

  }, [])

  const filteredItems = items.filter((item) => {
    const keyword = search.toLowerCase().trim()
    return !keyword || (item.title || '').toLowerCase().includes(keyword)
  })

  return (
    <main className="information-page">

      <section className="information-header">
        <div className="container information-header-inner">
          <h1>Pemberitahuan</h1>
          <p>Informasi pemberitahuan dan pengumuman terkait layanan geospasial Aceh.</p>
        </div>
      </section>

      <section className="container information-toolbar-wrapper">
        <div className="information-toolbar">
          <input
            type="text"
            className="information-search"
            placeholder="Cari pemberitahuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <small className="information-result-count">Menampilkan {filteredItems.length} pemberitahuan</small>
        </div>
      </section>

      <section className="container information-content">

        {loading && <div className="information-empty"><p>Memuat pemberitahuan...</p></div>}

        {!loading && filteredItems.length === 0 && (
          <div className="information-empty">
            <h5>Belum ada pemberitahuan</h5>
            <p>Pemberitahuan yang diunggah dan dipublikasikan admin akan tampil di sini.</p>
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="information-list">
            {filteredItems.map((item) => (
              <article className="information-card" key={item.id}>
                <div className="information-card-visual">
                  <div className="information-card-label">PEMBERITAHUAN<small>GEOPORTAL ACEH</small></div>
                </div>
                <div className="information-card-body">
                  <div className="information-card-meta">
                    <span className="information-card-date">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <h5 className="information-card-title">{item.title}</h5>
                  <p className="information-card-description">{stripHtml(item.abstract || '')}</p>
                </div>
              </article>
            ))}
          </div>
        )}

      </section>

    </main>
  )
}

export default Pemberitahuan