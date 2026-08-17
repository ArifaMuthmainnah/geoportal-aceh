import { useEffect, useState } from 'react'
import { statistics } from '../data/home'
import applications from '../data/applications'
import { getDatasets } from '../api/datasetApi'
import AnimatedCounter from '../components/AnimatedCounter'

function stripHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

const CATEGORY_MAP = {
  society: 'Sosial',
  biota: 'Lingkungan',
  environment: 'Lingkungan',
  imagery_basemaps_earth_cover: 'Infrastruktur',
  location: 'Administrasi',
  boundaries: 'Administrasi',
  planning_cadastre: 'Administrasi',
  structure: 'Infrastruktur',
  transportation: 'Infrastruktur',
  utilities_communication: 'Infrastruktur',
  economy: 'Sosial',
  farming: 'Lingkungan',
  health: 'Sosial',
  intelligence_military: 'Administrasi',
  ocean: 'Lingkungan',
  climatology_meteorology_atmosphere: 'Lingkungan',
  geoscientific_information: 'Lingkungan',
  elevation: 'Lingkungan',
}

function mapCategory(identifier) {
  return CATEGORY_MAP[identifier] || 'Umum'
}

function Home() {
  const [datasets, setDatasets] = useState([])
  const latestApplications = applications.slice(0, 3)

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const data = await getDatasets()
        const list = Array.isArray(data) ? data : data.datasets || []
        setDatasets(list.slice(0, 3))
      } catch (err) {
        console.error('Gagal mengambil dataset:', err)
      }
    }

    fetchDatasets()
  }, [])

  return (
    <div className="home-page">

      {/* =========================
          HERO
          ========================= */}

      <section className="home-hero">

        <div className="container">

          <div className="home-hero-grid">

            <div className="home-hero-content">

              <span className="home-eyebrow">
                GEOPORTAL ACEH
              </span>

              <h1>
                Portal Informasi
                <br />
                <span>Geospasial Aceh</span>
              </h1>

              <p>
                Menyediakan informasi dan data geospasial
                untuk mendukung pembangunan dan pengambilan
                keputusan berbasis data di Aceh.
              </p>

              <div className="home-hero-actions">

                <a
                  href="/webgis"
                  className="home-primary-button"
                >
                  Jelajahi WebGIS
                  <span>→</span>
                </a>

                <a
                  href="/katalog"
                  className="home-secondary-button"
                >
                  Lihat Katalog
                </a>

              </div>

            </div>


            {/* LOGO PLACEHOLDER */}

            <div className="home-hero-visual">

              <div className="home-logo-placeholder">

                <span>ACEH</span>

                <small>
                  Logo Geoportal
                </small>

              </div>

              <div className="home-map-decoration">
                GIS
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          STATISTICS
          ========================= */}

      <section className="home-statistics">

        <div className="container">

          <div className="statistics-card">

            {statistics.map((stat) => (

              <div
                className="stat-item"
                key={stat.label}
              >

                <div className="stat-icon">
                  {stat.icon}
                </div>

                <div className="stat-number">
                  <strong>
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                    />
                  </strong>
                </div>

                <span>
                  {stat.label}
                </span>

                <div className="stat-line" />

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* =========================
          DATASET
          ========================= */}

      <section className="home-section">

        <div className="container">

          <div className="home-section-heading">

            <div>
              <span className="section-eyebrow">
                DATA GEOSPASIAL
              </span>

              <h2>
                Dataset Terbaru
              </h2>

              <p>
                Temukan berbagai dataset geospasial
                yang tersedia di Geoportal Aceh.
              </p>
            </div>

            <a
              href="/katalog"
              className="section-link"
            >
              Lihat Semua
              <span>→</span>
            </a>

          </div>


          <div className="home-card-grid">

            {datasets.map((dataset) => (

              <article
                className="dataset-home-card"
                key={dataset.pk}
              >

                <div className="dataset-home-image">

                  {dataset.thumbnail_url ? (

                    <img
                      src={dataset.thumbnail_url}
                      alt={dataset.title}
                    />

                  ) : (

                    <div className="dataset-image-placeholder">

                      <span>
                        GIS
                      </span>

                      <small>
                        Preview Dataset
                      </small>

                    </div>

                  )}

                  <span className="dataset-type">
                    {dataset.subtype || 'Dataset'}
                  </span>

                </div>


                <div className="dataset-home-body">

                  <span className="dataset-category">
                    {mapCategory(dataset.category?.identifier)}
                  </span>

                  <h3>
                    {dataset.title}
                  </h3>

                  <p>
                    {stripHtml(dataset.abstract).slice(0, 100)}
                    {stripHtml(dataset.abstract).length > 100 ? '...' : ''}
                  </p>

                  <div className="dataset-agency">
                    <span>Instansi</span>

                    <strong>
                      {dataset.attribution || '-'}
                    </strong>
                  </div>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =========================
          WEBGIS PROMOTION
          ========================= */}

      <section className="home-webgis">

        <div className="container">

          <div className="webgis-promo">

            <div>

              <span className="section-eyebrow">
                WEBGIS ACEH
              </span>

              <h2>
                Jelajahi Aceh
                melalui Peta Interaktif
              </h2>

              <p>
                Akses informasi geospasial melalui
                peta interaktif dan jelajahi berbagai
                layer yang tersedia.
              </p>

              <a
                href="/webgis"
                className="home-primary-button"
              >
                Buka WebGIS
                <span>→</span>
              </a>

            </div>


            <div className="webgis-preview">

              <div className="map-grid">

                <span />
                <span />
                <span />
                <span />
                <span />
                <span />

              </div>

              <div className="map-pin">
                +
              </div>

              <div className="map-label">
                Peta Interaktif Aceh
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          APPLICATIONS
          ========================= */}

      <section className="home-section">

        <div className="container">

          <div className="home-section-heading">

            <div>

              <span className="section-eyebrow">
                LAYANAN DIGITAL
              </span>

              <h2>
                Aplikasi Geospasial
              </h2>

              <p>
                Akses berbagai aplikasi dan layanan
                geospasial yang tersedia.
              </p>

            </div>

            <a
              href="/aplikasi"
              className="section-link"
            >
              Semua Aplikasi
              <span>→</span>
            </a>

          </div>


          <div className="home-application-grid">

            {latestApplications.map((application) => (

              <article
                className="home-application-card"
                key={application.id}
              >

                <div className="home-application-icon">
                  GIS
                </div>

                <div>

                  <span>
                    {application.category}
                  </span>

                  <h3>
                    {application.name}
                  </h3>

                  <p>
                    {application.description}
                  </p>

                </div>

                <a
                  href="/aplikasi"
                  className="home-card-link"
                >
                  Selengkapnya →
                </a>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =========================
          INFORMATION
          ========================= */}

      <section className="home-information">

        <div className="container">

          <div className="home-information-inner">

            <div>

              <span className="section-eyebrow">
                INFORMASI
              </span>

              <h2>
                Informasi Geospasial Aceh
              </h2>

              <p>
                Dapatkan informasi terbaru mengenai
                data, layanan, dan perkembangan
                geospasial di Aceh.
              </p>

            </div>

            <a
              href="/informasi"
              className="home-primary-button"
            >
              Lihat Informasi
              <span>→</span>
            </a>

          </div>

        </div>

      </section>

    </div>
  )
}

export default Home