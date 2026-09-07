import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router'

import {
  getAdminDatasetsRaw,
  deleteDataset,
  updateDataset,
} from '../../api/datasetApi'

import {
  getAdminGeoappsRaw,
  hideGeoapp,
  restoreGeoapp,
} from '../../api/geoappApi'

import {
  getAllOwnDatasets,
  updateMyDataset,
  deleteMyDataset,
} from '../../api/myDatasetApi'

import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../../api/userApi'

import {
  useAuth,
} from '../../context/AuthContext'

import {
  IconSearch,
  IconFilter,
  IconEye,
  IconPencil,
  IconTrash,
  IconCheckCircle,
  IconEyeOff,
} from '../../components/ActionIcons'

import CreateChoiceMenu from '../../components/CreateChoiceMenu'

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api'
const SERVER_BASE_URL = AUTH_API_URL.replace(/\/api\/?$/, '')

function buildAvatarUrl(path) {
  if (!path) return null
  return `${SERVER_BASE_URL}/uploads/${path}`
}

function normalizeApiDatasetRow(dataset) {
  return {
    _source: 'api-dataset',
    key: `api-dataset-${dataset.pk}`,
    rawId: dataset.pk,
    title: dataset.title || 'Tanpa judul',
    ownerName: dataset.owner?.username || dataset.owner?.first_name || dataset.owner?.name || '-',
    category: dataset.category?.identifier || '',
    date: dataset.date,
    published: !dataset._is_hidden,
    typeLabel: 'Dataset',
    resourceType: 'dataset',
    raw: dataset,
  }
}

function normalizeApiGeoappRow(geoapp) {
  return {
    _source: 'api-geoapp',
    key: `api-geoapp-${geoapp.pk}`,
    rawId: geoapp.pk,
    title: geoapp.title || 'Tanpa judul',
    ownerName: geoapp.owner?.username || geoapp.owner?.first_name || geoapp.owner?.name || '-',
    category: geoapp.category?.identifier || 'Dashboard',
    date: geoapp.date,
    published: !geoapp._is_hidden,
    typeLabel: 'Dashboard',
    resourceType: 'dashboard',
    raw: geoapp,
  }
}

function normalizeLocalRow(item) {
  return {
    _source: 'local',
    key: `local-${item.id}`,
    rawId: item.id,
    title: item.title || 'Tanpa judul',
    ownerName: item.owner_username || '-',
    category: item.category || '',
    date: item.created_at,
    published: Boolean(item.is_published),
    typeLabel:
      item.resource_type === 'dashboard' ? 'Dashboard'
      : item.resource_type === 'webgis' ? 'WebGIS'
      : item.resource_type === 'map' ? 'Peta'
      : item.resource_type === 'document' ? 'Dokumen'
      : item.resource_type === 'informasi' ? `Informasi (${item.sub_type || '-'})`
      : 'Dataset',
    resourceType: item.resource_type || 'dataset',
    raw: item,
  }
}

function AdminDashboard() {

  const navigate = useNavigate()
  const { currentUser, logout, isAdmin, refreshCurrentUser } = useAuth()

  // ===================================================
  // SESI 9 (Poin 10): dukung ?tab=users supaya link
  // "Pengguna" dari sidebar halaman lain (mis. Data Saya)
  // bisa langsung membuka tab Pengguna di sini, tanpa harus
  // klik dua kali (buka Dashboard admin dulu, baru klik tab).
  // ===================================================

  const [searchParams] = useSearchParams()

  const [apiDatasets, setApiDatasets] = useState([])
  const [apiGeoapps, setApiGeoapps] = useState([])
  const [localDatasets, setLocalDatasets] = useState([])
  const [users, setUsers] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeMenu, setActiveMenu] = useState('dashboard')

  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState({ dataset: true, dashboard: true, map: true, document: true, informasi: true })
  const [filterStatus, setFilterStatus] = useState({ published: true, unpublished: true })
  const [filterCategory, setFilterCategory] = useState('Semua')
  const [filterInstansi, setFilterInstansi] = useState('Semua')

  // #3: popover posisi FIXED terhadap tombol, supaya tidak
  // terpotong ketika daftar hasil filter pendek/kosong.
  const filterButtonRef = useRef(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })

  function toggleFilterPopover() {
    if (!filterOpen && filterButtonRef.current) {

      const rect = filterButtonRef.current.getBoundingClientRect()
      const popoverWidth = 320
      const estimatedHeight = 420

      // #10: kalau ruang di bawah tombol tidak cukup, buka
      // ke ATAS supaya popover tidak terpotong layar/footer.
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight

      const top = openUpward
        ? Math.max(8, rect.top - estimatedHeight - 8)
        : rect.bottom + 8

      // Jangan sampai keluar sisi kanan layar
      const left = Math.min(rect.right - popoverWidth, window.innerWidth - popoverWidth - 16)

      setPopoverPos({ top, left: Math.max(8, left) })

    }
    setFilterOpen((current) => !current)
  }

  const [togglingKey, setTogglingKey] = useState(null)

  const [userModalMode, setUserModalMode] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'operator' })
  const [userAvatarFile, setUserAvatarFile] = useState(null)
  const [savingUser, setSavingUser] = useState(false)
  const [userFormError, setUserFormError] = useState('')

  async function loadDashboard() {
    try {
      setLoading(true)
      setError('')
      const [datasetResult, geoappResult, userResult, localResult] =
        await Promise.allSettled([
          getAdminDatasetsRaw(),
          getAdminGeoappsRaw(),
          getAllUsers(),
          getAllOwnDatasets(),
        ])
      setApiDatasets(datasetResult.status === 'fulfilled' && Array.isArray(datasetResult.value) ? datasetResult.value : [])
      setApiGeoapps(geoappResult.status === 'fulfilled' && Array.isArray(geoappResult.value) ? geoappResult.value : [])
      setUsers(userResult.status === 'fulfilled' && Array.isArray(userResult.value) ? userResult.value : [])
      setLocalDatasets(localResult.status === 'fulfilled' && Array.isArray(localResult.value) ? localResult.value : [])
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Gagal memuat dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  // SESI 9 (Poin 10): buka tab "Pengguna" otomatis kalau
  // halaman ini diakses lewat link "?tab=users".
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'users') {
      setActiveMenu('users')
    }
  }, [searchParams])

  const allRows = useMemo(() => {
    return [
      ...localDatasets.map(normalizeLocalRow),
      ...apiDatasets.map(normalizeApiDatasetRow),
      ...apiGeoapps.map(normalizeApiGeoappRow),
    ]
  }, [apiDatasets, apiGeoapps, localDatasets])

  const categoryOptions = useMemo(() => {
    const set = new Set()
    allRows.forEach((row) => { if (row.category) set.add(row.category) })
    return ['Semua', ...Array.from(set)]
  }, [allRows])

  const instansiOptions = useMemo(() => {
    const set = new Set()
    allRows.forEach((row) => { if (row.ownerName && row.ownerName !== '-') set.add(row.ownerName) })
    return ['Semua', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))]
  }, [allRows])

  const statistics = useMemo(() => {
    const published = allRows.filter((row) => row.published).length
    return [
      { label: 'Total Data', value: allRows.length, icon: '▦' },
      { label: 'Terpublikasi', value: published, icon: '✓' },
      { label: 'Pengguna', value: users.length, icon: '♙' },
      { label: 'Belum Terpublikasi', value: Math.max(allRows.length - published, 0), icon: '◷' },
    ]
  }, [allRows, users])

    const activeFilterCount = useMemo(() => {
      let count = 0
      if (!filterType.dataset || !filterType.dashboard || !filterType.map || !filterType.document || !filterType.informasi) count++
      if (!filterStatus.published || !filterStatus.unpublished) count++
      if (filterCategory !== 'Semua') count++
      if (filterInstansi !== 'Semua') count++
      return count
    }, [filterType, filterStatus, filterCategory, filterInstansi])
    
    const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return allRows.filter((row) => {
      const matchSearch = !keyword || row.title.toLowerCase().includes(keyword)
      const matchType = filterType[row.resourceType] !== false
      const matchStatus = (row.published && filterStatus.published) || (!row.published && filterStatus.unpublished)
      const matchCategory = filterCategory === 'Semua' || row.category === filterCategory
      const matchInstansi = filterInstansi === 'Semua' || row.ownerName === filterInstansi
      return matchSearch && matchType && matchStatus && matchCategory && matchInstansi
    })
  }, [allRows, search, filterType, filterStatus, filterCategory, filterInstansi])

  async function handleTogglePublish(row) {
    const nextValue = !row.published
    try {
      setTogglingKey(row.key)
      if (row._source === 'api-dataset') {
        await updateDataset(row.rawId, { is_published: nextValue })
        setApiDatasets((current) => current.map((item) => item.pk === row.rawId ? { ...item, _is_hidden: !nextValue } : item))
      } else if (row._source === 'api-geoapp') {
        if (nextValue) await restoreGeoapp(row.rawId); else await hideGeoapp(row.rawId)
        setApiGeoapps((current) => current.map((item) => item.pk === row.rawId ? { ...item, _is_hidden: !nextValue } : item))
      } else {
        await updateMyDataset(row.rawId, { is_published: nextValue })
        setLocalDatasets((current) => current.map((item) => item.id === row.rawId ? { ...item, is_published: nextValue } : item))
      }
    } catch (err) {
      console.error('Toggle publish error:', err)
      window.alert('Gagal mengubah status publish.')
    } finally {
      setTogglingKey(null)
    }
  }

  // ===================================================
  // SESI 6 (FIX): "Hapus" HANYA untuk data lokal (upload-an
  // user). Data dari API Geoportal Aceh lama TIDAK punya
  // tombol Hapus — itu jadi pembeda: API cuma Publish/Unpublish,
  // upload-an bisa dihapus permanen.
  // ===================================================

  async function handleDelete(row) {
    if (row._source !== 'local') return
    const confirmed = window.confirm(`Hapus "${row.title}"? Data akan dihapus permanen dari server kita.`)
    if (!confirmed) return
    try {
      await deleteMyDataset(row.rawId)
      setLocalDatasets((current) => current.filter((item) => item.id !== row.rawId))
      window.alert('Data berhasil dihapus.')
    } catch (err) {
      console.error('Delete error:', err)
      window.alert('Gagal menghapus data.')
    }
  }

  // ===================================================
  // SESI 8 (FIX Poin 6): Edit data SEKARANG membuka halaman
  // penuh /admin/edit/:source/:id (EditDatasetAdmin.jsx),
  // BUKAN modal/pop-up lagi — sama seperti pola halaman
  // "Edit Data" di Data Saya (EditMyDataset.jsx). :source
  // dipakai halaman tujuan untuk tahu cara mengambil &
  // menyimpan datanya (data lokal vs data dari API lama).
  // ===================================================

  function goToEditPage(row) {
    navigate(`/admin/edit/${row._source}/${row.rawId}`)
  }

  function openCreateUser() {
    setUserModalMode('create')
    setEditingUser(null)
    setUserForm({ username: '', email: '', password: '', role: 'operator' })
    setUserAvatarFile(null)
    setUserFormError('')
  }

  function openEditUser(user) {
    setUserModalMode('edit')
    setEditingUser(user)
    setUserForm({ username: user.username || '', email: user.email || '', password: '', role: user.role || 'operator' })
    setUserAvatarFile(null)
    setUserFormError('')
  }

  function closeUserModal() {
    setUserModalMode(null)
    setEditingUser(null)
    setUserAvatarFile(null)
  }

  async function handleSaveUser(event) {
    event.preventDefault()
    setUserFormError('')
    if (!userForm.username.trim()) { setUserFormError('Username wajib diisi.'); return }
    if (userModalMode === 'create' && !userForm.password.trim()) { setUserFormError('Password wajib diisi untuk pengguna baru.'); return }
    try {
      setSavingUser(true)
      if (userModalMode === 'create') {
        await createUser({
          username: userForm.username, email: userForm.email, password: userForm.password,
          role: userForm.role, avatarFile: userAvatarFile,
        })
        window.alert('Pengguna berhasil ditambahkan.')
      } else if (userModalMode === 'edit' && editingUser) {
        const payload = { username: userForm.username, email: userForm.email, role: userForm.role, avatarFile: userAvatarFile }
        if (userForm.password.trim()) payload.password = userForm.password
        await updateUser(editingUser.id || editingUser.pk, payload)
        if ((editingUser.id || editingUser.pk) === currentUser?.id) {
          await refreshCurrentUser()
        }
        window.alert('Pengguna berhasil diperbarui.')
      }
      await loadDashboard()
      closeUserModal()
    } catch (err) {
      console.error('Save user error:', err)
      setUserFormError(err.message || 'Gagal menyimpan pengguna.')
    } finally {
      setSavingUser(false)
    }
  }

  async function handleDeleteUser(user) {
    if (user.id === currentUser?.id || user.pk === currentUser?.id || user.username === currentUser?.username) {
      window.alert('Kamu tidak bisa menghapus akunmu sendiri.')
      return
    }
    const confirmed = window.confirm(`Hapus pengguna "${user.username || 'ini'}"?`)
    if (!confirmed) return
    try {
      await deleteUser(user.id || user.pk)
      await loadDashboard()
      window.alert('Pengguna berhasil dihapus.')
    } catch (err) {
      console.error('Delete user error:', err)
      window.alert('Pengguna gagal dihapus.')
    }
  }

  function handleLogout() { logout(); navigate('/', { replace: true }) }
  function handleRefresh() { loadDashboard() }

  if (!isAdmin) return null

  return (
    <main className="admin-page">

      <div className="admin-layout">

        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand"><span>GEOPORTAL</span><strong>ACEH</strong></div>

          {/* =============================================
              SESI 9 (Poin 10): nama/avatar admin sekarang
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
                (currentUser?.username || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <strong>{currentUser?.username || 'Administrator'}</strong>
              <span>Administrator</span>
            </div>
          </Link>

          {/* =============================================
              SIDEBAR MINIMAL — SESI 9 (Poin 10): cukup
              Dashboard, Data Saya, Pengguna, Lihat Katalog,
              WebGIS, Logout. "Ambil dari API" & "Profil"
              DIHAPUS — Ambil dari API sudah ada di tombol +
              (pojok kanan bawah), Profil pindah ke klik nama
              di atas.
          ============================================= */}

          <nav className="admin-sidebar-nav">
            <button type="button" className={activeMenu === 'dashboard' ? 'active' : ''} onClick={() => setActiveMenu('dashboard')}>
              <span>▦</span>Dashboard
            </button>

            <Link to="/dashboard/datasets" className="admin-sidebar-link"><span>◈</span>Data Saya</Link>

            <button type="button" className={activeMenu === 'users' ? 'active' : ''} onClick={() => setActiveMenu('users')}>
              <span>♙</span>Pengguna
            </button>

            <Link to="/katalog" className="admin-sidebar-link"><span>◉</span>Lihat Katalog</Link>
            <Link to="/webgis" className="admin-sidebar-link"><span>⌖</span>WebGIS</Link>
          </nav>

          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>← Logout</button>
        </aside>

        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">ADMINISTRATOR</span>
              <h1>Dashboard</h1>
              <p>Kelola data dan pengguna Geoportal Aceh.</p>
            </div>
            <div className="admin-header-actions">
              <button type="button" className="admin-refresh-button" onClick={handleRefresh} disabled={loading}>
                ↻ {loading ? 'Memuat...' : 'Refresh'}
              </button>
              <Link to="/" className="admin-view-site">Lihat Website →</Link>
            </div>
          </header>

          {error && <div className="admin-alert">{error}</div>}

          <section className="admin-stat-grid">
            {statistics.map((stat) => (
              <article className="admin-stat-card" key={stat.label}>
                <div className="admin-stat-icon">{stat.icon}</div>
                <div><strong>{loading ? '...' : stat.value}</strong><span>{stat.label}</span></div>
              </article>
            ))}
          </section>

          {activeMenu === 'dashboard' && (

            <section className="admin-panel">

              <div className="admin-panel-header">
                <div>
                  <span className="section-eyebrow">CONTENT</span>
                  <h2>Semua Data</h2>
                  <p>Dataset, dashboard, dan WebGIS dari seluruh sumber, digabung dalam satu daftar.</p>
                </div>
              </div>

              {/* =============================================
                  TOOLBAR — SESI 6: search di kiri (dengan ikon
                  kaca pembesar), filter di PALING KANAN.
                ============================================= */}

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
                    onChange={(event) => setSearch(event.target.value)}
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
                    {/* #10: titik hijau kecil menandakan ada filter aktif */}
                    {activeFilterCount > 0 && (
                      <span style={{
                        position: 'absolute', top: '-3px', right: '-3px',
                        width: '9px', height: '9px', borderRadius: '50%',
                        background: '#22c55e', border: '2px solid #fff',
                      }} />
                    )}
                  </button>

                  {filterOpen && (
                    <>
                      {/* SESI 6: klik di luar popover otomatis menutup filter */}
                      <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />

                      <div
                        style={{
                          position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 1000,
                          background: '#fff', border: '1px solid #d1d5db', borderRadius: '10px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '16px', width: '320px',
                          maxHeight: 'min(70vh, 420px)', overflowY: 'auto',
                          display: 'flex', flexDirection: 'column', gap: '16px',
                        }}
                      >

                        <div>
                          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>TYPE</strong>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                              { key: 'dataset', label: 'Dataset' },
                              { key: 'dashboard', label: 'Dashboard' },
                              { key: 'map', label: 'Peta' },
                              { key: 'document', label: 'Dokumen' },
                              { key: 'informasi', label: 'Informasi' },
                            ].map((option) => (
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

                        <div>
                          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>CATEGORY</strong>
                          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                            {categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </div>

                        <div>
                          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>INSTANSI</strong>
                          <select value={filterInstansi} onChange={(e) => setFilterInstansi(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                            {instansiOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </div>

                      </div>
                    </>
                  )}
                </div>

              </div>

              {loading ? (
                <div className="admin-loading">Memuat data...</div>
              ) : filteredRows.length === 0 ? (
                <div className="admin-empty">
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>◈</div>
                  <strong>Tidak ada data</strong>
                  <p>Belum ada data yang cocok dengan filter.</p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Data</th><th>Jenis</th><th>Owner</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                      {filteredRows.slice(0, 200).map((row) => (
                        <tr key={row.key}>
                          <td><strong>{row.title}</strong><small>ID: {row.rawId}</small></td>
                          <td><span className="admin-status">{row.typeLabel}</span></td>
                          <td>{row.ownerName}</td>
                          <td>{row.date ? new Date(row.date).toLocaleDateString('id-ID') : '-'}</td>
                          <td>
                            <span className={row.published ? 'admin-status published' : 'admin-status pending'}>
                              {row.published ? 'Published' : 'Unpublished'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions">
                              <Link
                                to={
                                  row.resourceType === 'dashboard'
                                    ? `/aplikasi/${row._source === 'local' ? `own-${row.rawId}` : row.rawId}`
                                    : `/katalog/${row._source === 'local' ? `own-${row.rawId}` : row.rawId}`
                                }
                                className="icon-btn icon-btn-view"
                                data-tooltip="Lihat"
                              >
                                <IconEye />
                              </Link>

                              <button
                                type="button"
                                className="icon-btn icon-btn-edit"
                                data-tooltip="Edit"
                                onClick={() => goToEditPage(row)}
                              >
                                <IconPencil />
                              </button>

                              <button
                                type="button"
                                className={row.published ? 'icon-btn icon-btn-unpublish' : 'icon-btn icon-btn-publish'}
                                data-tooltip={row.published ? 'Unpublish' : 'Publish'}
                                disabled={togglingKey === row.key}
                                onClick={() => handleTogglePublish(row)}
                              >
                                {row.published ? <IconEyeOff /> : <IconCheckCircle />}
                              </button>

                              {/* SESI 6 (FIX): Hapus HANYA untuk data lokal —
                                  ini pembeda antara data API vs upload-an user. */}
                              {row._source === 'local' && (
                                <button
                                  type="button"
                                  className="icon-btn icon-btn-delete"
                                  data-tooltip="Hapus"
                                  onClick={() => handleDelete(row)}
                                >
                                  <IconTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </section>

          )}

          {activeMenu === 'users' && (

            <section className="admin-panel">
              <div className="admin-panel-header">
                <div><span className="section-eyebrow">MANAGEMENT</span><h2>Pengguna</h2></div>
                <div className="admin-panel-actions">
                  <button type="button" className="admin-secondary-button" onClick={openCreateUser}>+ Tambah Pengguna</button>
                </div>
              </div>
              {loading ? (
                <div className="admin-loading">Memuat pengguna...</div>
              ) : users.length === 0 ? (
                <div className="admin-empty"><strong>Data pengguna tidak tersedia</strong></div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Foto</th><th>Username</th><th>Email</th><th>Role</th><th>Tanggal</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 100).map((user) => (
                        <tr key={user.id || user.pk || user.username}>
                          <td>
                            {user.avatar_url ? (
                              <img src={buildAvatarUrl(user.avatar_url)} alt={user.username} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                            )}
                          </td>
                          <td><strong>{user.username || '-'}</strong></td>
                          <td>{user.email || '-'}</td>
                          <td><span className={user.role === 'admin' ? 'admin-role admin' : 'admin-role operator'}>{user.role || 'operator'}</span></td>
                          <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}</td>
                          <td>
                            <div className="admin-actions">
                              <button type="button" className="icon-btn icon-btn-edit" data-tooltip="Edit" onClick={() => openEditUser(user)}>
                                <IconPencil />
                              </button>
                              {(user.id || user.pk) !== currentUser?.id && (
                                <button type="button" className="icon-btn icon-btn-delete" data-tooltip="Hapus" onClick={() => handleDeleteUser(user)}>
                                  <IconTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          )}

        </section>

      </div>


      {/* =============================================
          SESI 9 (Poin 8): FAB "+" lama yang cuma link
          langsung ke /dashboard/upload sekarang diganti
          dengan menu seperempat lingkaran yang sama seperti
          di halaman "Data Saya" — jadi admin juga bisa
          langsung pilih Dataset / Peta / Dashboard / Upload
          / Ambil dari API dari satu tombol yang sama.
      ============================================= */}

      <CreateChoiceMenu />


      {userModalMode && (
        <div className="admin-modal-overlay" onClick={closeUserModal}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header"><h3>{userModalMode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}</h3><button type="button" className="admin-modal-close" onClick={closeUserModal}>×</button></div>
            <form onSubmit={handleSaveUser}>
              <div className="admin-modal-body">
                {userFormError && <div className="admin-alert">{userFormError}</div>}
                <div className="admin-form-group">
                  <label>Username</label>
                  <input type="text" value={userForm.username} onChange={(e) => setUserForm((c) => ({ ...c, username: e.target.value }))} required />
                </div>
                <div className="admin-form-group">
                  <label>Email</label>
                  <input type="email" value={userForm.email} onChange={(e) => setUserForm((c) => ({ ...c, email: e.target.value }))} />
                </div>
                <div className="admin-form-group">
                  <label>Password{userModalMode === 'edit' && ' (kosongkan jika tidak diubah)'}</label>
                  <input type="password" value={userForm.password} onChange={(e) => setUserForm((c) => ({ ...c, password: e.target.value }))} />
                </div>
                <div className="admin-form-group">
                  <label>Role</label>
                  <select value={userForm.role} onChange={(e) => setUserForm((c) => ({ ...c, role: e.target.value }))}>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Foto Profil / Logo (opsional)</label>
                  <input type="file" accept="image/*" onChange={(e) => setUserAvatarFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-secondary-button" onClick={closeUserModal}>Batal</button>
                <button type="submit" className="admin-view-site" disabled={savingUser}>{savingUser ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  )
}

export default AdminDashboard