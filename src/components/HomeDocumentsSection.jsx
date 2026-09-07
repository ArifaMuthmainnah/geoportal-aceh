import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { getDocuments } from '../api/documentApi'
import { getPublishedByType } from '../api/myDatasetApi'
import { mergeResourceLists, sortByDateDesc } from '../utils/ownDataAdapter'

import DatasetCard from './DatasetCard'

function HomeDocumentsSection() {

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    let mounted = true

    async function fetchData() {

      try {

        setLoading(true)
        setError('')

        let oldDocuments = []
        try {
          const response = await getDocuments('?page=1&page_size=3')
          const rawList =
            Array.isArray(response)
              ? response
              : response?.results || response?.documents || []
          oldDocuments = rawList.map((d) => ({ ...d, resource_type: 'document' }))
        } catch (err) {
          console.error('Gagal mengambil dokumen API lama:', err)
        }

        let ownDocuments = []
        try {
          ownDocuments = await getPublishedByType('document')
        } catch (err) {
          console.error('Gagal mengambil dokumen upload sendiri:', err)
        }

        if (!mounted) return

        const merged = sortByDateDesc(mergeResourceLists(oldDocuments, ownDocuments))
        setDocuments(merged.slice(0, 3))

      } catch (err) {

        console.error('Gagal mengambil data dokumen:', err)
        if (mounted) setError('Dokumen belum dapat dimuat.')

      } finally {

        if (mounted) setLoading(false)

      }

    }

    fetchData()

    return () => { mounted = false }

  }, [])

  return (

    <section className="home-section">
      <div className="container">

        <div className="home-section-heading">
          <div>
            <span className="section-eyebrow">DOKUMEN PENDUKUNG</span>
            <h2>Dokumen Terbaru</h2>
            <p>Kumpulan dokumen pendukung data geospasial Aceh.</p>
          </div>
          <Link to="/dokumen" className="section-link">
            Lihat Semua<span>→</span>
          </Link>
        </div>

        {loading && (
          <div className="home-card-grid">
            {[1, 2, 3].map((item) => (
              <article className="dataset-home-card dataset-skeleton" key={item}>
                <div className="dataset-home-image" />
                <div className="dataset-home-body">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line title" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line medium" />
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && documents.length > 0 && (
          <div className="home-card-grid">
            {documents.map((item) => (
              <DatasetCard key={item.pk || item.uuid || item.id} dataset={item} owner={item.owner} />
            ))}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="home-empty-state">
            <div>▤</div>
            <h3>{error || 'Belum ada dokumen'}</h3>
            <p>Dokumen yang telah dipublikasikan akan ditampilkan di sini.</p>
          </div>
        )}

      </div>
    </section>

  )

}

export default HomeDocumentsSection