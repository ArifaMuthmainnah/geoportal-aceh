import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getDatasets } from '../api/datasetApi'

// Hapus tag HTML dari abstract
function stripHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

// Mapping kategori GeoNode (Inggris) -> label Indonesia yang dipakai di UI
const CATEGORY_MAP = {
  society: 'Sosial',
  biota: 'Lingkungan',
  environment: 'Lingkungan',
  imagery_basemaps_earth_cover: 'Infrastruktur',
  location: 'Administrasi',
  boundaries: 'Administrasi',
  planning_cadastre: 'Administrasi',
  structure: 'Infrastruktur',
  transportation: 'Infrastruktur',
  utilities_communication: 'Infrastruktur',
  economy: 'Sosial',
  farming: 'Lingkungan',
  health: 'Sosial',
  intelligence_military: 'Administrasi',
  ocean: 'Lingkungan',
  climatology_meteorology_atmosphere: 'Lingkungan',
  geoscientific_information: 'Lingkungan',
  elevation: 'Lingkungan',
}

function mapCategory(identifier) {
  return CATEGORY_MAP[identifier] || 'Umum'
}

function Katalog() {
  const [datasets, setDatasets] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const data = await getDatasets()

        console.log('Response API:', data)

        const list = Array.isArray(data) ? data : data.datasets || []

        setDatasets(list)
      } catch (err) {
        console.error('Gagal mengambil dataset:', err)
        setError('Gagal mengambil data dataset.')
      } finally {
        setLoading(false)
      }
    }

    fetchDatasets()
  }, [])

  const filteredDatasets = datasets.filter((dataset) => {
    const keyword = search.toLowerCase().trim()

    const title = dataset.title || ''
    const description = stripHtml(dataset.abstract)
    const mappedCategory = mapCategory(dataset.category?.identifier)

    const matchSearch =
      title.toLowerCase().includes(keyword) ||
      description.toLowerCase().includes(keyword)

    const matchCategory =
      category === 'Semua' || mappedCategory === category

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
            <span className="text-muted">Data</span>
            <span className="text-muted mx-2">/</span>
            <span className="current">Katalog</span>
          </div>
          <h1>Katalog Data</h1>
          <p>Temukan dan jelajahi data geospasial Aceh.</p>
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

        <div className="information-section-heading">
          <div>
            <h2>Dataset Terbaru</h2>
            <p>Temukan dataset berdasarkan kategori informasi.</p>
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

        {loading && (
          <div className="information-empty">
            <p>Memuat data...</p>
          </div>
        )}

        {!loading && error && (
          <div className="information-empty">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredDatasets.length > 0 && (
          <div className="row g-4">
            {filteredDatasets.map((dataset) => (
              <div className="col-md-6 col-lg-4" key={dataset.pk}>
                <Link
                  to={`/katalog/${dataset.pk}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <article className="card katalog-card h-100">
                    <div className="card-body p-4 d-flex flex-column">

                      <span className="text-primary small fw-semibold mb-3">
                        {mapCategory(dataset.category?.identifier)}
                      </span>

                      <h5 className="fw-semibold mb-3">
                        {dataset.title || 'Tanpa judul'}
                      </h5>

                      <p className="text-muted small flex-grow-1 mb-4">
                        {stripHtml(dataset.abstract).slice(0, 150)}
                        {stripHtml(dataset.abstract).length > 150 ? '...' : ''}
                      </p>

                      <div className="pt-3 border-top">
                        <small className="text-muted">
                          {new Date(dataset.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </small>
                      </div>

                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredDatasets.length === 0 && (
          <div className="information-empty">
            <h5>Dataset tidak ditemukan</h5>
            <p>Coba gunakan kata kunci atau kategori yang berbeda.</p>
          </div>
        )}

      </section>

    </main>
  )
}

export default Katalog