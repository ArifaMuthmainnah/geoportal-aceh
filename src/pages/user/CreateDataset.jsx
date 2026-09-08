import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { uploadMyDataset } from '../../api/myDatasetApi'
import { useAuth } from '../../context/AuthContext'

import {
  CATEGORY_OPTIONS,
  DATASET_BBOX_FIELDS,
  DATE_TYPE_OPTIONS,
  GROUP_OPTIONS,
  LICENSE_OPTIONS,
  buildExtraMetadata,
} from '../../utils/resourceFields'

import {
  downloadAttributeTemplate,
  parseAttributeExcel,
} from '../../utils/attributeExcel'

import {
  extractShapefileMetadata,
  hasAnyShapefilePart,
} from '../../utils/shapefileFields'

import BoundingBoxPicker from '../../components/BoundingBoxPicker'
import GeoJsonPreviewMap from '../../components/GeoJsonPreviewMap'


const STEPS = [
  { id: 1, label: 'Basic Metadata' },
  { id: 2, label: 'Location & Licenses' },
  { id: 3, label: 'Optional Metadata' },
  { id: 4, label: 'Dataset Attributes' },
]


function CreateDataset() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const [step, setStep] = useState(1)

  // ===== STEP 1: BASIC METADATA =====
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [dateType, setDateType] = useState('publication')
  const [publicationDate, setPublicationDate] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [group, setGroup] = useState('registered_members')
  const [keywords, setKeywords] = useState('')

  // ===== STEP 2: LOCATION & LICENSES =====
  const [region, setRegion] = useState('')
  const [bbox, setBbox] = useState({ minLon: '', minLat: '', maxLon: '', maxLat: '' })
  const [license, setLicense] = useState('')
  const [useMapPicker, setUseMapPicker] = useState(false)

  // ===== STEP 3: OPTIONAL METADATA =====
  const [srid, setSrid] = useState('EPSG:4326')
  const [language, setLanguage] = useState('Indonesia')
  const [attribution, setAttribution] = useState('')
  const [purpose, setPurpose] = useState('')
  const [supplementalInformation, setSupplementalInformation] = useState('')
  const [constraintsOther, setConstraintsOther] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')

  // ===== STEP 4: DATASET ATTRIBUTES + FILE =====
  const [files, setFiles] = useState([])
  const [externalUrl, setExternalUrl] = useState('')
  const [attributes, setAttributes] = useState([])
  const [attributeExcelError, setAttributeExcelError] = useState('')

  // SESI 6: sama seperti halaman Upload — geometri hasil
  // parsing .shp/.dbf/.prj, dipakai untuk mengisi otomatis
  // Bounding Box (Step 2), Sistem Koordinat (Step 3), dan
  // menampilkan peta pratinjau di Step 4.
  const [geometryType, setGeometryType] = useState('')
  const [geojson, setGeojson] = useState(null)
  const [shapefileNotice, setShapefileNotice] = useState('')

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')


  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function goNext() {

    if (step === 1 && !title.trim()) {
      setErrorMessage('Judul (Title) wajib diisi sebelum lanjut.')
      return
    }

    setErrorMessage('')
    setStep((current) => Math.min(current + 1, STEPS.length))

  }

  function goBack() {
    setErrorMessage('')
    setStep((current) => Math.max(current - 1, 1))
  }

  function addAttributeRow() {
    setAttributes((current) => [...current, { name: '', label: '', description: '' }])
  }

  function updateAttributeRow(index, field, value) {
    setAttributes((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function removeAttributeRow(index) {
    setAttributes((current) => current.filter((_, i) => i !== index))
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

      setAttributes((current) => [...current, ...parsedRows])
      window.alert(`${parsedRows.length} atribut berhasil ditambahkan dari file Excel.`)

    } catch (err) {

      console.error('Gagal membaca file Excel:', err)
      setAttributeExcelError('Gagal membaca file Excel. Pastikan format .xlsx/.xls sesuai template.')

    } finally {

      event.target.value = ''

    }

  }


  // ===================================================
  // SESI 6: FILE DATA — sekarang pakai parser shapefile
  // PENUH (sama seperti halaman Upload), bukan cuma nama
  // kolom .dbf. Otomatis mengisi Bounding Box, Sistem
  // Koordinat, Tipe Geometri, Attributes, DAN menampilkan
  // peta pratinjau kalau file lengkap (.shp+.dbf+.prj).
  // ===================================================

  async function handleFilesChange(event) {

    const selectedFiles = Array.from(event.target.files || [])
    setFiles(selectedFiles)
    setShapefileNotice('')

    if (selectedFiles.length === 0) return

    if (!hasAnyShapefilePart(selectedFiles)) {
      return
    }

    try {

      const meta = await extractShapefileMetadata(selectedFiles)

      if (meta.bbox) {
        setBbox({
          minLon: String(meta.bbox.minLon), minLat: String(meta.bbox.minLat),
          maxLon: String(meta.bbox.maxLon), maxLat: String(meta.bbox.maxLat),
        })
      }

      if (meta.srid) setSrid(meta.srid)
      if (meta.geometryType) setGeometryType(meta.geometryType)
      if (meta.geojson) setGeojson(meta.geojson)

      if (meta.attributes.length > 0) {
        setAttributes((current) => {
          const existingNames = new Set(current.map((row) => row.name))
          const newRows = meta.attributes.filter((row) => !existingNames.has(row.name))
          return [...current, ...newRows]
        })
      }

      const filled = []
      if (meta.bbox) filled.push('Bounding Box')
      if (meta.srid) filled.push('Sistem Koordinat')
      if (meta.geometryType) filled.push('Tipe Geometri')
      if (meta.attributes.length > 0) filled.push(`${meta.attributes.length} kolom Attributes`)
      if (meta.geojson) filled.push(`peta pratinjau (${meta.geojson.features.length} fitur)`)

      setShapefileNotice(
        filled.length > 0
          ? `Berhasil membaca ${meta.filesUsed.join(', ')}. Otomatis terisi: ${filled.join(', ')}.`
          : 'File shapefile terbaca, tapi tidak ada metadata yang berhasil ditarik.'
      )

    } catch (err) {

      console.error('Gagal membaca metadata shapefile:', err)
      setShapefileNotice('Gagal membaca sebagian file shapefile. Isi metadata secara manual.')

    }

  }


  async function handleSubmit() {

    const hasFiles = files.length > 0
    const hasLink = externalUrl.trim().length > 0

    if (!hasFiles && !hasLink) {
      setErrorMessage('Isi minimal salah satu: unggah file (shapefile/dll) atau isi link.')
      return
    }

    const finalCategory = category === '__custom__' ? customCategory.trim() : category

    setStatus('uploading')
    setErrorMessage('')

    try {

      const extraMetadata =
        buildExtraMetadata({
          resourceType: 'dataset',
          region, language, srid, attribution, purpose,
          supplementalInformation, constraintsOther, bbox, attributes,
          embedUrl,
          dateType, publicationDate, group, license,
          geometryType, geojson,
        })

      await uploadMyDataset({
        files,
        thumbnailFile,
        title,
        abstract,
        resourceType: 'dataset',
        category: finalCategory,
        keywords,
        externalUrl,
        extraMetadata,
      })

      setStatus('success')

    } catch (err) {

      console.error('Create dataset error:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Gagal membuat dataset.')

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
            <button type="button" className="active"><span>◈</span>Create Dataset</button>
            <Link to="/dashboard/create-map" className="admin-sidebar-link"><span>⌖</span>Create Map</Link>
            <Link to="/dashboard/upload" className="admin-sidebar-link"><span>⬆</span>Upload Lainnya</Link>
            <Link to="/dashboard/ambil-api" className="admin-sidebar-link"><span>⇩</span>Ambil dari API</Link>
            <Link to="/dashboard/profil" className="admin-sidebar-link"><span>◍</span>Profil</Link>
            <Link to="/katalog" className="admin-sidebar-link"><span>◉</span>Lihat Katalog</Link>
          </nav>
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>← Logout</button>
        </aside>


        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">{currentUser?.role === 'admin' ? 'ADMINISTRATOR' : 'OPERATOR'}</span>
              <h1>Create Dataset</h1>
              <p>Buat dataset baru lewat wizard 4 langkah — mirip alur GeoNode.</p>
            </div>
          </header>


          {status === 'success' ? (

            <div className="admin-panel">
              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
                <strong>Dataset berhasil dibuat</strong>
                <p>Dataset akan berstatus "Belum Publish" hingga disetujui admin.</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <Link to={currentUser?.role === 'admin' ? '/admin' : '/dashboard/datasets'} className="admin-secondary-button">
                    Lihat Data
                  </Link>
                </div>
              </div>
            </div>

          ) : (

            <>

              {/* =========================================
                  STEP INDICATOR
              ========================================= */}

              <div
                style={{
                  display: 'flex', gap: '8px', flexWrap: 'wrap',
                  marginBottom: '20px',
                }}
              >
                {STEPS.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 14px', borderRadius: '999px',
                      border: '1px solid #d1d5db',
                      background: step === s.id ? '#4f46e5' : (step > s.id ? '#eef2ff' : '#fff'),
                      color: step === s.id ? '#fff' : '#111',
                      fontSize: '13px', fontWeight: 600,
                    }}
                  >
                    <span>{s.id}</span>
                    <span>{s.label}</span>
                    {step > s.id && <span>✓</span>}
                  </div>
                ))}
              </div>

              {errorMessage && <div className="admin-alert">{errorMessage}</div>}


              {/* =========================================
                  STEP 1: BASIC METADATA
              ========================================= */}

              {step === 1 && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <span className="section-eyebrow">LANGKAH 1</span>
                      <h2>Basic Metadata</h2>
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div className="admin-form-group">
                      <label>Upload Thumbnail (opsional)</label>
                      <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Title *</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div className="admin-form-group">
                      <label>Abstract</label>
                      <textarea rows={4} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Data Type (Date Type)</label>
                      <select value={dateType} onChange={(e) => setDateType(e.target.value)}>
                        {DATE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label>Date</label>
                      <input type="datetime-local" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Category</label>
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
                      <label>Group</label>
                      <select value={group} onChange={(e) => setGroup(e.target.value)}>
                        {GROUP_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label>Free-text Keyword</label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="pisahkan dengan koma"
                      />
                    </div>

                  </div>

                </section>

              )}


              {/* =========================================
                  STEP 2: LOCATION & LICENSES
              ========================================= */}

              {step === 2 && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <span className="section-eyebrow">LANGKAH 2</span>
                      <h2>Location and Licenses</h2>
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div className="admin-form-group">
                      <label>Wilayah / Region</label>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="mis: Kabupaten Aceh Besar" />
                    </div>

                    <div className="admin-form-group">
                      <label>Bounding Box (WGS84) — opsional</label>

                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                        <button
                          type="button"
                          className={useMapPicker ? 'admin-view-site' : 'admin-secondary-button'}
                          onClick={() => setUseMapPicker(true)}
                        >
                          📍 Pilih di Peta
                        </button>
                        <button
                          type="button"
                          className={!useMapPicker ? 'admin-view-site' : 'admin-secondary-button'}
                          onClick={() => setUseMapPicker(false)}
                        >
                          ✏️ Input Manual
                        </button>
                      </div>

                      {useMapPicker ? (

                        <BoundingBoxPicker
                          initialBbox={bbox}
                          onChange={(nextBbox) => setBbox(nextBbox)}
                        />

                      ) : (

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

                      )}

                      {(bbox.minLon || bbox.minLat || bbox.maxLon || bbox.maxLat) && (
                        <small style={{ display: 'block', marginTop: '8px', opacity: 0.75 }}>
                          Area tersimpan: {Number(bbox.minLat).toFixed(4)}, {Number(bbox.minLon).toFixed(4)} → {Number(bbox.maxLat).toFixed(4)}, {Number(bbox.maxLon).toFixed(4)}
                        </small>
                      )}

                      <small style={{ display: 'block', marginTop: '4px' }}>
                        Kalau kamu sudah unggah shapefile lengkap di Langkah 4, kotak ini otomatis terisi —
                        tidak perlu diisi manual lagi.
                      </small>

                    </div>

                    <div className="admin-form-group">
                      <label>License</label>
                      <select value={license} onChange={(e) => setLicense(e.target.value)}>
                        {LICENSE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                </section>

              )}


              {/* =========================================
                  STEP 3: OPTIONAL METADATA
              ========================================= */}

              {step === 3 && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <span className="section-eyebrow">LANGKAH 3</span>
                      <h2>Optional Metadata</h2>
                      <p>Semua field di langkah ini opsional.</p>
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div className="admin-form-group">
                      <label>Bahasa</label>
                      <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Sistem Koordinat (CRS)</label>
                      <input type="text" value={srid} onChange={(e) => setSrid(e.target.value)} placeholder="EPSG:4326" />
                      <small>Otomatis terisi dari file .prj kalau kamu unggah shapefile lengkap di Langkah 4.</small>
                    </div>

                    <div className="admin-form-group">
                      <label>Atribusi</label>
                      <input type="text" value={attribution} onChange={(e) => setAttribution(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Tujuan (Purpose)</label>
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
                      <label>Embed URL (opsional)</label>
                      <input type="url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
                      <small>Kalau diisi, halaman detail dataset menampilkan iframe dari URL ini.</small>
                    </div>

                  </div>

                </section>

              )}


              {/* =========================================
                  STEP 4: DATASET ATTRIBUTES + FILE
              ========================================= */}

              {step === 4 && (

                <>

                  <section className="admin-panel">

                    <div className="admin-panel-header">
                      <div>
                        <span className="section-eyebrow">LANGKAH 4</span>
                        <h2>Data & Attributes</h2>
                        <p>Unggah file data (shapefile .shp/.dbf/.prj/.shx sekaligus, atau file lain) dan/atau link.</p>
                      </div>
                    </div>

                    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      <div className="admin-form-group">
                        <label>File Data (bisa pilih beberapa file sekaligus)</label>
                        <input type="file" multiple onChange={handleFilesChange} />
                        {files.length > 0 && (
                          <small>{files.length} file dipilih: {files.map((f) => f.name).join(', ')}</small>
                        )}
                        <small style={{ display: 'block', marginTop: '4px' }}>
                          Unggah .shp, .dbf, .prj, .shx SEKALIGUS untuk data spasial — Bounding Box,
                          Sistem Koordinat, Tipe Geometri, dan Attributes otomatis ditarik, plus peta
                          pratinjau muncul di bawah.
                        </small>

                        {shapefileNotice && (
                          <div
                            style={{
                              marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
                              background: 'var(--admin-success-bg)', color: 'var(--admin-success)',
                              fontSize: '13px', fontWeight: 600,
                            }}
                          >
                            {shapefileNotice}
                          </div>
                        )}

                        {geometryType && (
                          <div style={{ marginTop: '8px' }}>
                            <span className="admin-status published">Tipe Geometri: {geometryType}</span>
                          </div>
                        )}

                        {geojson && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '6px' }}>Pratinjau Peta</label>
                            <GeoJsonPreviewMap geojson={geojson} height={280} />
                          </div>
                        )}
                      </div>

                      <div className="admin-form-group">
                        <label>Link / URL (opsional)</label>
                        <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
                        <small>Isi minimal salah satu: file atau link.</small>
                      </div>

                    </div>

                  </section>


                  <section className="admin-panel">

                    <div className="admin-panel-header">
                      <div>
                        <h2>Dataset Attributes</h2>
                        <p>Otomatis terisi dari .dbf jika ada, atau isi manual/Excel.</p>
                      </div>

                      <div className="admin-panel-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" className="admin-secondary-button" onClick={downloadAttributeTemplate}>
                          ⬇ Unduh Template Excel
                        </button>
                        <label className="admin-secondary-button" style={{ cursor: 'pointer', margin: 0 }}>
                          ⬆ Upload Excel
                          <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleAttributeExcelUpload} />
                        </label>
                        <button type="button" className="admin-secondary-button" onClick={addAttributeRow}>
                          + Tambah Baris Manual
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: '0 22px 20px' }}>

                      {attributeExcelError && (
                        <div className="admin-alert" style={{ marginBottom: '12px' }}>{attributeExcelError}</div>
                      )}

                      {attributes.length === 0 ? (

                        <div className="admin-empty"><p>Belum ada atribut. Tidak wajib diisi.</p></div>

                      ) : (

                        <div className="admin-table-wrapper">
                          <table className="admin-table">
                            <thead><tr><th>Name</th><th>Label</th><th>Description</th><th></th></tr></thead>
                            <tbody>
                              {attributes.map((row, index) => (
                                <tr key={index}>
                                  <td><input type="text" value={row.name} onChange={(e) => updateAttributeRow(index, 'name', e.target.value)} /></td>
                                  <td><input type="text" value={row.label} onChange={(e) => updateAttributeRow(index, 'label', e.target.value)} placeholder="Opsional" /></td>
                                  <td><input type="text" value={row.description} onChange={(e) => updateAttributeRow(index, 'description', e.target.value)} placeholder="Opsional" /></td>
                                  <td><button type="button" className="admin-action-delete" onClick={() => removeAttributeRow(index)}>Hapus</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      )}

                    </div>

                  </section>

                </>

              )}


              {/* =========================================
                  NAVIGASI
              ========================================= */}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0 30px' }}>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={goBack}
                  disabled={step === 1}
                  style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
                >
                  ← Kembali
                </button>

                {step < STEPS.length ? (
                  <button type="button" className="admin-view-site" onClick={goNext}>
                    Lanjut →
                  </button>
                ) : (
                  <button type="button" className="admin-view-site" onClick={handleSubmit} disabled={status === 'uploading'}>
                    {status === 'uploading' ? 'Menyimpan...' : 'Simpan Dataset'}
                  </button>
                )}

              </div>

            </>

          )}

        </section>

      </div>

    </main>

  )

}

export default CreateDataset