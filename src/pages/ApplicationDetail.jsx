import {
  useEffect,
  useState,
} from 'react'

import {
  useParams,
} from 'react-router'

import {
  getGeoappDetail,
} from '../api/geoappApi'

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
  getResourceTypeLabel,
  stripHtml,
} from '../utils/datasetUtils'

import { useAuth } from '../context/AuthContext'
import CopyLinkButton from '../components/CopyLinkButton'
import BackToTopButton from '../components/BackToTopButton'
import OwnerBadge from '../components/OwnerBadge'

function ApplicationDetail() {

  const { id } = useParams()
  const isOwnId =
    typeof id === 'string' &&
    id.startsWith('own-')

  const { isAdmin, isAuthenticated } = useAuth()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    let mounted = true

    async function fetchDetail() {

      try {

        setLoading(true)
        setError('')

        if (isOwnId) {

          const rawId = id.replace('own-', '')

          let rawData = null

          try {
            rawData = await getPublishedDetail(rawId)
          } catch {
            rawData = null
          }

          if (!rawData && isAdmin) {
            try { rawData = await getAdminDatasetDetail(rawId) } catch {}
          }

          if (!rawData && isAuthenticated) {
            try { rawData = await getMyDatasetDetail(rawId) } catch {}
          }

          if (!rawData && isAuthenticated) {
            try { rawData = await getDatasetViewDetail(rawId) } catch {}
          }

          if (!rawData) {

            if (mounted) {
              setError('Aplikasi tidak ditemukan atau kamu tidak punya izin melihatnya.')
            }

            return

          }
    
          const adapted = adaptOwnResource(rawData)

          console.log('Detail Aplikasi Sendiri:', adapted)

          setApplication(adapted)

          return

        }

        const data = await getGeoappDetail(id)

        console.log('Detail Geoapp:', data)

        setApplication(data)

      } catch (err) {

        console.error('Gagal mengambil detail aplikasi:', err)
        setError('Gagal mengambil detail aplikasi.')

      } finally {

        setLoading(false)

      }

    }

    if (id) {
      fetchDetail()
    }

    return () => { mounted = false }

  }, [id, isOwnId])


  if (loading) {

    return (
      <main className="application-detail-page">
        <div className="container">
          <div className="information-empty">
            <p>Memuat detail aplikasi...</p>
          </div>
        </div>
      </main>
    )

  }

  if (error || !application) {

    return (
      <main className="application-detail-page">
        <div className="container">
          <div className="information-empty">
            <h5>Aplikasi tidak ditemukan</h5>
            <p>{error || 'Data aplikasi tidak tersedia.'}</p>
            <BackToTopButton to="/aplikasi" label="Kembali ke Aplikasi" className="on-light" />
          </div>
        </div>
      </main>
    )

  }

  const title =
    application.title ||
    application.name ||
    'Tanpa judul'

  const description =
    stripHtml(
      application.abstract ||
      application.description ||
      ''
    )

  const owner =
    application.owner ||
    application.metadata_author?.[0] ||
    application.poc?.[0] ||
    null

  const ownerName =
    owner?.first_name ||
    owner?.username ||
    'Tidak diketahui'

  const ownerAvatar = owner?.avatar || null
  const category = mapCategory(application.category?.identifier)
  const typeLabel =
    getResourceTypeLabel(application.resource_type === 'application' ? 'application' : 'dashboard')

  const isApplicationType = application.resource_type === 'application'
  const date =
    application.date
      ? new Date(application.date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-'

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const embedUrl = application.embed_url || null
  const detailUrl = application.detail_url || null
  const sourceLabel =
    isOwnId ? 'Diunggah oleh pengguna' : 'Geoportal Aceh'

  const openButtonLabel =
    isApplicationType
      ? 'Buka Aplikasi'
      : (isOwnId ? 'Buka Dashboard' : 'Buka di Geoportal')

  const emptyStateTitle =
    isApplicationType
      ? 'Aplikasi tidak tersedia untuk ditampilkan langsung'
      : 'Dashboard tidak tersedia untuk ditampilkan langsung'

  const emptyStateMessage =
    isApplicationType
      ? 'Aplikasi ini belum memiliki link yang dapat ditampilkan.'
      : (isOwnId
          ? 'Aplikasi ini diunggah sebagai file dan tidak dapat ditampilkan sebagai iframe. Gunakan tombol di atas untuk membukanya.'
          : 'Aplikasi ini belum memiliki alamat embed yang dapat ditampilkan.')

  return (

    <main className="application-detail-page">

      <section className="application-detail-hero">
        <div className="container">

          <div className="application-detail-top">
            <BackToTopButton to="/aplikasi" label="Kembali ke Aplikasi" />
          </div>

          <div className="application-detail-header">

            <span className="application-detail-category">
              {category}
            </span>

            <div className="dataset-title-row">
              <h1>{title}</h1>
              <CopyLinkButton text={shareUrl} label="Salin tautan halaman ini" className="on-dark" />
            </div>

            <p>{description}</p>

          </div>

        </div>
      </section>

      <section className="container application-detail-content">

        <div className="application-detail-meta">

          <div className="application-detail-meta-item">
            <span>Instansi / Pemilik</span>
            <strong>
              <OwnerBadge name={ownerName} avatar={ownerAvatar} />
            </strong>
          </div>

          <div className="application-detail-meta-item">
            <span>Tanggal</span>
            <strong>{date}</strong>
          </div>

          <div className="application-detail-meta-item">
            <span>Jenis</span>
            <strong>{typeLabel}</strong>
          </div>

          <div className="application-detail-meta-item">
            <span>Kategori</span>
            <strong>{category}</strong>
          </div>

          <div className="application-detail-meta-item">
            <span>Sumber</span>
            <strong>{sourceLabel}</strong>
          </div>

        </div>

        <section className="application-dashboard-section">

          <div className="application-dashboard-heading">

            <div>
              <span className="section-eyebrow">VISUALISASI</span>
              <h2>{typeLabel}</h2>
            </div>

            {detailUrl && (
              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="application-external-link"
              >
                {openButtonLabel}
                <span>↗</span>
              </a>
            )}

          </div>

          {isApplicationType ? (

            detailUrl ? (

              <div className="application-preview-frame">
                <div className="application-preview-cta">

                  <span className="application-preview-cta-icon">⌗</span>

                  <strong className="application-preview-cta-title">{title}</strong>

                  <p className="application-preview-cta-text">
                    Aplikasi ini dibuka di tab baru karena sumbernya tidak mengizinkan tampilan tertanam (iframe).
                  </p>

                  <a
                    href={detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="application-preview-cta-button"
                  >
                    {openButtonLabel}
                    <span>↗</span>
                  </a>

                </div>
              </div>

            ) : (

              <div className="application-dashboard-empty">
                <h3>{emptyStateTitle}</h3>
                <p>{emptyStateMessage}</p>
              </div>

            )

          ) : embedUrl ? (

            <div className="application-dashboard-frame">
              <iframe
                src={embedUrl}
                title={title}
                loading="lazy"
                allowFullScreen
              />
            </div>

          ) : (

            <div className="application-dashboard-empty">

              <h3>{emptyStateTitle}</h3>

              <p>{emptyStateMessage}</p>

              {detailUrl && (
                <a
                  href={detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="application-back-button"
                >
                  {openButtonLabel}
                </a>
              )}

            </div>

          )}

        </section>

      </section>

    </main>

  )

}

export default ApplicationDetail