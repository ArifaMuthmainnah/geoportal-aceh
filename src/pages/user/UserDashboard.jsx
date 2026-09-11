import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getAllDatasets, getDatasetTotalCount } from '../../api/datasetApi'
import { getAllGeoapps, getGeoappTotalCount } from '../../api/geoappApi'
import { getAllVisibleDatasets } from '../../api/myDatasetApi'
import { getPublicOwners } from '../../api/userApi'
import { useAuth } from '../../context/AuthContext'
import { IconSearch, IconFilter, IconEye } from '../../components/ActionIcons'

function buildAvatarUrl(path) {
  if (!path) return null
  return `${(import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/uploads/${path}`
}

function getResourceTypeLabel(resourceType) {
  const type = String(resourceType || 'dataset').toLowerCase()
  if (type === 'dashboard') return 'Dashboard'
  if (type === 'application') return 'Aplikasi'
  if (type === 'map') return 'Peta'
  if (type === 'document') return 'Dokumen'
  if (type === 'informasi') return 'Informasi'
  return 'Dataset'
}

function buildDetailPath(row) {
  const idPart = row.source === 'local' ? `own-${row.rawId}` : row.rawId
  if (row.type === 'dashboard' || row.type === 'application') return `/aplikasi/${idPart}`
  if (row.type === 'map') return `/peta/${idPart}`
  if (row.type === 'document') return `/dokumen/${idPart}`
  return `/katalog/${idPart}`
}


function UserDashboard() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [apiRows, setApiRows] = useState([])
  const [localRows, setLocalRows] = useState([])
  const [ownerCount, setOwnerCount] = useState(0)
  const [apiTotal, setApiTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState({ dataset: true, dashboard: true, application: true, map: true, document: true, informasi: true })
  const [filterStatus, setFilterStatus] = useState({ published: true, unpublished: true })
  const [filterCategory, setFilterCategory] = useState('Semua')
  const [filterInstansi, setFilterInstansi] = useState('Semua')
  const filterButtonRef = useRef(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })

  function toggleFilterPopover() {
    if (!filterOpen && filterButtonRef.current) {

      const rect = filterButtonRef.current.getBoundingClientRect()
      const popoverWidth = 320
      const estimatedHeight = 420
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

  async function loadData() {

    try {

      setLoading(true)
      setError('')

      let datasetRows = []
      let geoappRows = []
      let apiTotalCount = 0

      try {
        const [datasets, geoapps, datasetCount, geoappCount] = await Promise.all([
          getAllDatasets(), getAllGeoapps(), getDatasetTotalCount(), getGeoappTotalCount(),
        ])
        datasetRows = (Array.isArray(datasets) ? datasets : []).map((item) => ({
          key: `api-${item.pk}`, rawId: item.pk, source: 'api-dataset', title: item.title, type: 'dataset',
          category: item.category?.identifier || '',
          owner: item.owner?.username || item.owner?.first_name || '-',
          date: item.date, published: true, isMine: false,
        }))
        geoappRows = (Array.isArray(geoapps) ? geoapps : []).map((item) => ({
          key: `api-geo-${item.pk}`, rawId: item.pk, source: 'api-geoapp', title: item.title, type: 'dashboard',
          category: item.category?.identifier || 'Dashboard',
          owner: item.owner?.username || item.owner?.first_name || '-',
          date: item.date, published: true, isMine: false,
        }))
        apiTotalCount = datasetCount + geoappCount
      } catch (err) {
        console.error('Gagal mengambil data API lama:', err)
      }

      let allLocalDatasets = []
      try {
        allLocalDatasets = await getAllVisibleDatasets()
      } catch (err) {
        console.error('Gagal mengambil semua data lokal:', err)
      }

      const localRowsCombined = (Array.isArray(allLocalDatasets) ? allLocalDatasets : []).map((item) => ({
        key: `local-${item.id}`, rawId: item.id, source: 'local',
        title: item.title, type: item.resource_type || 'dataset',
        category: item.category || '',
        owner: item.owner_username || '-',
        date: item.created_at, published: Boolean(item.is_published),
        isMine: Number(item.owner_id) === Number(currentUser?.id),
      }))

      let owners = []
      try { owners = await getPublicOwners() } catch (err) { console.error(err) }

      setApiRows([...datasetRows, ...geoappRows])
      setLocalRows(localRowsCombined)
      setOwnerCount(owners.length)
      setApiTotal(apiTotalCount)

    } catch (err) {

      console.error('Dashboard error:', err)
      setError('Gagal memuat data dashboard.')

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {
    loadData()
  }, [])

  const allRows = useMemo(() => [...localRows, ...apiRows], [localRows, apiRows])
  const statistics = useMemo(() => {

    const totalData = apiTotal + localRows.length
    const publishedLocal = localRows.filter((r) => r.published).length
    const unpublishedLocal = localRows.filter((r) => !r.published).length

    return [
      { label: 'Total Data', value: totalData, icon: '▦' },
      { label: 'Terpublikasi', value: publishedLocal + apiRows.length, icon: '✓' },
      { label: 'Pengguna', value: ownerCount, icon: '♙' },
      { label: 'Belum Terpublikasi', value: unpublishedLocal, icon: '◷' },
    ]

  }, [apiTotal, localRows, apiRows, ownerCount])

  const categoryOptions = useMemo(() => {
    const set = new Set()
    allRows.forEach((row) => { if (row.category) set.add(row.category) })
    return ['Semua', ...Array.from(set)]
  }, [allRows])

  const instansiOptions = useMemo(() => {
    const set = new Set()
    allRows.forEach((row) => { if (row.owner && row.owner !== '-') set.add(row.owner) })
    return ['Semua', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))]
  }, [allRows])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (!filterType.dataset || !filterType.dashboard || !filterType.application || !filterType.map || !filterType.document || !filterType.informasi) count++
    if (!filterStatus.published || !filterStatus.unpublished) count++
    if (filterCategory !== 'Semua') count++
    if (filterInstansi !== 'Semua') count++
    return count
  }, [filterType, filterStatus, filterCategory, filterInstansi])

  const filteredRows = useMemo(() => {

    const keyword = search.trim().toLowerCase()

    return allRows.filter((row) => {
      const matchSearch = !keyword || String(row.title || '').toLowerCase().includes(keyword)
      const matchType = filterType[row.type] !== false
      const matchStatus = (row.published && filterStatus.published) || (!row.published && filterStatus.unpublished)
      const matchCategory = filterCategory === 'Semua' || row.category === filterCategory
      const matchInstansi = filterInstansi === 'Semua' || row.owner === filterInstansi
      return matchSearch && matchType && matchStatus && matchCategory && matchInstansi
    })

  }, [allRows, search, filterType, filterStatus, filterCategory, filterInstansi])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (

    <main className="admin-page">

      <div className="admin-layout">

        <aside className="admin-sidebar">

          <div className="admin-sidebar-brand"><span>GEOPORTAL</span><strong>ACEH</strong></div>

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
              <strong>{currentUser?.username || 'Operator'}</strong>
              <span>Operator</span>
            </div>
          </Link>

          <nav className="admin-sidebar-nav">

            <button type="button" className="active">
              <span>▦</span>
              Dashboard
            </button>

            <Link to="/dashboard/datasets" className="admin-sidebar-link">
              <span>◈</span>
              Data Saya
            </Link>

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
              <span className="section-eyebrow">OPERATOR</span>
              <h1>Dashboard</h1>
              <p>Ringkasan seluruh data yang tersedia di Geoportal Aceh, termasuk yang belum dipublikasikan (mode lihat saja).</p>
            </div>
            <div className="admin-header-actions">
              <Link to="/" className="admin-view-site">Lihat Website →</Link>
            </div>
          </header>

          {error && <div className="admin-alert">{error}</div>}

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
                <span className="section-eyebrow">SEMUA DATA</span>
                <h2>Dataset, Peta & Dashboard Geoportal Aceh</h2>
                <p>Termasuk data milik operator lain yang belum dipublikasikan. Data yang bisa Anda kelola sendiri ada di halaman "Data Saya".</p>
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
                        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>KATEGORI</strong>
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
              <div className="admin-empty"><strong>Belum ada data.</strong></div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Data</th><th>Jenis</th><th>Owner</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, 200).map((row) => (
                      <tr key={row.key}>
                        <td>
                          <strong>{row.title || 'Tanpa judul'}</strong>
                        </td>
                        <td><span className="admin-status">{getResourceTypeLabel(row.type)}</span></td>
                        <td>
                          {row.owner}
                          {row.isMine && (
                            <small style={{ display: 'block', color: 'var(--admin-accent)' }}>Milik saya</small>
                          )}
                        </td>
                        <td>{row.date ? new Date(row.date).toLocaleDateString('id-ID') : '-'}</td>
                        <td>
                          <span className={row.published ? 'admin-status published' : 'admin-status pending'}>
                            {row.published ? 'Published' : 'Unpublished'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            {/* SESI 6: ikon mata — operator bisa lihat data siapa
                                pun termasuk yang belum publish, tapi tidak bisa
                                edit/hapus dari sini. */}
                            <Link to={buildDetailPath(row)} className="icon-btn icon-btn-view" data-tooltip="Lihat">
                              <IconEye />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
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