import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { getLatestDatasets } from '../api/datasetApi'
import { getAllOwners } from '../api/jignApi'
import { getMaps } from '../api/mapApi'
import { getDocuments } from '../api/documentApi'
import { getGeoapps, getAllGeoapps } from '../api/geoappApi'

import {
  getOwnerName,
  getOwnerAvatar,
} from '../utils/datasetUtils'

import DatasetCard from '../components/DatasetCard'
import ApplicationCard from '../components/ApplicationCard'
import AnimatedCounter from '../components/AnimatedCounter'


// =========================================
// HOME
// =========================================

function Home() {

  // =========================================
  // DATASET
  // =========================================

  const [datasets, setDatasets] = useState([])
  const [datasetTotal, setDatasetTotal] = useState(0)


  // =========================================
  // APPLICATIONS / GEOAPPS
  // =========================================

  const [applications, setApplications] = useState([])
  const [applicationLoading, setApplicationLoading] =
    useState(true)


  // =========================================
  // STATISTICS
  // =========================================

  const [mapTotal, setMapTotal] = useState(0)
  const [documentTotal, setDocumentTotal] = useState(0)
  const [geoappTotal, setGeoappTotal] = useState(0)


  // =========================================
  // OWNERS / INSTANSI
  // =========================================

  const [owners, setOwners] = useState([])
  const [ownerTotal, setOwnerTotal] = useState(0)


  // =========================================
  // STATE
  // =========================================

  const [loading, setLoading] = useState(true)
  const [datasetError, setDatasetError] = useState('')
  const [applicationError, setApplicationError] =
    useState('')


  // =========================================
  // LOAD HOME DATA
  // =========================================

  useEffect(() => {

    async function loadHomeData() {

      setLoading(true)
      setDatasetError('')


      // =======================================
      // DATASET
      // =======================================

      try {

        const datasetResponse =
          await getLatestDatasets()

        console.log(
          'Dataset Home:',
          datasetResponse
        )


        const datasetList =
          Array.isArray(datasetResponse)
            ? datasetResponse
            : datasetResponse?.datasets ||
              datasetResponse?.results ||
              datasetResponse?.data ||
              []


        // Home hanya menampilkan 3 dataset
        setDatasets(
          datasetList.slice(0, 3)
        )


        // Total dataset dari API
        const totalDatasets =
          Number(
            datasetResponse?.total ??
            datasetResponse?.count ??
            datasetList.length
          )


        setDatasetTotal(
          totalDatasets
        )

      } catch (err) {

        console.error(
          'Gagal mengambil dataset:',
          err
        )

        setDatasets([])
        setDatasetTotal(0)

        setDatasetError(
          'Dataset belum dapat dimuat.'
        )

      }


      // =======================================
      // MAPS
      // =======================================

      try {

        const mapResponse =
          await getMaps('?page_size=1')

        console.log(
          'Maps Home:',
          mapResponse
        )


        setMapTotal(
          Number(
            mapResponse?.total ??
            mapResponse?.count ??
            0
          )
        )

      } catch (err) {

        console.error(
          'Gagal mengambil maps:',
          err
        )

        setMapTotal(0)

      }


      // =======================================
      // DOCUMENTS
      // =======================================

      try {

        const documentResponse =
          await getDocuments('?page_size=1')

        console.log(
          'Documents Home:',
          documentResponse
        )


        setDocumentTotal(
          Number(
            documentResponse?.total ??
            documentResponse?.count ??
            0
          )
        )

      } catch (err) {

        console.error(
          'Gagal mengambil documents:',
          err
        )

        setDocumentTotal(0)

      }


      // =======================================
      // GEOAPPS / DASHBOARD
      // =======================================

      try {

        const geoappResponse =
          await getGeoapps('?page_size=1')

        console.log(
          'Geoapps Home:',
          geoappResponse
        )


        setGeoappTotal(
          Number(
            geoappResponse?.total ??
            geoappResponse?.count ??
            0
          )
        )

      } catch (err) {

        console.error(
          'Gagal mengambil geoapps:',
          err
        )

        setGeoappTotal(0)

      }


      // =======================================
      // OWNERS / INSTANSI
      // =======================================

      try {

        /*
         * Ambil seluruh owner.
         *
         * getAllOwners() menangani
         * pagination dari API.
         */

        const ownerList =
          await getAllOwners()

        console.log(
          'Owners Home:',
          ownerList
        )


        const validOwners =
          Array.isArray(ownerList)
            ? ownerList
            : []


        /*
         * Urutkan berdasarkan jumlah dataset
         * terbanyak.
         */

        const sortedOwners =
          [...validOwners].sort(
            (a, b) =>
              Number(b.count || 0) -
              Number(a.count || 0)
          )


        setOwners(
          sortedOwners
        )


        /*
         * Jumlah instansi / owner.
         */

        setOwnerTotal(
          sortedOwners.length
        )

      } catch (err) {

        console.error(
          'Gagal mengambil owners:',
          err
        )

        setOwners([])
        setOwnerTotal(0)

      }


      setLoading(false)

    }


    loadHomeData()

  }, [])


  // =========================================
  // LOAD APPLICATIONS / GEOAPPS
  // =========================================

  useEffect(() => {

    async function loadApplications() {

      try {

        setApplicationLoading(true)
        setApplicationError('')


        const response =
          await getAllGeoapps()

        console.log(
          'Applications Home:',
          response
        )


        const geoappList =
          Array.isArray(response)
            ? response
            : response?.geoapps ||
              response?.results ||
              response?.data ||
              []


        /*
         * Hanya aplikasi yang sudah dipublikasikan
         * yang ditampilkan kepada pengunjung.
         */

        const publishedApplications =
          geoappList.filter(
            (application) =>
              application.is_published === true
          )


        /*
         * Ambil 3 aplikasi terbaru.
         *
         * Jika API mengembalikan data sudah dalam
         * urutan terbaru, slice(0, 3) cukup.
         *
         * Jika terdapat field date, kita urutkan
         * berdasarkan tanggal terlebih dahulu.
         */

        const sortedApplications =
          [...publishedApplications].sort(
            (a, b) => {

              const dateA =
                a.date
                  ? new Date(a.date).getTime()
                  : 0

              const dateB =
                b.date
                  ? new Date(b.date).getTime()
                  : 0

              return dateB - dateA

            }
          )


        setApplications(
          sortedApplications.slice(0, 3)
        )

      } catch (err) {

        console.error(
          'Gagal mengambil aplikasi:',
          err
        )

        setApplications([])

        setApplicationError(
          'Aplikasi belum dapat dimuat.'
        )

      } finally {

        setApplicationLoading(false)

      }

    }


    loadApplications()

  }, [])


  // =========================================
  // STATISTICS
  // =========================================

  const statistics = [

    {
      label: 'Dataset Terpublikasi',
      value: datasetTotal,
      icon: '▦',
    },

    {
      label: 'Peta Interaktif',
      value: mapTotal,
      icon: '⌖',
    },

    {
      label: 'Dokumen',
      value: documentTotal,
      icon: '▤',
    },

    {
      label: 'Dashboard',
      value: geoappTotal,
      icon: '▥',
    },

    {
      label: 'Instansi',
      value: ownerTotal,
      icon: '⌂',
    },

  ]


  // =========================================
  // OWNER MAP
  // =========================================

  /*
   * Membuat Map berdasarkan PK owner.
   *
   * Digunakan untuk mencocokkan owner dataset
   * dengan data owner dari API.
   */

  const ownerMap =
    new Map(
      owners.map((owner) => [
        owner.pk,
        owner,
      ])
    )


  // =========================================
  // RENDER
  // =========================================

  return (

    <div className="home-page">


      {/* =====================================
          HERO
          ===================================== */}

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

                <span>
                  Geospasial Aceh
                </span>

              </h1>


              <p>
                Menyediakan informasi dan data
                geospasial untuk mendukung pembangunan
                dan pengambilan keputusan berbasis data
                di Aceh.
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


            {/* HERO VISUAL */}

            <div className="home-hero-visual">

              <div className="home-logo-placeholder">

                <span>
                  ACEH
                </span>

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



      {/* =====================================
          STATISTICS
          ===================================== */}

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

                    {loading ? (

                      '...'

                    ) : (

                      <AnimatedCounter
                        value={stat.value}
                      />

                    )}

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



      {/* =====================================
          DATASET TERBARU
          ===================================== */}

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


            <Link
              to="/katalog"
              className="section-link"
            >
              Lihat Semua
              <span>→</span>
            </Link>

          </div>



          {/* ===================================
              LOADING DATASET
              =================================== */}

          {loading && (

            <div className="home-card-grid">

              {[1, 2, 3].map((item) => (

                <article
                  className="dataset-home-card dataset-skeleton"
                  key={item}
                >

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



          {/* ===================================
              DATASET CARDS
              =================================== */}

          {!loading &&
            datasets.length > 0 && (

              <div className="home-card-grid">

                {datasets.map((dataset) => {

                  /*
                   * Cari owner berdasarkan PK.
                   */

                  const ownerId =
                    dataset.owner?.pk ??
                    dataset.owner?.id ??
                    dataset.owner_pk ??
                    dataset.owner_id


                  const owner =
                    dataset.owner?.first_name !== undefined
                      ? dataset.owner
                      : ownerMap.get(ownerId)


                  return (

                    <DatasetCard
                      key={
                        dataset.pk ||
                        dataset.uuid ||
                        dataset.id
                      }
                      dataset={dataset}
                      owner={owner}
                    />

                  )

                })}

              </div>

            )}



          {/* ===================================
              ERROR / EMPTY DATASET
              =================================== */}

          {!loading &&
            datasets.length === 0 && (

              <div className="home-empty-state">

                <div>
                  ▦
                </div>


                <h3>
                  {datasetError ||
                    'Belum ada dataset'}
                </h3>


                <p>
                  Dataset yang telah dipublikasikan
                  akan ditampilkan di sini.
                </p>

              </div>

            )}

        </div>

      </section>



      {/* =====================================
          WEBGIS
          ===================================== */}

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



      {/* =====================================
          APLIKASI GEOSPASIAL
          ===================================== */}

      <section className="home-section home-applications-section">

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
                Akses berbagai aplikasi dan dashboard
                geospasial yang tersedia di Geoportal Aceh.
              </p>

            </div>


            <Link
              to="/aplikasi"
              className="section-link"
            >
              Semua Aplikasi
              <span>→</span>
            </Link>

          </div>



          {/* ===================================
              LOADING APPLICATION
              =================================== */}

          {applicationLoading && (

            <div className="row g-4">

              {[1, 2, 3].map((item) => (

                <div
                  className="col-md-6 col-lg-4"
                  key={item}
                >

                  <article className="card katalog-card h-100">

                    <div className="katalog-card-image">

                      <div className="katalog-card-image-placeholder">

                        <span>
                          GIS
                        </span>

                      </div>

                    </div>


                    <div className="card-body katalog-card-body">

                      <div className="skeleton-line short" />

                      <div className="skeleton-line title" />

                      <div className="skeleton-line" />

                      <div className="skeleton-line medium" />

                    </div>

                  </article>

                </div>

              ))}

            </div>

          )}



          {/* ===================================
              ERROR APPLICATION
              =================================== */}

          {!applicationLoading &&
            applicationError && (

              <div className="information-empty">

                <p>
                  {applicationError}
                </p>

              </div>

            )}



          {/* ===================================
              APPLICATION CARDS
              =================================== */}

          {!applicationLoading &&
            !applicationError &&
            applications.length > 0 && (

              <div className="row g-4">

                {applications.map(
                  (application) => (

                    <div
                      className="col-md-6 col-lg-4"
                      key={
                        application.pk ||
                        application.uuid ||
                        application.id
                      }
                    >

                      <ApplicationCard
                        application={
                          application
                        }
                      />

                    </div>

                  )
                )}

              </div>

            )}



          {/* ===================================
              EMPTY APPLICATION
              =================================== */}

          {!applicationLoading &&
            !applicationError &&
            applications.length === 0 && (

              <div className="information-empty">

                <h5>
                  Belum ada aplikasi
                </h5>

                <p>
                  Aplikasi dan dashboard geospasial
                  yang telah dipublikasikan akan
                  ditampilkan di sini.
                </p>

              </div>

            )}

        </div>

      </section>



      {/* =====================================
          KONTRIBUSI INSTANSI
          ===================================== */}

      <section className="home-agency-section">

        <div className="container">

          <div className="home-section-heading">

            <div>

              <span className="section-eyebrow">
                KONTRIBUSI DATA
              </span>


              <h2>
                Ketersediaan Data Per Instansi
              </h2>


              <p>
                Daftar instansi penyedia dan jumlah
                dataset terpublikasi di Geoportal Aceh.
              </p>

            </div>

          </div>



          {/* ===================================
              LOADING OWNER
              =================================== */}

          {loading ? (

            <div className="agency-loading">
              Memuat data instansi...
            </div>

          ) : owners.length > 0 ? (

            <div className="agency-grid">

              {owners.map((owner) => {

                const ownerName =
                  getOwnerName(owner)


                const ownerAvatar =
                  getOwnerAvatar(owner)


                const datasetCount =
                  Number(
                    owner.count || 0
                  )


                return (

                  <article
                    className="agency-card"
                    key={
                      owner.pk ||
                      owner.username ||
                      ownerName
                    }
                  >

                    {/* AVATAR INSTANSI */}

                    <div className="agency-card-icon">

                      {ownerAvatar ? (

                        <img
                          src={ownerAvatar}
                          alt={ownerName}
                        />

                      ) : (

                        <span>
                          👤
                        </span>

                      )}

                    </div>


                    {/* INFORMASI INSTANSI */}

                    <div className="agency-card-content">

                      <h3
                        title={ownerName}
                      >
                        {ownerName}
                      </h3>


                      <strong>
                        {datasetCount}
                      </strong>


                      <span>
                        Dataset
                      </span>

                    </div>

                  </article>

                )

              })}

            </div>

          ) : (

            <div className="home-empty-state">

              <div>
                ⌂
              </div>


              <h3>
                Belum ada data instansi
              </h3>


              <p>
                Data kontribusi dataset per instansi
                akan ditampilkan di sini.
              </p>

            </div>

          )}

        </div>

      </section>



      {/* =====================================
          INFORMATION
          ===================================== */}

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


            <Link
              to="/informasi/berita"
              className="home-primary-button"
            >
              Lihat Informasi
              <span>→</span>
            </Link>

          </div>

        </div>

      </section>


    </div>

  )

}


export default Home