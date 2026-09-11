import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getMapDetail } from '../api/mapApi'
import { getPublishedDetail, getDatasetViewDetail } from '../api/myDatasetApi'
import { getDatasetDetail, getDatasetFeatures } from '../api/datasetApi'
import { getMapLayersOverride, saveMapLayers, saveMapLayersOverride } from '../api/mapLayerApi'
import { adaptOwnResource } from '../utils/ownDataAdapter'
import { getOwnerName, getOwnerAvatar, stripHtml } from '../utils/datasetUtils'
import { useAuth } from '../context/AuthContext'
import CopyLinkButton from '../components/CopyLinkButton'
import BackToTopButton from '../components/BackToTopButton'
import OwnerBadge from '../components/OwnerBadge'
import GeoFeatureExplorer from '../components/GeoFeatureExplorer'
import AddDatasetLayerModal from '../components/AddDatasetLayerModal'

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

function toBboxWKT(bbox) {
  if (!bbox) return ''
  const { minLon, minLat, maxLon, maxLat } = bbox
  return `POLYGON ((${minLon} ${minLat}, ${minLon} ${maxLat}, ${maxLon} ${maxLat}, ${maxLon} ${minLat}, ${minLon} ${minLat}))`
}

function toPointWKT(center) {
  if (!center) return ''
  return `POINT (${center.lon} ${center.lat})`
}

function buildLocationImageUrl(bbox, center) {
  if (!center) return null

  const zoom = 6
  const width = 640
  const height = 320
  const color = '3a6ea5'
  const bboxPath = bbox
    ? `&path=color:0x${color}ff|weight:3|${bbox.minLat},${bbox.minLon}|${bbox.minLat},${bbox.maxLon}|${bbox.maxLat},${bbox.maxLon}|${bbox.maxLat},${bbox.minLon}|${bbox.minLat},${bbox.minLon}`
    : ''

  const latRad = (center.lat * Math.PI) / 180
  const metersPerPixel = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom)
  const armMeters = 9 * metersPerPixel
  const armLatDeg = armMeters / 111320
  const armLonDeg = armMeters / (111320 * Math.max(Math.cos(latRad), 0.1))
  const crosshairPath =
    `&path=color:0x${color}ff|weight:3` +
    `|${center.lat},${center.lon - armLonDeg}` +
    `|${center.lat},${center.lon}` +
    `|${center.lat + armLatDeg},${center.lon}` +
    `|${center.lat},${center.lon}` +
    `|${center.lat},${center.lon + armLonDeg}` +
    `|${center.lat},${center.lon}` +
    `|${center.lat - armLatDeg},${center.lon}`

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat},${center.lon}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik${bboxPath}${crosshairPath}`
}

function isUrl(value) {
  if (typeof value !== 'string') return false
  return /^https?:\/\//i.test(value.trim())
}

function PetaDetail() {

  const { id } = useParams()
  const isOwnId = typeof id === 'string' && id.startsWith('own-')
  const { isAuthenticated, isAdmin } = useAuth()
  const [map, setMap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info')
  const [apiMapLayers, setApiMapLayers] = useState([])
  const [layerDatasets, setLayerDatasets] = useState([])
  const [layersLoading, setLayersLoading] = useState(false)
  const [layerSaving, setLayerSaving] = useState(false)
  const [showAddLayerModal, setShowAddLayerModal] = useState(false)
  const canManageLayers = isOwnId ? isAuthenticated : isAdmin
  const layerRefs = (isOwnId ? (map?._map_layers || []) : apiMapLayers)
    .map((ref) => ({ ...ref, source: ref.source || 'own' }))

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

  }, [id, isOwnId, isAuthenticated])

  useEffect(() => {

    if (isOwnId || !map || !isAdmin) {
      setApiMapLayers([])
      return
    }

    let mounted = true

    async function loadOverride() {
      try {
        const layers = await getMapLayersOverride('map', id)
        if (mounted) setApiMapLayers(layers)
      } catch (err) {
        console.error('Gagal mengambil layer peta tersimpan:', err)
      }
    }

    loadOverride()

    return () => { mounted = false }

  }, [map, isOwnId, isAdmin, id])

  useEffect(() => {

    if (layerRefs.length === 0) {
      setLayerDatasets([])
      return
    }

    let mounted = true

    async function loadLayers() {

      setLayersLoading(true)

      const results = await Promise.all(
        layerRefs.map(async (layerRef) => {

          try {

            if (layerRef.source === 'api') {

              const detail = await getDatasetDetail(layerRef.id).catch(() => null)
              const item = detail?.dataset || detail

              if (!item) {
                return { ...layerRef, geojson: null, missing: true }
              }

              const typeName = item.alternate || item.typename
              const featureCollection = typeName
                ? await getDatasetFeatures(typeName).catch(() => null)
                : null

              return {
                ...layerRef,
                title: item.title || layerRef.title,
                geojson: featureCollection,
                missing: false,
              }

            }

            let rawData = null
            try { rawData = await getPublishedDetail(layerRef.id) } catch { rawData = null }

            if (!rawData && isAuthenticated) {
              try { rawData = await getDatasetViewDetail(layerRef.id) } catch { rawData = null }
            }

            if (!rawData) {
              return { ...layerRef, geojson: null, missing: true }
            }

            const adapted = adaptOwnResource(rawData)

            return {
              ...layerRef,
              title: adapted?.title || layerRef.title,
              geojson: adapted?._geojson || null,
              missing: false,
            }

          } catch (err) {
            console.error('Gagal mengambil detail layer dataset:', err)
            return { ...layerRef, geojson: null, missing: true }
          }

        })
      )

      if (mounted) setLayerDatasets(results)
      setLayersLoading(false)

    }

    loadLayers()

    return () => { mounted = false }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(layerRefs), isAuthenticated])

  async function persistLayers(nextLayers) {
    if (isOwnId) {
      await saveMapLayers(map._rawId, nextLayers)
      setMap((current) => (current ? { ...current, _map_layers: nextLayers } : current))
    } else {
      await saveMapLayersOverride('map', id, nextLayers)
      setApiMapLayers(nextLayers)
    }
  }

  async function handleAddLayer(dataset) {

    const nextLayers = [
      ...layerRefs,
      { id: dataset.id, source: dataset.source, title: dataset.title, category: dataset.category },
    ]

    setLayerSaving(true)

    try {

      await persistLayers(nextLayers)
      setShowAddLayerModal(false)

    } catch (err) {

      console.error('Gagal menambah layer:', err)
      alert('Gagal menambah dataset sebagai layer.')

    } finally {

      setLayerSaving(false)

    }

  }

  async function handleRemoveLayer(layerRef) {

    const confirmed = window.confirm('Hapus dataset ini dari peta?')
    if (!confirmed) return

    const nextLayers = layerRefs.filter(
      (item) => !(item.id === layerRef.id && item.source === layerRef.source)
    )

    setLayerSaving(true)

    try {

      await persistLayers(nextLayers)

    } catch (err) {

      console.error('Gagal menghapus layer:', err)
      alert('Gagal menghapus layer.')

    } finally {

      setLayerSaving(false)

    }

  }

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
  const ownerAvatar = getOwnerAvatar(map.owner)
  const bbox = getBoundingBox(map?.extent?.coords)
  const center = getCenter(bbox)
  const linkedResources = isOwnId ? (map._linked_resources || []) : []
  const regions = Array.isArray(map.regions) ? map.regions : []
  const bboxWKT = toBboxWKT(bbox)
  const pointWKT = toPointWKT(center)
  const combinedFeatures = [
    ...(map._geojson?.features || []),
    ...layerDatasets.flatMap((layer) =>
      (layer.geojson?.features || []).map((feature) => ({
        ...feature,
        properties: { ...(feature.properties || {}), _layerTitle: layer.title },
      }))
    ),
  ]

  const combinedGeojson = combinedFeatures.length > 0
    ? { type: 'FeatureCollection', features: combinedFeatures }
    : null

  const primaryLocationImageUrl = map.thumbnail_url || map.thumbnail || map.thumbnailUrl || null
  const fallbackLocationImageUrl = buildLocationImageUrl(bbox, center)
  const locationImageUrl =
    locationImageStage === 'primary'
      ? (primaryLocationImageUrl || fallbackLocationImageUrl)
      : locationImageStage === 'fallback'
        ? fallbackLocationImageUrl
        : null

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const fullMapUrl = map.embed_url || map.detail_url || null

  return (

    <main className="dataset-detail-page">

      <section className="dataset-detail-header">
        <div className="container">

          <div className="dataset-detail-topbar">
            <BackToTopButton to="/peta" label="Kembali ke Peta" />
          </div>

          <div className="dataset-breadcrumb">
            <Link to="/peta">Peta</Link><span> / </span><span>Detail</span>
          </div>

          <div className="dataset-resource-type">
            <span className="dataset-type-icon">◫</span>
            <span>Peta</span>
            <span className="dataset-from">dari</span>
            <span className="dataset-owner-link">{ownerName}</span>
            <span className="dataset-from">/</span>
            <span>{formatDate(map.date)}</span>
          </div>

          <div className="dataset-title-row">
            <h1>{map.title}</h1>
            <CopyLinkButton text={shareUrl} label="Salin tautan halaman ini" className="on-dark" />
          </div>

          {map.abstract && <p className="dataset-header-description">{stripHtml(map.abstract)}</p>}
        </div>
      </section>

      <section className="container dataset-detail-content">

        {map.embed_url ? (
          <div className="dataset-map-wrapper">
            <iframe src={map.embed_url} title={map.title} className="dataset-map-iframe" loading="lazy" allowFullScreen />
          </div>
        ) : combinedGeojson ? (
          <GeoFeatureExplorer geojson={combinedGeojson} title={map.title} attributes={map._attributes} />
        ) : null}

        <div className="dataset-tabs">
          <button type="button" className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>Info</button>
          <button type="button" className={activeTab === 'location' ? 'active' : ''} onClick={() => setActiveTab('location')}>Location</button>
          <button type="button" className={activeTab === 'linked' ? 'active' : ''} onClick={() => setActiveTab('linked')}>Linked Resources</button>
          <button type="button" className={activeTab === 'layers' ? 'active' : ''} onClick={() => setActiveTab('layers')}>Layer Peta</button>
        </div>

        {activeTab === 'info' && (
          <section className="dataset-info-section">
            <div className="dataset-info-grid">
              <div className="dataset-info-item"><span className="dataset-info-label">Title</span><span className="dataset-info-value">{map.title}</span></div>
              <div className="dataset-info-item">
                <span className="dataset-info-label">Owner</span>
                <span className="dataset-info-value">
                  <OwnerBadge name={ownerName} avatar={ownerAvatar} />
                </span>
              </div>
              <div className="dataset-info-item"><span className="dataset-info-label">Publication</span><span className="dataset-info-value">{formatDate(map.date)}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Added to catalog</span><span className="dataset-info-value">{formatDate(map.created)}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Last catalog modification</span><span className="dataset-info-value">{formatDate(map.last_updated)}</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Resource type</span><span className="dataset-info-value">map</span></div>
              <div className="dataset-info-item"><span className="dataset-info-label">Source</span><span className="dataset-info-value">{map.sourcetype || 'LOCAL'}</span></div>
              <div className="dataset-info-item">
                <span className="dataset-info-label">Point of contact</span>
                <span className="dataset-info-value">
                  <OwnerBadge name={ownerName} avatar={ownerAvatar} />
                </span>
              </div>
              <div className="dataset-info-item"><span className="dataset-info-label">Language</span><span className="dataset-info-value">{map.language || '-'}</span></div>
              <div className="dataset-info-item dataset-info-item-full">
                <span className="dataset-info-label">Supplemental information</span>
                <span className="dataset-info-value">{stripHtml(map.supplemental_information) || 'No information provided'}</span>
              </div>
            </div>

            {fullMapUrl && (
              <div className="dataset-full-metadata">
                <a
                  href={fullMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dataset-metadata-link icon-tooltip-btn"
                  data-tooltip="Buka peta ini dalam tampilan penuh"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                  </svg>
                  <strong>View Full Map</strong>
                </a>
              </div>
            )}
          </section>
        )}

        {activeTab === 'location' && (
          <section className="dataset-location-section">
            {bbox ? (
              <>
                {locationImageUrl && (
                  <div className="dataset-location-image">
                    <img
                      src={locationImageUrl}
                      alt={`Lokasi ${map.title}`}
                      loading="lazy"
                      onError={() => {
                        setLocationImageStage((currentStage) => {
                          if (
                            currentStage === 'primary' &&
                            fallbackLocationImageUrl &&
                            fallbackLocationImageUrl !== primaryLocationImageUrl
                          ) {
                            return 'fallback'
                          }
                          return 'none'
                        })
                      }}
                    />
                  </div>
                )}

                <div className="dataset-location-grid">
                  <div>
                    <span className="dataset-info-label">Spatial Reference</span>
                    <strong>{map.srid || 'EPSG:4326'}</strong>
                  </div>
                  <div>
                    <span className="dataset-info-label">Representation</span>
                    <strong>{map.spatial_representation_type || map.subtype || '-'}</strong>
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
                    <li key={index} className="dataset-keyword" style={{ display: 'block', marginBottom: '8px' }}>
                      {isUrl(item) ? (
                        <a href={item} target="_blank" rel="noopener noreferrer">{item}</a>
                      ) : (
                        item
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="dataset-attributes-empty"><p>Belum ada linked resources untuk peta ini.</p></div>
              )
            ) : (
              <div className="dataset-assets-list">
                {(map.maplayers || []).map((layer) => {
                  const layerUrl = layer.dataset?.detail_url || layer.dataset?.link || null
                  return layerUrl ? (
                    <a key={layer.pk} href={layerUrl} target="_blank" rel="noopener noreferrer" className="dataset-asset-card">
                      <strong>{layer.dataset?.title || layer.name}</strong>
                      <span className="dataset-asset-arrow">↗</span>
                    </a>
                  ) : (
                    <div key={layer.pk} className="dataset-asset-card" style={{ cursor: 'default' }}>
                      <strong>{layer.dataset?.title || layer.name}</strong>
                    </div>
                  )
                })}
                {(!map.maplayers || map.maplayers.length === 0) && (
                  <div className="dataset-attributes-empty"><p>Belum ada linked resources untuk peta ini.</p></div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'layers' && (

          <section className="dataset-assets-section">

            {canManageLayers && (
              <div className="layer-add-bar">
                <button
                  type="button"
                  className="admin-view-site"
                  onClick={() => setShowAddLayerModal(true)}
                >
                  + Tambah Dataset
                </button>
              </div>
            )}

            {layersLoading ? (

              <p>Memuat layer...</p>

            ) : layerRefs.length === 0 ? (

              <div className="dataset-attributes-empty">
                <p>Belum ada dataset yang ditambahkan sebagai layer pada peta ini.</p>
              </div>

            ) : (

              <div className="dataset-assets-list">
                {layerDatasets.map((layer) => (
                  <div key={`${layer.source}-${layer.id}`} className="layer-item-card">
                    <div>
                      <strong>{layer.title}</strong>
                      <span className={`layer-modal-badge ${layer.source}`}>
                        {layer.source === 'api' ? 'API Lama' : 'Upload Sendiri'}
                      </span>
                      {layer.missing && (
                        <span className="layer-item-missing">Dataset ini sudah tidak tersedia</span>
                      )}
                    </div>
                    {canManageLayers && (
                      <button
                        type="button"
                        className="admin-action-delete"
                        onClick={() => handleRemoveLayer(layer)}
                        disabled={layerSaving}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>

            )}

            {showAddLayerModal && (
              <AddDatasetLayerModal
                onClose={() => setShowAddLayerModal(false)}
                onAdd={handleAddLayer}
                excludeKeys={layerRefs.map((item) => `${item.source}-${item.id}`)}
                saving={layerSaving}
              />
            )}

          </section>

        )}

      </section>

    </main>

  )
}

export default PetaDetail