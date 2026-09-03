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
  getAdminDatasetsRaw,
  deleteDataset,
  updateDataset,
} from '../../api/datasetApi'

import {
  getAdminGeoappsRaw,
  updateGeoapp,
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
  RESOURCE_TYPE_OPTIONS,
  INFORMASI_SUBTYPE_OPTIONS,
  CATEGORY_OPTIONS,
  DATASET_BBOX_FIELDS,
  supportsAttributeTable,
  supportsBboxLocation,
  supportsLinkedResources,
  supportsEmbedUrl,
  supportsExtraMetadataForm,
  buildExtraMetadata,
} from '../../utils/resourceFields'

import {
  downloadAttributeTemplate,
  parseAttributeExcel,
} from '../../utils/attributeExcel'

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

const EMPTY_METADATA_FORM = {
  region: '', language: '', srid: '', attribution: '', purpose: '',
  supplementalInformation: '', constraintsOther: '',
  bbox: { minLon: '', minLat: '', maxLon: '', maxLat: '' },
  attributes: [],
}

function AdminDashboard() {

  const navigate = useNavigate()
  const { currentUser, logout, isAdmin, refreshCurrentUser } = useAuth()

  const [apiDatasets, setApiDatasets] = useState([])
  const [apiGeoapps, setApiGeoapps] = useState([])
  const [localDatasets, setLocalDatasets] = useState([])
  const [users, setUsers] = useState([])

  const [files, setFiles] = useState([])
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [subType, setSubType] = useState('pemberitahuan')
  const [linkedResourcesText, setLinkedResourcesText] = useState('')

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
      const left = Math.min(rect.left, window.innerWidth - popoverWidth - 16)

      setPopoverPos({ top, left: Math.max(8, left) })

    }
    setFilterOpen((current) => !current)
  }

  const [togglingKey, setTogglingKey] = useState(null)

  // ===================================================
  // EDIT MODAL (#6: selengkap halaman upload untuk data lokal)
  // ===================================================

  const [editingRow, setEditingRow] = useState(null)
  const [datasetForm, setDatasetForm] = useState({
    title: '', abstract: '', category: '', customCategory: '', resourceType: 'dataset', externalUrl: '',
  })
  const [metadataForm, setMetadataForm] = useState(EMPTY_METADATA_FORM)
  const [attributeExcelError, setAttributeExcelError] = useState('')
  const [savingDataset, setSavingDataset] = useState(false)

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
  // OPEN EDIT — isi form selengkap halaman upload (#6)
  // ===================================================

  function openEditRow(row) {

    setEditingRow(row)
    setAttributeExcelError('')

    const isLocal = row._source === 'local'
    const isKnownCategory = CATEGORY_OPTIONS.includes(row.category)

    setDatasetForm({
      title: row.title || '',
      abstract: row.raw.abstract || row.raw.description || '',
      category: isLocal ? (isKnownCategory ? row.category : (row.category ? '__custom__' : '')) : row.category,
      customCategory: isLocal && !isKnownCategory ? (row.category || '') : '',
      resourceType: row.resourceType,
      externalUrl: row.raw.external_url || '',
    })

    if (isLocal) {

      const metadata = parseExtraMetadata(row.raw.extra_metadata)

      setMetadataForm({
        region: metadata.region || '',
        language: metadata.language || '',
        srid: metadata.srid || '',
        attribution: metadata.attribution || '',
        purpose: metadata.purpose || '',
        supplementalInformation: metadata.supplemental_information || '',
        constraintsOther: metadata.constraints_other || '',
        bbox: {
          minLon: metadata.bbox?.minLon ?? '',
          minLat: metadata.bbox?.minLat ?? '',
          maxLon: metadata.bbox?.maxLon ?? '',
          maxLat: metadata.bbox?.maxLat ?? '',
        },
        attributes: Array.isArray(metadata.attributes) ? metadata.attributes : [],
      })

    } else {

      setMetadataForm(EMPTY_METADATA_FORM)

    }

  }

  function closeEditRow() { setEditingRow(null) }

  function addAttributeRow() {
    setMetadataForm((current) => ({ ...current, attributes: [...current.attributes, { name: '', label: '', description: '' }] }))
  }

  function updateAttributeRow(index, field, value) {
    setMetadataForm((current) => ({
      ...current,
      attributes: current.attributes.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }))
  }

  function removeAttributeRow(index) {
    setMetadataForm((current) => ({
      ...current,
      attributes: current.attributes.filter((_, i) => i !== index),
    }))
  }

  async function handleAttributeExcelUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setAttributeExcelError('')
    try {
      const parsedRows = await parseAttributeExcel(file)
      if (parsedRows.length === 0) {
        setAttributeExcelError('Tidak ada baris valid ditemukan. Pastikan kolom "name" terisi.')
        return
      }
      setMetadataForm((current) => ({ ...current, attributes: [...current.attributes, ...parsedRows] }))
      window.alert(`${parsedRows.length} atribut berhasil ditambahkan dari file Excel.`)
    } catch (err) {
      console.error('Gagal membaca file Excel:', err)
      setAttributeExcelError('Gagal membaca file Excel. Pastikan format .xlsx/.xls sesuai template.')
    } finally {
      event.target.value = ''
    }
  }

  async function handleSaveRow(event) {

    event.preventDefault()
    if (!editingRow) return

    try {

      setSavingDataset(true)

      const finalCategory =
        datasetForm.category === '__custom__' ? datasetForm.customCategory.trim() : datasetForm.category

      if (editingRow._source === 'api-dataset') {

        await updateDataset(editingRow.rawId, {
          title: datasetForm.title, abstract: datasetForm.abstract, category: finalCategory,
        })

        setApiDatasets((current) => current.map((item) =>
          item.pk === editingRow.rawId
            ? { ...item, title: datasetForm.title, abstract: datasetForm.abstract, category: { ...item.category, identifier: finalCategory } }
            : item
        ))

      } else if (editingRow._source === 'api-geoapp') {

        await updateGeoapp(editingRow.rawId, {
          title: datasetForm.title, abstract: datasetForm.abstract, category: finalCategory,
        })

        setApiGeoapps((current) => current.map((item) =>
          item.pk === editingRow.rawId
            ? { ...item, title: datasetForm.title, abstract: datasetForm.abstract, category: { ...item.category, identifier: finalCategory } }
            : item
        ))

      } else {

        const extraMetadata =
          buildExtraMetadata({
            resourceType: datasetForm.resourceType,
            region: metadataForm.region,
            language: metadataForm.language,
            srid: metadataForm.srid,
            attribution: metadataForm.attribution,
            purpose: metadataForm.purpose,
            supplementalInformation: metadataForm.supplementalInformation,
            constraintsOther: metadataForm.constraintsOther,
            bbox: metadataForm.bbox,
            attributes: metadataForm.attributes,
          })

        await updateMyDataset(editingRow.rawId, {
          title: datasetForm.title,
          abstract: datasetForm.abstract,
          category: finalCategory,
          resource_type: datasetForm.resourceType,
          external_url: datasetForm.externalUrl || null,
          extra_metadata: extraMetadata,
        })

        setLocalDatasets((current) => current.map((item) =>
          item.id === editingRow.rawId
            ? {
                ...item,
                title: datasetForm.title,
                abstract: datasetForm.abstract,
                category: finalCategory,
                resource_type: datasetForm.resourceType,
                external_url: datasetForm.externalUrl || null,
                extra_metadata: extraMetadata,
              }
            : item
        ))

      }

      window.alert('Data berhasil diperbarui.')
      closeEditRow()

    } catch (err) {
      console.error('Update dataset error:', err)
      window.alert('Gagal memperbarui data.')
    } finally {
      setSavingDataset(false)
    }

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

  const isLocalEditing = editingRow?._source === 'local'
  const showAttributeTable = isLocalEditing && supportsAttributeTable(datasetForm.resourceType)

  return (
    <main className="admin-page">

      <div className="admin-layout">

        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand"><span>GEOPORTAL</span><strong>ACEH</strong></div>
          <div className="admin-sidebar-user">
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
          </div>
          <nav className="admin-sidebar-nav">
            <button type="button" className={activeMenu === 'dashboard' ? 'active' : ''} onClick={() => setActiveMenu('dashboard')}>
              <span>▦</span>Dashboard
            </button>
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
                              <Link to="/dashboard/create-dataset" className="admin-secondary-button">+ Create Dataset</Link>
              <Link to="/dashboard/create-map" className="admin-secondary-button">+ Create Map</Link>
              <Link to="/dashboard/create-dashboard" className="admin-secondary-button">+ Create Dashboard</Link>
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
                  TOOLBAR — #5: filter (hamburger) di PALING KIRI,
                  jauh dari search box.
                ============================================= */}

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
                      display: 'flex', alignItems: 'center', gap: '8px', position: 'relative',
                      padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid #d1d5db', background: filterOpen ? '#eef2ff' : '#fff',
                      cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px',
                    }}
                  >
                    {/* #5: ikon corong filter (funnel), bukan hamburger */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="4 4 20 4 14 12 14 19 10 21 10 12 4 4" />
                    </svg>
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
                  onChange={(event) => setSearch(event.target.value)}
                  style={{ flex: 1 }}
                />
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
                                className="admin-action-view"
                              >
                                Lihat
                              </Link>
                              <button type="button" className="admin-action-view" onClick={() => openEditRow(row)}>Edit</button>
                              <button
                                type="button"
                                className={row.published ? 'admin-action-delete' : 'admin-action-view'}
                                disabled={togglingKey === row.key}
                                onClick={() => handleTogglePublish(row)}
                              >
                                {togglingKey === row.key ? '...' : row.published ? 'Unpublish' : 'Publish'}
                              </button>
                              {row._source === 'local' && (
                                <button type="button" className="admin-action-delete" onClick={() => handleDelete(row)}>Hapus</button>
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
                              <button type="button" className="admin-action-view" onClick={() => openEditUser(user)}>Edit</button>
                              {(user.id || user.pk) !== currentUser?.id && (
                                <button type="button" className="admin-action-delete" onClick={() => handleDeleteUser(user)}>Hapus</button>
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
          FAB — #3: tombol bulat "+" tanpa teks, pojok
          kanan bawah, langsung ke halaman upload.
      ============================================= */}

      <Link
        to="/dashboard/upload"
        title="Upload Data"
        className="admin-view-site"
        style={{
          position: 'fixed', bottom: '30px', right: '30px', width: '56px', height: '56px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', lineHeight: 1, padding: 0,
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)', zIndex: 50,
        }}
      >
        +
      </Link>


      {/* =============================================
          MODAL EDIT — #6: lengkap untuk data lokal
      ============================================= */}

      {editingRow && (

        <div className="admin-modal-overlay" onClick={closeEditRow}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>

            <div className="admin-modal-header">
              <h3>Edit Data</h3>
              <button type="button" className="admin-modal-close" onClick={closeEditRow}>×</button>
            </div>

            <form onSubmit={handleSaveRow}>

              <div className="admin-modal-body">

                {isLocalEditing && (
                  <div className="admin-form-group">
                    <label>Jenis Resource</label>
                    <select value={datasetForm.resourceType} onChange={(e) => setDatasetForm((c) => ({ ...c, resourceType: e.target.value }))}>
                      {RESOURCE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                      <option value="webgis">WebGIS (data lama)</option>
                    </select>
                  </div>
                )}

                {isLocalEditing && (
                  <div className="admin-form-group">
                    <label>Link / URL (opsional)</label>
                    <input type="url" value={datasetForm.externalUrl} onChange={(e) => setDatasetForm((c) => ({ ...c, externalUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Judul</label>
                  <input type="text" value={datasetForm.title} onChange={(e) => setDatasetForm((c) => ({ ...c, title: e.target.value }))} required />
                </div>

                <div className="admin-form-group">
                  <label>Deskripsi / Abstract</label>
                  <textarea rows={4} value={datasetForm.abstract} onChange={(e) => setDatasetForm((c) => ({ ...c, abstract: e.target.value }))} />
                </div>

                <div className="admin-form-group">
                  <label>Kategori</label>

                  {isLocalEditing ? (
                    <>
                      <select value={datasetForm.category} onChange={(e) => setDatasetForm((c) => ({ ...c, category: e.target.value }))}>
                        <option value="">Pilih kategori</option>
                        {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        <option value="__custom__">Lainnya...</option>
                      </select>
                      {datasetForm.category === '__custom__' && (
                        <>
                          <input
                            type="text"
                            style={{ marginTop: '8px' }}
                            value={datasetForm.customCategory}
                            onChange={(e) => setDatasetForm((c) => ({ ...c, customCategory: e.target.value }))}
                            placeholder="Ketik kategori baru"
                          />
                          <small style={{ display: 'block', marginTop: '4px' }}>
                            Gunakan bahasa Indonesia untuk kategori baru ini.
                          </small>
                        </>
                      )}
                    </>
                  ) : (
                    <input type="text" value={datasetForm.category} onChange={(e) => setDatasetForm((c) => ({ ...c, category: e.target.value }))} />
                  )}
                </div>

                  {isLocalEditing && supportsExtraMetadataForm(datasetForm.resourceType) && (

                  <>
                    <div className="admin-form-group"><label>Wilayah / Region</label><input type="text" value={metadataForm.region} onChange={(e) => setMetadataForm((c) => ({ ...c, region: e.target.value }))} /></div>
                    <div className="admin-form-group"><label>Bahasa</label><input type="text" value={metadataForm.language} onChange={(e) => setMetadataForm((c) => ({ ...c, language: e.target.value }))} /></div>
                    <div className="admin-form-group"><label>Sistem Koordinat (CRS)</label><input type="text" value={metadataForm.srid} onChange={(e) => setMetadataForm((c) => ({ ...c, srid: e.target.value }))} /></div>
                    <div className="admin-form-group"><label>Atribusi</label><input type="text" value={metadataForm.attribution} onChange={(e) => setMetadataForm((c) => ({ ...c, attribution: e.target.value }))} /></div>
                    <div className="admin-form-group"><label>Tujuan</label><textarea rows={3} value={metadataForm.purpose} onChange={(e) => setMetadataForm((c) => ({ ...c, purpose: e.target.value }))} /></div>
                    <div className="admin-form-group"><label>Informasi Tambahan</label><textarea rows={3} value={metadataForm.supplementalInformation} onChange={(e) => setMetadataForm((c) => ({ ...c, supplementalInformation: e.target.value }))} /></div>
                    <div className="admin-form-group"><label>Batasan Penggunaan</label><textarea rows={3} value={metadataForm.constraintsOther} onChange={(e) => setMetadataForm((c) => ({ ...c, constraintsOther: e.target.value }))} /></div>

                    <div className="admin-form-group">
                      <label>Bounding Box (WGS84)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {DATASET_BBOX_FIELDS.map((field) => {
                          const shortKey =
                            field.key.replace('bbox_min_lon', 'minLon').replace('bbox_min_lat', 'minLat').replace('bbox_max_lon', 'maxLon').replace('bbox_max_lat', 'maxLat')
                          return (
                            <input
                              key={field.key} type="number" step="any" placeholder={field.label}
                              value={metadataForm.bbox[shortKey] || ''}
                              onChange={(e) => setMetadataForm((c) => ({ ...c, bbox: { ...c.bbox, [shortKey]: e.target.value } }))}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </>

                )}

                {showAttributeTable && (

                  <div className="admin-form-group">

                    <label>Attributes</label>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <button type="button" className="admin-secondary-button" onClick={downloadAttributeTemplate}>⬇ Template Excel</button>
                      <label className="admin-secondary-button" style={{ cursor: 'pointer', margin: 0 }}>
                        ⬆ Upload Excel
                        <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleAttributeExcelUpload} />
                      </label>
                      <button type="button" className="admin-secondary-button" onClick={addAttributeRow}>+ Baris Manual</button>
                    </div>

                    {attributeExcelError && <div className="admin-alert" style={{ marginBottom: '10px' }}>{attributeExcelError}</div>}

                    {metadataForm.attributes.length === 0 ? (
                      <div className="admin-empty"><p>Belum ada atribut ditambahkan.</p></div>
                    ) : (
                      <div className="admin-table-wrapper">
                        <table className="admin-table">
                          <thead><tr><th>Name</th><th>Label</th><th>Description</th><th></th></tr></thead>
                          <tbody>
                            {metadataForm.attributes.map((row, index) => (
                              <tr key={index}>
                                <td><input type="text" value={row.name} onChange={(e) => updateAttributeRow(index, 'name', e.target.value)} /></td>
                                <td><input type="text" value={row.label} onChange={(e) => updateAttributeRow(index, 'label', e.target.value)} /></td>
                                <td><input type="text" value={row.description} onChange={(e) => updateAttributeRow(index, 'description', e.target.value)} /></td>
                                <td><button type="button" className="admin-action-delete" onClick={() => removeAttributeRow(index)}>Hapus</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>

                )}

                {!isLocalEditing && (
                  <p style={{ fontSize: '13px', opacity: 0.75 }}>
                    Perubahan ini hanya berlaku di tampilan web kita. Data asli di Geoportal Aceh tidak ikut berubah.
                  </p>
                )}

              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-secondary-button" onClick={closeEditRow}>Batal</button>
                <button type="submit" className="admin-view-site" disabled={savingDataset}>{savingDataset ? 'Menyimpan...' : 'Simpan'}</button>
              </div>

            </form>

          </div>
        </div>

      )}


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