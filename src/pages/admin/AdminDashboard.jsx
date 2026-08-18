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
  updateDataset,
} from '../../api/datasetApi'

import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../../api/userApi'

import {
  useAuth,
} from '../../context/AuthContext'


function AdminDashboard() {

  const navigate = useNavigate()

  const {
    currentUser,
    logout,
    isAdmin,
  } = useAuth()


  // ===================================================
  // STATE - DATA
  // ===================================================

  const [datasets, setDatasets] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeMenu, setActiveMenu] = useState('dashboard')


  // ===================================================
  // STATE - MODAL DATASET
  // ===================================================

  const [editingDataset, setEditingDataset] = useState(null)
  const [datasetForm, setDatasetForm] = useState({
    title: '',
    abstract: '',
  })
  const [savingDataset, setSavingDataset] = useState(false)
  const [togglingId, setTogglingId] = useState(null)


  // ===================================================
  // STATE - MODAL USER
  // ===================================================

  const [userModalMode, setUserModalMode] = useState(null) // 'create' | 'edit' | null
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'operator',
  })
  const [savingUser, setSavingUser] = useState(false)
  const [userFormError, setUserFormError] = useState('')


  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  async function loadDashboard() {

    try {

      setLoading(true)
      setError('')

      const [datasetResult, userResult] = await Promise.allSettled([
        getAllDatasets(),
        getAllUsers(),
      ])

      if (datasetResult.status === 'fulfilled') {
        const datasetData = datasetResult.value
        setDatasets(Array.isArray(datasetData) ? datasetData : [])
      } else {
        console.error('Dataset error:', datasetResult.reason)
        setDatasets([])
      }

      if (userResult.status === 'fulfilled') {
        const userData = userResult.value
        setUsers(Array.isArray(userData) ? userData : [])
      } else {
        console.error('User error:', userResult.reason)
        setUsers([])
      }

      if (
        datasetResult.status === 'rejected' &&
        userResult.status === 'rejected'
      ) {
        setError('Data dashboard gagal dimuat.')
      }

    } catch (err) {

      console.error('Dashboard error:', err)
      setError('Gagal memuat dashboard.')

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {
    loadDashboard()
  }, [])


  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {

    const published = datasets.filter(
      (dataset) =>
        dataset.is_published === true ||
        dataset.published === true ||
        dataset.is_approved === true
    ).length

    return [
      { label: 'Total Dataset', value: datasets.length, icon: '▦' },
      { label: 'Terpublikasi', value: published, icon: '✓' },
      { label: 'Pengguna', value: users.length, icon: '♙' },
      {
        label: 'Belum Terpublikasi',
        value: Math.max(datasets.length - published, 0),
        icon: '◷',
      },
    ]

  }, [datasets, users])


  // ===================================================
  // FILTER DATASET
  // ===================================================

  const filteredDatasets = useMemo(() => {

    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return datasets
    }

    return datasets.filter((dataset) => {

      const title = String(dataset.title || '').toLowerCase()

      const abstract = String(
        dataset.abstract || dataset.description || ''
      ).toLowerCase()

      return title.includes(keyword) || abstract.includes(keyword)

    })

  }, [datasets, search])


  // ===================================================
  // DELETE DATASET
  // ===================================================

  async function handleDelete(dataset) {

    const title = dataset.title || 'dataset ini'

    const confirmed = window.confirm(`Hapus dataset "${title}"?`)

    if (!confirmed) {
      return
    }

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


  // ===================================================
  // TOGGLE PUBLISH DATASET
  // ===================================================

  function isDatasetPublished(dataset) {
    return (
      dataset.is_published === true ||
      dataset.published === true ||
      dataset.is_approved === true
    )
  }

  async function handleTogglePublish(dataset) {

    const nextValue = !isDatasetPublished(dataset)

    try {

      setTogglingId(dataset.pk)

      await updateDataset(dataset.pk, {
        is_published: nextValue,
      })

      setDatasets((current) =>
        current.map((item) =>
          item.pk === dataset.pk
            ? { ...item, is_published: nextValue }
            : item
        )
      )

    } catch (err) {

      console.error('Toggle publish error:', err)

      window.alert(
        'Gagal mengubah status publish. Periksa permission API.'
      )

    } finally {

      setTogglingId(null)

    }

  }


  // ===================================================
  // EDIT DATASET
  // ===================================================

  function openEditDataset(dataset) {

    setEditingDataset(dataset)

    setDatasetForm({
      title: dataset.title || '',
      abstract: dataset.abstract || dataset.description || '',
    })

  }

  function closeEditDataset() {
    setEditingDataset(null)
  }

  async function handleSaveDataset(event) {

    event.preventDefault()

    if (!editingDataset) {
      return
    }

    try {

      setSavingDataset(true)

      await updateDataset(editingDataset.pk, {
        title: datasetForm.title,
        abstract: datasetForm.abstract,
      })

      setDatasets((current) =>
        current.map((item) =>
          item.pk === editingDataset.pk
            ? {
                ...item,
                title: datasetForm.title,
                abstract: datasetForm.abstract,
              }
            : item
        )
      )

      window.alert('Dataset berhasil diperbarui.')

      closeEditDataset()

    } catch (err) {

      console.error('Update dataset error:', err)
      window.alert('Dataset gagal diperbarui. Periksa permission API.')

    } finally {

      setSavingDataset(false)

    }

  }


  // ===================================================
  // USER - CREATE / EDIT MODAL
  // ===================================================

  function openCreateUser() {

    setUserModalMode('create')

    setEditingUser(null)

    setUserForm({
      username: '',
      email: '',
      password: '',
      role: 'operator',
    })

    setUserFormError('')

  }

  function openEditUser(user) {

    setUserModalMode('edit')

    setEditingUser(user)

    setUserForm({
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role || 'operator',
    })

    setUserFormError('')

  }

  function closeUserModal() {
    setUserModalMode(null)
    setEditingUser(null)
  }

  async function handleSaveUser(event) {

    event.preventDefault()

    setUserFormError('')

    if (!userForm.username.trim()) {
      setUserFormError('Username wajib diisi.')
      return
    }

    if (userModalMode === 'create' && !userForm.password.trim()) {
      setUserFormError('Password wajib diisi untuk pengguna baru.')
      return
    }

    try {

      setSavingUser(true)

      if (userModalMode === 'create') {

        const created = await createUser({
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
        })

        setUsers((current) => [
          ...current,
          created?.user || created || userForm,
        ])

        window.alert('Pengguna berhasil ditambahkan.')

      } else if (userModalMode === 'edit' && editingUser) {

        const payload = {
          username: userForm.username,
          email: userForm.email,
          role: userForm.role,
        }

        if (userForm.password.trim()) {
          payload.password = userForm.password
        }

        await updateUser(
          editingUser.id || editingUser.pk,
          payload
        )

        setUsers((current) =>
          current.map((item) =>
            item === editingUser ||
            item.id === editingUser.id ||
            item.pk === editingUser.pk
              ? { ...item, ...payload }
              : item
          )
        )

        window.alert('Pengguna berhasil diperbarui.')

      }

      closeUserModal()

    } catch (err) {

      console.error('Save user error:', err)

      setUserFormError(
        'Gagal menyimpan pengguna. Periksa permission API atau data yang dimasukkan.'
      )

    } finally {

      setSavingUser(false)

    }

  }


  // ===================================================
  // DELETE USER
  // ===================================================

  async function handleDeleteUser(user) {

    if (
      user.id === currentUser?.id ||
      user.pk === currentUser?.id ||
      user.username === currentUser?.username
    ) {
      window.alert('Kamu tidak bisa menghapus akunmu sendiri.')
      return
    }

    const confirmed = window.confirm(
      `Hapus pengguna "${user.username || 'ini'}"?`
    )

    if (!confirmed) {
      return
    }

    try {

      await deleteUser(user.id || user.pk)

      setUsers((current) =>
        current.filter(
          (item) =>
            (item.id || item.pk) !== (user.id || user.pk)
        )
      )

      window.alert('Pengguna berhasil dihapus.')

    } catch (err) {

      console.error('Delete user error:', err)
      window.alert('Pengguna gagal dihapus. Periksa permission API.')

    }

  }


  // ===================================================
  // LOGOUT / REFRESH
  // ===================================================

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function handleRefresh() {
    loadDashboard()
  }


  // ===================================================
  // PROTECTION
  // ===================================================

  if (!isAdmin) {
    return null
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <main className="admin-page">

      <div className="admin-layout">


        {/* SIDEBAR */}

        <aside className="admin-sidebar">

          <div className="admin-sidebar-brand">
            <span>GEOPORTAL</span>
            <strong>ACEH</strong>
          </div>

          <div className="admin-sidebar-user">

            <div className="admin-user-avatar">
              {(currentUser?.username || 'A').charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{currentUser?.username || 'Administrator'}</strong>
              <span>Administrator</span>
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

            <button
              type="button"
              className={activeMenu === 'datasets' ? 'active' : ''}
              onClick={() => setActiveMenu('datasets')}
            >
              <span>◈</span>
              Dataset
            </button>

            <button
              type="button"
              className={activeMenu === 'users' ? 'active' : ''}
              onClick={() => setActiveMenu('users')}
            >
              <span>♙</span>
              Pengguna
            </button>

            <Link to="/katalog" className="admin-sidebar-link">
              <span>◉</span>
              Lihat Katalog
            </Link>

            <Link to="/webgis" className="admin-sidebar-link">
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


        {/* MAIN */}

        <section className="admin-main">


          {/* HEADER */}

          <header className="admin-header">

            <div>
              <span className="section-eyebrow">ADMINISTRATOR</span>
              <h1>Dashboard</h1>
              <p>Kelola data dan pengguna Geoportal Aceh.</p>
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


          {/* STATISTICS */}

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


          {/* DATASET */}

          {(activeMenu === 'dashboard' || activeMenu === 'datasets') && (

            <section className="admin-panel">

              <div className="admin-panel-header">

                <div>
                  <span className="section-eyebrow">CONTENT</span>
                  <h2>Dataset</h2>
                </div>

                <div className="admin-panel-actions">
                  <Link to="/katalog" className="admin-secondary-button">
                    Katalog
                  </Link>
                </div>

              </div>

              <div className="admin-toolbar">
                <input
                  type="search"
                  placeholder="Cari dataset..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
                  <p>Belum ada dataset yang tersedia.</p>
                </div>

              ) : (

                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>Dataset</th>
                        <th>Owner</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredDatasets.slice(0, 50).map((dataset) => {

                        const published = isDatasetPublished(dataset)

                        return (

                          <tr key={dataset.pk}>

                            <td>
                              <strong>{dataset.title || 'Tanpa judul'}</strong>
                              <small>ID: {dataset.pk || '-'}</small>
                            </td>

                            <td>
                              {
                                dataset.owner?.username ||
                                dataset.owner?.first_name ||
                                dataset.owner?.name ||
                                '-'
                              }
                            </td>

                            <td>
                              {
                                dataset.date
                                  ? new Date(dataset.date).toLocaleDateString('id-ID')
                                  : '-'
                              }
                            </td>

                            <td>
                              <span
                                className={
                                  published
                                    ? 'admin-status published'
                                    : 'admin-status pending'
                                }
                              >
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
                                  className="admin-action-view"
                                  onClick={() => openEditDataset(dataset)}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className={
                                    published
                                      ? 'admin-action-delete'
                                      : 'admin-action-view'
                                  }
                                  disabled={togglingId === dataset.pk}
                                  onClick={() => handleTogglePublish(dataset)}
                                >
                                  {togglingId === dataset.pk
                                    ? '...'
                                    : published
                                      ? 'Unpublish'
                                      : 'Publish'}
                                </button>

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

          )}


          {/* USERS */}

          {activeMenu === 'users' && (

            <section className="admin-panel">

              <div className="admin-panel-header">

                <div>
                  <span className="section-eyebrow">MANAGEMENT</span>
                  <h2>Pengguna</h2>
                  <p>Daftar pengguna yang terdaftar di sistem Geoportal Aceh.</p>
                </div>

                <div className="admin-panel-actions">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={openCreateUser}
                  >
                    + Tambah Pengguna
                  </button>
                </div>

              </div>

              {loading ? (

                <div className="admin-loading">
                  Memuat pengguna...
                </div>

              ) : users.length === 0 ? (

                <div className="admin-empty">
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>♙</div>
                  <strong>Data pengguna tidak tersedia</strong>
                  <p>Endpoint user mungkin membutuhkan permission administrator.</p>
                </div>

              ) : (

                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>

                    <tbody>

                      {users.slice(0, 100).map((user) => (

                        <tr key={user.id || user.pk || user.username}>

                          <td>
                            <strong>{user.username || '-'}</strong>
                          </td>

                          <td>
                            {user.email || '-'}
                          </td>

                          <td>
                            <span
                              className={
                                user.role === 'admin'
                                  ? 'admin-role admin'
                                  : 'admin-role operator'
                              }
                            >
                              {user.role || 'operator'}
                            </span>
                          </td>

                          <td>
                            {
                              user.created_at
                                ? new Date(user.created_at).toLocaleDateString('id-ID')
                                : '-'
                            }
                          </td>

                          <td>

                            <div className="admin-actions">

                              <button
                                type="button"
                                className="admin-action-view"
                                onClick={() => openEditUser(user)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="admin-action-delete"
                                onClick={() => handleDeleteUser(user)}
                              >
                                Hapus
                              </button>

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


      {/* MODAL - EDIT DATASET */}

      {editingDataset && (

        <div className="admin-modal-overlay" onClick={closeEditDataset}>

          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="admin-modal-header">
              <h3>Edit Dataset</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={closeEditDataset}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveDataset}>

              <div className="admin-modal-body">

                <div className="admin-form-group">
                  <label>Judul</label>
                  <input
                    type="text"
                    value={datasetForm.title}
                    onChange={(event) =>
                      setDatasetForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Deskripsi / Abstract</label>
                  <textarea
                    rows={5}
                    value={datasetForm.abstract}
                    onChange={(event) =>
                      setDatasetForm((current) => ({
                        ...current,
                        abstract: event.target.value,
                      }))
                    }
                  />
                </div>

              </div>

              <div className="admin-modal-footer">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={closeEditDataset}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="admin-view-site"
                  disabled={savingDataset}
                >
                  {savingDataset ? 'Menyimpan...' : 'Simpan'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* MODAL - CREATE / EDIT USER */}

      {userModalMode && (

        <div className="admin-modal-overlay" onClick={closeUserModal}>

          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="admin-modal-header">
              <h3>
                {userModalMode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={closeUserModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveUser}>

              <div className="admin-modal-body">

                {userFormError && (
                  <div className="admin-alert">
                    {userFormError}
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(event) =>
                      setUserForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(event) =>
                      setUserForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>
                    Password
                    {userModalMode === 'edit' && ' (kosongkan jika tidak diubah)'}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(event) =>
                      setUserForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(event) =>
                      setUserForm((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                  >
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

              </div>

              <div className="admin-modal-footer">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={closeUserModal}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="admin-view-site"
                  disabled={savingUser}
                >
                  {savingUser ? 'Menyimpan...' : 'Simpan'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>

  )

}


export default AdminDashboard