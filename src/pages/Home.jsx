import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router'

import {
  getLatestDatasets,
  getDatasetTotalCount,
} from '../api/datasetApi'

import {
  getAllOwners,
} from '../api/jignApi'

import {
  getMaps,
} from '../api/mapApi'

import {
  getDocuments,
} from '../api/documentApi'

import {
  getGeoapps,
  getAllGeoapps,
  getGeoappTotalCount,
} from '../api/geoappApi'

import {
  getPublishedByType,
} from '../api/myDatasetApi'

import {
  getPublicOwners,
} from '../api/userApi'

import {
  getOwnerName,
  getOwnerAvatar,
} from '../utils/datasetUtils'

import {
  mergeResourceLists,
  sortByDateDesc,
  mergeOwnerLists,
} from '../utils/ownDataAdapter'

import DatasetCard from '../components/DatasetCard'
import ApplicationCard from '../components/ApplicationCard'
import AnimatedCounter from '../components/AnimatedCounter'


function Home() {

  // ===================================================
  // DATASET
  // ===================================================

  const [datasets, setDatasets] =
    useState([])

  const [datasetTotal, setDatasetTotal] =
    useState(0)


  // ===================================================
  // APPLICATION
  // ===================================================

  const [applications, setApplications] =
    useState([])

  const [
    applicationLoading,
    setApplicationLoading,
  ] = useState(true)


  // ===================================================
  // STATISTICS
  // ===================================================

  const [mapTotal, setMapTotal] =
    useState(0)

  const [documentTotal, setDocumentTotal] =
    useState(0)

  const [geoappTotal, setGeoappTotal] =
    useState(0)


  // ===================================================
  // OWNERS
  // ===================================================

  const [owners, setOwners] =
    useState([])

  const [ownerTotal, setOwnerTotal] =
    useState(0)


  // ===================================================
  // STATE
  // ===================================================

  const [loading, setLoading] =
    useState(true)

  const [datasetError, setDatasetError] =
    useState('')

  const [
    applicationError,
    setApplicationError,
  ] = useState('')


  // ===================================================
  // LOAD HOME DATA
  // ===================================================

  useEffect(() => {

    let mounted = true


    async function loadHomeData() {

      setLoading(true)
      setDatasetError('')


      // ===============================================
      // DATASET (API LAMA + UPLOAD SENDIRI)
      // ===============================================

      let oldDatasetList = []
      let ownDatasetList = []

            let oldDatasetTotal = 0

      try {

        const response =
          await getLatestDatasets()

        oldDatasetList =
          Array.isArray(response)
            ? response
            : response?.datasets ||
              response?.results ||
              response?.data ||
              []

        oldDatasetTotal =
          await getDatasetTotalCount()

      } catch (err) {

        console.error(
          'Gagal mengambil dataset API lama:',
          err
        )

        if (mounted) {
          setDatasetError(
            'Sebagian dataset belum dapat dimuat.'
          )
        }

      }

      try {

        ownDatasetList =
          await getPublishedByType('dataset')

      } catch (err) {

        console.error(
          'Gagal mengambil dataset sendiri:',
          err
        )

      }

      if (mounted) {

        const mergedDatasets =
          sortByDateDesc(
            mergeResourceLists(
              oldDatasetList,
              ownDatasetList
            )
          )

        setDatasets(
          mergedDatasets.slice(0, 3)
        )

        setDatasetTotal(
          oldDatasetTotal +
          ownDatasetList.length
        )

      }


      // ===============================================
      // MAPS (API LAMA) + WEBGIS SENDIRI
      // ===============================================

      let ownWebgisTotal = 0

      try {

        ownWebgisTotal =
          (await getPublishedByType('webgis')).length

      } catch (err) {

        console.error(
          'Gagal mengambil webgis sendiri:',
          err
        )

      }

      try {

        const response =
          await getMaps(
            '?page_size=1'
          )

        if (mounted) {

          const oldMapTotal =
            Number(
              response?.total ??
              response?.count ??
              0
            )

          setMapTotal(
            oldMapTotal + ownWebgisTotal
          )

        }

      } catch (err) {

        console.error(
          'Gagal mengambil maps:',
          err
        )

        if (mounted) {
          setMapTotal(ownWebgisTotal)
        }

      }


      // ===============================================
      // DOCUMENTS (API LAMA)
      // ===============================================

      try {

        const response =
          await getDocuments(
            '?page_size=1'
          )

        if (mounted) {

          setDocumentTotal(
            Number(
              response?.total ??
              response?.count ??
              0
            )
          )

        }

      } catch (err) {

        console.error(
          'Gagal mengambil documents:',
          err
        )

        if (mounted) {
          setDocumentTotal(0)
        }

      }


      // ===============================================
      // GEOAPPS / DASHBOARD (API LAMA + SENDIRI)
      // ===============================================

      let ownDashboardTotal = 0

      try {

        ownDashboardTotal =
          (await getPublishedByType('dashboard')).length

      } catch (err) {

        console.error(
          'Gagal mengambil dashboard sendiri:',
          err
        )

      }

            try {

        const oldGeoappTotal =
          await getGeoappTotalCount()

        if (mounted) {

          setGeoappTotal(
            oldGeoappTotal + ownDashboardTotal
          )

        }

      } catch (err) {

        console.error(
          'Gagal mengambil geoapps:',
          err
        )

        if (mounted) {
          setGeoappTotal(ownDashboardTotal)
        }

      }


      // ===============================================
      // OWNERS (API LAMA + PENGGUNA SENDIRI)
      // ===============================================

      let oldOwnerList = []
      let ownUserList = []

      try {

        const response =
          await getAllOwners()

        oldOwnerList =
          Array.isArray(response)
            ? response
            : response?.owners ||
              response?.results ||
              response?.data ||
              []

      } catch (err) {

        console.error(
          'Gagal mengambil owners:',
          err
        )

      }

      try {

        ownUserList =
          await getPublicOwners()

      } catch (err) {

        console.error(
          'Gagal mengambil pengguna sendiri:',
          err
        )

      }

      if (mounted) {

        const mergedOwners =
          mergeOwnerLists(
            oldOwnerList,
            ownUserList
          )

        const sortedOwners =
          [...mergedOwners].sort(
            (a, b) =>
              Number(b?.count || 0) -
              Number(a?.count || 0)
          )

        setOwners(sortedOwners)
        setOwnerTotal(sortedOwners.length)

      }


      if (mounted) {
        setLoading(false)
      }

    }


    loadHomeData()


    return () => {
      mounted = false
    }

  }, [])


  // ===================================================
  // LOAD APPLICATIONS (API LAMA + DASHBOARD SENDIRI)
  // ===================================================

  useEffect(() => {

    let mounted = true


    async function loadApplications() {

      try {

        setApplicationLoading(true)
        setApplicationError('')


        let oldGeoappList = []
        let ownDashboardList = []


        try {

          const response =
            await getAllGeoapps()

          oldGeoappList =
            Array.isArray(response)
              ? response
              : response?.geoapps ||
                response?.results ||
                response?.data ||
                []

        } catch (err) {

          console.error(
            'Gagal mengambil aplikasi API lama:',
            err
          )

        }


        try {

          ownDashboardList =
            await getPublishedByType('dashboard')

        } catch (err) {

          console.error(
            'Gagal mengambil dashboard sendiri:',
            err
          )

        }


        const mergedApplications =
          mergeResourceLists(
            oldGeoappList,
            ownDashboardList
          )


        const publishedApplications =
          mergedApplications.filter(
            (application) =>
              application?.is_published === true
          )


        const sortedApplications =
          sortByDateDesc(
            publishedApplications
          )


        if (mounted) {

          setApplications(
            sortedApplications.slice(
              0,
              3
            )
          )

        }

      } catch (err) {

        console.error(
          'Gagal mengambil aplikasi:',
          err
        )


        if (mounted) {

          setApplications([])

          setApplicationError(
            'Aplikasi belum dapat dimuat.'
          )

        }

      } finally {

        if (mounted) {
          setApplicationLoading(false)
        }

      }

    }


    loadApplications()


    return () => {
      mounted = false
    }

  }, [])


  // ===================================================
  // STATISTICS
  // ===================================================

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


  // ===================================================
  // OWNER MAP
  // ===================================================

  const ownerMap = useMemo(
    () =>
      new Map(
        owners.map(
          (owner) => [
            owner.pk ||
            owner.id ||
            owner.uuid,

            owner,
          ]
        )
      ),

    [owners]
  )


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="home-page">


      {/* =================================================
          HERO
      ================================================= */}

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

                <Link
                  to="/webgis"
                  className="home-primary-button"
                >
                  Jelajahi WebGIS
                  <span>→</span>
                </Link>


                <Link
                  to="/katalog"
                  className="home-secondary-button"
                >
                  Lihat Katalog
                </Link>

              </div>

            </div>


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


      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="home-statistics">

        <div className="container">

          <div className="statistics-card">

            {statistics.map(
              (stat) => (

                <div
                  className="stat-item"
                  key={stat.label}
                >

                  <div className="stat-icon">
                    {stat.icon}
                  </div>


                  <div className="stat-number">

                    <strong>

                      {loading
                        ? '...'
                        : (
                          <AnimatedCounter
                            value={
                              stat.value
                            }
                          />
                        )}

                    </strong>

                  </div>


                  <span>
                    {stat.label}
                  </span>


                  <div className="stat-line" />

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* =================================================
          DATASET TERBARU
      ================================================= */}

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


          {/* =============================================
              LOADING
          ============================================= */}

          {loading && (

            <div className="home-card-grid">

              {[1, 2, 3].map(
                (item) => (

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

                )
              )}

            </div>

          )}


          {/* =============================================
              DATA
          ============================================= */}

          {!loading &&
            datasets.length > 0 && (

              <div className="home-card-grid">

                {datasets.map(
                  (dataset) => {

                    const ownerId =
                      dataset?.owner?.pk ??
                      dataset?.owner?.id ??
                      dataset?.owner_pk ??
                      dataset?.owner_id


                    const owner =
                      dataset?.owner
                        ?.first_name !==
                        undefined
                        ? dataset.owner
                        : ownerMap.get(
                            ownerId
                          )


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

                  }
                )}

              </div>

            )}


          {/* =============================================
              EMPTY
          ============================================= */}

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


      {/* =================================================
          WEBGIS
      ================================================= */}

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

              <Link
                to="/webgis"
                className="home-primary-button"
              >
                Buka WebGIS
                <span>→</span>
              </Link>

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


      {/* =================================================
          APPLICATION
      ================================================= */}

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


          {/* =============================================
              LOADING
          ============================================= */}

          {applicationLoading && (

            <div className="row g-4">

              {[1, 2, 3].map(
                (item) => (

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

                )
              )}

            </div>

          )}


          {/* =============================================
              ERROR
          ============================================= */}

          {!applicationLoading &&
            applicationError && (

              <div className="information-empty">

                <p>
                  {applicationError}
                </p>

              </div>

            )}


          {/* =============================================
              APPLICATION
          ============================================= */}

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


          {/* =============================================
              EMPTY
          ============================================= */}

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


      {/* =================================================
          AGENCY
      ================================================= */}

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


          {loading ? (

            <div className="agency-loading">
              Memuat data instansi...
            </div>

          ) : owners.length > 0 ? (

            <div className="agency-grid">

              {owners.map(
                (owner) => {

                  const ownerName =
                    getOwnerName(owner)


                  const ownerAvatar =
                    getOwnerAvatar(owner)


                  const datasetCount =
                    Number(
                      owner?.count || 0
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

                }
              )}

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


      {/* =================================================
          INFORMATION
      ================================================= */}

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