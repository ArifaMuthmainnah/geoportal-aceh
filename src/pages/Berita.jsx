import { useEffect, useState } from 'react'
import { getPublishedByType } from '../api/myDatasetApi'
import { stripHtml } from '../utils/datasetUtils'

function Berita() {

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
            .filter((item) => item.sub_type === 'berita')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        )

      } catch (err) {

        console.error('Gagal mengambil berita:', err)
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
    <main className="bg-light min-vh-100">

      <section className="bg-white border-bottom">
        <div className="container py-5">
          <h1 className="fw-bold mb-2">Berita</h1>
          <p className="text-muted mb-0">Berita dan perkembangan terbaru seputar informasi geospasial Aceh.</p>
        </div>
      </section>

      <section className="container pt-4">
        <input
          type="text"
          className="form-control mb-4"
          placeholder="Cari berita..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && <p className="text-muted">Memuat berita...</p>}

        {!loading && filteredItems.length === 0 && (
          <div className="bg-white border rounded-3 text-center py-5">
            <h5 className="fw-semibold">Belum ada berita</h5>
            <p className="text-muted small mb-0">Berita yang diunggah dan dipublikasikan admin akan tampil di sini.</p>
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="row g-4 pb-5">
            {filteredItems.map((item) => (
              <div className="col-md-6 col-lg-4" key={item.id}>
                <article className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4 d-flex flex-column">
                    <small className="text-muted mb-2">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                    </small>
                    <h5 className="fw-semibold mb-3">{item.title}</h5>
                    <p className="text-muted small flex-grow-1">
                      {stripHtml(item.abstract || '').slice(0, 150)}
                    </p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  )
}

export default Berita