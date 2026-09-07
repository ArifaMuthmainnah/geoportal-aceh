import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { updateMyProfile } from '../../api/userApi'
import { useAuth } from '../../context/AuthContext'

function buildAvatarUrl(path) {
  if (!path) return null
  return `${(import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/uploads/${path}`
}

function Profil() {

  const navigate = useNavigate()
  const { currentUser, isAdmin, logout, refreshCurrentUser } = useAuth()

  const [username, setUsername] = useState(currentUser?.username || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleAvatarChange(event) {
    const file = event.target.files?.[0] || null
    setAvatarFile(file)
    setAvatarPreview(file ? URL.createObjectURL(file) : null)
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  async function handleSubmit(event) {

    event.preventDefault()
    setError('')
    setSuccess('')

    if (!username.trim()) {
      setError('Username tidak boleh kosong.')
      return
    }

    if (newPassword && newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.')
      return
    }

    if (newPassword && !currentPassword) {
      setError('Isi password saat ini untuk mengganti password.')
      return
    }

    setSaving(true)

    try {

      await updateMyProfile({
        username,
        email,
        password: newPassword || undefined,
        currentPassword: newPassword ? currentPassword : undefined,
        avatarFile,
      })

      await refreshCurrentUser()

      setSuccess('Profil berhasil diperbarui.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setAvatarFile(null)
      setAvatarPreview(null)

    } catch (err) {

      console.error('Update profil error:', err)
      setError(err.message || 'Gagal memperbarui profil.')

    } finally {

      setSaving(false)

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
          </div>

          <nav className="admin-sidebar-nav">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="admin-sidebar-link"><span>▦</span>Dashboard</Link>
            <Link to="/dashboard/datasets" className="admin-sidebar-link"><span>◈</span>Data Saya</Link>
            <Link to="/dashboard/upload" className="admin-sidebar-link"><span>⬆</span>Upload</Link>
            <Link to="/dashboard/ambil-api" className="admin-sidebar-link"><span>⇩</span>Ambil dari API</Link>
            <button type="button" className="active"><span>◍</span>Profil</button>
            <Link to="/katalog" className="admin-sidebar-link"><span>◉</span>Lihat Katalog</Link>
          </nav>

          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>← Logout</button>

        </aside>


        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">{isAdmin ? 'ADMINISTRATOR' : 'OPERATOR'}</span>
              <h1>Profil Saya</h1>
              <p>Kelola informasi akun, foto profil, dan password kamu.</p>
            </div>
          </header>

          {error && <div className="admin-alert">{error}</div>}
          {success && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
              background: 'var(--admin-success-bg)', color: 'var(--admin-success)', fontWeight: 600, fontSize: '14px',
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <section className="admin-panel">

              <div className="admin-panel-header"><div><h2>Informasi Akun</h2></div></div>

              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
                    background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', fontWeight: 700, color: '#6b7280', flexShrink: 0,
                  }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : currentUser?.avatar_url ? (
                      <img src={buildAvatarUrl(currentUser.avatar_url)} alt={currentUser.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (currentUser?.username || 'U').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="admin-form-group" style={{ margin: 0, flex: 1 }}>
                    <label>Foto Profil (opsional)</label>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                <div className="admin-form-group">
                  <label>Email (opsional)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="admin-form-group">
                  <label>Role</label>
                  <input type="text" value={isAdmin ? 'Administrator' : 'Operator'} disabled />
                  <small>Role hanya bisa diubah oleh admin.</small>
                </div>

              </div>

            </section>

            <section className="admin-panel">

              <div className="admin-panel-header">
                <div>
                  <h2>Ganti Password</h2>
                  <p>Kosongkan kalau tidak ingin mengganti password.</p>
                </div>
              </div>

              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div className="admin-form-group">
                  <label>Password Saat Ini</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Wajib diisi kalau mengganti password" />
                </div>

                <div className="admin-form-group">
                  <label>Password Baru</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" />
                </div>

                <div className="admin-form-group">
                  <label>Konfirmasi Password Baru</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>

              </div>

            </section>

            <div style={{ padding: '0 0 30px' }}>
              <button type="submit" className="admin-view-site" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

          </form>

        </section>

      </div>

    </main>

  )

}

export default Profil