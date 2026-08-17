import { useEffect, useMemo, useState } from 'react'

import { getAllDatasets, } from '../api/datasetApi'

import { getAllOwners, } from '../api/jignApi'

import { mapCategory, } from '../utils/datasetUtils'

import DatasetCard from '../components/DatasetCard'


function Katalog() {

  // =========================================
  // DATA
  // =========================================

  const [datasets, setDatasets] =
    useState([])

  const [owners, setOwners] =
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
  // LOAD DATASET + OWNER
  // =========================================

  useEffect(() => {

    async function fetchData() {

      try {

        setLoading(true)
        setError('')


        // ================================
        // DATASET
        // ================================

        const datasetData =
          await getAllDatasets()

        console.log(
          'Semua Dataset:',
          datasetData
        )


        setDatasets(
          Array.isArray(datasetData)
            ? datasetData
            : []
        )


        // ================================
        // OWNER / INSTANSI
        // ================================

        const ownerData =
          await getAllOwners()

        console.log(
          'Semua Owner:',
          ownerData
        )


        setOwners(
          Array.isArray(ownerData)
            ? ownerData
            : []
        )


      } catch (err) {

        console.error(
          'Gagal mengambil data:',
          err
        )

        setDatasets([])
        setOwners([])

        setError(
          'Gagal mengambil data katalog.'
        )


      } finally {

        setLoading(false)

      }

    }


    fetchData()

  }, [])


  // =========================================
  // OWNER MAP
  // =========================================

  const ownerMap = useMemo(() => {

    return new Map(
      owners.map((owner) => [
        owner.pk,
        owner,
      ])
    )

  }, [owners])


  // =========================================
  // CATEGORY FILTER
  // =========================================

  const categories = useMemo(() => {
    const categorySet = new Set()

    datasets.forEach((dataset) => {
      const identifier =
        dataset.category?.identifier

      if (!identifier) {
        return
      }

      const mappedCategory =
        mapCategory(identifier)

      // Jangan tampilkan kategori "Umum"
      // jika identifier API memang tidak dikenal.
      if (mappedCategory !== 'Umum') {
        categorySet.add(mappedCategory)
      }
    })

    return [
      'Semua',
      ...Array.from(categorySet),
    ]
  }, [datasets])


  // =========================================
  // FILTER DATASET
  // =========================================

  const filteredDatasets =
    useMemo(() => {

      const keyword =
        search
          .toLowerCase()
          .trim()


      return datasets.filter(
        (dataset) => {

          // SEARCH HANYA JUDUL
          const title =
            (
              dataset.title || ''
            ).toLowerCase()


          const matchSearch =
            title.includes(keyword)


          // FILTER CATEGORY
          const mappedCategory =
            mapCategory(
              dataset.category?.identifier
            )


          const matchCategory =
            category === 'Semua' ||
            mappedCategory === category


          return (
            matchSearch &&
            matchCategory
          )

        }
      )

    }, [
      datasets,
      search,
      category,
    ])


  // =========================================
  // RENDER
  // =========================================

  return (

    <main className="katalog-page">


      {/* =====================================
          HEADER
          ===================================== */}

      <section className="information-header">

        <div className="container information-header-inner">

          <div className="information-breadcrumb">

            <span className="text-muted">
              Data
            </span>

            <span className="text-muted mx-2">
              /
            </span>

            <span className="current">
              Katalog
            </span>

          </div>


          <h1>
            Katalog Data
          </h1>


          <p>
            Temukan dan jelajahi data
            geospasial Aceh.
          </p>

        </div>

      </section>



      {/* =====================================
          SEARCH
          ===================================== */}

      <section className="container information-toolbar-wrapper">

        <div className="information-toolbar">

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
              placeholder="Cari berdasarkan judul dataset..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <small className="information-result-count">
            Menampilkan{' '}
            {filteredDatasets.length}{' '}
            dataset
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

          {/* ================================
              TITLE
          ================================= */}
          <div className="catalog-heading-title">

            <span className="section-eyebrow">
              DATA GEOSPASIAL
            </span>

            <h2>
              Dataset Terbaru
            </h2>

            <p>
              Temukan dataset berdasarkan
              kategori informasi.
            </p>

          </div>


          {/* ================================
              CATEGORY
          ================================= */}
          <div className="catalog-category-wrapper">

            <div className="information-categories">

              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`information-category ${
                    category === item
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}

            </div>

          </div>

        </div>


        {/* ===================================
            LOADING
            =================================== */}

        {loading && (

          <div className="information-empty">

            <p>
              Memuat data...
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
            DATASET
            =================================== */}

        {!loading &&
          !error &&
          filteredDatasets.length > 0 && (

            <div className="row g-4">

              {filteredDatasets.map(
                (dataset) => {

                  /*
                   * Dataset biasanya memiliki
                   * informasi owner.
                   *
                   * Kita coba cari owner
                   * berdasarkan PK dari API owners.
                   */

                  const ownerId =
                    dataset.owner?.pk ||
                    dataset.owner?.id ||
                    dataset.owner_pk ||
                    dataset.owner_id


                  const owner =
                    ownerMap.get(
                      ownerId
                    ) ||
                    dataset.owner ||
                    null


                  return (

                    <div
                      className="col-md-6 col-lg-4"
                      key={dataset.pk}
                    >

                      <DatasetCard
                        dataset={dataset}
                        owner={owner}
                      />

                    </div>

                  )

                }
              )}

            </div>

          )}

        {/* ===================================
            EMPTY
            =================================== */}

        {!loading &&
          !error &&
          filteredDatasets.length === 0 && (

            <div className="information-empty">

              <h5>
                Dataset tidak ditemukan
              </h5>

              <p>
                Coba gunakan kata kunci
                judul atau kategori
                yang berbeda.
              </p>

            </div>

          )}

      </section>

    </main>

  )
}


export default Katalog