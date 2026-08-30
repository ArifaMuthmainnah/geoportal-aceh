import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useParams,
} from 'react-router'

import {
  getGeoappDetail,
} from '../api/geoappApi'

import {
  getPublishedDetail,
  getMyDatasetDetail, 
  getAdminDatasetDetail,
} from '../api/myDatasetApi'

import {
  adaptOwnResource,
} from '../utils/ownDataAdapter'

import {
  stripHtml,
} from '../utils/datasetUtils'

import { useAuth } from '../context/AuthContext'

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
            <Link to="/aplikasi" className="application-back-button">
              ← Kembali ke Aplikasi
            </Link>
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

  const category =
    application.resource_type === 'dashboard'
      ? 'Dashboard'
      : application.category?.identifier || 'Aplikasi'

  const date =
    application.date
      ? new Date(application.date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-'


  // ===================================================
  // SUMBER DASHBOARD
  // ===================================================
  //
  // - Kalau dari API lama  : embed_url/detail_url berasal
  //   dari respons API lama, jadi klik akan membuka
  //   dashboard/detail di web Geoportal Aceh lama.
  // - Kalau upload sendiri : embed_url/detail_url berasal
  //   dari adaptOwnResource (link atau file yang di-upload
  //   user), jadi klik akan membuka dashboard/file milik
  //   user itu sendiri, BUKAN web lama.
  //
  // Halaman ini sendiri (/aplikasi/:id) selalu berada di
  // web kita — hanya isi tombol/iframe yang berbeda sumber.
  //
  // ===================================================

  const embedUrl = application.embed_url || null
  const detailUrl = application.detail_url || null

  const sourceLabel =
    isOwnId ? 'Diunggah oleh pengguna' : 'Sumber: Geoportal Aceh'


  return (

    <main className="application-detail-page">

      <section className="application-detail-hero">
        <div className="container">

          <Link to="/aplikasi" className="application-back-link">
            ← Kembali ke Aplikasi
          </Link>

          <div className="application-detail-header">

            <span className="application-detail-category">
              {category}
            </span>

            <h1>{title}</h1>

            <p>{description}</p>

          </div>

        </div>
      </section>


      <section className="container application-detail-content">

        <div className="application-detail-meta">

          <div className="application-detail-meta-item">
            <span>Instansi / Pemilik</span>
            <strong>{ownerName}</strong>
          </div>

          <div className="application-detail-meta-item">
            <span>Tanggal</span>
            <strong>{date}</strong>
          </div>

          <div className="application-detail-meta-item">
            <span>Jenis</span>
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
              <h2>{category}</h2>
            </div>

            {detailUrl && (
              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="application-external-link"
              >
                {isOwnId ? 'Buka Dashboard' : 'Buka di Geoportal'}
                <span>↗</span>
              </a>
            )}

          </div>


          {embedUrl ? (

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

              <h3>Dashboard tidak tersedia untuk ditampilkan langsung</h3>

              <p>
                {isOwnId
                  ? 'Aplikasi ini diunggah sebagai file dan tidak dapat ditampilkan sebagai iframe. Gunakan tombol di atas untuk membukanya.'
                  : 'Aplikasi ini belum memiliki alamat embed yang dapat ditampilkan.'}
              </p>

              {detailUrl && (
                <a
                  href={detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="application-back-button"
                >
                  Buka Aplikasi
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