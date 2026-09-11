import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  uploadMyDataset,
  getMyDatasets,
  getPublishedByType,
} from '../../api/myDatasetApi'
import { useAuth } from '../../context/AuthContext'
import { buildExtraMetadata, CATEGORY_OPTIONS } from '../../utils/resourceFields'

function CreateDashboard() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [resourceKind, setResourceKind] = useState('dashboard')
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [embedUrl, setEmbedUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [availableResources, setAvailableResources] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [loadingResources, setLoadingResources] = useState(true)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const isApplication = resourceKind === 'application'

  useEffect(() => {

    if (isApplication) {
      setLoadingResources(false)
      return
    }

    let mounted = true

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

        if (mounted) setAvailableResources(Array.from(map.values()))

      } finally {

        if (mounted) setLoadingResources(false)

      }

    }

    loadResources()

    return () => { mounted = false }

  }, [isApplication])


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

  function handleChangeKind(nextKind) {
    setResourceKind(nextKind)
    setErrorMessage('')
  }

  async function handleSubmit(event) {

    event.preventDefault()

    if (!title.trim()) {
      setErrorMessage(`Judul ${isApplication ? 'aplikasi' : 'dashboard'} wajib diisi.`)
      return
    }

    const hasLink = externalUrl.trim().length > 0

    if (isApplication) {

      if (!hasLink) {
        setErrorMessage('Link aplikasi wajib diisi. Aplikasi hanya bisa diisi dengan link, tidak menerima upload file.')
        return
      }

    } else {

      const hasWidgets = selectedIds.length > 0
      const hasEmbed = embedUrl.trim().length > 0

      if (!hasWidgets && !hasEmbed && !hasLink) {
        setErrorMessage('Pilih minimal 1 widget (dataset/peta), atau isi Embed URL / Link.')
        return
      }

    }

    const finalCategory =
      category === '__custom__' ? customCategory.trim() : category

    setStatus('uploading')
    setErrorMessage('')

    try {

      const widgetTitles =
        isApplication
          ? []
          : availableResources
              .filter((item) => selectedIds.includes(item.id))
              .map((item) =>
                `${item.title} (${item.resource_type === 'map' ? 'Peta' : 'Dataset'})`
              )

      const extraMetadata =
        buildExtraMetadata({
          resourceType: resourceKind,
          embedUrl: isApplication ? '' : embedUrl,
          linkedResources: widgetTitles,
        })

      await uploadMyDataset({
        files: [],
        thumbnailFile,
        title,
        abstract,
        resourceType: resourceKind,
        category: finalCategory,
        keywords: '',
        externalUrl,
        extraMetadata,
      })

      setStatus('success')

    } catch (err) {

      console.error('Create dashboard/aplikasi error:', err)
      setStatus('error')
      setErrorMessage(err.message || `Gagal membuat ${isApplication ? 'aplikasi' : 'dashboard'}.`)

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
            <Link to="/dashboard/ambil-api" className="admin-sidebar-link"><span>⇩</span>Ambil dari API</Link>
            <Link to="/dashboard/profil" className="admin-sidebar-link"><span>◍</span>Profil</Link>
            <button type="button" className="active"><span>▥</span>Dashboard / Aplikasi</button>
            <Link to="/dashboard/upload" className="admin-sidebar-link"><span>⬆</span>Upload Lainnya</Link>
            <Link to="/katalog" className="admin-sidebar-link"><span>◉</span>Lihat Katalog</Link>
          </nav>

          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>← Logout</button>

        </aside>

        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">{currentUser?.role === 'admin' ? 'ADMINISTRATOR' : 'OPERATOR'}</span>
              <h1>Create {isApplication ? 'Aplikasi' : 'Dashboard'}</h1>
              <p>
                {isApplication
                  ? 'Tautkan aplikasi geospasial eksternal (mis. sistem informasi berbasis web) supaya tampil di halaman Aplikasi.'
                  : 'Susun dashboard dari dataset/peta yang sudah ada sebagai widget, atau tautkan dashboard eksternal.'}
              </p>
            </div>
          </header>

          {status === 'success' ? (

            <div className="admin-panel">
              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
                <strong>{isApplication ? 'Aplikasi' : 'Dashboard'} berhasil dibuat</strong>
                                <p>{isApplication ? 'Aplikasi' : 'Dashboard'} akan berstatus "Unpublished" hingga disetujui admin.</p>
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

                <div className="admin-panel-header"><div><h2>Jenis</h2></div></div>

                <div style={{ padding: '20px 22px' }}>

                  <div style={{ display: 'inline-flex', border: '1px solid #d7e0e9', borderRadius: '10px', overflow: 'hidden' }}>

                    <button
                      type="button"
                      onClick={() => handleChangeKind('dashboard')}
                      style={{
                        padding: '10px 18px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: !isApplication ? '#0b5cab' : '#ffffff',
                        color: !isApplication ? '#ffffff' : '#617384',
                      }}
                    >
                      ▥ Dashboard
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChangeKind('application')}
                      style={{
                        padding: '10px 18px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: isApplication ? '#0b5cab' : '#ffffff',
                        color: isApplication ? '#ffffff' : '#617384',
                      }}
                    >
                      ⌗ Aplikasi
                    </button>

                  </div>

                  <p style={{ margin: '10px 0 0', fontSize: '12.5px', color: '#7a8996' }}>
                    {isApplication
                      ? 'Aplikasi hanya bisa diisi dengan LINK (tidak bisa upload file), misalnya link Sistem Informasi Hidrologi, WebGIS, atau aplikasi geospasial lain berbasis web.'
                      : 'Dashboard bisa disusun dari widget dataset/peta yang sudah ada, atau ditautkan ke dashboard eksternal (mis. Looker Studio/Power BI).'}
                  </p>

                </div>

              </section>

              <section className="admin-panel">

                <div className="admin-panel-header"><div><h2>Informasi {isApplication ? 'Aplikasi' : 'Dashboard'}</h2></div></div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {errorMessage && <div className="admin-alert">{errorMessage}</div>}

                  <div className="admin-form-group">
                    <label>Gambar Sampul (opsional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Judul {isApplication ? 'Aplikasi' : 'Dashboard'} *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>

                  <div className="admin-form-group">
                    <label>Deskripsi</label>
                    <textarea rows={3} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Kategori</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="">Pilih kategori</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__custom__">Lainnya...</option>
                    </select>
                    {category === '__custom__' && (
                      <>
                        <input
                          type="text"
                          style={{ marginTop: '8px' }}
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="Ketik kategori baru"
                        />
                        <small style={{ display: 'block', marginTop: '4px' }}>
                          Gunakan bahasa Indonesia untuk kategori baru ini.
                        </small>
                      </>
                    )}
                  </div>

                  {isApplication ? (

                    <div className="admin-form-group">
                      <label>Link Aplikasi *</label>
                      <input
                        type="url"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder="https://..."
                        required
                      />
                      <small>
                        Contoh: link menuju PSIH3-WS BARITO (Sistem Informasi Hidrologi, Hidrometeorologi
                        dan Hidrogeologi Wilayah Sungai Barito), atau aplikasi web lain. Tombol "Buka
                        Aplikasi" di halaman detail akan langsung mengarah ke link ini.
                      </small>
                    </div>

                  ) : (

                    <>
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
                    </>

                  )}

                </div>

              </section>


              {!isApplication && (

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

              )}

              <div style={{ padding: '0 0 30px' }}>
                <button type="submit" className="admin-view-site" disabled={status === 'uploading'}>
                  {status === 'uploading' ? 'Menyimpan...' : `Simpan ${isApplication ? 'Aplikasi' : 'Dashboard'}`}
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