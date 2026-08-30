import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router'

import {
  getMyDatasets,
  deleteMyDataset,
} from '../../api/myDatasetApi'

import {
  useAuth,
} from '../../context/AuthContext'


function MyDatasets() {

  const navigate = useNavigate()

  const {
    currentUser,
    logout,
  } = useAuth()


  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // ===================================================
  // FILTER (samain dengan admin) — hamburger + popover
  // posisi fixed supaya tidak terpotong (#3)
  // ===================================================

  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState({ dataset: true, dashboard: true, webgis: true })
  const [filterStatus, setFilterStatus] = useState({ published: true, unpublished: true })

  const filterButtonRef = useRef(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })

  function toggleFilterPopover() {
    if (!filterOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect()
      setPopoverPos({ top: rect.bottom + 8, left: rect.left })
    }
    setFilterOpen((current) => !current)
  }


  async function loadDatasets() {

    try {

      setLoading(true)
      setError('')

      const data =
        await getMyDatasets()

      setDatasets(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (err) {

      console.error(
        'Load datasets error:',
        err
      )

      setError(
        'Gagal memuat data.'
      )

      setDatasets([])

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadDatasets()

  }, [])


  // ===================================================
  // FILTER + SEARCH (fix #3: search hanya berdasarkan judul)
  // ===================================================

  const filteredDatasets =
    useMemo(() => {

      const keyword =
        search
          .trim()
          .toLowerCase()

      return datasets.filter(
        (dataset) => {

          const title =
            String(dataset.title || '').toLowerCase()

          const matchSearch =
            !keyword || title.includes(keyword)

          const resourceType =
            String(dataset.resource_type || 'dataset').toLowerCase()

          const matchType =
            filterType[resourceType] !== false

          const published =
            Boolean(dataset.is_published)

          const matchStatus =
            (published && filterStatus.published) ||
            (!published && filterStatus.unpublished)

          return matchSearch && matchType && matchStatus

        }
      )

    }, [
      datasets,
      search,
      filterType,
      filterStatus,
    ])


  // =====================================================
  // RESOURCE TYPE LABEL
  // =====================================================

  function getResourceTypeLabel(
    resourceType
  ) {

    const type =
      String(
        resourceType || 'dataset'
      )
        .trim()
        .toLowerCase()


    if (type === 'dashboard') {
      return 'Dashboard'
    }


    if (type === 'webgis') {
      return 'WebGIS'
    }


    return 'Dataset'

  }


  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete(
    dataset
  ) {

    const title =
      dataset.title ||
      'data ini'


    const confirmed =
      window.confirm(
        `Hapus "${title}"?`
      )


    if (!confirmed) {
      return
    }


    try {

      await deleteMyDataset(
        dataset.id
      )


      setDatasets(
        (current) =>
          current.filter(
            (item) =>
              item.id !== dataset.id
          )
      )


      window.alert(
        'Data berhasil dihapus.'
      )

    } catch (err) {

      console.error(
        'Delete error:',
        err
      )

      window.alert(
        'Data gagal dihapus.'
      )

    }

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {

    logout()

    navigate(
      '/',
      {
        replace: true,
      }
    )

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <main className="admin-page">

      <div className="admin-layout">


        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="admin-sidebar">


          <div className="admin-sidebar-brand">

            <span>
              GEOPORTAL
            </span>

            <strong>
              ACEH
            </strong>

          </div>


          {/* USER */}

          <div className="admin-sidebar-user">

            <div className="admin-user-avatar">

              {currentUser?.avatar_url ? (
                <img
                  src={`${(import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/uploads/${currentUser.avatar_url}`}
                  alt={currentUser.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                (currentUser?.username || 'U').charAt(0).toUpperCase()
              )}

            </div>


            <div>

              <strong>
                {currentUser?.username || 'Operator'}
              </strong>

              <span>
                Operator
              </span>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="admin-sidebar-nav">


            <Link
              to="/dashboard"
              className="admin-sidebar-link"
            >

              <span>
                ▦
              </span>

              Dashboard

            </Link>


            <button
              type="button"
              className="active"
            >

              <span>
                ◈
              </span>

              Data Saya

            </button>


            <Link
              to="/dashboard/upload"
              className="admin-sidebar-link"
            >

              <span>
                ⬆
              </span>

              Upload

            </Link>


            <Link
              to="/katalog"
              className="admin-sidebar-link"
            >

              <span>
                ◉
              </span>

              Lihat Katalog

            </Link>


            <Link
              to="/webgis"
              className="admin-sidebar-link"
            >

              <span>
                ⌖
              </span>

              WebGIS

            </Link>


          </nav>


          {/* LOGOUT */}

          <button
            type="button"
            className="admin-sidebar-logout"
            onClick={handleLogout}
          >

            ← Logout

          </button>


        </aside>


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <section className="admin-main">


          {/* HEADER */}

          <header className="admin-header">


            <div>

              <span className="section-eyebrow">
                OPERATOR
              </span>


              <h1>
                Data Saya
              </h1>


              <p>
                Kelola dataset, dashboard,
                dan WebGIS yang telah Anda unggah.
              </p>

            </div>


            <div className="admin-header-actions">

              <Link
                to="/dashboard/upload"
                className="admin-view-site"
              >
                + Upload Data
              </Link>

            </div>


          </header>


          {/* ERROR */}

          {error && (

            <div className="admin-alert">
              {error}
            </div>

          )}


          {/* =================================================
              PANEL
          ================================================= */}

          <section className="admin-panel">


            {/* PANEL HEADER */}

            <div className="admin-panel-header">

              <div>

                <span className="section-eyebrow">
                  DAFTAR
                </span>


                <h2>
                  Semua Data Saya
                </h2>

              </div>

            </div>


            {/* =================================================
                TOOLBAR — filter (hamburger, paling kiri) +
                search berdasarkan JUDUL saja
            ================================================= */}

            <div
              className="admin-toolbar"
              style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative' }}
            >

              <div style={{ position: 'relative' }}>

                <button
                  ref={filterButtonRef}
                  type="button"
                  onClick={toggleFilterPopover}
                  title="Filter"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #d1d5db', background: filterOpen ? '#eef2ff' : '#fff',
                    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                  Filter
                </button>

                {filterOpen && (
                  <div
                    style={{
                      position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 1000,
                      background: '#fff', border: '1px solid #d1d5db', borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '16px', width: '280px',
                      maxHeight: '70vh', overflowY: 'auto',
                      display: 'flex', flexDirection: 'column', gap: '16px',
                    }}
                  >

                    <div>
                      <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>TYPE</strong>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[{ key: 'dataset', label: 'Dataset' }, { key: 'dashboard', label: 'Dashboard' }, { key: 'webgis', label: 'WebGIS' }].map((option) => (
                          <label key={option.key} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                            borderRadius: '999px', border: '1px solid #d1d5db', cursor: 'pointer',
                            background: filterType[option.key] ? '#eef2ff' : '#fff', fontSize: '13px',
                          }}>
                            <input type="checkbox" checked={filterType[option.key]}
                              onChange={(e) => setFilterType((c) => ({ ...c, [option.key]: e.target.checked }))} />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>STATUS</strong>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[{ key: 'published', label: 'Published' }, { key: 'unpublished', label: 'Unpublished' }].map((option) => (
                          <label key={option.key} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                            borderRadius: '999px', border: '1px solid #d1d5db', cursor: 'pointer',
                            background: filterStatus[option.key] ? '#eef2ff' : '#fff', fontSize: '13px',
                          }}>
                            <input type="checkbox" checked={filterStatus[option.key]}
                              onChange={(e) => setFilterStatus((c) => ({ ...c, [option.key]: e.target.checked }))} />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <button type="button" className="admin-secondary-button" onClick={() => setFilterOpen(false)}>
                      Terapkan
                    </button>

                  </div>
                )}

              </div>

              <input
                type="search"
                placeholder="Cari berdasarkan judul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />

            </div>


            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (

              <div className="admin-loading">

                Memuat data...

              </div>


            ) : filteredDatasets.length === 0 ? (


              /* =================================================
                  EMPTY
              ================================================= */

              <div className="admin-empty">

                <div
                  style={{
                    fontSize: '36px',
                    marginBottom: '10px',
                  }}
                >
                  ◈
                </div>


                <strong>
                  {search
                    ? 'Data tidak ditemukan'
                    : 'Belum ada data'}
                </strong>


                <p>
                  {search
                    ? 'Coba gunakan kata kunci pencarian lain.'
                    : 'Anda belum mengunggah dataset, dashboard, atau WebGIS apa pun.'}
                </p>


                {!search && (

                  <div
                    style={{
                      marginTop: '16px',
                    }}
                  >

                    <Link
                      to="/dashboard/upload"
                      className="admin-secondary-button"
                    >
                      + Upload Data
                    </Link>

                  </div>

                )}

              </div>


            ) : (


              /* =================================================
                  TABLE
              ================================================= */

              <div className="admin-table-wrapper">

                <table className="admin-table">


                  <thead>

                    <tr>

                      <th>
                        Data
                      </th>

                      <th>
                        Jenis
                      </th>

                      <th>
                        Kategori
                      </th>

                      <th>
                        Tanggal
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Aksi
                      </th>

                    </tr>

                  </thead>


                  <tbody>


                    {filteredDatasets.map(
                      (dataset) => {


                        const published =
                          Boolean(
                            dataset.is_published
                          )


                        const resourceType =
                          getResourceTypeLabel(
                            dataset.resource_type
                          )


                        return (

                          <tr
                            key={dataset.id}
                          >


                            {/* DATA */}

                            <td>

                              <strong>
                                {dataset.title ||
                                  'Tanpa judul'}
                              </strong>


                              <small>
                                ID: {dataset.id || '-'}
                              </small>

                            </td>


                            {/* JENIS */}

                            <td>

                              <span className="admin-status">

                                {resourceType}

                              </span>

                            </td>


                            {/* KATEGORI */}

                            <td>

                              {dataset.category
                                ? dataset.category
                                : '-'}

                            </td>


                            {/* TANGGAL */}

                            <td>

                              {dataset.created_at

                                ? new Date(
                                    dataset.created_at
                                  ).toLocaleDateString(
                                    'id-ID'
                                  )

                                : '-'

                              }

                            </td>


                            {/* STATUS */}

                            <td>

                              <span
                                className={
                                  published
                                    ? 'admin-status published'
                                    : 'admin-status pending'
                                }
                              >

                                {published
                                  ? 'Published'
                                  : 'Belum Publish'}

                              </span>

                            </td>


                            {/* AKSI */}

                            <td>

                              <div className="admin-actions">

                                <Link
                                  to={
                                    dataset.resource_type === 'dashboard'
                                      ? `/aplikasi/own-${dataset.id}`
                                      : `/katalog/own-${dataset.id}`
                                  }
                                  className="admin-action-view"
                                >
                                  Lihat
                                </Link>

                                {!published && (
                                  <Link
                                    to={`/dashboard/edit/${dataset.id}`}
                                    className="admin-action-view"
                                  >
                                    Edit
                                  </Link>
                                )}

                              </div>

                            </td>


                          </tr>

                        )

                      }
                    )}


                  </tbody>

                </table>

              </div>

            )}


          </section>


        </section>

      </div>

    </main>

  )

}


export default MyDatasets