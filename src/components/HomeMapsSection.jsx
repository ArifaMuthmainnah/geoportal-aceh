import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { getMaps } from '../api/mapApi'
import { getPublishedByType } from '../api/myDatasetApi'
import { mergeResourceLists, sortByDateDesc } from '../utils/ownDataAdapter'

import DatasetCard from './DatasetCard'

function HomeMapsSection() {

  const [maps, setMaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    let mounted = true

    async function fetchData() {

      try {

        setLoading(true)
        setError('')

        let oldMaps = []
        try {
          const response = await getMaps('?page=1&page_size=3')
          const rawList =
            Array.isArray(response)
              ? response
              : response?.results || response?.maps || []
          oldMaps = rawList.map((m) => ({ ...m, resource_type: 'map' }))
        } catch (err) {
          console.error('Gagal mengambil peta API lama:', err)
        }

        let ownMaps = []
        try {
          ownMaps = await getPublishedByType('map')
        } catch (err) {
          console.error('Gagal mengambil peta upload sendiri:', err)
        }

        if (!mounted) return

        const merged = sortByDateDesc(mergeResourceLists(oldMaps, ownMaps))
        setMaps(merged.slice(0, 3))

      } catch (err) {

        console.error('Gagal mengambil data peta:', err)
        if (mounted) setError('Peta belum dapat dimuat.')

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
            <span className="section-eyebrow">PETA INTERAKTIF</span>
            <h2>Peta Terbaru</h2>
            <p>Jelajahi koleksi peta interaktif yang tersedia di Geoportal Aceh.</p>
          </div>
          <Link to="/peta" className="section-link">
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

        {!loading && maps.length > 0 && (
          <div className="home-card-grid">
            {maps.map((item) => (
              <DatasetCard key={item.pk || item.uuid || item.id} dataset={item} owner={item.owner} />
            ))}
          </div>
        )}

        {!loading && maps.length === 0 && (
          <div className="home-empty-state">
            <div>⌖</div>
            <h3>{error || 'Belum ada peta'}</h3>
            <p>Peta yang telah dipublikasikan akan ditampilkan di sini.</p>
          </div>
        )}

      </div>
    </section>

  )

}

export default HomeMapsSection