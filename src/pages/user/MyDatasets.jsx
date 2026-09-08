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
  updateMyDataset,
  deleteMyDataset,
} from '../../api/myDatasetApi'

import {
  useAuth,
} from '../../context/AuthContext'

import CreateChoiceMenu from '../../components/CreateChoiceMenu'

import {
  IconSearch,
  IconFilter,
  IconEye,
  IconPencil,
  IconTrash,
  IconCheckCircle,
  IconEyeOff,
} from '../../components/ActionIcons'


function buildAvatarUrl(path) {
  if (!path) return null
  return `${(import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/uploads/${path}`
}


function MyDatasets() {

  const navigate = useNavigate()
  const { currentUser, logout, isAdmin } = useAuth()

  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState({
    dataset: true, dashboard: true, application: true, map: true, document: true, informasi: true,
  })
  const [filterStatus, setFilterStatus] = useState({ published: true, unpublished: true })

  const [togglingKey, setTogglingKey] = useState(null)

  const filterButtonRef = useRef(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })

  function toggleFilterPopover() {

    if (!filterOpen && filterButtonRef.current) {

      const rect = filterButtonRef.current.getBoundingClientRect()
      const popoverWidth = 280
      const estimatedHeight = 380

      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight

      const top = openUpward
        ? Math.max(8, rect.top - estimatedHeight - 8)
        : rect.bottom + 8

      const left = Math.min(rect.right - popoverWidth, window.innerWidth - popoverWidth - 16)

      setPopoverPos({ top, left: Math.max(8, left) })

    }

    setFilterOpen((current) => !current)

  }


  async function loadDatasets() {

    try {

      setLoading(true)
      setError('')

      const data = await getMyDatasets()

      setDatasets(Array.isArray(data) ? data : [])

    } catch (err) {

      console.error('Load datasets error:', err)
      setError('Gagal memuat data.')
      setDatasets([])

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {
    loadDatasets()
  }, [])


  // ===================================================
  // STATISTIK PERSONAL (dipindahkan dari Dashboard)
  // ===================================================

  const statistics = useMemo(() => {

    const published = datasets.filter((item) => Boolean(item.is_published)).length

    return [
      { label: 'Data Saya', value: datasets.length, icon: '◈' },
      { label: 'Terpublikasi', value: published, icon: '✓' },
      { label: 'Menunggu Publish', value: Math.max(datasets.length - published, 0), icon: '◷' },
    ]

  }, [datasets])


  const filteredDatasets = useMemo(() => {

    const keyword = search.trim().toLowerCase()

    return datasets.filter((dataset) => {

      const title = String(dataset.title || '').toLowerCase()
      const matchSearch = !keyword || title.includes(keyword)

      const resourceType = String(dataset.resource_type || 'dataset').toLowerCase()
      const matchType = filterType[resourceType] !== false

      const published = Boolean(dataset.is_published)
      const matchStatus =
        (published && filterStatus.published) ||
        (!published && filterStatus.unpublished)

      return matchSearch && matchType && matchStatus

    })

  }, [datasets, search, filterType, filterStatus])


  function getResourceTypeLabel(resourceType) {

    const type = String(resourceType || 'dataset').trim().toLowerCase()

    if (type === 'dashboard') return 'Dashboard'
    if (type === 'application') return 'Aplikasi'
    if (type === 'webgis') return 'WebGIS'
    if (type === 'map') return 'Peta'
    if (type === 'document') return 'Dokumen'
    if (type === 'informasi') return 'Informasi'

    return 'Dataset'

  }


  // ===================================================
  // SESI 6: Publish/Unpublish & Hapus — HANYA untuk admin.
  // "di halaman admin pada bagian data saya, tombolnya
  // disamakan seperti di dashboard utama (ada Unpublish
  // & Hapus)". Operator tidak melihat 2 tombol ini karena
  // backend memang membatasi publish & hapus permanen
  // hanya untuk role admin.
  // ===================================================

  async function handleTogglePublish(dataset) {
    const nextValue = !dataset.is_published
    try {
      setTogglingKey(dataset.id)
      await updateMyDataset(dataset.id, { is_published: nextValue })
      setDatasets((current) => current.map((item) => item.id === dataset.id ? { ...item, is_published: nextValue } : item))
    } catch (err) {
      console.error('Toggle publish error:', err)
      window.alert('Gagal mengubah status publish.')
    } finally {
      setTogglingKey(null)
    }
  }

  async function handleDelete(dataset) {
    const confirmed = window.confirm(`Hapus "${dataset.title}"? Data akan dihapus permanen dari server kita.`)
    if (!confirmed) return
    try {
      await deleteMyDataset(dataset.id)
      setDatasets((current) => current.filter((item) => item.id !== dataset.id))
      window.alert('Data berhasil dihapus.')
    } catch (err) {
      console.error('Delete error:', err)
      window.alert('Gagal menghapus data.')
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

          {/* =============================================
              SESI 9 (Poin 10): nama/avatar pengguna sekarang
              bisa DIKLIK dan langsung mengarah ke halaman
              profil — menu "Profil" terpisah di bawah sudah
              tidak diperlukan lagi.
          ============================================= */}

          <Link
            to="/dashboard/profil"
            className="admin-sidebar-user"
            title="Lihat profil saya"
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <div className="admin-user-avatar">
              {currentUser?.avatar_url ? (
                <img
                  src={buildAvatarUrl(currentUser.avatar_url)}
                  alt={currentUser.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                (currentUser?.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <strong>{currentUser?.username || 'Pengguna'}</strong>
              <span>{isAdmin ? 'Administrator' : 'Operator'}</span>
            </div>
          </Link>

          {/* =============================================
              SIDEBAR MINIMAL — SESI 9 (Poin 10):
              Admin  : Dashboard, Data Saya, Pengguna, Lihat
                       Katalog, WebGIS, Logout.
              Operator: Dashboard, Data Saya, Lihat Katalog,
                        WebGIS, Logout.
              "Ambil dari API" & "Profil" DIHAPUS dari sini —
              Ambil dari API sudah ada di tombol + (pojok
              kanan bawah), Profil pindah ke klik nama di atas.
          ============================================= */}

          <nav className="admin-sidebar-nav">

            <Link to={isAdmin ? '/admin' : '/dashboard'} className="admin-sidebar-link">
              <span>▦</span>
              Dashboard
            </Link>

            <button type="button" className="active">
              <span>◈</span>
              Data Saya
            </button>

            {isAdmin && (
              <Link to="/admin?tab=users" className="admin-sidebar-link">
                <span>♙</span>
                Pengguna
              </Link>
            )}

            <Link to="/katalog" className="admin-sidebar-link">
              <span>◉</span>
              Lihat Katalog
            </Link>

            <Link to="/webgis" className="admin-sidebar-link">
              <span>⌖</span>
              WebGIS
            </Link>

          </nav>

          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
            ← Logout
          </button>

        </aside>


        <section className="admin-main">

          <header className="admin-header">

            <div>
              <span className="section-eyebrow">{isAdmin ? 'ADMINISTRATOR' : 'OPERATOR'}</span>
              <h1>Data Saya</h1>
              <p>Kelola dataset, peta, dan dashboard yang telah Anda unggah.</p>
            </div>

          </header>

          {error && <div className="admin-alert">{error}</div>}


          {/* =============================================
              STATISTIK PERSONAL
          ============================================= */}

          <section className="admin-stat-grid">
            {statistics.map((stat) => (
              <article className="admin-stat-card" key={stat.label}>
                <div className="admin-stat-icon">{stat.icon}</div>
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
                <span className="section-eyebrow">DAFTAR</span>
                <h2>Semua Data Saya</h2>
              </div>
            </div>

            <div
              className="admin-toolbar"
              style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}
            >

              <div className="search-box-wrap">
                <span className="search-box-icon"><IconSearch /></span>
                <input
                  type="search"
                  placeholder="Cari berdasarkan judul..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ position: 'relative' }}>

                <button
                  ref={filterButtonRef}
                  type="button"
                  onClick={toggleFilterPopover}
                  title="Filter"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', position: 'relative',
                    padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #d1d5db', background: filterOpen ? '#eef2ff' : '#fff',
                    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px',
                  }}
                >
                  <IconFilter />
                  Filter
                </button>

                {filterOpen && (

                  <>
                    <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />

                    <div
                      style={{
                        position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 1000,
                        background: '#fff', border: '1px solid #d1d5db', borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '16px', width: '280px',
                        maxHeight: 'min(70vh, 380px)', overflowY: 'auto',
                        display: 'flex', flexDirection: 'column', gap: '16px',
                      }}
                    >

                      <div>
                        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>JENIS</strong>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { key: 'dataset', label: 'Dataset' },
                            { key: 'dashboard', label: 'Dashboard' },
                            { key: 'application', label: 'Aplikasi' },
                            { key: 'map', label: 'Peta' },
                            { key: 'document', label: 'Dokumen' },
                            { key: 'informasi', label: 'Informasi' },
                          ].map((option) => (
                            <label key={option.key} style={{
                              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                              borderRadius: '999px', border: '1px solid #d1d5db', cursor: 'pointer',
                              background: filterType[option.key] ? '#eef2ff' : '#fff', fontSize: '13px',
                            }}>
                              <input
                                type="checkbox"
                                checked={filterType[option.key]}
                                onChange={(e) => setFilterType((c) => ({ ...c, [option.key]: e.target.checked }))}
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>STATUS</strong>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { key: 'published', label: 'Published' },
                            { key: 'unpublished', label: 'Unpublished' },
                          ].map((option) => (
                            <label key={option.key} style={{
                              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                              borderRadius: '999px', border: '1px solid #d1d5db', cursor: 'pointer',
                              background: filterStatus[option.key] ? '#eef2ff' : '#fff', fontSize: '13px',
                            }}>
                              <input
                                type="checkbox"
                                checked={filterStatus[option.key]}
                                onChange={(e) => setFilterStatus((c) => ({ ...c, [option.key]: e.target.checked }))}
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      </div>

                    </div>
                  </>

                )}

              </div>

            </div>

            {loading ? (

              <div className="admin-loading">Memuat data...</div>

            ) : filteredDatasets.length === 0 ? (

              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>◈</div>
                <strong>{search ? 'Data tidak ditemukan' : 'Belum ada data'}</strong>
                <p>
                  {search
                    ? 'Coba gunakan kata kunci pencarian lain.'
                    : 'Anda belum mengunggah dataset, peta, atau dashboard apa pun.'}
                </p>
                {!search && (
                  <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                    Gunakan tombol <strong>+</strong> di pojok kanan bawah layar untuk mulai menambahkan data.
                  </p>
                )}
              </div>

            ) : (

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Data</th><th>Jenis</th><th>Kategori</th><th>Tanggal</th><th>Status</th><th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredDatasets.map((dataset) => {

                      const published = Boolean(dataset.is_published)
                      const resourceType = getResourceTypeLabel(dataset.resource_type)

                      const detailPath =
                        dataset.resource_type === 'dashboard' || dataset.resource_type === 'application'
                          ? `/aplikasi/own-${dataset.id}`
                          : dataset.resource_type === 'map'
                            ? `/peta/own-${dataset.id}`
                            : dataset.resource_type === 'document'
                              ? `/dokumen/own-${dataset.id}`
                              : `/katalog/own-${dataset.id}`

                      return (

                        <tr key={dataset.id}>

                          <td>
                            <strong>{dataset.title || 'Tanpa judul'}</strong>
                            <small>ID: {dataset.id || '-'}</small>
                          </td>

                          <td><span className="admin-status">{resourceType}</span></td>
                          <td>{dataset.category ? dataset.category : '-'}</td>
                          <td>{dataset.created_at ? new Date(dataset.created_at).toLocaleDateString('id-ID') : '-'}</td>

                          <td>
                            <span className={published ? 'admin-status published' : 'admin-status pending'}>
                              {published ? 'Published' : 'Belum Publish'}
                            </span>
                          </td>

                          <td>
                            <div className="admin-actions">

                              <Link to={detailPath} className="icon-btn icon-btn-view" data-tooltip="Lihat">
                                <IconEye />
                              </Link>

                              {/* Operator hanya bisa edit selama BELUM publish
                                  (dibatasi backend). Admin selalu boleh edit. */}
                              {(isAdmin || !published) && (
                                <Link to={`/dashboard/edit/${dataset.id}`} className="icon-btn icon-btn-edit" data-tooltip="Edit">
                                  <IconPencil />
                                </Link>
                              )}

                              {/* SESI 6: Publish/Unpublish & Hapus khusus admin,
                                  disamakan dengan tombol di Dashboard utama. */}
                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    className={published ? 'icon-btn icon-btn-unpublish' : 'icon-btn icon-btn-publish'}
                                    data-tooltip={published ? 'Unpublish' : 'Publish'}
                                    disabled={togglingKey === dataset.id}
                                    onClick={() => handleTogglePublish(dataset)}
                                  >
                                    {published ? <IconEyeOff /> : <IconCheckCircle />}
                                  </button>

                                  <button
                                    type="button"
                                    className="icon-btn icon-btn-delete"
                                    data-tooltip="Hapus"
                                    onClick={() => handleDelete(dataset)}
                                  >
                                    <IconTrash />
                                  </button>
                                </>
                              )}

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

      {/* =============================================
          SESI 9 (Poin 8): tombol + bulat mengambang, satu
          instance saja per halaman (posisinya fixed, jadi
          selalu tampak di pojok kanan bawah tidak peduli
          tabel kosong atau berisi).
      ============================================= */}

      <CreateChoiceMenu />

    </main>

  )

}


export default MyDatasets