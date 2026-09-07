import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAllOwners,
} from '../api/jignApi'

import {
  getPublicOwners,
} from '../api/userApi'

import {
  getAllGeoapps,
} from '../api/geoappApi'

import {
  getAllMaps,
} from '../api/mapApi'

import {
  getAllDocuments,
} from '../api/documentApi'

import {
  mergeOwnerLists,
} from '../utils/ownDataAdapter'

import { Link } from 'react-router'


// =========================================
// HITUNG JUMLAH RESOURCE PER OWNER
// =========================================
//
// #8 (Sesi 4): endpoint "owners" API lama cuma kasih total
// gabungan semua jenis resource ("count"), tanpa rincian per
// jenis. Jadi di sini kita hitung sendiri dari daftar
// geoapps/maps/documents lengkap, dikelompokkan per username
// pemilik.

function countByOwnerUsername(list) {
  const map = new Map()
  if (!Array.isArray(list)) return map
  list.forEach((item) => {
    const username = item?.owner?.username
    if (!username) return
    map.set(username, (map.get(username) || 0) + 1)
  })
  return map
}


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
      // OWNERS / SIMPUL JARINGAN - API LAMA
      // =======================================

      let oldOwnerList = []

      try {

        const ownerList =
          await getAllOwners()

        console.log(
          'JIGN Owners (API Lama):',
          ownerList
        )


        oldOwnerList =
          Array.isArray(ownerList)
            ? ownerList
            : []

      } catch (err) {

        console.error(
          'Gagal mengambil owners API lama:',
          err
        )

        setError(
          'Sebagian data simpul jaringan belum dapat dimuat.'
        )

      }


      // =======================================
      // RINCIAN JENIS DATA (Dashboard/Peta/Dokumen)
      // DARI API LAMA — #8
      // =======================================

      let dashboardCountMap = new Map()
      let mapCountMap = new Map()
      let documentCountMap = new Map()

      try {

        const [oldGeoapps, oldMaps, oldDocuments] = await Promise.all([
          getAllGeoapps().catch(() => []),
          getAllMaps().catch(() => []),
          getAllDocuments().catch(() => []),
        ])

        dashboardCountMap = countByOwnerUsername(oldGeoapps)
        mapCountMap = countByOwnerUsername(oldMaps)
        documentCountMap = countByOwnerUsername(oldDocuments)

      } catch (err) {

        console.error(
          'Gagal menghitung rincian jenis data API lama:',
          err
        )

      }

      const enrichedOldOwners =
        oldOwnerList.map((owner) => {

          const dashboardCount = dashboardCountMap.get(owner.username) || 0
          const mapCount = mapCountMap.get(owner.username) || 0
          const documentCount = documentCountMap.get(owner.username) || 0

          // Sisa dari total dianggap Dataset, karena API lama
          // tidak punya endpoint rincian per-owner untuk dataset.
          const datasetCount =
            Math.max(
              Number(owner.count || 0) - dashboardCount - mapCount - documentCount,
              0
            )

          return {
            ...owner,
            dataset_count: datasetCount,
            dashboard_count: dashboardCount,
            application_count: 0,
            map_count: mapCount,
            document_count: documentCount,
            informasi_count: 0,
          }

        })


      // =======================================
      // PENGGUNA SENDIRI (LOKAL)
      // =======================================

      let ownUserList = []

      try {

        ownUserList =
          await getPublicOwners()

        console.log(
          'JIGN Owners (Sendiri):',
          ownUserList
        )

      } catch (err) {

        console.error(
          'Gagal mengambil pengguna sendiri:',
          err
        )

      }


      // =======================================
      // GABUNGKAN
      // =======================================

      const mergedOwners =
        mergeOwnerLists(
          enrichedOldOwners,
          ownUserList
        )


      setOwners(
        mergedOwners
      )


      setLoading(false)

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

          <div className="information-toolbar">

            <div className="catalog-search-wrapper">

              <span className="catalog-search-icon" aria-hidden="true">

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


                  // #8: rincian jumlah data per jenis resource,
                  // hanya ditampilkan untuk yang jumlahnya > 0.
                  const breakdown = [
                    { label: 'Dataset', value: Number(owner.dataset_count || 0) },
                    { label: 'Dashboard', value: Number(owner.dashboard_count || 0) },
                    { label: 'Aplikasi', value: Number(owner.application_count || 0) },
                    { label: 'Peta', value: Number(owner.map_count || 0) },
                    { label: 'Dokumen', value: Number(owner.document_count || 0) },
                    { label: 'Informasi', value: Number(owner.informasi_count || 0) },
                  ].filter((entry) => entry.value > 0)


                  return (

                    <Link
                      to={`/jign/${encodeURIComponent(owner.username || '')}`}
                      className="jign-owner-card"
                      key={
                        owner.pk ||
                        owner.username ||
                        name
                      }
                      style={{ textDecoration: 'none', color: 'inherit' }}
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
                              Total Data
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


                        {/* #8: RINCIAN PER JENIS DATA */}

                        {breakdown.length > 0 && (

                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginTop: '10px',
                            }}
                          >

                            {breakdown.map((entry) => (

                              <span
                                key={entry.label}
                                style={{
                                  padding: '3px 9px',
                                  borderRadius: '999px',
                                  background: '#eef5fb',
                                  color: '#0b5cab',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                }}
                              >
                                {entry.value} {entry.label}
                              </span>

                            ))}

                          </div>

                        )}

                      </div>

                    </Link>

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