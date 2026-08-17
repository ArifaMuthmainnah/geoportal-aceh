import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { getDatasetDetail } from '../api/datasetApi'

function stripHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

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

function DatasetDetail() {
  const { id } = useParams()

  const [dataset, setDataset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true)
        const data = await getDatasetDetail(id)

        console.log('Detail API:', data)

        // Antisipasi kalau response detail dibungkus { dataset: {...} }
        const result = data.dataset || data

        setDataset(result)
      } catch (err) {
        console.error('Gagal mengambil detail dataset:', err)
        setError('Gagal mengambil detail dataset.')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id])

  if (loading) {
    return (
      <main className="katalog-page">
        <div className="container py-5">
          <p>Memuat data...</p>
        </div>
      </main>
    )
  }

  if (error || !dataset) {
    return (
      <main className="katalog-page">
        <div className="container py-5">
          <p>{error || 'Dataset tidak ditemukan.'}</p>
          <Link to="/katalog">Kembali ke Katalog</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="katalog-page">

      <section className="information-header">
        <div className="container information-header-inner">
          <div className="information-breadcrumb">
            <Link to="/katalog" className="text-muted">Katalog</Link>
            <span className="text-muted mx-2">/</span>
            <span className="current">{dataset.title}</span>
          </div>

          <h1>{dataset.title}</h1>

          <span className="text-primary small fw-semibold">
            {mapCategory(dataset.category?.identifier)}
          </span>
        </div>
      </section>

      <section className="container py-5">

        {dataset.thumbnail_url && (
          <img
            src={dataset.thumbnail_url}
            alt={dataset.title}
            className="img-fluid rounded mb-4"
            style={{ maxHeight: '400px', objectFit: 'cover', width: '100%' }}
          />
        )}

        <h5 className="fw-semibold mb-3">Deskripsi</h5>
        <p className="text-muted mb-4">{stripHtml(dataset.abstract)}</p>

        {dataset.purpose && (
          <>
            <h5 className="fw-semibold mb-3">Tujuan</h5>
            <p className="text-muted mb-4">{stripHtml(dataset.purpose)}</p>
          </>
        )}

        {dataset.attribution && (
          <>
            <h5 className="fw-semibold mb-3">Sumber Data</h5>
            <p className="text-muted mb-4">{dataset.attribution}</p>
          </>
        )}

        <div className="row mb-4">
          <div className="col-md-6">
            <small className="text-muted d-block">Tanggal Publikasi</small>
            <p>
              {new Date(dataset.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {dataset.data_quality_statement && (
            <div className="col-md-6">
              <small className="text-muted d-block">Kualitas Data</small>
              <p className="text-muted">
                {stripHtml(dataset.data_quality_statement)}
              </p>
            </div>
          )}
        </div>

        {dataset.download_url && (
          <a
            href={dataset.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Unduh Dataset
          </a>
        )}

        <div className="mt-4">
          <Link to="/katalog">&larr; Kembali ke Katalog</Link>
        </div>

      </section>

    </main>
  )
}

export default DatasetDetail