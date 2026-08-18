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
  stripHtml,
} from '../utils/datasetUtils'


function ApplicationDetail() {

  // =====================================================
  // PARAMETER
  // =====================================================

  const { id } =
    useParams()


  // =====================================================
  // STATE
  // =====================================================

  const [application, setApplication] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // =====================================================
  // LOAD DETAIL
  // =====================================================

  useEffect(() => {

    async function fetchDetail() {

      try {

        setLoading(true)
        setError('')


        const data =
          await getGeoappDetail(id)


        console.log(
          'Detail Geoapp:',
          data
        )


        setApplication(data)


      } catch (err) {

        console.error(
          'Gagal mengambil detail aplikasi:',
          err
        )


        setError(
          'Gagal mengambil detail aplikasi.'
        )


      } finally {

        setLoading(false)

      }

    }


    if (id) {
      fetchDetail()
    }

  }, [id])


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <main className="application-detail-page">

        <div className="container">

          <div className="information-empty">

            <p>
              Memuat detail aplikasi...
            </p>

          </div>

        </div>

      </main>

    )

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error || !application) {

    return (

      <main className="application-detail-page">

        <div className="container">

          <div className="information-empty">

            <h5>
              Aplikasi tidak ditemukan
            </h5>

            <p>
              {error ||
                'Data aplikasi tidak tersedia.'}
            </p>


            <Link
              to="/aplikasi"
              className="application-back-button"
            >
              ← Kembali ke Aplikasi
            </Link>

          </div>

        </div>

      </main>

    )

  }


  // =====================================================
  // DATA
  // =====================================================

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
    application.resource_type ===
    'dashboard'
      ? 'Dashboard'
      : application.category?.identifier ||
        'Aplikasi'


  const date =
    application.date
      ? new Date(
          application.date
        ).toLocaleDateString(
          'id-ID',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }
        )
      : '-'


  const embedUrl =
    application.embed_url ||
    null


  const detailUrl =
    application.detail_url ||
    null


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <main className="application-detail-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <section className="application-detail-hero">

        <div className="container">

          <Link
            to="/aplikasi"
            className="application-back-link"
          >
            ← Kembali ke Aplikasi
          </Link>


          <div className="application-detail-header">

            <span className="application-detail-category">
              {category}
            </span>


            <h1>
              {title}
            </h1>


            <p>
              {description}
            </p>

          </div>

        </div>

      </section>



      {/* =================================================
          META
      ================================================= */}

      <section className="container application-detail-content">

        <div className="application-detail-meta">


          {/* OWNER */}

          <div className="application-detail-meta-item">

            <span>
              Instansi / Pemilik
            </span>

            <strong>
              {ownerName}
            </strong>

          </div>


          {/* DATE */}

          <div className="application-detail-meta-item">

            <span>
              Tanggal
            </span>

            <strong>
              {date}
            </strong>

          </div>


          {/* TYPE */}

          <div className="application-detail-meta-item">

            <span>
              Jenis
            </span>

            <strong>
              {category}
            </strong>

          </div>

        </div>



        {/* =================================================
            DASHBOARD
        ================================================= */}

        <section className="application-dashboard-section">


          <div className="application-dashboard-heading">

            <div>

              <span className="section-eyebrow">
                VISUALISASI
              </span>

              <h2>
                {category}
              </h2>

            </div>


            {detailUrl && (

              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="application-external-link"
              >
                Buka di Geoportal
                <span>
                  ↗
                </span>
              </a>

            )}

          </div>


          {/* =================================================
              IFRAME
          ================================================= */}

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

              <h3>
                Dashboard tidak tersedia
              </h3>

              <p>
                Aplikasi ini belum memiliki
                alamat embed yang dapat ditampilkan.
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