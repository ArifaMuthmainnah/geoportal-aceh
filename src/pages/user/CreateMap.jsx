import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import {
  uploadMyDataset,
  getMyDatasets,
  getPublishedByType,
} from '../../api/myDatasetApi'

import { useAuth } from '../../context/AuthContext'
import { buildExtraMetadata } from '../../utils/resourceFields'

import BoundingBoxPicker from '../../components/BoundingBoxPicker'
import { parseExtraMetadata } from '../../utils/resourceFields'

function CreateMap() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [embedUrl, setEmbedUrl] = useState('')

  const [availableDatasets, setAvailableDatasets] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [bbox, setBbox] = useState({ minLon: '', minLat: '', maxLon: '', maxLat: '' })
  const [search, setSearch] = useState('')
  const [loadingDatasets, setLoadingDatasets] = useState(true)

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')


  useEffect(() => {

    async function loadDatasets() {

      try {

        setLoadingDatasets(true)

        let ownDatasets = []
        try {
          const mine = await getMyDatasets()
          ownDatasets = mine.filter((item) => item.resource_type === 'dataset')
        } catch (err) {
          console.error('Gagal mengambil dataset milik sendiri:', err)
        }

        let publicDatasets = []
        try {
          publicDatasets = await getPublishedByType('dataset')
        } catch (err) {
          console.error('Gagal mengambil dataset publik:', err)
        }

        // Gabungkan tanpa duplikat (berdasarkan id)
        const map = new Map()

        ;[...ownDatasets, ...publicDatasets].forEach((item) => {
          map.set(item.id, item)
        })

        setAvailableDatasets(Array.from(map.values()))

      } finally {

        setLoadingDatasets(false)

      }

    }

    loadDatasets()

  }, [])


  const filteredDatasets = useMemo(() => {

    const keyword = search.trim().toLowerCase()

    if (!keyword) return availableDatasets

    return availableDatasets.filter((item) =>
      String(item.title || '').toLowerCase().includes(keyword)
    )

  }, [availableDatasets, search])


    function toggleSelect(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function moveSelected(id, direction) {

    setSelectedIds((current) => {

      const index = current.indexOf(id)
      const targetIndex = direction === 'up' ? index - 1 : index + 1

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const next = [...current]
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]

      return next

    })

  }


  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }


  async function handleSubmit(event) {

    event.preventDefault()

    if (!title.trim()) {
      setErrorMessage('Judul peta wajib diisi.')
      return
    }

    if (selectedIds.length === 0 && !embedUrl.trim()) {
      setErrorMessage('Pilih minimal 1 dataset sebagai layer, atau isi Embed URL.')
      return
    }

    setStatus('uploading')
    setErrorMessage('')

    try {

      const selectedTitles =
        availableDatasets
          .filter((item) => selectedIds.includes(item.id))
          .map((item) => item.title)

      const extraMetadata =
        buildExtraMetadata({
          resourceType: 'map',
          embedUrl,
          linkedResources: selectedTitles,
          bbox,
        })

      await uploadMyDataset({
        files: [],
        thumbnailFile,
        title,
        abstract,
        resourceType: 'map',
        category: '',
        keywords: '',
        externalUrl: '',
        extraMetadata,
      })

      setStatus('success')

    } catch (err) {

      console.error('Create map error:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Gagal membuat peta.')

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
            <button type="button" className="active"><span>⌖</span>Create Map</button>
            <Link to="/dashboard/upload" className="admin-sidebar-link"><span>⬆</span>Upload Lainnya</Link>
            <Link to="/katalog" className="admin-sidebar-link"><span>◉</span>Lihat Katalog</Link>
          </nav>
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>← Logout</button>
        </aside>


        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">{currentUser?.role === 'admin' ? 'ADMINISTRATOR' : 'OPERATOR'}</span>
              <h1>Create Map</h1>
              <p>Susun peta dari dataset yang sudah ada, mirip Add Dataset di GeoNode.</p>
            </div>
          </header>


          {status === 'success' ? (

            <div className="admin-panel">
              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
                <strong>Peta berhasil dibuat</strong>
                <p>Peta akan berstatus "Belum Publish" hingga disetujui admin.</p>
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

                <div className="admin-panel-header">
                  <div><h2>Informasi Peta</h2></div>
                </div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {errorMessage && <div className="admin-alert">{errorMessage}</div>}

                  <div className="admin-form-group">
                    <label>Gambar Sampul (opsional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Judul Peta *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>

                  <div className="admin-form-group">
                    <label>Deskripsi</label>
                    <textarea rows={3} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Embed URL (opsional)</label>
                    <input type="url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
                    <small>Kalau kamu sudah punya peta interaktif eksternal (mis. dari WebGIS lain), isi di sini.</small>
                  </div>

                </div>

              </section>


              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Add Dataset (Layer)</h2>
                    <p>Pilih dataset yang ingin dijadikan layer pada peta ini.</p>
                  </div>
                </div>

                <div style={{ padding: '0 22px 20px' }}>

                  <input
                    type="search"
                    placeholder="Cari dataset..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', marginBottom: '14px' }}
                  />

                  {loadingDatasets ? (

                    <div className="admin-loading">Memuat daftar dataset...</div>

                  ) : filteredDatasets.length === 0 ? (

                    <div className="admin-empty">
                      <p>Belum ada dataset yang tersedia untuk dijadikan layer. Buat dataset dulu lewat "Create Dataset".</p>
                    </div>

                  ) : (

                    <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>

                      {filteredDatasets.map((item) => (

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
                            <small style={{ opacity: 0.7 }}>{item.category || 'Tanpa kategori'}</small>
                          </div>
                        </label>

                      ))}

                    </div>

                  )}

                                    <small style={{ display: 'block', marginTop: '10px' }}>
                    {selectedIds.length} dataset dipilih sebagai layer.
                  </small>

                </div>
              </section>


              {selectedIds.length > 0 && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <h2>Urutan Layer</h2>
                      <p>Layer paling atas ditampilkan paling depan di peta. Atur urutan dengan tombol ↑ ↓.</p>
                    </div>
                  </div>

                  <div style={{ padding: '0 22px 20px' }}>

                    {selectedIds.map((id, index) => {

                      const item = availableDatasets.find((dataset) => dataset.id === id)

                      if (!item) return null

                      return (

                        <div
                          key={id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px',
                            marginBottom: '8px',
                          }}
                        >

                          <div>
                            <strong>{index + 1}. {item.title || 'Tanpa judul'}</strong>
                            <small style={{ display: 'block', opacity: 0.7 }}>{item.category || 'Tanpa kategori'}</small>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="admin-secondary-button"
                              disabled={index === 0}
                              onClick={() => moveSelected(id, 'up')}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="admin-secondary-button"
                              disabled={index === selectedIds.length - 1}
                              onClick={() => moveSelected(id, 'down')}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="admin-action-delete"
                              onClick={() => toggleSelect(id)}
                            >
                              Hapus
                            </button>
                          </div>

                        </div>

                      )

                    })}

                  </div>

                </section>

              )}


              {/* =========================================
                  PREVIEW CAKUPAN PETA
              ========================================= */}

              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Preview Cakupan Peta (Opsional)</h2>
                    <p>Tandai area cakupan utama peta ini. Hanya untuk referensi tampilan, tidak wajib.</p>
                  </div>
                </div>

                <div style={{ padding: '0 22px 20px' }}>
                  <BoundingBoxPicker
                    initialBbox={bbox}
                    onChange={(nextBbox) => setBbox(nextBbox)}
                  />
                </div>

              </section>


              <div style={{ padding: '0 0 30px' }}>
                <button type="submit" className="admin-view-site" disabled={status === 'uploading'}>
                  {status === 'uploading' ? 'Menyimpan...' : 'Simpan Peta'}
                </button>
              </div>

            </form>

          )}

        </section>

      </div>

    </main>

  )

}

export default CreateMap