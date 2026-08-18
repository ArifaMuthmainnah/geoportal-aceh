import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAllOwners,
} from '../api/jignApi'


function JIGN() {

  // =========================================
  // OWNERS / INSTANSI
  // =========================================

  const [owners, setOwners] =
    useState([])


  // =========================================
  // FILTER
  // =========================================

  const [search, setSearch] =
    useState('')

  const [sort, setSort] =
    useState('Terbanyak Data')


  // =========================================
  // STATE
  // =========================================

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // =========================================
  // LOAD DATA JIGN
  // =========================================

  useEffect(() => {

    async function fetchJIGNData() {

      setLoading(true)
      setError('')


      // =======================================
      // OWNERS / SIMPUL JARINGAN
      // =======================================

      try {

        const ownerList =
          await getAllOwners()

        console.log(
          'JIGN Owners:',
          ownerList
        )


        const validOwners =
          Array.isArray(ownerList)
            ? ownerList
            : []


        setOwners(
          validOwners
        )

      } catch (err) {

        console.error(
          'Gagal mengambil owners:',
          err
        )


        setOwners([])

        setError(
          'Gagal mengambil data simpul jaringan.'
        )

      } finally {

        setLoading(false)

      }

    }


    fetchJIGNData()

  }, [])


  // =========================================
  // OWNER NAME
  // =========================================

  function getOwnerName(owner) {

    const fullName =
      `${owner.first_name || ''} ${
        owner.last_name || ''
      }`
        .trim()


    if (fullName) {
      return fullName
    }


    return (
      owner.username ||
      'Instansi'
    )

  }


  // =========================================
  // FILTER + SORT
  // =========================================

  const filteredOwners =
    useMemo(() => {

      const keyword =
        search
          .toLowerCase()
          .trim()


      const result =
        owners.filter((owner) => {

          const username =
            (
              owner.username ||
              ''
            ).toLowerCase()


          const firstName =
            (
              owner.first_name ||
              ''
            ).toLowerCase()


          const lastName =
            (
              owner.last_name ||
              ''
            ).toLowerCase()


          const fullName =
            `${firstName} ${lastName}`
              .trim()
              .toLowerCase()


          return (
            username.includes(keyword) ||
            firstName.includes(keyword) ||
            lastName.includes(keyword) ||
            fullName.includes(keyword)
          )

        })


      // =====================================
      // SORT
      // =====================================

      if (
        sort ===
        'Terbanyak Data'
      ) {

        result.sort(
          (a, b) =>
            Number(b.count || 0) -
            Number(a.count || 0)
        )

      }


      if (
        sort ===
        'Tersedikit Data'
      ) {

        result.sort(
          (a, b) =>
            Number(a.count || 0) -
            Number(b.count || 0)
        )

      }


      if (
        sort ===
        'Nama A-Z'
      ) {

        result.sort(
          (a, b) =>
            getOwnerName(a).localeCompare(
              getOwnerName(b),
              'id'
            )
        )

      }


      if (
        sort ===
        'Nama Z-A'
      ) {

        result.sort(
          (a, b) =>
            getOwnerName(b).localeCompare(
              getOwnerName(a),
              'id'
            )
        )

      }


      return result

    }, [
      owners,
      search,
      sort,
    ])


  // =========================================
  // TOTAL DATASET DARI OWNER
  // =========================================

  const totalOwnerDatasets =
    owners.reduce(
      (total, owner) =>
        total +
        Number(
          owner.count || 0
        ),
      0
    )


  // =========================================
  // RENDER
  // =========================================

  return (

    <main className="jign-page">


      {/* =====================================
          HERO
      ===================================== */}

      <section className="catalog-hero">

        <div className="container">

          <div className="catalog-hero-content">

            <span className="catalog-eyebrow">
              JARINGAN INFORMASI GEOSPASIAL
            </span>


            <h1>
              JIGN Aceh
            </h1>


            <p>
              Jaringan Informasi Geospasial Nasional
              yang menghubungkan simpul jaringan
              dan informasi geospasial di Aceh.
            </p>

          </div>

        </div>

      </section>



      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <section className="container jign-content-section">


        {/* ===================================
            HEADING
        =================================== */}

        <div className="jign-heading">

          <div className="jign-heading-text">

            <span className="section-eyebrow">
              SIMPUL JARINGAN JIGN
            </span>


            <h2>
              Instansi Penyedia Data
            </h2>


            <p>
              Daftar instansi yang terhubung dalam
              ekosistem informasi geospasial Aceh
              beserta jumlah data yang tersedia.
            </p>

          </div>

        </div>



        {/* ===================================
            SEARCH + FILTER
        =================================== */}

        <div className="jign-toolbar-section">

          <div className="jign-toolbar">


            {/* SEARCH */}

            <div className="jign-search-row">

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
                  placeholder="Cari nama instansi atau username..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>



            {/* FILTER */}

            <div className="jign-filter-row">

              <small className="information-result-count">

                Menampilkan{' '}

                <strong>
                  {filteredOwners.length}
                </strong>

                {' '}dari{' '}

                <strong>
                  {owners.length}
                </strong>

                {' '}instansi

              </small>


              <select
                className="jign-sort-select"
                value={sort}
                onChange={(e) =>
                  setSort(
                    e.target.value
                  )
                }
                aria-label="Urutkan daftar instansi"
              >

                <option value="Terbanyak Data">
                  Jumlah Dataset Terbanyak
                </option>

                <option value="Tersedikit Data">
                  Jumlah Dataset Tersedikit
                </option>

                <option value="Nama A-Z">
                  Nama Instansi (A–Z)
                </option>

                <option value="Nama Z-A">
                  Nama Instansi (Z–A)
                </option>

              </select>

            </div>

          </div>

        </div>



        {/* ===================================
            SUMMARY
        =================================== */}

        <div className="jign-summary">

          <span>

            <strong>
              {owners.length}
            </strong>

            {' '}simpul jaringan

          </span>


          <span>

            <strong>
              {totalOwnerDatasets}
            </strong>

            {' '}dataset dari instansi

          </span>

        </div>



        {/* ===================================
            LOADING
        =================================== */}

        {loading && (

          <div className="information-empty">

            <p>
              Memuat data JIGN...
            </p>

          </div>

        )}



        {/* ===================================
            ERROR
        =================================== */}

        {!loading &&
          error && (

            <div className="information-empty">

              <h5>
                Data JIGN belum dapat dimuat
              </h5>

              <p>
                {error}
              </p>

            </div>

          )}



        {/* ===================================
            OWNER GRID
        =================================== */}

        {!loading &&
          !error &&
          filteredOwners.length > 0 && (

            <div className="jign-owner-grid">

              {filteredOwners.map(
                (owner) => {

                  const name =
                    getOwnerName(
                      owner
                    )


                  const datasetCount =
                    Number(
                      owner.count || 0
                    )


                  return (

                    <article
                      className="jign-owner-card"
                      key={
                        owner.pk ||
                        owner.username ||
                        name
                      }
                    >


                      {/* CARD HEADER */}

                      <div className="jign-owner-header">

                        <div className="jign-owner-avatar">

                          {owner.avatar ? (

                            <img
                              src={
                                owner.avatar
                              }
                              alt={name}
                            />

                          ) : (

                            <span>
                              {name
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                          )}

                        </div>


                        {/* STATUS */}

                        <span className="jign-owner-status">

                          <span className="jign-status-dot" />

                          Aktif

                        </span>

                      </div>



                      {/* CARD CONTENT */}

                      <div className="jign-owner-content">

                        <span className="jign-owner-username">

                          @
                          {owner.username ||
                            'instansi'}

                        </span>


                        <h3>
                          {name}
                        </h3>


                        <p className="jign-owner-description">

                          Simpul Jaringan Informasi
                          Geospasial Aceh

                        </p>



                        {/* CARD FOOTER */}

                        <div className="jign-owner-footer">


                          <div className="jign-owner-dataset">

                            <strong>
                              {datasetCount}
                            </strong>

                            <span>
                              Dataset
                            </span>

                          </div>



                          <div className="jign-owner-type">

                            <span className="jign-type-icon">
                              GIS
                            </span>

                            <span>
                              Simpul JIGN
                            </span>

                          </div>

                        </div>

                      </div>

                    </article>

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
          filteredOwners.length === 0 && (

            <div className="information-empty">

              <div className="jign-empty-icon">
                ⌂
              </div>


              <h5>
                Instansi tidak ditemukan
              </h5>


              <p>
                Coba gunakan kata kunci
                yang berbeda.
              </p>

            </div>

          )}

      </section>



      {/* =====================================
          INFORMATION
      ===================================== */}

      <section className="jign-info-section">

        <div className="container">

          <div className="jign-info-box">

            <div>

              <span className="section-eyebrow">
                TENTANG JIGN
              </span>


              <h2 className="jign-info-title">

                Menghubungkan informasi
                geospasial Aceh.

              </h2>

            </div>


            <p>

              JIGN menjadi bagian dari ekosistem
              penyelenggaraan informasi geospasial
              yang memungkinkan data dari berbagai
              instansi dikelola dan dimanfaatkan
              secara lebih terintegrasi.

            </p>

          </div>

        </div>

      </section>


    </main>

  )

}


export default JIGN