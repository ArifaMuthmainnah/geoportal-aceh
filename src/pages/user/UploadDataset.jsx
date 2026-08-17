import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { uploadDataset } from '../../api/uploadApi'
import { useAuth } from '../../context/AuthContext'


function UploadDataset() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [category, setCategory] = useState('')
  const [keywords, setKeywords] = useState('')
  const [file, setFile] = useState(null)

  const [status, setStatus] = useState('idle')
  // idle | uploading | success | error

  const [errorMessage, setErrorMessage] = useState('')


  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }


  async function handleSubmit(event) {

    event.preventDefault()

    if (!file) {
      setErrorMessage('Silakan pilih file terlebih dahulu.')
      return
    }

    setStatus('uploading')
    setErrorMessage('')

    try {

      await uploadDataset({
        file,
        title,
        abstract,
        category,
        keywords,
      })

      setStatus('success')

    } catch (err) {

      console.error('Upload error:', err)

      setStatus('error')

      setErrorMessage(
        err.message || 'Gagal mengunggah dataset.'
      )

    }

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

            <Link to="/dashboard/datasets" className="admin-sidebar-link">
              <span>◈</span>
              Dataset Saya
            </Link>

            <button type="button" className="active">
              <span>⬆</span>
              Upload
            </button>

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
              <h1>Upload Dataset</h1>
              <p>Unggah dataset baru untuk ditinjau dan dipublikasikan oleh admin.</p>
            </div>
          </header>


          {status === 'success' ? (

            <div className="admin-panel">
              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
                <strong>Dataset berhasil diunggah</strong>
                <p>Dataset akan berstatus "Menunggu Publish" hingga disetujui admin.</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <Link to="/dashboard/datasets" className="admin-secondary-button">
                    Lihat Dataset Saya
                  </Link>
                </div>
              </div>
            </div>

          ) : (

            <section className="admin-panel">

              <div className="admin-panel-header">
                <div>
                  <span className="section-eyebrow">FORM</span>
                  <h2>Detail Dataset</h2>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >

                {status === 'error' && (
                  <div className="admin-alert">
                    {errorMessage}
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Judul Dataset</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Deskripsi</label>
                  <textarea
                    rows={4}
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Kategori</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="mis: society, transportation"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Keyword</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="pisahkan dengan koma"
                  />
                </div>

                <div className="admin-form-group">
                  <label>File Dataset</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="admin-view-site"
                  disabled={status === 'uploading'}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {status === 'uploading' ? 'Mengunggah...' : 'Unggah Dataset'}
                </button>

              </form>

            </section>

          )}

        </section>

      </div>

    </main>

  )

}

export default UploadDataset