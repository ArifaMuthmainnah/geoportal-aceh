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
} from '../../api/datasetApi'

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

      const data = await getAllDatasets()

      setDatasets(Array.isArray(data) ? data : [])

    } catch (err) {

      console.error('Dashboard error:', err)

      setError('Gagal memuat data dashboard.')

      setDatasets([])

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {
    loadDashboard()
  }, [])


  const myDatasets = useMemo(() => {

    if (!currentUser) return []

    return datasets.filter((dataset) => {

      const ownerUsername =
        dataset.owner?.username ||
        dataset.owner?.name ||
        ''

      return (
        ownerUsername.toLowerCase() ===
        String(currentUser.username || '').toLowerCase()
      )

    })

  }, [datasets, currentUser])


  const statistics = useMemo(() => {

    const published = myDatasets.filter(
      (dataset) =>
        dataset.is_published === true ||
        dataset.published === true ||
        dataset.is_approved === true
    ).length

    return [
      {
        label: 'Dataset Saya',
        value: myDatasets.length,
        icon: '◈',
      },
      {
        label: 'Terpublikasi',
        value: published,
        icon: '✓',
      },
      {
        label: 'Menunggu Publish',
        value: Math.max(myDatasets.length - published, 0),
        icon: '◷',
      },
    ]

  }, [myDatasets])


  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }


  function handleRefresh() {
    loadDashboard()
  }


  return (

    <main className="admin-page">

      <div className="admin-layout">


        <aside className="admin-sidebar">

          <div className="admin-sidebar-brand">
            <span>GEOPORTAL</span>
            <strong>ACEH</strong>
          </div>


          <div className="admin-sidebar-user">

            <div className="admin-user-avatar">
              {(currentUser?.username || 'U').charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{currentUser?.username || 'Operator'}</strong>
              <span>Operator</span>
            </div>

          </div>


          <nav className="admin-sidebar-nav">

            <button
              type="button"
              className={activeMenu === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveMenu('dashboard')}
            >
              <span>▦</span>
              Dashboard
            </button>

            <Link
              to="/dashboard/datasets"
              className="admin-sidebar-link"
            >
              <span>◈</span>
              Dataset Saya
            </Link>

            <Link
              to="/dashboard/upload"
              className="admin-sidebar-link"
            >
              <span>⬆</span>
              Upload
            </Link>

            <Link
              to="/katalog"
              className="admin-sidebar-link"
            >
              <span>◉</span>
              Lihat Katalog
            </Link>

            <Link
              to="/webgis"
              className="admin-sidebar-link"
            >
              <span>⌖</span>
              WebGIS
            </Link>

          </nav>


          <button
            type="button"
            className="admin-sidebar-logout"
            onClick={handleLogout}
          >
            ← Logout
          </button>

        </aside>


        <section className="admin-main">

          <header className="admin-header">

            <div>
              <span className="section-eyebrow">OPERATOR</span>
              <h1>Dashboard</h1>
              <p>Kelola dataset milik Anda di Geoportal Aceh.</p>
            </div>

            <div className="admin-header-actions">

              <button
                type="button"
                className="admin-refresh-button"
                onClick={handleRefresh}
                disabled={loading}
              >
                ↻ {loading ? 'Memuat...' : 'Refresh'}
              </button>

              <Link to="/" className="admin-view-site">
                Lihat Website →
              </Link>

            </div>

          </header>


          {error && (
            <div className="admin-alert">
              {error}
            </div>
          )}


          <section className="admin-stat-grid">

            {statistics.map((stat) => (

              <article className="admin-stat-card" key={stat.label}>

                <div className="admin-stat-icon">
                  {stat.icon}
                </div>

                <div>
                  <strong>{loading ? '...' : stat.value}</strong>
                  <span>{stat.label}</span>
                </div>

              </article>

            ))}

          </section>


          <section className="admin-panel">

            <div className="admin-panel-header">

              <div>
                <span className="section-eyebrow">RINGKASAN</span>
                <h2>Dataset Terbaru Saya</h2>
              </div>

              <div className="admin-panel-actions">
                <Link to="/dashboard/datasets" className="admin-secondary-button">
                  Lihat Semua
                </Link>
              </div>

            </div>

            {loading ? (

              <div className="admin-loading">
                Memuat dataset...
              </div>

            ) : myDatasets.length === 0 ? (

              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>◈</div>
                <strong>Belum ada dataset</strong>
                <p>Anda belum mengunggah dataset apa pun.</p>
              </div>

            ) : (

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Dataset</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {myDatasets.slice(0, 5).map((dataset) => {

                      const published =
                        dataset.is_published === true ||
                        dataset.published === true ||
                        dataset.is_approved === true

                      return (

                        <tr key={dataset.pk}>

                          <td>
                            <strong>{dataset.title || 'Tanpa judul'}</strong>
                          </td>

                          <td>
                            {dataset.date
                              ? new Date(dataset.date).toLocaleDateString('id-ID')
                              : '-'}
                          </td>

                          <td>
                            <span className={published ? 'admin-status published' : 'admin-status pending'}>
                              {published ? 'Published' : 'Belum Publish'}
                            </span>
                          </td>

                        </tr>

                      )

                    })}

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