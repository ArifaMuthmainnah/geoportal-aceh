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


  async function loadDatasets() {

    try {
      setLoading(true)
      setError('')

      const data = await getAllDatasets()

      setDatasets(Array.isArray(data) ? data : [])

    } catch (err) {

      console.error('Load datasets error:', err)

      setError('Gagal memuat dataset.')

      setDatasets([])

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {
    loadDatasets()
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


  const filteredDatasets = useMemo(() => {

    const keyword = search.trim().toLowerCase()

    if (!keyword) return myDatasets

    return myDatasets.filter((dataset) => {

      const title = String(dataset.title || '').toLowerCase()

      return title.includes(keyword)

    })

  }, [myDatasets, search])


  async function handleDelete(dataset) {

    const title = dataset.title || 'dataset ini'

    const confirmed = window.confirm(`Hapus dataset "${title}"?`)

    if (!confirmed) return

    try {

      await deleteDataset(dataset.pk)

      setDatasets((current) =>
        current.filter((item) => item.pk !== dataset.pk)
      )

      window.alert('Dataset berhasil dihapus.')

    } catch (err) {

      console.error('Delete error:', err)

      window.alert('Dataset gagal dihapus. Periksa permission API.')

    }

  }


  function handleLogout() {
    logout()
    navigate('/', { replace: true })
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

            <Link to="/dashboard" className="admin-sidebar-link">
              <span>▦</span>
              Dashboard
            </Link>

            <button type="button" className="active">
              <span>◈</span>
              Dataset Saya
            </button>

            <Link to="/dashboard/upload" className="admin-sidebar-link">
              <span>⬆</span>
              Upload
            </Link>

            <Link to="/katalog" className="admin-sidebar-link">
              <span>◉</span>
              Lihat Katalog
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
              <h1>Dataset Saya</h1>
              <p>Kelola dataset yang telah Anda unggah.</p>
            </div>

            <div className="admin-header-actions">
              <Link to="/dashboard/upload" className="admin-view-site">
                + Upload Dataset
              </Link>
            </div>
          </header>


          {error && (
            <div className="admin-alert">
              {error}
            </div>
          )}


          <section className="admin-panel">

            <div className="admin-panel-header">
              <div>
                <span className="section-eyebrow">DAFTAR</span>
                <h2>Semua Dataset Saya</h2>
              </div>
            </div>

            <div className="admin-toolbar">
              <input
                type="search"
                placeholder="Cari dataset..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (

              <div className="admin-loading">
                Memuat dataset...
              </div>

            ) : filteredDatasets.length === 0 ? (

              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>◈</div>
                <strong>Tidak ada dataset</strong>
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
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredDatasets.map((dataset) => {

                      const published =
                        dataset.is_published === true ||
                        dataset.published === true ||
                        dataset.is_approved === true

                      return (

                        <tr key={dataset.pk}>

                          <td>
                            <strong>{dataset.title || 'Tanpa judul'}</strong>
                            <small>ID: {dataset.pk || '-'}</small>
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

                          <td>
                            <div className="admin-actions">

                              <Link
                                to={`/katalog/${dataset.pk}`}
                                className="admin-action-view"
                              >
                                Lihat
                              </Link>

                              <button
                                type="button"
                                className="admin-action-delete"
                                onClick={() => handleDelete(dataset)}
                              >
                                Hapus
                              </button>

                            </div>
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

export default MyDatasets