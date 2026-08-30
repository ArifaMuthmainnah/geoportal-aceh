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
  getMyDatasets,
} from '../../api/myDatasetApi'

import {
  useAuth,
} from '../../context/AuthContext'


function UserDashboard() {

  const navigate = useNavigate()

  const {
    currentUser,
    logout,
  } = useAuth()


  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeMenu, setActiveMenu] = useState('dashboard')


  async function loadDashboard() {

    try {

      setLoading(true)
      setError('')

      const data = await getMyDatasets()

      setDatasets(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (err) {

      console.error(
        'Dashboard error:',
        err
      )

      setError(
        'Gagal memuat data dashboard.'
      )

      setDatasets([])

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadDashboard()

  }, [])


  const statistics = useMemo(() => {

    const published =
      datasets.filter(
        (item) =>
          Boolean(
            item.is_published
          )
      ).length


    return [

      {
        label: 'Data Saya',
        value: datasets.length,
        icon: '◈',
      },

      {
        label: 'Terpublikasi',
        value: published,
        icon: '✓',
      },

      {
        label: 'Menunggu Publish',
        value:
          Math.max(
            datasets.length -
              published,
            0
          ),
        icon: '◷',
      },

    ]

  }, [datasets])


  function handleLogout() {

    logout()

    navigate(
      '/',
      {
        replace: true,
      }
    )

  }


  function handleRefresh() {

    loadDashboard()

  }


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
                {
                  currentUser?.username ||
                  'Operator'
                }
              </strong>

              <span>
                Operator
              </span>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="admin-sidebar-nav">


            {/* DASHBOARD */}

            <button
              type="button"
              className={
                activeMenu === 'dashboard'
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


            {/* DATA SAYA */}

            <Link
              to="/dashboard/datasets"
              className="admin-sidebar-link"
            >

              <span>
                ◈
              </span>

              Data Saya

            </Link>


            {/* UPLOAD */}

            <Link
              to="/dashboard/upload"
              className="admin-sidebar-link"
            >

              <span>
                ⬆
              </span>

              Upload

            </Link>


            {/* KATALOG */}

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
                Dashboard
              </h1>

              <p>
                Kelola dataset, dashboard, dan WebGIS milik Anda di Geoportal Aceh.
              </p>

            </div>


            <div className="admin-header-actions">


              {/* REFRESH */}

              <button
                type="button"
                className="admin-refresh-button"
                onClick={handleRefresh}
                disabled={loading}
              >

                ↻{' '}

                {
                  loading
                    ? 'Memuat...'
                    : 'Refresh'
                }

              </button>


              {/* WEBSITE */}

              <Link
                to="/"
                className="admin-view-site"
              >

                Lihat Website →

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
              STATISTICS
          ================================================= */}

          <section className="admin-stat-grid">


            {statistics.map(
              (stat) => (

                <article
                  className="admin-stat-card"
                  key={stat.label}
                >


                  <div className="admin-stat-icon">

                    {stat.icon}

                  </div>


                  <div>

                    <strong>

                      {
                        loading
                          ? '...'
                          : stat.value
                      }

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
              DATA TERBARU
          ================================================= */}

          <section className="admin-panel">


            <div className="admin-panel-header">


              <div>

                <span className="section-eyebrow">
                  RINGKASAN
                </span>

                <h2>
                  Data Terbaru Saya
                </h2>

              </div>


              <div className="admin-panel-actions">

                <Link
                  to="/dashboard/datasets"
                  className="admin-secondary-button"
                >

                  Lihat Semua

                </Link>

              </div>


            </div>


            {/* LOADING */}

            {loading ? (

              <div className="admin-loading">

                Memuat data...

              </div>


            ) : datasets.length === 0 ? (


              /* EMPTY */

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
                  Belum ada data
                </strong>


                <p>
                  Anda belum mengunggah dataset, dashboard, atau WebGIS apa pun.
                </p>


              </div>


            ) : (


              /* TABLE */

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
                        Tanggal
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>


                  <tbody>


                    {datasets
                      .slice(0, 5)
                      .map(
                        (dataset) => {

                          const published =
                            Boolean(
                              dataset.is_published
                            )


                          return (

                            <tr
                              key={
                                dataset.id
                              }
                            >


                              {/* DATA */}

                              <td>

                                <strong>

                                  {
                                    dataset.title ||
                                    'Tanpa judul'
                                  }

                                </strong>

                              </td>


                              {/* RESOURCE TYPE */}

                              <td>

                                <span>

                                  {
                                    dataset.resource_type ===
                                    'dashboard'
                                      ? 'Dashboard'
                                      : dataset.resource_type ===
                                        'webgis'
                                      ? 'WebGIS'
                                      : 'Dataset'
                                  }

                                </span>

                              </td>


                              {/* DATE */}

                              <td>

                                {
                                  dataset.created_at

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

                                  {
                                    published
                                      ? 'Published'
                                      : 'Belum Publish'
                                  }

                                </span>

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


export default UserDashboard