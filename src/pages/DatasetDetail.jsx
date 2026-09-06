import {
  useEffect,
  useState,
} from 'react'

import {
  useParams,
  Link,
} from 'react-router'

import {
  getDatasetDetail,
  getDatasetAttributes,
} from '../api/datasetApi'

import {
  getPublishedDetail,
  getMyDatasetDetail, 
  getAdminDatasetDetail,
  getDatasetViewDetail,
} from '../api/myDatasetApi'

import {
  adaptOwnResource,
} from '../utils/ownDataAdapter'

import {
  mapCategory,
  getOwnerName,
  getOwnerAvatar,
  stripHtml,
} from '../utils/datasetUtils'

import { useAuth } from '../context/AuthContext'

import CopyLinkButton from '../components/CopyLinkButton'
import BackToTopButton from '../components/BackToTopButton'

import GeoFeatureExplorer from '../components/GeoFeatureExplorer'

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(date) {

  if (!date) {
    return '-'
  }


  const parsedDate =
    new Date(date)


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return '-'
  }


  return parsedDate.toLocaleString(
    'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  )

}


// =====================================================
// FORMAT DATE ONLY
// =====================================================

function formatDateOnly(date) {

  if (!date) {
    return '-'
  }


  const parsedDate =
    new Date(date)


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return '-'
  }


  return parsedDate.toLocaleDateString(
    'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )

}


// =====================================================
// LINK ICON
// =====================================================

function getLinkIcon(link) {

  if (
    link?.link_type === 'data'
  ) {
    return '↓'
  }


  if (
    link?.link_type === 'image'
  ) {
    return '▧'
  }


  if (
    link?.link_type === 'metadata'
  ) {
    return '◫'
  }


  return '↗'

}


// =====================================================
// BOUNDING BOX
// =====================================================

function getBoundingBox(coords) {

  if (
    !Array.isArray(coords) ||
    coords.length < 4
  ) {
    return null
  }


  const [
    minLon,
    minLat,
    maxLon,
    maxLat,
  ] = coords


  return {
    minLon,
    minLat,
    maxLon,
    maxLat,
  }

}


// =====================================================
// CENTER
// =====================================================

function getCenter(coords) {

  const bbox =
    getBoundingBox(coords)


  if (!bbox) {
    return null
  }


  return {

    lat:
      (
        bbox.minLat +
        bbox.maxLat
      ) / 2,

    lon:
      (
        bbox.minLon +
        bbox.maxLon
      ) / 2,

  }

}


// =====================================================
// WKT (Well Known Text) — dipakai untuk tombol copy
// di Bounding Box & Center, mengikuti format yang sama
// dengan halaman detail Peta & Dokumen.
// =====================================================

function toBboxWKT(bbox) {

  if (!bbox) {
    return ''
  }

  const {
    minLon,
    minLat,
    maxLon,
    maxLat,
  } = bbox


  return `POLYGON ((${minLon} ${minLat}, ${minLon} ${maxLat}, ${maxLon} ${maxLat}, ${maxLon} ${minLat}, ${minLon} ${minLat}))`
}


function toPointWKT(center) {

  if (!center) {
    return ''
  }

  return `POINT (${center.lon} ${center.lat})`

}


// =====================================================
// GAMBAR LOKASI (mirip preview lokasi di web SIG lama),
// dirender dari static map OpenStreetMap berdasarkan
// titik tengah & bounding box dataset.
// =====================================================

function buildLocationImageUrl(bbox, center) {
  if (!center) return null

  const zoom = 6
  const width = 640
  const height = 320
  const color = '3a6ea5'

  // Kotak Bounding Box (garis tepi biru saja, tanpa isi),
  // sama seperti tampilan tab Location di web SIG lama.
  const bboxPath = bbox
    ? `&path=color:0x${color}ff|weight:3|${bbox.minLat},${bbox.minLon}|${bbox.minLat},${bbox.maxLon}|${bbox.maxLat},${bbox.maxLon}|${bbox.maxLat},${bbox.minLon}|${bbox.minLat},${bbox.minLon}`
    : ''

  // Tanda "+" (crosshair) di titik tengah — digambar sebagai
  // garis pendek yang berpotongan (BUKAN pin marker), persis
  // seperti web SIG lama. Panjang lengan dihitung dari
  // resolusi peta (meter/pixel) di zoom & latitude tersebut,
  // supaya ukurannya konsisten (~9px) di posisi mana pun.
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


// =====================================================
// NORMALIZE ATTRIBUTES RESPONSE
// =====================================================

function normalizeAttributes(
  response
) {

  if (!response) {
    return []
  }


  if (
    Array.isArray(response)
  ) {
    return response
  }


  if (
    Array.isArray(
      response.attributes
    )
  ) {
    return response.attributes
  }


  if (
    Array.isArray(
      response.data
    )
  ) {
    return response.data
  }


  if (
    Array.isArray(
      response.results
    )
  ) {
    return response.results
  }


  if (
    Array.isArray(
      response.fields
    )
  ) {
    return response.fields
  }


  return []

}


// =====================================================
// NORMALIZE ATTRIBUTE
// =====================================================

function normalizeAttribute(
  attribute,
  index
) {

  if (!attribute) {

    return {

      id: index,

      name:
        `field_${index + 1}`,

      label: 'N/A',

      description: 'N/A',

    }

  }


  const name =
    attribute.name ||
    attribute.attribute ||
    attribute.field_name ||
    attribute.field ||
    attribute.column ||
    `field_${index + 1}`


  const label =
    attribute.label ||
    attribute.title ||
    attribute.display_name ||
    'N/A'


  const description =
    attribute.description ||
    attribute.desc ||
    attribute.abstract ||
    'N/A'


  return {

    id:
      attribute.id ||
      attribute.pk ||
      name ||
      index,

    name,

    label,

    description,

  }

}


// =====================================================
// FIND METADATA URL
// =====================================================

function findMetadataUrl(
  dataset,
  links = []
) {

  const directUrl =
    dataset?.metadata_detail_url ||
    dataset?.metadata_url ||
    dataset?.metadata_detail


  if (
    typeof directUrl === 'string' &&
    directUrl.trim() !== '' &&
    directUrl !== '#'
  ) {
    return directUrl
  }


  if (
    typeof dataset?.metadata ===
      'object'
  ) {

    const metadataObjectUrl =
      dataset.metadata.url ||
      dataset.metadata.href ||
      dataset.metadata.link


    if (
      typeof metadataObjectUrl ===
        'string' &&
      metadataObjectUrl.trim() !== '' &&
      metadataObjectUrl !== '#'
    ) {
      return metadataObjectUrl
    }

  }

  const metadataLink = links.find((link) => {
    if (!link) {
          return false
        }


        const type =
          String(
            link.link_type || ''
          ).toLowerCase()


        const name =
          String(
            link.name ||
            link.title ||
            ''
          ).toLowerCase()


        const url =
          String(
            link.url || ''
          ).toLowerCase()


        return (
          type === 'metadata' ||
          name.includes('metadata') ||
          name.includes('iso') ||
          url.includes('metadata')
        )
  })


  if (
    metadataLink?.url
  ) {
    return metadataLink.url
  }


  return null

}


// =====================================================
// COMPONENT
// =====================================================

function DatasetDetail() {

  const { id } =
    useParams()


  // ===================================================
  // APAKAH DATA UPLOAD SENDIRI?
  // ===================================================

  const isOwnId =
    typeof id === 'string' &&
    id.startsWith('own-')

  const { isAdmin, isAuthenticated } = useAuth()

  // ===================================================
  // DATASET
  // ===================================================

  const [dataset, setDataset] =
    useState(null)


  const [loading, setLoading] =
    useState(true)


  const [error, setError] =
    useState('')


  // ===================================================
  // TAB
  // ===================================================

  const [activeTab, setActiveTab] =
    useState('info')


  // ===================================================
  // ATTRIBUTES
  // ===================================================

  const [attributes, setAttributes] =
    useState([])


  const [
    attributesLoading,
    setAttributesLoading,
  ] = useState(false)


    const [
    attributesError,
    setAttributesError,
  ] = useState('')


  // ===================================================
  // GAMBAR LOKASI (fallback berlapis)
  // ===================================================
  //
  // 'primary'  = coba thumbnail_url asli dari API dulu
  // 'fallback' = thumbnail_url gagal, coba peta statis
  //              hasil generate dari bounding box
  // 'none'     = keduanya gagal, sembunyikan gambar
  //              (jangan tampilkan ikon broken image)
  //
  // ===================================================

  const [
    locationImageStage,
    setLocationImageStage,
  ] = useState('primary')


  // ===================================================
  // FETCH DETAIL
  // ===================================================

  useEffect(() => {

    let mounted = true

    // Reset fallback gambar lokasi setiap kali pindah
    // ke dataset lain, supaya tidak "nyangkut" di stage
    // fallback/none milik dataset sebelumnya.
    setLocationImageStage('primary')

    async function fetchDetail() {

      try {

        setLoading(true)
        setError('')


        // =============================================
        // DATA UPLOAD SENDIRI
        // =============================================

        if (isOwnId) {

          const rawId =
            id.replace('own-', '')


          let rawDataset = null

          try {
            rawDataset = await getPublishedDetail(rawId)
          } catch {
            rawDataset = null
          }

          if (!rawDataset && isAdmin) {
            try { rawDataset = await getAdminDatasetDetail(rawId) } catch {}
          }

          if (!rawDataset && isAuthenticated) {
            try { rawDataset = await getMyDatasetDetail(rawId) } catch {}
          }

          // SESI 6: fallback terakhir — pengguna login mana pun (operator
          // lain, bukan pemilik & bukan admin) tetap bisa MELIHAT dataset
          // ini read-only walau belum dipublikasikan.
          if (!rawDataset && isAuthenticated) {
            try { rawDataset = await getDatasetViewDetail(rawId) } catch {}
          }

          if (!rawDataset) {

            if (mounted) {
              setError('Dataset tidak ditemukan atau kamu tidak punya izin melihatnya.')
            }

            return

          }


          const adapted =
            adaptOwnResource(
              rawDataset
            )


          console.log(
            'Detail Dataset Sendiri:',
            adapted
          )


          if (mounted) {

            setDataset(
              adapted
            )

          }


          return

        }


        // =============================================
        // DATA API LAMA
        // =============================================

        const response =
          await getDatasetDetail(id)


        console.log(
          'Detail API:',
          response
        )


        const result =
          response?.dataset ||
          response?.resource ||
          response


        if (mounted) {

          setDataset(
            result
          )

        }

      } catch (err) {

        console.error(
          'Gagal mengambil detail dataset:',
          err
        )


        if (mounted) {

          setError(
            'Gagal mengambil detail dataset.'
          )

        }

      } finally {

        if (mounted) {
          setLoading(false)
        }

      }

    }


    if (id) {
      fetchDetail()
    } else {

      setLoading(false)

      setError(
        'ID dataset tidak tersedia.'
      )

    }


    return () => {
      mounted = false
    }

  }, [id, isOwnId])


  // ===================================================
  // FETCH ATTRIBUTES
  // ===================================================
  //
  // Data upload sendiri (own-*) pakai attributes dari
  // extra_metadata (diisi lewat form upload), TIDAK
  // memanggil GeoServer. Data API lama tetap memanggil
  // GeoServer seperti biasa.
  //
  // ===================================================

  useEffect(() => {

    if (!dataset) {
      return
    }


    if (isOwnId) {

      setAttributes(
        Array.isArray(dataset._attributes)
          ? dataset._attributes.map((attribute, index) => ({
              id: attribute.name || index,
              name: attribute.name || `field_${index + 1}`,
              label: attribute.label || 'N/A',
              description: attribute.description || 'N/A',
            }))
          : []
      )

      setAttributesLoading(false)
      setAttributesError('')

      return

    }


    let mounted = true


    async function fetchAttributes() {

      try {

        setAttributesLoading(true)
        setAttributesError('')


        const attributeId =
          dataset.alternate ||
          dataset.typename ||
          dataset.type_name ||
          dataset.uuid ||
          id


        console.log(
          'Attribute ID:',
          attributeId
        )


        const response =
          await getDatasetAttributes(
            attributeId
          )


        console.log(
          'Attributes API:',
          response
        )


        const normalizedResponse =
          normalizeAttributes(
            response
          )


        const normalizedAttributes =
          normalizedResponse.map(
            normalizeAttribute
          )


        console.log(
          'Normalized attributes:',
          normalizedAttributes
        )


        if (mounted) {

          setAttributes(
            normalizedAttributes
          )

        }

      } catch (err) {

        console.error(
          'Gagal mengambil attributes:',
          err
        )


        if (mounted) {

          setAttributesError(
            'Metadata atribut belum lengkap.'
          )

          setAttributes([])

        }

      } finally {

        if (mounted) {
          setAttributesLoading(false)
        }

      }

    }


    fetchAttributes()


    return () => {
      mounted = false
    }

  }, [dataset, id, isOwnId])


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (

      <main className="dataset-detail-page">

        <div className="container py-5">

          <div className="dataset-detail-loading">

            <div className="loading-spinner" />

            <p>
              Memuat detail dataset...
            </p>

          </div>

        </div>

      </main>

    )

  }

  if (!dataset) {

    return (

      <main className="dataset-detail-page">

        <div className="container py-5">

          <div className="dataset-detail-error">

            <h4>
              Dataset tidak ditemukan
            </h4>

            <p>
              {error ||
                'Data dataset tidak tersedia.'}
            </p>

            <Link
              to="/katalog"
              className="btn btn-primary"
            >
              Kembali ke Katalog
            </Link>

          </div>

        </div>

      </main>

    )

  }


  // ===================================================
  // DATA
  // ===================================================

  const owner =
    dataset.owner || null


  const ownerName =
    getOwnerName(owner)


  const ownerAvatar =
    getOwnerAvatar(owner)


  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : ''


  const category =
    mapCategory(
      dataset?.category?.identifier
    )


  const keywords =
    Array.isArray(
      dataset.keywords
    )
      ? dataset.keywords
      : []


  const regions =
    Array.isArray(
      dataset.regions
    )
      ? dataset.regions
      : []


  const links =
    Array.isArray(
      dataset.links
    )
      ? dataset.links
      : []


  const bbox =
    getBoundingBox(
      dataset?.extent?.coords
    )


  const center =
    getCenter(
      dataset?.extent?.coords
    )


  const bboxWKT =
    toBboxWKT(bbox)


  const pointWKT =
    toPointWKT(center)


  const locationImageUrl =
    buildLocationImageUrl(
      bbox,
      center
    )


  // ===================================================
  // METADATA
  // ===================================================

  const fullMetadataUrl =
    findMetadataUrl(
      dataset,
      links
    )


  // ===================================================
  // RESOURCE LINKS
  // ===================================================

  const originalLinks =
    links.filter(
      (link) => {

        if (
          link?.link_type !== 'data'
        ) {
          return false
        }


        const name =
          String(
            link.name ||
            link.title ||
            ''
          ).toLowerCase()


        return (
          name === 'original'
        )

      }
    )


  const dataLinks =
    originalLinks.length > 0
      ? originalLinks
      : links.filter(
          (link) =>
            link?.link_type ===
            'data'
        )


  const imageLinks =
    links.filter(
      (link) =>
        link?.link_type ===
        'image'
    )


  const metadataLinks =
    links.filter(
      (link) =>
        link?.link_type ===
        'metadata'
    )


  const infoLinks =
    links.filter(
      (link) =>
        ![
          'data',
          'image',
          'metadata',
        ].includes(
          link?.link_type
        )
    )


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <main className="dataset-detail-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <section className="dataset-detail-header">

        <div className="container">

          <div className="dataset-detail-topbar">
            <BackToTopButton to="/katalog" label="Kembali ke Katalog" />
          </div>

          <div className="dataset-breadcrumb">

            <Link to="/katalog">
              Katalog
            </Link>

            <span>
              /
            </span>

            <span>
              Dataset
            </span>

          </div>


          <div className="dataset-resource-type">

            <span className="dataset-type-icon">
              ◈
            </span>

            <span>
              Dataset
            </span>

            <span className="dataset-from">
              dari
            </span>

            <span className="dataset-owner-link">
              {ownerName}
            </span>

            <span className="dataset-from">
              /
            </span>

            <span>
              {formatDateOnly(
                dataset.date
              )}
            </span>

          </div>


          <div className="dataset-title-row">

            <h1>
              {dataset.title}
            </h1>

            <CopyLinkButton
              text={shareUrl}
              label="Salin tautan halaman ini"
              className="on-dark"
            />

          </div>


          <div className="dataset-header-category">

            <span>
              {category}
            </span>

          </div>


          {dataset.abstract && (

            <p className="dataset-header-description">

              {stripHtml(
                dataset.abstract
              )}

            </p>

          )}

        </div>

      </section>


      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="container dataset-detail-content">


        {/* =================================================
            MAP
        ================================================= */}

                {dataset.embed_url ? (

          <div className="dataset-map-wrapper">

            <iframe
              src={dataset.embed_url}
              title={
                `Peta ${dataset.title}`
              }
              className="dataset-map-iframe"
              loading="lazy"
              allowFullScreen
            />

          </div>

        ) : dataset._geojson ? (

          <GeoFeatureExplorer
            geojson={dataset._geojson}
            title={dataset.title}
            attributes={dataset._attributes}
          />

        ) : null}


        {/* =================================================
            TABS
        ================================================= */}

        <div className="dataset-tabs">

          <button
            type="button"
            className={
              activeTab === 'info'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveTab('info')
            }
          >
            Info
          </button>


          <button
            type="button"
            className={
              activeTab === 'location'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveTab('location')
            }
          >
            Location
          </button>


          <button
            type="button"
            className={
              activeTab === 'attributes'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveTab('attributes')
            }
          >
            Attributes
          </button>


          <button
            type="button"
            className={
              activeTab === 'assets'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveTab('assets')
            }
          >
            Assets
          </button>

        </div>


        {/* =================================================
            INFO
        ================================================= */}

        {activeTab === 'info' && (

          <section className="dataset-info-section">

            <div className="dataset-info-grid">


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Title
                </span>

                <span className="dataset-info-value">
                  {dataset.title || '-'}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Owner
                </span>

                <span className="dataset-info-value dataset-owner-value">

                  {ownerAvatar && (

                    <img
                      src={ownerAvatar}
                      alt={ownerName}
                      className="dataset-owner-avatar"
                    />

                  )}

                  {ownerName}

                </span>

              </div>

              
              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Publication
                </span>

                <span className="dataset-info-value">
                  {formatDate(
                    dataset.date
                  )}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Added to catalog
                </span>

                <span className="dataset-info-value">
                  {formatDate(
                    dataset.created
                  )}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Last catalog modification
                </span>

                <span className="dataset-info-value">
                  {formatDate(
                    dataset.last_updated
                  )}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Resource type
                </span>

                <span className="dataset-info-value">
                  {dataset.resource_type ||
                    'dataset'}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Source
                </span>

                <span className="dataset-info-value">
                  {dataset.sourcetype ||
                    'LOCAL'}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Category
                </span>

                <span className="dataset-info-value">
                  {category}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Point of contact
                </span>

                <span className="dataset-info-value">

                  {Array.isArray(
                    dataset.poc
                  ) &&
                  dataset.poc.length > 0
                    ? getOwnerName(
                        dataset.poc[0]
                      )
                    : ownerName}

                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Identifier
                </span>

                <span className="dataset-info-value">
                  {dataset.uuid ||
                    dataset.alternate ||
                    '-'}
                </span>

              </div>


              <div className="dataset-info-item dataset-info-item-full">

                <span className="dataset-info-label">
                  Keywords
                </span>

                <div className="dataset-keywords">

                  {keywords.length > 0
                    ? keywords.map(
                        (
                          keyword,
                          index
                        ) => (

                          <span
                            key={
                              keyword.slug ||
                              keyword.name ||
                              index
                            }
                            className="dataset-keyword"
                          >
                            {keyword.name ||
                              keyword}
                          </span>

                        )
                      )
                    : (
                      <span>
                        -
                      </span>
                    )}

                </div>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Regions
                </span>

                <div className="dataset-keywords">

                  {regions.length > 0
                    ? regions.map(
                        (
                          region,
                          index
                        ) => (

                          <span
                            key={
                              region.code ||
                              region.name ||
                              index
                            }
                            className="dataset-keyword"
                          >
                            {region.name ||
                              region}
                          </span>

                        )
                      )
                    : (
                      <span>
                        -
                      </span>
                    )}

                </div>

              </div>


              <div className="dataset-info-item dataset-info-item-full">

                <span className="dataset-info-label">
                  Attribution
                </span>

                <span className="dataset-info-value">
                  {dataset.attribution ||
                    '-'}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Language
                </span>

                <span className="dataset-info-value">
                  {dataset.language ||
                    '-'}
                </span>

              </div>


              <div className="dataset-info-item">

                <span className="dataset-info-label">
                  Coordinate Reference System
                </span>

                <span className="dataset-info-value">
                  {dataset.srid ||
                    '-'}
                </span>

              </div>


              <div className="dataset-info-item dataset-info-item-full">

                <span className="dataset-info-label">
                  Supplemental information
                </span>

                <span className="dataset-info-value">

                  {stripHtml(
                    dataset.supplemental_information
                  ) || '-'}

                </span>

              </div>


              {dataset.purpose && (

                <div className="dataset-info-item dataset-info-item-full">

                  <span className="dataset-info-label">
                    Purpose
                  </span>

                  <span className="dataset-info-value">

                    {stripHtml(
                      dataset.purpose
                    )}

                  </span>

                </div>

              )}


              {dataset.data_quality_statement && (

                <div className="dataset-info-item dataset-info-item-full">

                  <span className="dataset-info-label">
                    Data quality statement
                  </span>

                  <span className="dataset-info-value">

                    {stripHtml(
                      dataset.data_quality_statement
                    )}

                  </span>

                </div>

              )}


                            {dataset.constraints_other && (
                <div className="dataset-info-item dataset-info-item-full">
                  <span className="dataset-info-label">
                    Constraints
                  </span>
                  <span className="dataset-info-value">
                    {stripHtml(
                      dataset.constraints_other
                    )}
                  </span>
                </div>
              )}

                            {dataset.license && (
                <div className="dataset-info-item">
                  <span className="dataset-info-label">License</span>
                  <span className="dataset-info-value">
                    {typeof dataset.license === 'object'
                      ? dataset.license.identifier || dataset.license.name || '-'
                      : dataset.license}
                  </span>
                </div>
              )}

              {dataset.group && (
                <div className="dataset-info-item">
                  <span className="dataset-info-label">Group</span>
                  <span className="dataset-info-value">
                    {typeof dataset.group === 'object'
                      ? dataset.group.name || dataset.group.identifier || '-'
                      : dataset.group}
                  </span>
                </div>
              )}

              {dataset.date_type && (
                <div className="dataset-info-item">
                  <span className="dataset-info-label">Date Type</span>
                  <span className="dataset-info-value">{dataset.date_type}</span>
                </div>
              )}

            </div>


            {/* =================================================
                FULL METADATA
            ================================================= */}

            <div className="dataset-full-metadata">

              {fullMetadataUrl ? (

                <a
                  href={fullMetadataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dataset-metadata-link"
                >

                  <strong>
                    View full metadata
                  </strong>

                  <span>
                    ↗
                  </span>

                </a>

              ) : (

                <span
                  className="dataset-metadata-link dataset-metadata-disabled"
                  title="Metadata lengkap belum tersedia"
                >

                  <strong>
                    View full metadata
                  </strong>

                  <span>
                    ↗
                  </span>

                </span>

              )}

            </div>

          </section>

        )}


        {/* =================================================
            LOCATION
        ================================================= */}

        {activeTab === 'location' && (

          <section className="dataset-location-section">

            <div className="dataset-location-heading">

              <span className="section-eyebrow">
                LOCATION
              </span>

              <h3>
                Lokasi Dataset
              </h3>

              <p>
                Informasi lokasi dan cakupan spasial
                dataset dalam sistem koordinat WGS84.
              </p>

            </div>

            {locationImageUrl && (

              <div className="dataset-location-image">

                <img
                  src={locationImageUrl}
                  alt={
                    `Lokasi ${dataset.title}`
                  }
                  loading="lazy"
                />

              </div>

            )}


            <div className="dataset-location-grid">

              <div>

                <span className="dataset-info-label">
                  Spatial Reference
                </span>

                <strong>
                  {dataset.srid ||
                    'EPSG:4326'}
                </strong>

              </div>


              <div>

                <span className="dataset-info-label">
                  Representation
                </span>

                <strong>
                  {dataset.spatial_representation_type ||
                    dataset.subtype ||
                    '-'}
                </strong>

              </div>


              <div>

                <span className="dataset-info-label">
                  Region
                </span>

                <strong>

                  {regions.length > 0
                    ? regions
                        .map(
                          (region) =>
                            region.name ||
                            region
                        )
                        .join(', ')
                    : '-'}

                </strong>

              </div>

            </div>


            {bbox && (

              <div className="dataset-bbox">

                <div className="dataset-location-title">

                  <div>

                    <span className="section-eyebrow">
                      SPATIAL EXTENT
                    </span>

                    <h4>
                      Bounding Box (WGS84)
                    </h4>

                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >

                    <span className="dataset-crs-badge">
                      EPSG:4326
                    </span>

                    <CopyLinkButton
                      text={bboxWKT}
                      label="Salin WKT Bounding Box"
                    />

                  </div>

                </div>


                <div className="dataset-bbox-grid">

                  <div>

                    <span>
                      Min Latitude
                    </span>

                    <strong>
                      {bbox.minLat.toFixed(6)}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Min Longitude
                    </span>

                    <strong>
                      {bbox.minLon.toFixed(6)}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Max Latitude
                    </span>

                    <strong>
                      {bbox.maxLat.toFixed(6)}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Max Longitude
                    </span>

                    <strong>
                      {bbox.maxLon.toFixed(6)}
                    </strong>

                  </div>

                </div>


              </div>

            )}


            {center && (

              <div className="dataset-center-card">

                <div>

                  <span className="section-eyebrow">
                    MAP CENTER
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >

                    <h4>
                      Center (WGS84)
                    </h4>

                    <CopyLinkButton
                      text={pointWKT}
                      label="Salin WKT Center"
                    />

                  </div>

                  <p>
                    Titik tengah dari cakupan
                    spasial dataset.
                  </p>

                </div>


                <div className="dataset-center-values">

                  <div>

                    <span>
                      Latitude
                    </span>

                    <strong>
                      {center.lat.toFixed(6)}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Longitude
                    </span>

                    <strong>
                      {center.lon.toFixed(6)}
                    </strong>

                  </div>

                </div>

              </div>

            )}

          </section>

        )}


        {/* =================================================
            ATTRIBUTES
        ================================================= */}

        {activeTab === 'attributes' && (

          <section className="dataset-attributes-section">

            <div className="dataset-attributes-header">

              <div>

                <span className="section-eyebrow">
                  DATASET
                </span>

                <h3>
                  Attributes
                </h3>

                <p>
                  Daftar atribut yang tersedia
                  pada dataset geospasial ini.
                </p>

              </div>


              {!attributesLoading &&
                attributes.length > 0 && (

                  <span className="dataset-attribute-count">

                    {attributes.length}
                    {' '}
                    atribut

                  </span>

                )}

            </div>


            {attributesLoading && (

              <div className="dataset-attributes-loading">

                <div className="loading-spinner" />

                <p>
                  Memuat atribut dataset...
                </p>

              </div>

            )}


            {!attributesLoading &&
              attributes.length > 0 && (

                <div className="dataset-attributes-table-wrapper">

                  <table className="dataset-attributes-table">

                    <thead>

                      <tr>

                        <th>
                          Name
                        </th>

                        <th>
                          Label
                        </th>

                        <th>
                          Description
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {attributes.map(
                        (
                          attribute,
                          index
                        ) => (

                          <tr
                            key={
                              attribute.id ||
                              attribute.name ||
                              index
                            }
                          >

                            <td>

                              <code>
                                {attribute.name ||
                                  'N/A'}
                              </code>

                            </td>


                            <td>
                              {attribute.label ||
                                'N/A'}
                            </td>


                            <td>
                              {attribute.description ||
                                'N/A'}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}


            {!attributesLoading &&
              attributes.length === 0 && (

                <div className="dataset-attributes-empty">

                  <div className="dataset-empty-icon">
                    ◫
                  </div>

                  <h4>
                    Atribut belum tersedia
                  </h4>

                  <p>

                    {isOwnId
                      ? 'Dataset ini diunggah tanpa daftar atribut. Tambahkan lewat form upload/edit jika perlu.'
                      : 'Metadata atribut belum tersedia untuk dataset ini.'}

                  </p>

                  {attributesError && (

                    <small>
                      {attributesError}
                    </small>

                  )}

                </div>

              )}

          </section>

        )}


        {/* =================================================
            ASSETS
        ================================================= */}

        {activeTab === 'assets' && (

          <section className="dataset-assets-section">

            <div className="dataset-assets-header">

              <span className="section-eyebrow">
                RESOURCES
              </span>

              <h3>
                Assets
              </h3>

              <p>
                Sumber daya dan format data yang
                tersedia untuk dataset ini.
              </p>

            </div>


            {/* =================================================
                DATA
            ================================================= */}

            {dataLinks.length > 0 && (

              <div className="dataset-assets-group">

                <h4>
                  Data
                </h4>

                <div className="dataset-assets-list">

                  {dataLinks.map(
                    (link, index) => {

                      const downloadUrl =
                        link?.extras
                          ?.content
                          ?.download_url ||
                        link?.url


                      if (!downloadUrl) {
                        return null
                      }


                      return (

                        <a
                          key={
                            `${link.name || 'data'}-${index}`
                          }
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dataset-asset-card"
                        >

                          <span className="dataset-asset-icon">
                            {getLinkIcon(link)}
                          </span>


                          <div className="dataset-asset-content">

                            <strong>
                              {link.name ||
                                link.title ||
                                'Data'}
                            </strong>

                            <span>
                              {link.extension
                                ?.toUpperCase() ||
                                link.mime ||
                                'Download'}
                            </span>

                          </div>


                          <span className="dataset-asset-arrow">
                            ↗
                          </span>

                        </a>

                      )

                    }
                  )}

                </div>

              </div>

            )}


            {/* =================================================
                IMAGES
            ================================================= */}

            {imageLinks.length > 0 && (

              <div className="dataset-assets-group">

                <h4>
                  Images & Preview
                </h4>

                <div className="dataset-assets-list">

                  {imageLinks.map(
                    (link, index) => {

                      if (!link?.url) {
                        return null
                      }


                      return (
                        <a
                          key={`${link.name || 'image'}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dataset-asset-card"
                        >
                          <span className="dataset-asset-icon">
                            {getLinkIcon(link)}
                          </span>

                          <div className="dataset-asset-content">
                            <strong>
                              {link.name ||
                                link.title ||
                                'Preview'}
                            </strong>

                            <span>
                              {link.extension
                                ?.toUpperCase() ||
                                link.mime ||
                                'Image'}
                            </span>
                          </div>

                          <span className="dataset-asset-arrow">
                            ↗
                          </span>
                        </a>
                      )

                    }
                  )}

                </div>

              </div>

            )}


            {/* =================================================
                METADATA
            ================================================= */}

            {metadataLinks.length > 0 && (

              <div className="dataset-assets-group">

                <h4>
                  Metadata
                </h4>

                <div className="dataset-assets-list">

                  {metadataLinks.map(
                    (link, index) => {

                      if (!link?.url) {
                        return null
                      }


                      return (
                        <a
                          key={
                            `${link.name || 'metadata'}-${index}`
                          }
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dataset-asset-card"
                        >

                          <span className="dataset-asset-icon">
                            {getLinkIcon(link)}
                          </span>


                          <div className="dataset-asset-content">

                            <strong>
                              {link.name ||
                                link.title ||
                                'Metadata'}
                            </strong>

                            <span>
                              {link.extension
                                ?.toUpperCase() ||
                                link.mime ||
                                'Metadata'}
                            </span>

                          </div>


                          <span className="dataset-asset-arrow">
                            ↗
                          </span>

                        </a>

                      )

                    }
                  )}

                </div>

              </div>

            )}


            {/* =================================================
                OTHER
            ================================================= */}

            {infoLinks.length > 0 && (

              <div className="dataset-assets-group">

                <h4>
                  Other Resources
                </h4>

                <div className="dataset-assets-list">

                  {infoLinks.map(
                    (link, index) => {

                      if (!link?.url) {
                        return null
                      }


                      return (

                        <a
                          key={
                            `${link.name || 'resource'}-${index}`
                          }
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dataset-asset-card"
                        >

                          <span className="dataset-asset-icon">
                            {getLinkIcon(link)}
                          </span>


                          <div className="dataset-asset-content">

                            <strong>
                              {link.name ||
                                link.title ||
                                'Resource'}
                            </strong>

                            <span>
                              {link.extension
                                ?.toUpperCase() ||
                                link.mime ||
                                link.link_type ||
                                'Resource'}
                            </span>

                          </div>


                          <span className="dataset-asset-arrow">
                            ↗
                          </span>

                        </a>

                      )

                    }
                  )}

                </div>

              </div>

            )}


            {/* =================================================
                NO ASSETS
            ================================================= */}

            {dataLinks.length === 0 &&
              imageLinks.length === 0 &&
              metadataLinks.length === 0 &&
              infoLinks.length === 0 && (

                <div className="dataset-attributes-empty">

                  <div className="dataset-empty-icon">
                    ▧
                  </div>

                  <h4>
                    Belum ada assets
                  </h4>

                  <p>
                    Resource untuk dataset ini
                    belum tersedia.
                  </p>

                </div>

              )}

          </section>

        )}


        {/* =================================================
            DOWNLOAD
        ================================================= */}

        {dataset.download_url && (

          <div className="dataset-download-section">

            <div>

              <span className="section-eyebrow">
                DATASET
              </span>

              <h3>
                Unduh Dataset
              </h3>

              <p>
                Download dataset untuk digunakan
                pada analisis geospasial.
              </p>

            </div>


            <a
              href={dataset.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary dataset-download-button"
            >
              ↓&nbsp; Unduh Dataset
            </a>

          </div>

        )}


      </section>

    </main>

  )

}


export default DatasetDetail