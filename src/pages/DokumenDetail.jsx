import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getDocumentDetail } from '../api/documentApi'
import { getPublishedDetail, getDatasetViewDetail } from '../api/myDatasetApi'
import { adaptOwnResource } from '../utils/ownDataAdapter'
import { mapCategory, getOwnerName, getOwnerAvatar, stripHtml } from '../utils/datasetUtils'
import { useAuth } from '../context/AuthContext'
import CopyLinkButton from '../components/CopyLinkButton'
import BackToTopButton from '../components/BackToTopButton'
import OwnerBadge from '../components/OwnerBadge'
import LocationBoundsMap from '../components/LocationBoundsMap'

function formatDate(date) {
  if (!date) return '-'
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return '-'
  return parsedDate.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateOnly(date) {
  if (!date) return '-'
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return '-'
  return parsedDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getBoundingBox(coords) {
  if (!Array.isArray(coords) || coords.length < 4) return null
  const [minLon, minLat, maxLon, maxLat] = coords
  return { minLon, minLat, maxLon, maxLat }
}

function getCenter(bbox) {
  if (!bbox) return null
  return {
    lat: (bbox.minLat + bbox.maxLat) / 2,
    lon: (bbox.minLon + bbox.maxLon) / 2,
  }
}


function toBboxWKT(bbox) {
  if (!bbox) return ''
  const { minLon, minLat, maxLon, maxLat } = bbox
  return `POLYGON ((${minLon} ${minLat}, ${minLon} ${maxLat}, ${maxLon} ${maxLat}, ${maxLon} ${minLat}, ${minLon} ${minLat}))`
}

function toPointWKT(center) {
  if (!center) return ''
  return `POINT (${center.lon} ${center.lat})`
}

function getDocumentViewUrl(doc, links) {
  if (doc?.embed_url) return doc.embed_url
  return getDocumentDownloadUrl(doc, links)
}

function getDocumentDownloadUrl(doc, links) {
  const uploadedLink = links.find((link) => link?.link_type === 'uploaded')
  if (uploadedLink) {
    return uploadedLink.extras?.content?.download_url || uploadedLink.url || null
  }

  const dataLink = links.find((link) => link?.link_type === 'data' && link?.url)
  if (dataLink) return dataLink.url

  return doc?.download_url || doc?.doc_url || doc?.detail_url || null
}

function getDocumentFileName(doc, links) {
  const uploadedLink = links.find((link) => link?.link_type === 'uploaded')
  if (uploadedLink) return uploadedLink.name || uploadedLink.extras?.content?.title || doc?.title

  const dataLink = links.find((link) => link?.link_type === 'data')
  if (dataLink) return dataLink.name || doc?.title

  return doc?.file_name || doc?.title || 'Dokumen'
}

function findMetadataUrl(doc, links) {
  const directUrl = doc?.metadata_detail_url || doc?.metadata_url || doc?.metadata_detail
  if (typeof directUrl === 'string' && directUrl.trim() !== '' && directUrl !== '#') {
    return directUrl
  }

  const isoLink = links.find((link) => {
    if (!link) return false
    const type = String(link.link_type || '').toLowerCase()
    const name = String(link.name || link.title || '').toLowerCase()
    return type === 'metadata' && name.includes('iso')
  })
  if (isoLink?.url) return isoLink.url

  const anyMetadataLink = links.find(
    (link) => String(link?.link_type || '').toLowerCase() === 'metadata' && link?.url
  )
  if (anyMetadataLink?.url) return anyMetadataLink.url

  return null
}

function DokumenDetail() {

  const { id } = useParams()
  const isOwnId = typeof id === 'string' && id.startsWith('own-')
  const { isAuthenticated } = useAuth()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info')
  const [locationImageStage, setLocationImageStage] = useState('primary')

  useEffect(() => {

    setLocationImageStage('primary')

    async function fetchDetail() {

      try {

        setLoading(true)
        setError('')

        if (isOwnId) {

          const rawId = id.replace('own-', '')

          let rawData = null
          try { rawData = await getPublishedDetail(rawId) } catch { rawData = null }

          if (!rawData && isAuthenticated) {
            try { rawData = await getDatasetViewDetail(rawId) } catch {}
          }

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

  }, [id, isOwnId, isAuthenticated])

  if (loading) {
    return (
      <main className="dataset-detail-page">
        <div className="container py-5"><p>Memuat detail dokumen...</p></div>
      </main>
    )
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
  const ownerAvatar = getOwnerAvatar(doc.owner)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const links = Array.isArray(doc.links) ? doc.links : []
  const keywords = Array.isArray(doc.keywords) ? doc.keywords : []
  const regions = Array.isArray(doc.regions) ? doc.regions : []
  const category = mapCategory(doc?.category?.identifier)

  const pointOfContact =
    Array.isArray(doc.poc) && doc.poc.length > 0
      ? getOwnerName(doc.poc[0])
      : ownerName

  const bbox = getBoundingBox(doc?.extent?.coords)
  const center = getCenter(bbox)
  const bboxWKT = toBboxWKT(bbox)
  const pointWKT = toPointWKT(center)
  const primaryLocationImageUrl = doc.thumbnail_url || doc.thumbnail || doc.thumbnailUrl || null
  const showPrimaryLocationImage = Boolean(primaryLocationImageUrl) && locationImageStage === 'primary'
  const fullMetadataUrl = findMetadataUrl(doc, links)
  const documentViewUrl = getDocumentViewUrl(doc, links)
  const documentDownloadUrl = getDocumentDownloadUrl(doc, links)
  const documentFileName = getDocumentFileName(doc, links)
  const uploadedAssetLinks = links.filter((link) => link?.link_type === 'uploaded')
  const documentAssets =
    uploadedAssetLinks.length > 0
      ? uploadedAssetLinks
      : links.filter((link) => link?.link_type === 'data')

  return (

    <main className="dataset-detail-page">

      <section className="dataset-detail-header">
        <div className="container">

          <div className="dataset-detail-topbar">
            <BackToTopButton to="/dokumen" label="Kembali ke Dokumen" />
          </div>

          <div className="dataset-breadcrumb">
            <Link to="/dokumen">Dokumen</Link><span> / </span><span>Detail</span>
          </div>

          <div className="dataset-resource-type">
            <span className="dataset-type-icon">▤</span>
            <span>Document</span>
            <span className="dataset-from">dari</span>
            <span className="dataset-owner-link">{ownerName}</span>
            <span className="dataset-from">/</span>
            <span>{formatDateOnly(doc.date)}</span>
          </div>

          <div className="dataset-title-row">
            <h1>{doc.title}</h1>
            <CopyLinkButton text={shareUrl} label="Salin tautan halaman ini" className="on-dark" />
          </div>

          {doc.abstract && (
            <p className="dataset-header-description">{stripHtml(doc.abstract)}</p>
          )}

        </div>
      </section>

      <section className="container dataset-detail-content">

        {documentViewUrl && (
          <>
            <div className="dataset-map-wrapper">
              <iframe
                src={documentViewUrl}
                title={`Dokumen ${doc.title}`}
                className="dataset-map-iframe"
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '34px' }}>
              <a
                href={documentViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                </svg>
                Lihat Halaman Penuh
              </a>

              {documentDownloadUrl && (
                <a
                  href={documentDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" />
                  </svg>
                  Unduh Dokumen
                </a>
              )}
            </div>
          </>
        )}

        <div className="dataset-tabs">

          <button
            type="button"
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>

          <button
            type="button"
            className={activeTab === 'location' ? 'active' : ''}
            onClick={() => setActiveTab('location')}
          >
            Location
          </button>

          <button
            type="button"
            className={activeTab === 'assets' ? 'active' : ''}
            onClick={() => setActiveTab('assets')}
          >
            Assets
          </button>

        </div>

        {activeTab === 'info' && (

          <section className="dataset-info-section">

            <div className="dataset-info-grid">

              <div className="dataset-info-item">
                <span className="dataset-info-label">Title</span>
                <span className="dataset-info-value">{doc.title || '-'}</span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Owner</span>
                <span className="dataset-info-value">
                  <OwnerBadge name={ownerName} avatar={ownerAvatar} />
                </span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Creation</span>
                <span className="dataset-info-value">{formatDate(doc.date)}</span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Added to catalog</span>
                <span className="dataset-info-value">{formatDate(doc.created)}</span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Last catalog modification</span>
                <span className="dataset-info-value">{formatDate(doc.last_updated)}</span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Resource type</span>
                <span className="dataset-info-value">{doc.resource_type || 'document'}</span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Source</span>
                <span className="dataset-info-value">{doc.sourcetype || 'LOCAL'}</span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Category</span>
                <span className="dataset-info-value">{category}</span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Point of contact</span>
                <span className="dataset-info-value">{pointOfContact}</span>
              </div>

              <div className="dataset-info-item dataset-info-item-full">
                <span className="dataset-info-label">Keywords</span>
                <div className="dataset-keywords">
                  {keywords.length > 0 ? (
                    keywords.map((keyword, index) => (
                      <span key={keyword.slug || keyword.name || index} className="dataset-keyword">
                        {keyword.name || keyword}
                      </span>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Regions</span>
                <div className="dataset-keywords">
                  {regions.length > 0 ? (
                    regions.map((region, index) => (
                      <span key={region.code || region.name || index} className="dataset-keyword">
                        {region.name || region}
                      </span>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>

              <div className="dataset-info-item dataset-info-item-full">
                <span className="dataset-info-label">Attribution</span>
                <span className="dataset-info-value">{doc.attribution || '-'}</span>
              </div>

              <div className="dataset-info-item">
                <span className="dataset-info-label">Language</span>
                <span className="dataset-info-value">{doc.language || '-'}</span>
              </div>

              <div className="dataset-info-item dataset-info-item-full">
                <span className="dataset-info-label">Supplemental information</span>
                <span className="dataset-info-value">
                  {stripHtml(doc.supplemental_information) || 'No information provided'}
                </span>
              </div>

            </div>

            <div className="dataset-full-metadata">
              {fullMetadataUrl ? (
                <a
                  href={fullMetadataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dataset-metadata-link"
                >
                  <strong>View full metadata</strong>
                  <span>↗</span>
                </a>
              ) : (
                <span
                  className="dataset-metadata-link dataset-metadata-disabled"
                  title="Metadata lengkap belum tersedia"
                >
                  <strong>View full metadata</strong>
                  <span>↗</span>
                </span>
              )}
            </div>

          </section>

        )}

        {activeTab === 'location' && (

          <section className="dataset-location-section">

            {bbox ? (

              <>

                {showPrimaryLocationImage ? (
                  <div className="dataset-location-image">
                    <img
                      src={primaryLocationImageUrl}
                      alt={`Lokasi ${doc.title}`}
                      loading="lazy"
                      onError={() => setLocationImageStage('fallback')}
                    />
                  </div>
                ) : (
                  <LocationBoundsMap bbox={bbox} center={center} />
                )}

                <div className="dataset-location-grid">
                  <div>
                    <span className="dataset-info-label">Spatial Reference</span>
                    <strong>{doc.srid || 'EPSG:4326'}</strong>
                  </div>
                  <div>
                    <span className="dataset-info-label">Representation</span>
                    <strong>{doc.spatial_representation_type || doc.subtype || '-'}</strong>
                  </div>
                  <div>
                    <span className="dataset-info-label">Region</span>
                    <strong>
                      {regions.length > 0
                        ? regions.map((region) => region.name || region).join(', ')
                        : '-'}
                    </strong>
                  </div>
                </div>

                <div className="dataset-bbox">
                  <h4>
                    <span>Bounding Box (WGS84)</span>
                    <CopyLinkButton text={bboxWKT} label="Salin WKT Bounding Box" />
                  </h4>
                  <div className="dataset-bbox-grid">
                    <div><span>Min Lat</span><strong>{bbox.minLat.toFixed(6)}</strong></div>
                    <div><span>Min Lon</span><strong>{bbox.minLon.toFixed(6)}</strong></div>
                    <div><span>Max Lat</span><strong>{bbox.maxLat.toFixed(6)}</strong></div>
                    <div><span>Max Lon</span><strong>{bbox.maxLon.toFixed(6)}</strong></div>
                  </div>
                  <code className="dataset-wkt-code">{bboxWKT}</code>
                </div>

                {center && (
                  <div className="dataset-center-card">
                    <h4>
                      <span>Center (WGS84)</span>
                      <CopyLinkButton text={pointWKT} label="Salin WKT Center" />
                    </h4>
                    <div className="dataset-center-values">
                      <div><span>Lat</span><strong>{center.lat.toFixed(6)}</strong></div>
                      <div><span>Lon</span><strong>{center.lon.toFixed(6)}</strong></div>
                    </div>
                    <code className="dataset-wkt-code">{pointWKT}</code>
                  </div>
                )}

              </>

            ) : (

              <div className="dataset-attributes-empty">
                <p>Informasi lokasi belum tersedia untuk dokumen ini.</p>
              </div>

            )}

          </section>

        )}

        {activeTab === 'assets' && (

          <section className="dataset-assets-section">

            <div className="dataset-assets-header">
              <span className="section-eyebrow">RESOURCES</span>
              <h3>Assets</h3>
              <p>Berkas dokumen yang tersedia untuk diunduh.</p>
            </div>

            {documentAssets.length > 0 ? (

              <div className="dataset-assets-list">

                {documentAssets.map((link, index) => {

                  const downloadUrl = link?.extras?.content?.download_url || link?.url
                  if (!downloadUrl) return null

                  return (
                    <a
                      key={`${link.name || 'dokumen'}-${index}`}
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dataset-asset-card"
                    >
                      <span className="dataset-asset-icon">↓</span>
                      <div className="dataset-asset-content">
                        <strong>{link.name || link.title || documentFileName}</strong>
                        <span>{(link.extension || doc.extension || '').toUpperCase() || link.mime || 'Download'}</span>
                      </div>
                      <span className="dataset-asset-arrow">↗</span>
                    </a>
                  )

                })}

              </div>

            ) : documentFileUrl ? (

              <div className="dataset-assets-list">
                <a
                  href={documentFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dataset-asset-card"
                >
                  <span className="dataset-asset-icon">↓</span>
                  <div className="dataset-asset-content">
                    <strong>{documentFileName}</strong>
                    <span>{(doc.extension || '').toUpperCase() || doc.mime_type || 'Download'}</span>
                  </div>
                  <span className="dataset-asset-arrow">↗</span>
                </a>
              </div>

            ) : (

              <div className="dataset-attributes-empty">
                <div className="dataset-empty-icon">▧</div>
                <h4>Belum ada assets</h4>
                <p>Berkas untuk dokumen ini belum tersedia.</p>
              </div>

            )}

          </section>

        )}

      </section>

    </main>

  )
}

export default DokumenDetail