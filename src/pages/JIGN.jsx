import { useEffect } from 'react'
import { getOwners } from '../api/jignApi'
import {
  jignStatistics,
  jignServices,
  jignNodes,
  jignCategories,
} from '../data/jign'

function JIGN() {

  useEffect(() => {
    async function fetchOwners() {
      try {
        const data = await getOwners()
        console.log('Owners API:', data)
      } catch (err) {
        console.error('Gagal mengambil data owners:', err)
      }
    }

    fetchOwners()
  }, [])

  return (
    <div className="jign-page">

      {/* HERO */}
      <section className="jign-hero">
        <div className="jign-hero-decoration jign-decoration-one"></div>
        <div className="jign-hero-decoration jign-decoration-two"></div>

        <div className="container">
          <div className="jign-hero-content">

            <span className="jign-eyebrow">
              JARINGAN INFORMASI GEOSPASIAL
            </span>

            <h1>
              JIGN
              <br />
              <span>Aceh</span>
            </h1>

            <p>
              Membangun ekosistem informasi geospasial
              yang terintegrasi untuk mendukung
              pembangunan Aceh yang berbasis data.
            </p>

            <div className="jign-hero-actions">
              <a href="/katalog" className="jign-primary-button">
                Jelajahi Data
                <span>→</span>
              </a>

              <a href="#simpul-jaringan" className="jign-secondary-button">
                Lihat Instansi
              </a>
            </div>

          </div>
        </div>
      </section>


      {/* STATISTICS */}
      <section className="jign-stat-section">
        <div className="container">

          <div className="jign-stat-grid">

            {jignStatistics.map((stat) => (
              <div className="jign-stat-card" key={stat.label}>

                <div className="jign-stat-icon">
                  ◈
                </div>

                <div>
                  <strong>
                    {stat.value}
                    {stat.suffix}
                  </strong>

                  <span>
                    {stat.label}
                  </span>
                </div>

              </div>
            ))}

          </div>

        </div>
      </section>


      {/* INTRO */}
      <section className="jign-intro">
        <div className="container">

          <div className="jign-section-heading">

            <span className="jign-section-label">
              TENTANG JIGN
            </span>

            <h2>
              Menghubungkan data,
              <br />
              mengintegrasikan informasi.
            </h2>

            <p>
              Jaringan Informasi Geospasial merupakan bagian
              penting dalam pengelolaan dan penyebarluasan
              informasi geospasial. Melalui kolaborasi antar
              instansi, data dapat dikelola secara lebih
              terstruktur, mudah ditemukan, dan dapat
              dimanfaatkan untuk mendukung pengambilan
              keputusan.
            </p>

          </div>

        </div>
      </section>


      {/* SERVICES */}
      <section className="jign-services">
        <div className="container">

          <div className="jign-section-title-row">

            <div>
              <span className="jign-section-label">
                EKOSISTEM JIGN
              </span>

              <h2>
                Layanan Geospasial Aceh
              </h2>
            </div>

            <p>
              Infrastruktur dan layanan untuk mendukung
              pengelolaan informasi geospasial daerah.
            </p>

          </div>


          <div className="jign-service-grid">

            {jignServices.map((service) => (
              <article
                className="jign-service-card"
                key={service.number}
              >

                <div className="jign-service-top">
                  <span className="jign-service-number">
                    {service.number}
                  </span>

                  <span className="jign-service-icon">
                    {service.icon}
                  </span>
                </div>

                <h3>
                  {service.title}
                </h3>

                <p>
                  {service.description}
                </p>

                <a href="#">
                  Pelajari
                  <span>→</span>
                </a>

              </article>
            ))}

          </div>

        </div>
      </section>


      {/* NODES */}
      <section
        className="jign-nodes"
        id="simpul-jaringan"
      >
        <div className="container">

          <div className="jign-section-heading centered">

            <span className="jign-section-label">
              SIMPUL JARINGAN
            </span>

            <h2>
              Unit Produksi Data Geospasial
            </h2>

            <p>
              Instansi yang berperan dalam pengelolaan,
              produksi, dan penyediaan informasi geospasial
              di Aceh.
            </p>

          </div>


          <div className="jign-node-grid">

            {jignNodes.map((node) => (
              <article
                className="jign-node-card"
                key={node.shortName}
              >

                <div className="jign-node-logo">
                  {node.shortName.charAt(0)}
                </div>

                <div className="jign-node-info">

                  <span>
                    {node.shortName}
                  </span>

                  <h3>
                    {node.name}
                  </h3>

                </div>

                <div className="jign-node-meta">
                  <strong>
                    {node.metadata}
                  </strong>

                  <span>
                    Metadata
                  </span>
                </div>

              </article>
            ))}

          </div>

          <div className="jign-node-more">
            <button type="button">
              Lihat Semua Instansi
              <span>→</span>
            </button>
          </div>

        </div>
      </section>


      {/* CATEGORIES */}
      <section className="jign-categories">

        <div className="container">

          <div className="jign-section-title-row">

            <div>
              <span className="jign-section-label">
                DATA GEOSPASIAL
              </span>

              <h2>
                Kategori Informasi
              </h2>
            </div>

            <p>
              Kelompok data geospasial yang dapat
              dikembangkan dan dikelola melalui
              Geoportal Aceh.
            </p>

          </div>


          <div className="jign-category-grid">

            {jignCategories.map((category, index) => (
              <div
                className="jign-category-card"
                key={category}
              >

                <span>
                  {String(index + 1).padStart(2, '0')}
                </span>

                <h3>
                  {category}
                </h3>

                <div>
                  →
                </div>

              </div>
            ))}

          </div>

        </div>

      </section>


      {/* ONE MAP POLICY */}
      <section className="jign-policy">

        <div className="container">

          <div className="jign-policy-box">

            <div className="jign-policy-content">

              <span className="jign-section-label">
                SATU DATA GEOSPASIAL
              </span>

              <h2>
                One Map Policy
              </h2>

              <p>
                Mendorong tersedianya data geospasial
                yang terintegrasi, akurat, dan dapat
                dipertanggungjawabkan sebagai dasar
                perencanaan pembangunan dan
                pengambilan kebijakan di Aceh.
              </p>

              <a href="/katalog">
                Eksplorasi Data
                <span>→</span>
              </a>

            </div>

            <div className="jign-policy-visual">

              <div className="jign-map-grid">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="jign-map-pin">
                ⌖
              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  )
}

export default JIGN