import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAllGeoapps,
} from '../api/geoappApi'

import GeoappCard from '../components/ApplicationCard'


function Aplikasi() {

  // =========================================
  // DATA
  // =========================================

  const [applications, setApplications] =
    useState([])


  // =========================================
  // FILTER
  // =========================================

  const [search, setSearch] =
    useState('')

  const [category, setCategory] =
    useState('Semua')


  // =========================================
  // STATE
  // =========================================

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // =========================================
  // LOAD GEOAPPS
  // =========================================

  useEffect(() => {

    async function fetchApplications() {

      try {

        setLoading(true)
        setError('')


        const data =
          await getAllGeoapps()


        console.log(
          'Semua Geoapps:',
          data
        )


        setApplications(
          Array.isArray(data)
            ? data
            : []
        )


      } catch (err) {

        console.error(
          'Gagal mengambil aplikasi:',
          err
        )


        setApplications([])

        setError(
          'Gagal mengambil data aplikasi.'
        )


      } finally {

        setLoading(false)

      }

    }


    fetchApplications()

  }, [])


  // =========================================
  // CATEGORY
  // =========================================

  const categories = useMemo(() => {

    const categorySet =
      new Set()


    applications.forEach(
      (application) => {

        const category =
          application.resource_type ===
          'dashboard'
            ? 'Dashboard'
            : application.category?.identifier ||
              'Aplikasi'


        categorySet.add(
          category
        )

      }
    )


    return [
      'Semua',
      ...Array.from(categorySet),
    ]

  }, [applications])


  // =========================================
  // FILTER
  // =========================================

  const filteredApplications =
    useMemo(() => {

      const keyword =
        search
          .toLowerCase()
          .trim()


      return applications.filter(
        (application) => {

          // ================================
          // SEARCH
          // ================================

          const title =
            (
              application.title ||
              application.name ||
              ''
            ).toLowerCase()


          const matchSearch =
            title.includes(
              keyword
            )


          // ================================
          // CATEGORY
          // ================================

          const applicationCategory =
            application.resource_type ===
            'dashboard'
              ? 'Dashboard'
              : application.category?.identifier ||
                'Aplikasi'


          const matchCategory =
            category === 'Semua' ||
            applicationCategory ===
              category


          // ================================
          // PUBLISHED ONLY
          // ================================

          const matchPublished =
            application.is_published === true


          return (
            matchSearch &&
            matchCategory &&
            matchPublished
          )

        }
      )

    }, [
      applications,
      search,
      category,
    ])


  // =========================================
  // RENDER
  // =========================================

  return (

    <main className="applications-page">


      {/* =====================================
          HERO
      ===================================== */}

      <section className="applications-hero">

        <div className="container">

          <div className="applications-hero-content">

            <span className="applications-eyebrow">
              GEOPORTAL ACEH
            </span>

            <h1>
              Aplikasi Geospasial
            </h1>

            <p>
              Jelajahi berbagai aplikasi dan
              layanan geospasial yang mendukung
              pengelolaan informasi spasial
              di Aceh.
            </p>

          </div>

        </div>

      </section>



      {/* =====================================
          SEARCH
      ===================================== */}

      <section className="container information-toolbar-wrapper">

        <div className="information-toolbar">


          {/* SEARCH */}

          <div className="catalog-search-wrapper">

            <span
              className="catalog-search-icon"
              aria-hidden="true"
            >

              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >

                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                <path
                  d="M16.5 16.5L21 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

              </svg>

            </span>


            <input
              type="text"
              className="information-search"
              placeholder="Cari berdasarkan judul aplikasi..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          {/* RESULT */}

          <small className="information-result-count">

            Menampilkan{' '}

            {filteredApplications.length}

            {' '}aplikasi

          </small>

        </div>

      </section>



      {/* =====================================
          CONTENT
      ===================================== */}

      <section className="container information-content">


        {/* ===================================
            HEADING
        =================================== */}

        <div className="catalog-heading-layout">


          <div className="catalog-heading-title">

            <span className="section-eyebrow">
              APLIKASI GEOSPASIAL
            </span>

            <h2>
              Aplikasi Terbaru
            </h2>

            <p>
              Temukan berbagai aplikasi dan
              dashboard geospasial yang tersedia
              di Geoportal Aceh.
            </p>

          </div>


          {/* CATEGORY */}

          <div className="catalog-category-wrapper">

            <div className="information-categories">

              {categories.map(
                (item) => (

                  <button
                    key={item}
                    type="button"
                    className={`information-category ${
                      category === item
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setCategory(item)
                    }
                  >
                    {item}
                  </button>

                )
              )}

            </div>

          </div>

        </div>



        {/* ===================================
            LOADING
        =================================== */}

        {loading && (

          <div className="information-empty">

            <p>
              Memuat aplikasi...
            </p>

          </div>

        )}



        {/* ===================================
            ERROR
        =================================== */}

        {!loading &&
          error && (

            <div className="information-empty">

              <p>
                {error}
              </p>

            </div>

          )}



        {/* ===================================
            APPLICATIONS
        =================================== */}

        {!loading &&
          !error &&
          filteredApplications.length > 0 && (

            <div className="row g-4">

              {filteredApplications.map(
                (application) => (

                  <div
                    className="col-md-6 col-lg-4"
                    key={
                      application.pk ||
                      application.uuid
                    }
                  >

                    <GeoappCard
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
            EMPTY
        =================================== */}

        {!loading &&
          !error &&
          filteredApplications.length === 0 && (

            <div className="information-empty">

              <h5>
                Aplikasi tidak ditemukan
              </h5>

              <p>
                Coba gunakan kata kunci atau
                kategori yang berbeda.
              </p>

            </div>

          )}

      </section>

    </main>

  )

}


export default Aplikasi