import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { uploadMyDataset } from '../../api/myDatasetApi'
import { useAuth } from '../../context/AuthContext'

import {
  RESOURCE_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  DATASET_BBOX_FIELDS,
  supportsAttributeTable,
  buildExtraMetadata,
} from '../../utils/resourceFields'

import {
  downloadAttributeTemplate,
  parseAttributeExcel,
} from '../../utils/attributeExcel'


function UploadDataset() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [resourceType, setResourceType] = useState('dataset')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [keywords, setKeywords] = useState('')

  const [files, setFiles] = useState([])
  const [externalUrl, setExternalUrl] = useState('')

  const [region, setRegion] = useState('')
  const [language, setLanguage] = useState('Indonesia')
  const [srid, setSrid] = useState('EPSG:4326')
  const [attribution, setAttribution] = useState('')
  const [purpose, setPurpose] = useState('')
  const [supplementalInformation, setSupplementalInformation] = useState('')
  const [constraintsOther, setConstraintsOther] = useState('')

  const [bbox, setBbox] = useState({ minLon: '', minLat: '', maxLon: '', maxLat: '' })

  const [attributes, setAttributes] = useState([])
  const [attributeExcelError, setAttributeExcelError] = useState('')

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')


  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }


  function addAttributeRow() {
    setAttributes((current) => [...current, { name: '', label: '', description: '' }])
  }

  function updateAttributeRow(index, field, value) {
    setAttributes((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  function removeAttributeRow(index) {
    setAttributes((current) => current.filter((_, i) => i !== index))
  }


  // ===================================================
  // UPLOAD EXCEL ATTRIBUTES (#5)
  // ===================================================

  async function handleAttributeExcelUpload(event) {

    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setAttributeExcelError('')

    try {

      const parsedRows = await parseAttributeExcel(file)

      if (parsedRows.length === 0) {

        setAttributeExcelError(
          'Tidak ada baris valid ditemukan. Pastikan kolom "name" terisi dan formatnya sesuai template.'
        )

        return

      }

      setAttributes((current) => [...current, ...parsedRows])

      window.alert(`${parsedRows.length} atribut berhasil ditambahkan dari file Excel.`)

    } catch (err) {

      console.error('Gagal membaca file Excel:', err)

      setAttributeExcelError(
        'Gagal membaca file Excel. Pastikan file berformat .xlsx/.xls dan sesuai template.'
      )

    } finally {

      // reset input supaya bisa upload file yang sama lagi
      event.target.value = ''

    }

  }


  async function handleSubmit(event) {

    event.preventDefault()

    if (!title.trim()) {
      setErrorMessage('Judul wajib diisi.')
      return
    }

    const hasFiles = files.length > 0
    const hasLink = externalUrl.trim().length > 0

    if (!hasFiles && !hasLink) {
      setErrorMessage('Isi minimal salah satu: unggah file atau isi link.')
      return
    }

    const finalCategory =
      category === '__custom__' ? customCategory.trim() : category

    setStatus('uploading')
    setErrorMessage('')

    try {

      const extraMetadata =
        buildExtraMetadata({
          resourceType, region, language, srid, attribution, purpose,
          supplementalInformation, constraintsOther, bbox, attributes,
        })

      await uploadMyDataset({
        files,
        title,
        abstract,
        resourceType,
        category: finalCategory,
        keywords,
        externalUrl,
        extraMetadata,
      })

      setStatus('success')

    } catch (err) {

      console.error('Upload error:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Gagal mengunggah data.')

    }

  }


  const showAttributeTable = supportsAttributeTable(resourceType)


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

            <Link
              to={currentUser?.role === 'admin' ? '/admin' : '/dashboard'}
              className="admin-sidebar-link"
            >
              <span>▦</span>
              Dashboard
            </Link>

            {currentUser?.role !== 'admin' && (
              <Link to="/dashboard/datasets" className="admin-sidebar-link">
                <span>◈</span>
                Data Saya
              </Link>
            )}

            <button type="button" className="active">
              <span>⬆</span>
              Upload
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

          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
            ← Logout
          </button>

        </aside>


        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">{currentUser?.role === 'admin' ? 'ADMINISTRATOR' : 'OPERATOR'}</span>
              <h1>Upload Data</h1>
              <p>Unggah dataset, dashboard, atau WebGIS. Kamu boleh isi file, link, atau keduanya sekaligus.</p>
            </div>
          </header>


          {status === 'success' ? (

            <div className="admin-panel">
              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
                <strong>Data berhasil diunggah</strong>
                <p>Data akan berstatus "Belum Publish" hingga disetujui admin.</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <Link
                    to={currentUser?.role === 'admin' ? '/admin' : '/dashboard/datasets'}
                    className="admin-secondary-button"
                  >
                    Lihat Data
                  </Link>
                </div>
              </div>
            </div>

          ) : (

            <form onSubmit={handleSubmit}>

              <section className="admin-panel">

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {status === 'error' && <div className="admin-alert">{errorMessage}</div>}

                  <div className="admin-form-group">
                    <label>Jenis Resource</label>
                    <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                      {RESOURCE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>File (opsional, bisa pilih lebih dari satu)</label>
                    <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                    {files.length > 0 && (
                      <small>{files.length} file dipilih: {files.map((f) => f.name).join(', ')}</small>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label>Link / URL (opsional)</label>
                    <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
                    <small>Isi minimal salah satu: file atau link. Boleh isi keduanya.</small>
                  </div>

                  <div className="admin-form-group">
                    <label>Judul</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>

                  <div className="admin-form-group">
                    <label>Deskripsi / Abstract</label>
                    <textarea rows={4} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
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

                  <div className="admin-form-group">
                    <label>Keyword</label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="pisahkan dengan koma"
                    />
                  </div>

                </div>

              </section>


              {resourceType === 'dataset' && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <h2>Metadata Dataset</h2>
                      <p>Diisi agar tab Info & Location di halaman detail bisa lengkap.</p>
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div className="admin-form-group">
                      <label>Wilayah / Region</label>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="mis: Kabupaten Aceh Besar" />
                    </div>

                    <div className="admin-form-group">
                      <label>Bahasa</label>
                      <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Sistem Koordinat (CRS)</label>
                      <input type="text" value={srid} onChange={(e) => setSrid(e.target.value)} placeholder="EPSG:4326" />
                    </div>

                    <div className="admin-form-group">
                      <label>Atribusi</label>
                      <input type="text" value={attribution} onChange={(e) => setAttribution(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Tujuan</label>
                      <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Informasi Tambahan</label>
                      <textarea rows={3} value={supplementalInformation} onChange={(e) => setSupplementalInformation(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Batasan Penggunaan</label>
                      <textarea rows={3} value={constraintsOther} onChange={(e) => setConstraintsOther(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Bounding Box (WGS84) — opsional</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {DATASET_BBOX_FIELDS.map((field) => {
                          const shortKey =
                            field.key
                              .replace('bbox_min_lon', 'minLon')
                              .replace('bbox_min_lat', 'minLat')
                              .replace('bbox_max_lon', 'maxLon')
                              .replace('bbox_max_lat', 'maxLat')

                          return (
                            <input
                              key={field.key}
                              type="number"
                              step="any"
                              placeholder={field.label}
                              value={bbox[shortKey] || ''}
                              onChange={(e) => setBbox((current) => ({ ...current, [shortKey]: e.target.value }))}
                            />
                          )
                        })}
                      </div>
                    </div>

                  </div>

                </section>

              )}


              {showAttributeTable && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <h2>Attributes (Opsional)</h2>
                      <p>Daftar kolom/atribut dataset — isi manual, atau unggah lewat Excel.</p>
                    </div>

                    <div
                      className="admin-panel-actions"
                      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                    >

                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={downloadAttributeTemplate}
                      >
                        ⬇ Unduh Template Excel
                      </button>

                      <label
                        className="admin-secondary-button"
                        style={{ cursor: 'pointer', margin: 0 }}
                      >
                        ⬆ Upload Excel
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          style={{ display: 'none' }}
                          onChange={handleAttributeExcelUpload}
                        />
                      </label>

                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={addAttributeRow}
                      >
                        + Tambah Baris Manual
                      </button>

                    </div>

                  </div>

                  <div style={{ padding: '0 22px 20px' }}>

                    {attributeExcelError && (
                      <div className="admin-alert" style={{ marginBottom: '12px' }}>
                        {attributeExcelError}
                      </div>
                    )}

                    <p style={{ fontSize: '13px', opacity: 0.75, marginBottom: '12px' }}>
                      Template Excel berisi 3 kolom wajib: <code>name</code>, <code>label</code>, <code>description</code>.
                      Isi baris sesuai jumlah atribut yang kamu punya, lalu upload lagi file yang sudah diisi —
                      baris-barisnya akan otomatis masuk ke tabel di bawah ini.
                    </p>

                    {attributes.length === 0 ? (

                      <div className="admin-empty"><p>Belum ada atribut ditambahkan.</p></div>

                    ) : (

                      <div className="admin-table-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Name</th><th>Label</th><th>Description</th><th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {attributes.map((row, index) => (
                              <tr key={index}>
                                <td>
                                  <input type="text" value={row.name} onChange={(e) => updateAttributeRow(index, 'name', e.target.value)} placeholder="nama_kolom" />
                                </td>
                                <td>
                                  <input type="text" value={row.label} onChange={(e) => updateAttributeRow(index, 'label', e.target.value)} placeholder="Label" />
                                </td>
                                <td>
                                  <input type="text" value={row.description} onChange={(e) => updateAttributeRow(index, 'description', e.target.value)} placeholder="Deskripsi" />
                                </td>
                                <td>
                                  <button type="button" className="admin-action-delete" onClick={() => removeAttributeRow(index)}>Hapus</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    )}

                  </div>

                </section>

              )}


              <div style={{ padding: '0 0 30px' }}>
                <button type="submit" className="admin-view-site" disabled={status === 'uploading'}>
                  {status === 'uploading' ? 'Mengunggah...' : 'Unggah Data'}
                </button>
              </div>

            </form>

          )}

        </section>

      </div>

    </main>

  )

}


export default UploadDataset