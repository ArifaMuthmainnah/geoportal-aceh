import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router'

import {
  getAllDatasets,
  deleteDataset,
} from '../../api/datasetApi'

import {
  getAllUsers,
} from '../../api/userApi'

import {
  useAuth,
} from '../../context/AuthContext'


function AdminDashboard() {

  const navigate =
    useNavigate()


  const {
    currentUser,
    logout,
    isAdmin,
  } = useAuth()


  // ===================================================
  // STATE
  // ===================================================

  const [
    datasets,
    setDatasets
  ] = useState([])


  const [
    users,
    setUsers
  ] = useState([])


  const [
    loading,
    setLoading
  ] = useState(true)


  const [
    error,
    setError
  ] = useState('')


  const [
    search,
    setSearch
  ] = useState('')


  const [
    activeMenu,
    setActiveMenu
  ] = useState('dashboard')


  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  async function loadDashboard() {

    try {

      setLoading(true)

      setError('')


      const [
        datasetResult,
        userResult,
      ] = await Promise.allSettled([

        getAllDatasets(),

        getAllUsers(),

      ])


      // ===============================================
      // DATASET
      // ===============================================

      if (
        datasetResult.status ===
        'fulfilled'
      ) {

        const datasetData =
          datasetResult.value


        setDatasets(
          Array.isArray(
            datasetData
          )
            ? datasetData
            : []
        )

      } else {

        console.error(
          'Dataset error:',
          datasetResult.reason
        )


        setDatasets([])

      }


      // ===============================================
      // USERS
      // ===============================================

      if (
        userResult.status ===
        'fulfilled'
      ) {

        const userData =
          userResult.value


        setUsers(
          Array.isArray(
            userData
          )
            ? userData
            : []
        )

      } else {

        console.error(
          'User error:',
          userResult.reason
        )


        setUsers([])

      }


      // ===============================================
      // ERROR
      // ===============================================

      if (
        datasetResult.status ===
          'rejected' &&
        userResult.status ===
          'rejected'
      ) {

        setError(
          'Data dashboard gagal dimuat.'
        )

      }

    } catch (err) {

      console.error(
        'Dashboard error:',
        err
      )


      setError(
        'Gagal memuat dashboard.'
      )

    } finally {

      setLoading(false)

    }

  }


  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {

    loadDashboard()

  }, [])


  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics =
    useMemo(() => {

      const published =
        datasets.filter(
          (dataset) =>
            dataset.is_published ===
              true ||
            dataset.published ===
              true ||
            dataset.is_approved ===
              true
        ).length


      return [

        {
          label:
            'Total Dataset',

          value:
            datasets.length,

          icon:
            '▦',
        },


        {
          label:
            'Terpublikasi',

          value:
            published,

          icon:
            '✓',
        },


        {
          label:
            'Pengguna',

          value:
            users.length,

          icon:
            '♙',
        },


        {
          label:
            'Belum Terpublikasi',

          value:
            Math.max(
              datasets.length -
              published,
              0
            ),

          icon:
            '◷',
        },

      ]

    }, [
      datasets,
      users,
    ])


  // ===================================================
  // FILTER DATASET
  // ===================================================

  const filteredDatasets =
    useMemo(() => {

      const keyword =
        search
          .trim()
          .toLowerCase()


      if (!keyword) {

        return datasets

      }


      return datasets.filter(
        (dataset) => {

          const title =
            String(
              dataset.title ||
              ''
            )
              .toLowerCase()


          const abstract =
            String(
              dataset.abstract ||
              dataset.description ||
              ''
            )
              .toLowerCase()


          return (
            title.includes(
              keyword
            ) ||
            abstract.includes(
              keyword
            )
          )

        }
      )

    }, [
      datasets,
      search,
    ])


  // ===================================================
  // DELETE DATASET
  // ===================================================

  async function handleDelete(
    dataset
  ) {

    const title =
      dataset.title ||
      'dataset ini'


    const confirmed =
      window.confirm(
        `Hapus dataset "${title}"?`
      )


    if (!confirmed) {

      return

    }


    try {

      await deleteDataset(
        dataset.pk
      )


      setDatasets(
        (current) =>
          current.filter(
            (item) =>
              item.pk !==
              dataset.pk
          )
      )


      window.alert(
        'Dataset berhasil dihapus.'
      )

    } catch (err) {

      console.error(
        'Delete error:',
        err
      )


      window.alert(
        'Dataset gagal dihapus. Periksa permission API.'
      )

    }

  }


  // ===================================================
  // LOGOUT
  // ===================================================

  function handleLogout() {

    logout()


    navigate(
      '/',
      {
        replace: true,
      }
    )

  }


  // ===================================================
  // REFRESH
  // ===================================================

  function handleRefresh() {

    loadDashboard()

  }


  // ===================================================
  // PROTECTION
  // ===================================================
  //
  // Seharusnya sudah ditangani ProtectedRoute.
  //
  // Ini hanya lapisan tambahan pada component.
  //
  // ===================================================

  if (!isAdmin) {

    return null

  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <main className="admin-page">

      <div className="admin-layout">


        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="admin-sidebar">


          {/* BRAND */}

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

              {
                (
                  currentUser?.username ||
                  'A'
                )
                  .charAt(0)
                  .toUpperCase()
              }

            </div>


            <div>

              <strong>

                {
                  currentUser?.username ||
                  'Administrator'
                }

              </strong>


              <span>
                Administrator
              </span>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="admin-sidebar-nav">


            {/* DASHBOARD */}

            <button
              type="button"
              className={
                activeMenu ===
                'dashboard'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveMenu(
                  'dashboard'
                )
              }
            >

              <span>
                ▦
              </span>

              Dashboard

            </button>


            {/* DATASET */}

            <button
              type="button"
              className={
                activeMenu ===
                'datasets'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveMenu(
                  'datasets'
                )
              }
            >

              <span>
                ◈
              </span>

              Dataset

            </button>


            {/* USERS */}

            <button
              type="button"
              className={
                activeMenu ===
                'users'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveMenu(
                  'users'
                )
              }
            >

              <span>
                ♙
              </span>

              Pengguna

            </button>


            {/* CATALOG */}

            <Link
              to="/katalog"
              className="admin-sidebar-link"
            >

              <span>
                ◉
              </span>

              Lihat Katalog

            </Link>


            {/* WEBGIS */}

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
            onClick={
              handleLogout
            }
          >

            ← Logout

          </button>


        </aside>


        {/* =================================================
            MAIN
        ================================================= */}

        <section className="admin-main">


          {/* =================================================
              HEADER
          ================================================= */}

          <header className="admin-header">

            <div>

              <span className="section-eyebrow">
                ADMINISTRATOR
              </span>


              <h1>
                Dashboard
              </h1>


              <p>
                Kelola data dan pengguna
                Geoportal Aceh.
              </p>

            </div>


            <div className="admin-header-actions">


              <button
                type="button"
                className="admin-refresh-button"
                onClick={
                  handleRefresh
                }
                disabled={loading}
              >

                ↻
                {' '}
                {loading
                  ? 'Memuat...'
                  : 'Refresh'
                }

              </button>


              <Link
                to="/"
                className="admin-view-site"
              >

                Lihat Website →

              </Link>


            </div>

          </header>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="admin-alert">

              {error}

            </div>

          )}


          {/* =================================================
              STATISTICS
          ================================================= */}

          <section className="admin-stat-grid">

            {statistics.map(
              (stat) => (

                <article
                  className="admin-stat-card"
                  key={
                    stat.label
                  }
                >

                  <div className="admin-stat-icon">

                    {stat.icon}

                  </div>


                  <div>

                    <strong>

                      {loading
                        ? '...'
                        : stat.value}

                    </strong>


                    <span>

                      {stat.label}

                    </span>

                  </div>

                </article>

              )
            )}

          </section>


          {/* =================================================
              DATASET
          ================================================= */}

          {(
            activeMenu ===
              'dashboard' ||
            activeMenu ===
              'datasets'
          ) && (

            <section className="admin-panel">


              {/* PANEL HEADER */}

              <div className="admin-panel-header">

                <div>

                  <span className="section-eyebrow">
                    CONTENT
                  </span>


                  <h2>
                    Dataset
                  </h2>

                </div>


                <div className="admin-panel-actions">

                  <Link
                    to="/katalog"
                    className="admin-secondary-button"
                  >
                    Katalog
                  </Link>

                </div>

              </div>


              {/* TOOLBAR */}

              <div className="admin-toolbar">

                <input
                  type="search"
                  placeholder="Cari dataset..."
                  value={search}
                  onChange={
                    (event) =>
                      setSearch(
                        event.target.value
                      )
                  }
                />

              </div>


              {/* LOADING */}

              {loading ? (

                <div className="admin-loading">

                  Memuat dataset...

                </div>

              ) : filteredDatasets.length === 0 ? (

                <div className="admin-empty">

                  <div
                    style={{
                      fontSize:
                        '36px',
                      marginBottom:
                        '10px',
                    }}
                  >
                    ◈
                  </div>

                  <strong>
                    Tidak ada dataset
                  </strong>

                  <p>
                    Belum ada dataset
                    yang tersedia.
                  </p>

                </div>

              ) : (

                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>

                      <tr>

                        <th>
                          Dataset
                        </th>

                        <th>
                          Owner
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

                      {filteredDatasets
                        .slice(
                          0,
                          50
                        )
                        .map(
                          (
                            dataset
                          ) => {

                            const published =
                              dataset.is_published ===
                                true ||
                              dataset.published ===
                                true ||
                              dataset.is_approved ===
                                true


                            return (

                              <tr
                                key={
                                  dataset.pk
                                }
                              >


                                {/* DATASET */}

                                <td>

                                  <strong>

                                    {
                                      dataset.title ||
                                      'Tanpa judul'
                                    }

                                  </strong>


                                  <small>

                                    ID:{' '}

                                    {
                                      dataset.pk ||
                                      '-'
                                    }

                                  </small>

                                </td>


                                {/* OWNER */}

                                <td>

                                  {
                                    dataset.owner?.username ||
                                    dataset.owner?.first_name ||
                                    dataset.owner?.name ||
                                    '-'
                                  }

                                </td>


                                {/* DATE */}

                                <td>

                                  {
                                    dataset.date
                                      ? new Date(
                                          dataset.date
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
                                      : 'Belum Publish'
                                    }

                                  </span>

                                </td>


                                {/* ACTION */}

                                <td>

                                  <div className="admin-actions">


                                    <Link
                                      to={
                                        `/katalog/${dataset.pk}`
                                      }
                                      className="admin-action-view"
                                    >

                                      Lihat

                                    </Link>


                                    <button
                                      type="button"
                                      className="admin-action-delete"
                                      onClick={() =>
                                        handleDelete(
                                          dataset
                                        )
                                      }
                                    >

                                      Hapus

                                    </button>


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

          )}


          {/* =================================================
              USERS
          ================================================= */}

          {activeMenu ===
            'users' && (

            <section className="admin-panel">


              {/* HEADER */}

              <div className="admin-panel-header">

                <div>

                  <span className="section-eyebrow">
                    MANAGEMENT
                  </span>


                  <h2>
                    Pengguna
                  </h2>


                  <p>
                    Daftar pengguna yang
                    terdaftar di sistem
                    Geoportal Aceh.
                  </p>

                </div>

              </div>


              {/* LOADING */}

              {loading ? (

                <div className="admin-loading">

                  Memuat pengguna...

                </div>

              ) : users.length === 0 ? (

                <div className="admin-empty">

                  <div
                    style={{
                      fontSize:
                        '36px',
                      marginBottom:
                        '10px',
                    }}
                  >
                    ♙
                  </div>


                  <strong>
                    Data pengguna
                    tidak tersedia
                  </strong>


                  <p>
                    Endpoint user mungkin
                    membutuhkan permission
                    administrator.
                  </p>

                </div>

              ) : (

                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>

                      <tr>

                        <th>
                          Username
                        </th>

                        <th>
                          Email
                        </th>

                        <th>
                          Role
                        </th>

                        <th>
                          Tanggal
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {users
                        .slice(
                          0,
                          100
                        )
                        .map(
                          (
                            user
                          ) => (

                            <tr
                              key={
                                user.id ||
                                user.pk ||
                                user.username
                              }
                            >

                              <td>

                                <strong>

                                  {
                                    user.username ||
                                    '-'
                                  }

                                </strong>

                              </td>


                              <td>

                                {
                                  user.email ||
                                  '-'
                                }

                              </td>


                              <td>

                                <span
                                  className={
                                    user.role ===
                                    'admin'
                                      ? 'admin-role admin'
                                      : 'admin-role operator'
                                  }
                                >

                                  {
                                    user.role ||
                                    'operator'
                                  }

                                </span>

                              </td>


                              <td>

                                {
                                  user.created_at
                                    ? new Date(
                                        user.created_at
                                      ).toLocaleDateString(
                                        'id-ID'
                                      )
                                    : '-'
                                }

                              </td>


                              <td>

                                <span className="admin-status published">

                                  Aktif

                                </span>

                              </td>

                            </tr>

                          )
                        )}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          )}


        </section>

      </div>

    </main>

  )

}


export default AdminDashboard