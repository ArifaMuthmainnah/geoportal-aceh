import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  uploadMyDataset,
  getMyDatasets,
  getPublishedByType,
} from '../../api/myDatasetApi'
import { useAuth } from '../../context/AuthContext'
import { buildExtraMetadata } from '../../utils/resourceFields'

function CreateDashboard() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [embedUrl, setEmbedUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')

  const [availableResources, setAvailableResources] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [loadingResources, setLoadingResources] = useState(true)

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')


  // ===================================================
  // AMBIL DATASET + PETA YANG SUDAH ADA UNTUK JADI WIDGET
  // ===================================================

  useEffect(() => {

    async function loadResources() {

      try {

        setLoadingResources(true)

        let ownResources = []

        try {
          const mine = await getMyDatasets()
          ownResources = mine.filter((item) =>
            item.resource_type === 'dataset' || item.resource_type === 'map'
          )
        } catch (err) {
          console.error('Gagal mengambil data milik sendiri:', err)
        }

        let publicDatasets = []
        try {
          publicDatasets = await getPublishedByType('dataset')
        } catch (err) {
          console.error('Gagal mengambil dataset publik:', err)
        }

        let publicMaps = []
        try {
          publicMaps = await getPublishedByType('map')
        } catch (err) {
          console.error('Gagal mengambil peta publik:', err)
        }

        const map = new Map()
        ;[...ownResources, ...publicDatasets, ...publicMaps].forEach((item) => {
          map.set(item.id, item)
        })

        setAvailableResources(Array.from(map.values()))

      } finally {

        setLoadingResources(false)

      }

    }

    loadResources()

  }, [])


  const filteredResources = useMemo(() => {

    const keyword = search.trim().toLowerCase()

    if (!keyword) return availableResources

    return availableResources.filter((item) =>
      String(item.title || '').toLowerCase().includes(keyword)
    )

  }, [availableResources, search])


  function toggleSelect(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }


  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }


  async function handleSubmit(event) {

    event.preventDefault()

    if (!title.trim()) {
      setErrorMessage('Judul dashboard wajib diisi.')
      return
    }

    const hasWidgets = selectedIds.length > 0
    const hasEmbed = embedUrl.trim().length > 0
    const hasLink = externalUrl.trim().length > 0

    if (!hasWidgets && !hasEmbed && !hasLink) {
      setErrorMessage('Pilih minimal 1 widget (dataset/peta), atau isi Embed URL / Link.')
      return
    }

    setStatus('uploading')
    setErrorMessage('')

    try {

      const widgetTitles =
        availableResources
          .filter((item) => selectedIds.includes(item.id))
          .map((item) =>
            `${item.title} (${item.resource_type === 'map' ? 'Peta' : 'Dataset'})`
          )

      const extraMetadata =
        buildExtraMetadata({
          resourceType: 'dashboard',
          embedUrl,
          linkedResources: widgetTitles,
        })

      await uploadMyDataset({
        files: [],
        thumbnailFile,
        title,
        abstract,
        resourceType: 'dashboard',
        category: '',
        keywords: '',
        externalUrl,
        extraMetadata,
      })

      setStatus('success')

    } catch (err) {

      console.error('Create dashboard error:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Gagal membuat dashboard.')

    }

  }


  return (

    <main className="admin-page">

      <div className="admin-layout">

        <aside className="admin-sidebar">

          <div className="admin-sidebar-brand"><span>GEOPORTAL</span><strong>ACEH</strong></div>

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
              <strong>{currentUser?.username || 'Operator'}</strong>
              <span>{currentUser?.role === 'admin' ? 'Administrator' : 'Operator'}</span>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <Link to={currentUser?.role === 'admin' ? '/admin' : '/dashboard'} className="admin-sidebar-link">
              <span>▦</span>Dashboard
            </Link>
            {currentUser?.role !== 'admin' && (
              <Link to="/dashboard/datasets" className="admin-sidebar-link"><span>◈</span>Data Saya</Link>
            )}
            <Link to="/dashboard/create-dataset" className="admin-sidebar-link"><span>◈</span>Create Dataset</Link>
            <Link to="/dashboard/create-map" className="admin-sidebar-link"><span>⌖</span>Create Map</Link>
            <button type="button" className="active"><span>▥</span>Create Dashboard</button>
            <Link to="/dashboard/upload" className="admin-sidebar-link"><span>⬆</span>Upload Lainnya</Link>
            <Link to="/katalog" className="admin-sidebar-link"><span>◉</span>Lihat Katalog</Link>
          </nav>

          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>← Logout</button>

        </aside>


        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">{currentUser?.role === 'admin' ? 'ADMINISTRATOR' : 'OPERATOR'}</span>
              <h1>Create Dashboard</h1>
              <p>Susun dashboard dari dataset/peta yang sudah ada sebagai widget, atau tautkan dashboard eksternal.</p>
            </div>
          </header>

          {status === 'success' ? (

            <div className="admin-panel">
              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
                <strong>Dashboard berhasil dibuat</strong>
                <p>Dashboard akan berstatus "Belum Publish" hingga disetujui admin.</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <Link to={currentUser?.role === 'admin' ? '/admin' : '/dashboard/datasets'} className="admin-secondary-button">
                    Lihat Data
                  </Link>
                </div>
              </div>
            </div>

          ) : (

            <form onSubmit={handleSubmit}>

              <section className="admin-panel">

                <div className="admin-panel-header"><div><h2>Informasi Dashboard</h2></div></div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {errorMessage && <div className="admin-alert">{errorMessage}</div>}

                  <div className="admin-form-group">
                    <label>Gambar Sampul (opsional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Judul Dashboard *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>

                  <div className="admin-form-group">
                    <label>Deskripsi</label>
                    <textarea rows={3} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Link Dashboard Eksternal (opsional)</label>
                    <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
                    <small>Kalau dashboard-mu sudah ada di Looker Studio/Power BI/dll, isi linknya di sini.</small>
                  </div>

                  <div className="admin-form-group">
                    <label>Embed URL (opsional)</label>
                    <input type="url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
                    <small>Kalau diisi, halaman detail aplikasi akan menampilkan iframe dari URL ini.</small>
                  </div>

                </div>

              </section>


              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Widgets (Dataset & Peta Terkait)</h2>
                    <p>Pilih dataset/peta yang ingin ditampilkan sebagai bagian dari dashboard ini.</p>
                  </div>
                </div>

                <div style={{ padding: '0 22px 20px' }}>

                  <input
                    type="search"
                    placeholder="Cari dataset atau peta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', marginBottom: '14px' }}
                  />

                  {loadingResources ? (

                    <div className="admin-loading">Memuat daftar dataset & peta...</div>

                  ) : filteredResources.length === 0 ? (

                    <div className="admin-empty">
                      <p>Belum ada dataset/peta yang tersedia. Buat dulu lewat "Create Dataset" atau "Create Map".</p>
                    </div>

                  ) : (

                    <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>

                      {filteredResources.map((item) => (

                        <label
                          key={item.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', borderBottom: '1px solid #f1f1f1',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                          <div>
                            <strong style={{ display: 'block' }}>{item.title || 'Tanpa judul'}</strong>
                            <small style={{ opacity: 0.7 }}>
                              {item.resource_type === 'map' ? 'Peta' : 'Dataset'}
                              {item.category ? ` · ${item.category}` : ''}
                            </small>
                          </div>
                        </label>

                      ))}

                    </div>

                  )}

                  <small style={{ display: 'block', marginTop: '10px' }}>
                    {selectedIds.length} widget dipilih.
                  </small>

                </div>

              </section>


              <div style={{ padding: '0 0 30px' }}>
                <button type="submit" className="admin-view-site" disabled={status === 'uploading'}>
                  {status === 'uploading' ? 'Menyimpan...' : 'Simpan Dashboard'}
                </button>
              </div>

            </form>

          )}

        </section>

      </div>

    </main>

  )

}


export default CreateDashboard