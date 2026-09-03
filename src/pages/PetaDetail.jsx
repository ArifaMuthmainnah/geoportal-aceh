import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { getMapDetail } from '../api/mapApi'
import { getPublishedDetail } from '../api/myDatasetApi'
import { adaptOwnResource } from '../utils/ownDataAdapter'
import { getOwnerName, stripHtml } from '../utils/datasetUtils'

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getBoundingBox(coords) {
  if (!Array.isArray(coords) || coords.length < 4) return null
  const [minLon, minLat, maxLon, maxLat] = coords
  return { minLon, minLat, maxLon, maxLat }
}

function getCenter(bbox) {
  if (!bbox) return null
  return { lat: (bbox.minLat + bbox.maxLat) / 2, lon: (bbox.minLon + bbox.maxLon) / 2 }
}

function PetaDetail() {

  const { id } = useParams()
  const isOwnId = typeof id === 'string' && id.startsWith('own-')

  const [map, setMap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {

    async function fetchDetail() {

      try {

        setLoading(true)
        setError('')

        if (isOwnId) {

          const rawId = id.replace('own-', '')
          const rawData = await getPublishedDetail(rawId)

          if (!rawData) { setError('Peta tidak ditemukan.'); return }

          setMap(adaptOwnResource(rawData))
          return

        }

        const response = await getMapDetail(id)
        const result = response?.map || response?.maps?.[0] || response
        setMap(result)

      } catch (err) {

        console.error('Gagal mengambil detail peta:', err)
        setError('Gagal mengambil detail peta.')

      } finally {

        setLoading(false)

      }

    }

    if (id) fetchDetail()

  }, [id, isOwnId])

  if (loading) {
    return (
      <main className="dataset-detail-page">
        <div className="container py-5"><p>Memuat detail peta...</p></div>
      </main>
    )
  }

  if (error || !map) {
    return (
      <main className="dataset-detail-page">
        <div className="container py-5">
          <h4>Peta tidak ditemukan</h4>
          <p>{error || 'Data peta tidak tersedia.'}</p>
          <Link to="/peta" className="btn btn-primary">Kembali ke Peta</Link>
        </div>
      </main>
    )
  }

  const ownerName = getOwnerName(map.owner)
  const bbox = getBoundingBox(map?.extent?.coords)
  const center = getCenter(bbox)
  const linkedResources = isOwnId ? (map._linked_resources || []) : []

  return (

    <main className="dataset-detail-page">

      <section className="dataset-detail-header">
        <div className="container">
          <div className="dataset-breadcrumb">
            <Link to="/peta">Peta</Link><span> / </span><span>Detail</span>
          </div>
          <h1>{map.title}</h1>
          {map.abstract && <p className="dataset-header-description">{stripHtml(map.abstract)}</p>}
        </div>
      </section>

      <section className="container dataset-detail-content">

        {map.embed_url && (
          <div className="dataset-map-wrapper">
            <iframe src={map.embed_url} title={map.title} className="dataset-map-iframe" loading="lazy" allowFullScreen />
          </div>
        )}

        <div className="dataset-tabs">
          <button type="button" className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>Info</button>
          <button type="button" className={activeTab === 'location' ? 'active' : ''} onClick={() => setActiveTab('location')}>Location</button>
          <button type="button" className={activeTab === 'linked' ? 'active' : ''} onClick={() => setActiveTab('linked')}>Linked Resources</button>
        </div>

        {activeTab === 'info' && (
          <section className="dataset-info-section">
            <div className="dataset-info-grid">
              <div className="dataset-info-item"><span className="dataset-info-label">Title</span><span className="dataset-info-value">{map.title}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Owner</span><span className="dataset-info-value">{ownerName}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Publication</span><span className="dataset-info-value">{formatDate(map.date)}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Added to catalog</span><span className="dataset-info-value">{formatDate(map.created)}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Last catalog modification</span><span className="dataset-info-value">{formatDate(map.last_updated)}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Resource type</span><span className="dataset-info-value">map</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Source</span><span className="dataset-info-value">{map.sourcetype || 'LOCAL'}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Point of contact</span><span className="dataset-info-value">{ownerName}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Language</span><span className="dataset-info-value">{map.language || '-'}</span></div>
              <div className="dataset-info-item dataset-info-item-full">
                <span className="dataset-info-label">Supplemental information</span>
                <span className="dataset-info-value">{stripHtml(map.supplemental_information) || 'No information provided'}</span>
              </div>
            </div>

            {map.detail_url && (
              <div className="dataset-full-metadata">
                <a href={map.detail_url} target="_blank" rel="noopener noreferrer" className="dataset-metadata-link">
                  <strong>View full metadata</strong><span>↗</span>
                </a>
              </div>
            )}
          </section>
        )}

        {activeTab === 'location' && (
          <section className="dataset-location-section">
            {bbox ? (
              <>
                <div className="dataset-bbox">
                  <h4>Bounding Box (WGS84)</h4>
                  <div className="dataset-bbox-grid">
                    <div><span>Min Lat</span><strong>{bbox.minLat.toFixed(6)}</strong></div>
                    <div><span>Min Lon</span><strong>{bbox.minLon.toFixed(6)}</strong></div>
                    <div><span>Max Lat</span><strong>{bbox.maxLat.toFixed(6)}</strong></div>
                    <div><span>Max Lon</span><strong>{bbox.maxLon.toFixed(6)}</strong></div>
                  </div>
                </div>
                {center && (
                  <div className="dataset-center-card">
                    <h4>Center (WGS84)</h4>
                    <div className="dataset-center-values">
                      <div><span>Lat</span><strong>{center.lat.toFixed(6)}</strong></div>
                      <div><span>Lon</span><strong>{center.lon.toFixed(6)}</strong></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="dataset-attributes-empty"><p>Informasi lokasi belum tersedia untuk peta ini.</p></div>
            )}
          </section>
        )}

        {activeTab === 'linked' && (
          <section className="dataset-assets-section">
            {isOwnId ? (
              linkedResources.length > 0 ? (
                <ul className="dataset-keywords" style={{ listStyle: 'none', padding: 0 }}>
                  {linkedResources.map((item, index) => (
                    <li key={index} className="dataset-keyword" style={{ display: 'block', marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="dataset-attributes-empty"><p>Belum ada linked resources untuk peta ini.</p></div>
              )
            ) : (
              <div className="dataset-assets-list">
                {(map.maplayers || []).map((layer) => (
                  <div key={layer.pk} className="dataset-asset-card" style={{ cursor: 'default' }}>
                    <strong>{layer.dataset?.title || layer.name}</strong>
                  </div>
                ))}
                {(!map.maplayers || map.maplayers.length === 0) && (
                  <div className="dataset-attributes-empty"><p>Belum ada linked resources untuk peta ini.</p></div>
                )}
              </div>
            )}
          </section>
        )}

        <div className="dataset-back">
          <Link to="/peta">← Kembali ke Peta</Link>
        </div>

      </section>

    </main>

  )
}

export default PetaDetail