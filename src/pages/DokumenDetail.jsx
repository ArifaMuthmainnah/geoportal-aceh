import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { getDocumentDetail } from '../api/documentApi'
import { getPublishedDetail } from '../api/myDatasetApi'
import { adaptOwnResource } from '../utils/ownDataAdapter'
import { getOwnerName, stripHtml } from '../utils/datasetUtils'

function DokumenDetail() {

  const { id } = useParams()
  const isOwnId = typeof id === 'string' && id.startsWith('own-')

  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    async function fetchDetail() {

      try {

        setLoading(true)
        setError('')

        if (isOwnId) {

          const rawId = id.replace('own-', '')
          const rawData = await getPublishedDetail(rawId)

          if (!rawData) { setError('Dokumen tidak ditemukan.'); return }

          setDoc(adaptOwnResource(rawData))
          return

        }

        const response = await getDocumentDetail(id)
        const result = response?.document || response?.documents?.[0] || response
        setDoc(result)

      } catch (err) {

        console.error('Gagal mengambil detail dokumen:', err)
        setError('Gagal mengambil detail dokumen.')

      } finally {

        setLoading(false)

      }

    }

    if (id) fetchDetail()

  }, [id, isOwnId])

  if (loading) {
    return <main className="dataset-detail-page"><div className="container py-5"><p>Memuat detail dokumen...</p></div></main>
  }

  if (error || !doc) {
    return (
      <main className="dataset-detail-page">
        <div className="container py-5">
          <h4>Dokumen tidak ditemukan</h4>
          <p>{error || 'Data dokumen tidak tersedia.'}</p>
          <Link to="/dokumen" className="btn btn-primary">Kembali ke Dokumen</Link>
        </div>
      </main>
    )
  }

  const ownerName = getOwnerName(doc.owner)

  return (

    <main className="dataset-detail-page">

      <section className="dataset-detail-header">
        <div className="container">
          <div className="dataset-breadcrumb"><Link to="/dokumen">Dokumen</Link><span> / </span><span>Detail</span></div>
          <h1>{doc.title}</h1>
          {doc.abstract && <p className="dataset-header-description">{stripHtml(doc.abstract)}</p>}
        </div>
      </section>

      <section className="container dataset-detail-content">

        <div className="dataset-info-grid">
          <div className="dataset-info-item"><span className="dataset-info-label">Owner</span><span className="dataset-info-value">{ownerName}</span></div>
          <div className="dataset-info-item"><span className="dataset-info-label">Resource type</span><span className="dataset-info-value">document</span></div>
          <div className="dataset-info-item"><span className="dataset-info-label">Language</span><span className="dataset-info-value">{doc.language || '-'}</span></div>
        </div>

        {(doc.download_url || doc.detail_url) && (
          <div className="dataset-download-section">
            <div><h3>Unduh Dokumen</h3></div>
            <a href={doc.download_url || doc.detail_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary dataset-download-button">
              ↓ Unduh Dokumen
            </a>
          </div>
        )}

        <div className="dataset-back"><Link to="/dokumen">← Kembali ke Dokumen</Link></div>

      </section>

    </main>

  )
}

export default DokumenDetail