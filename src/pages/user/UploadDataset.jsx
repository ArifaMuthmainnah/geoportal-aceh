import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { uploadMyDataset } from '../../api/myDatasetApi'
import { useAuth } from '../../context/AuthContext'
import {
  INFORMASI_SUBTYPE_OPTIONS,
  CATEGORY_OPTIONS,
  DATASET_BBOX_FIELDS,
  supportsAttributeTable,
  supportsBboxLocation,
  supportsLinkedResources,
  supportsEmbedUrl,
  supportsExtraMetadataForm,
  supportsAgendaSchedule,
  supportsShapefileUpload,
  requiresLinkOnly,
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

import { urlErrorMessage } from '../../utils/urlValidation'

import GeoJsonPreviewMap from '../../components/GeoJsonPreviewMap'

const UPLOAD_TYPE_OPTIONS = [
  { value: 'dataset', label: 'Dataset' },
  { value: 'dashboard', label: 'Aplikasi/Dashboard' },
  { value: 'map', label: 'Peta' },
  { value: 'document', label: 'Dokumen' },
  { value: 'informasi', label: 'Informasi' },
]

function Req() {
  return <span className="field-required-mark">*</span>
}

function Opt() {
  return <span className="field-optional">(Opsional)</span>
}

function UploadDataset() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [resourceType, setResourceType] = useState('dataset')
  const [dashboardKind, setDashboardKind] = useState('dashboard')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [keywords, setKeywords] = useState('')
  const [spatialFiles, setSpatialFiles] = useState([])
  const [assetFiles, setAssetFiles] = useState([])
  const [geometryType, setGeometryType] = useState('')
  const [geojson, setGeojson] = useState(null)
  const [shapefileNotice, setShapefileNotice] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [subType, setSubType] = useState('pemberitahuan')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [linkedResourcesText, setLinkedResourcesText] = useState('')
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
  const effectiveResourceType =
    resourceType === 'dashboard' ? dashboardKind : resourceType

  const linkOnly = requiresLinkOnly(effectiveResourceType)
  const externalUrlError = urlErrorMessage(externalUrl, { required: linkOnly, label: 'Link/URL' })
  const embedUrlError = urlErrorMessage(embedUrl, { label: 'Embed URL' })
  const showAttributeTable = supportsAttributeTable(effectiveResourceType)
  const showAgendaSchedule = supportsAgendaSchedule(effectiveResourceType, subType)
  const showShapefileUpload = supportsShapefileUpload(effectiveResourceType)
  const showEmbedUrl = supportsEmbedUrl(effectiveResourceType)
  const showMetadataPanel = supportsExtraMetadataForm(effectiveResourceType)
  const showBboxLocation = supportsBboxLocation(effectiveResourceType)
  const showLinkedResources = supportsLinkedResources(effectiveResourceType)

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

      event.target.value = ''

    }

  }

  async function handleSpatialFilesChange(event) {

    const selectedFiles = Array.from(event.target.files || [])
    setSpatialFiles(selectedFiles)
    setShapefileNotice('')
    setGeojson(null)

    if (selectedFiles.length === 0) {
      return
    }

    if (!hasAnyShapefilePart(selectedFiles)) {
      setShapefileNotice('File terpilih tidak dikenali sebagai bagian shapefile (.shp/.shx/.dbf/.prj). Data tetap akan diunggah, tapi metadata tidak bisa ditarik otomatis.')
      return
    }

    try {

      const meta = await extractShapefileMetadata(selectedFiles)

      if (meta.bbox) {
        setBbox({
          minLon: String(meta.bbox.minLon),
          minLat: String(meta.bbox.minLat),
          maxLon: String(meta.bbox.maxLon),
          maxLat: String(meta.bbox.maxLat),
        })
      }

      if (meta.srid) {
        setSrid(meta.srid)
      }

      if (meta.geometryType) {
        setGeometryType(meta.geometryType)
      }

      if (meta.geojson) {
        setGeojson(meta.geojson)
      }

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

      let noticeText =
        filled.length > 0
          ? `Berhasil membaca ${meta.filesUsed.join(', ')}. Otomatis terisi: ${filled.join(', ')}.`
          : 'File shapefile terbaca, tapi tidak ada metadata yang berhasil ditarik. Isi manual di bawah.'

      if (meta.geojsonSkipped) {
        noticeText += ' File .shp berukuran besar — peta pratinjau interaktif dilewati, tapi bounding box tetap terisi.'
      }

      setShapefileNotice(noticeText)

    } catch (err) {

      console.error('Gagal membaca metadata shapefile:', err)
      setShapefileNotice('Gagal membaca sebagian file shapefile. Isi metadata secara manual di bawah.')

    }

  }

  async function handleSubmit(event) {

    event.preventDefault()

    if (!title.trim()) {
      setErrorMessage('Judul wajib diisi.')
      return
    }

    if (!abstract.trim()) {
      setErrorMessage('Deskripsi / Abstract wajib diisi.')
      return
    }

    const finalCategory =
      category === '__custom__' ? customCategory.trim() : category

    if (!finalCategory) {
      setErrorMessage('Kategori wajib diisi.')
      return
    }

    if (!keywords.trim()) {
      setErrorMessage('Keyword wajib diisi.')
      return
    }

    if (!thumbnailFile) {
      setErrorMessage('Gambar Sampul / Thumbnail wajib diisi.')
      return
    }

    if (externalUrlError) {
      setErrorMessage(externalUrlError)
      return
    }

    if (embedUrlError) {
      setErrorMessage(embedUrlError)
      return
    }

    if (showShapefileUpload) {
      const hasSpatial = spatialFiles.length > 0
      const hasEmbed = Boolean(embedUrl && embedUrl.trim())
      if (!hasSpatial && !hasEmbed) {
        setErrorMessage('Data Utama/Spasial wajib diisi: unggah File Shapefile ATAU isi Embed URL.')
        return
      }
    }

    if (showAgendaSchedule) {
      if (!eventDate || !eventTime.trim() || !eventLocation.trim()) {
        setErrorMessage('Tanggal Acara, Waktu, dan Tempat wajib diisi untuk Agenda.')
        return
      }
    }

    if (showMetadataPanel) {

      if (!region.trim()) {
        setErrorMessage('Wilayah / Region wajib diisi.')
        return
      }

      if (!language.trim()) {
        setErrorMessage('Bahasa wajib diisi.')
        return
      }

      if (!srid.trim()) {
        setErrorMessage('Sistem Koordinat / CRS wajib diisi.')
        return
      }

      if (!attribution.trim()) {
        setErrorMessage('Atribusi wajib diisi.')
        return
      }

      if (showBboxLocation) {
        if (!bbox.minLon || !bbox.minLat || !bbox.maxLon || !bbox.maxLat) {
          setErrorMessage('Bounding Box wajib diisi lengkap (4 kolom).')
          return
        }
      }

      if (showLinkedResources && !linkedResourcesText.trim()) {
        setErrorMessage('Linked Resources wajib diisi.')
        return
      }

    }

    if (showAttributeTable && attributes.filter((a) => a.name && a.name.trim()).length === 0) {
      setErrorMessage('Attributes wajib diisi, minimal 1 baris.')
      return
    }

    const combinedFiles = linkOnly ? [] : [...spatialFiles, ...assetFiles]

    setStatus('uploading')
    setErrorMessage('')

    try {

      const extraMetadata =
        buildExtraMetadata({
          resourceType: effectiveResourceType, subType, region, language, srid, attribution, purpose,
          supplementalInformation, constraintsOther, bbox, attributes,
          embedUrl,
          linkedResources: linkedResourcesText.split('\n'),
          eventDate, eventTime, eventLocation,
          geometryType, geojson,
        })

      await uploadMyDataset({
        files: combinedFiles,
        thumbnailFile,
        title,
        abstract,
        resourceType: effectiveResourceType,
        subType: effectiveResourceType === 'informasi' ? subType : undefined,
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
              <p>
                Unggah dataset, peta, dashboard, aplikasi, dokumen, atau informasi ke Geoportal Aceh.
                Field bertanda <span className="field-required-mark">*</span> wajib diisi.
              </p>
            </div>
          </header>

          {status === 'success' ? (

            <div className="admin-panel">
              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
                <strong>Data berhasil diunggah</strong>
                                <p>Data akan berstatus "Unpublished" hingga disetujui admin.</p>
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
                    <label>Jenis Resource <Req /></label>
                    <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} required>
                      {UPLOAD_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <small>Menentukan field apa saja yang perlu diisi di bawah, dan bagaimana data ini ditampilkan di halaman detail.</small>
                  </div>

                  {resourceType === 'dashboard' && (
                    <div className="admin-form-group">
                      <label>Sub-jenis <Req /></label>
                      <div style={{ display: 'inline-flex', border: '1px solid #d7e0e9', borderRadius: '10px', overflow: 'hidden' }}>

                        <button
                          type="button"
                          onClick={() => setDashboardKind('dashboard')}
                          style={{
                            padding: '10px 18px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 700,
                            background: dashboardKind === 'dashboard' ? '#0b5cab' : '#ffffff',
                            color: dashboardKind === 'dashboard' ? '#ffffff' : '#617384',
                          }}
                        >
                          ▥ Dashboard
                        </button>

                        <button
                          type="button"
                          onClick={() => setDashboardKind('application')}
                          style={{
                            padding: '10px 18px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 700,
                            background: dashboardKind === 'application' ? '#0b5cab' : '#ffffff',
                            color: dashboardKind === 'application' ? '#ffffff' : '#617384',
                          }}
                        >
                          ⌗ Aplikasi
                        </button>

                      </div>
                      <small>
                        {dashboardKind === 'application'
                          ? 'Aplikasi hanya bisa diisi lewat Link (tidak menerima file mentah) — cocok untuk aplikasi eksternal seperti WebGIS, PSIH3-WS, dsb.'
                          : 'Dashboard boleh diisi lewat file ATAU link, sama seperti Dataset/Peta.'}
                      </small>
                    </div>
                  )}

                  {resourceType === 'informasi' && (
                    <div className="admin-form-group">
                      <label>Jenis Informasi <Req /></label>
                      <select value={subType} onChange={(e) => setSubType(e.target.value)} required>
                        {INFORMASI_SUBTYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <small>Pemberitahuan &amp; Berita tampil sebagai artikel; Agenda tampil dengan jadwal kegiatan (tanggal/waktu/tempat) di bawah.</small>
                    </div>
                  )}

                  {showAgendaSchedule && (
                    <>
                      <div className="admin-form-group">
                        <label>Tanggal Acara <Req /></label>
                        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                        <small>Tanggal pelaksanaan kegiatan (boleh beda dari tanggal upload ini).</small>
                      </div>

                      <div className="admin-form-group">
                        <label>Waktu <Req /></label>
                        <input
                          type="text"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          placeholder="mis: 10:00 s/d 15:00 WIB"
                          required
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Tempat <Req /></label>
                        <input
                          type="text"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          placeholder="mis: Aula Diskominsa Provinsi Aceh"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="admin-form-group">
                    <label>Gambar Sampul / Thumbnail <Req /></label>
                    <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} required />
                    <small>Gambar ini yang akan tampil di bagian atas card, seperti data dari API lama. Format JPG/PNG, disarankan rasio 4:3 atau 16:9.</small>
                  </div>

                  {showShapefileUpload && (

                    <div
                      style={{
                        border: '1px dashed #cbd5e1', borderRadius: '10px',
                        padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
                      }}
                    >

                      <div>
                        <strong style={{ fontSize: '14px' }}>📍 Data Utama / Spasial <Req /></strong>
                        <p style={{ fontSize: '12.5px', opacity: 0.75, margin: '4px 0 0' }}>
                          Wajib isi SALAH SATU: unggah file Shapefile (kalau ada file mentahnya), ATAU isi Embed URL
                          (kalau sudah ada link tampilan peta/data interaktif dari sumber lain). Kalau dua-duanya
                          diisi, Embed URL yang akan diprioritaskan tampil di halaman detail.
                        </p>
                      </div>

                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label>File Shapefile — .shp, .shx, .dbf, .prj <Req /></label>
                        <input
                          type="file"
                          multiple
                          accept=".shp,.shx,.dbf,.prj"
                          onChange={handleSpatialFilesChange}
                        />
                        {spatialFiles.length > 0 && (
                          <small>{spatialFiles.length} file dipilih: {spatialFiles.map((f) => f.name).join(', ')}</small>
                        )}
                        <small style={{ display: 'block', marginTop: '4px' }}>
                          Unggah 4 file ini SEKALIGUS (pilih semua lewat satu dialog file, tahan Ctrl/Cmd untuk
                          memilih lebih dari satu). Sistem otomatis menarik Sistem Koordinat, Bounding Box, Tipe
                          Geometri, dan nama kolom Attributes dari sini, PLUS menampilkan peta pratinjau
                          geometrinya di bawah. File-file ini juga tetap bisa diunduh lewat tab <strong>Assets</strong> pada
                          halaman detail. (Boleh dikosongkan KALAU Embed URL di bawah sudah diisi.)
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

                      {showEmbedUrl && (
                        <div className="admin-form-group" style={{ margin: 0 }}>
                          <label>Embed URL — alternatif dari file Shapefile <Req /></label>
                          <input
                            type="url"
                            value={embedUrl}
                            onChange={(e) => setEmbedUrl(e.target.value)}
                            placeholder="https://sig.acehprov.go.id/maps/123/embed"
                            className={embedUrlError ? 'input-invalid' : ''}
                          />
                          {embedUrlError && <span className="field-error-text">{embedUrlError}</span>}
                          <small>
                            Kalau diisi, halaman detail akan menampilkan tampilan tertanam (iframe) dari URL ini
                            SEBAGAI GANTI peta interaktif hasil parsing file Shapefile di atas. Harus link lengkap
                            yang diawali <code>https://</code>. (Boleh dikosongkan KALAU File Shapefile di atas
                            sudah diisi.)
                          </small>
                        </div>
                      )}

                    </div>

                  )}

                  <div
                    style={{
                      border: '1px dashed #cbd5e1', borderRadius: '10px',
                      padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
                    }}
                  >

                    <div>
                      <strong style={{ fontSize: '14px' }}>
                        📎 {linkOnly ? 'Link Aplikasi' : 'File Assets Tambahan'}
                        {linkOnly ? <Req /> : <Opt />}
                      </strong>
                      <p style={{ fontSize: '12.5px', opacity: 0.75, margin: '4px 0 0' }}>
                        {linkOnly
                          ? 'Jenis "Aplikasi" hanya menerima Link — tidak ada upload file mentah untuk jenis ini.'
                          : 'Boleh isi file saja, link saja, keduanya sekaligus, atau dikosongkan semua.'}
                      </p>
                    </div>

                    {!linkOnly && (
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label>{showShapefileUpload ? 'File Assets Tambahan' : 'File'} <Opt /></label>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setAssetFiles(Array.from(e.target.files || []))}
                        />
                        {assetFiles.length > 0 && (
                          <small>{assetFiles.length} file dipilih: {assetFiles.map((f) => f.name).join(', ')}</small>
                        )}
                        {showShapefileUpload && (
                          <small style={{ display: 'block', marginTop: '4px' }}>
                            Untuk file pendukung lain (PDF laporan, gambar, dokumen resmi, dll) yang HANYA
                            perlu bisa diunduh di tab <strong>Assets</strong> — tidak diparsing sebagai metadata.
                          </small>
                        )}
                      </div>
                    )}

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>
                        Link / URL {linkOnly ? <Req /> : <Opt />}
                      </label>
                      <input
                        type="url"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder="https://contoh.acehprov.go.id"
                        required={linkOnly}
                        className={externalUrlError ? 'input-invalid' : ''}
                      />
                      {externalUrlError && <span className="field-error-text">{externalUrlError}</span>}
                      <small>Harus link lengkap yang diawali <code>https://</code> atau <code>http://</code>.</small>
                    </div>

                  </div>

                  <div className="admin-form-group">
                    <label>Judul <Req /></label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="mis: Peta Sebaran Fasilitas Kesehatan Provinsi Aceh"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Deskripsi / Abstract <Req /></label>
                    <textarea
                      rows={4}
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      placeholder="Ringkasan singkat: data ini berisi apa, sumbernya dari mana, dan untuk keperluan apa."
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Kategori <Req /></label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required>
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
                          placeholder="Ketik kategori baru, mis: Kebencanaan"
                          required
                        />
                        <small style={{ display: 'block', marginTop: '4px' }}>
                          Gunakan bahasa Indonesia untuk kategori baru ini.
                        </small>
                      </>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label>Keyword <Req /></label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="mis: kesehatan, puskesmas, fasilitas (pisahkan dengan koma)"
                      required
                    />
                    <small>Membantu pencarian data ini di halaman Katalog.</small>
                  </div>

                </div>

              </section>


              {showMetadataPanel && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <h2>Metadata {effectiveResourceType === 'map' ? 'Peta' : effectiveResourceType === 'document' ? 'Dokumen' : 'Dataset'}</h2>
                      <p>
                        Diisi agar tab Info &amp; Location di halaman detail bisa lengkap.
                        {showShapefileUpload && ' Sebagian sudah otomatis terisi dari file shapefile di atas — tinggal lengkapi sisanya.'}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div className="admin-form-group">
                      <label>Wilayah / Region <Req /></label>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="mis: Kabupaten Aceh Besar" required />
                    </div>

                    <div className="admin-form-group">
                      <label>Bahasa <Req /></label>
                      <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="mis: Indonesia" required />
                    </div>

                    <div className="admin-form-group">
                      <label>Sistem Koordinat / CRS <Req /></label>
                      <input type="text" value={srid} onChange={(e) => setSrid(e.target.value)} placeholder="EPSG:4326" required />
                      {showShapefileUpload && <small>Otomatis terisi dari file .prj bila diunggah di atas.</small>}
                    </div>

                    <div className="admin-form-group">
                      <label>Atribusi <Req /></label>
                      <input type="text" value={attribution} onChange={(e) => setAttribution(e.target.value)} placeholder="mis: Diskominsa Provinsi Aceh" required />
                    </div>

                    <div className="admin-form-group">
                      <label>Tujuan <Opt /></label>
                      <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Tujuan data ini dibuat/dikumpulkan." />
                    </div>

                    <div className="admin-form-group">
                      <label>Informasi Tambahan <Opt /></label>
                      <textarea rows={3} value={supplementalInformation} onChange={(e) => setSupplementalInformation(e.target.value)} placeholder="Catatan tambahan yang perlu diketahui pengguna data." />
                    </div>

                    <div className="admin-form-group">
                      <label>Batasan Penggunaan <Opt /></label>
                      <textarea rows={3} value={constraintsOther} onChange={(e) => setConstraintsOther(e.target.value)} placeholder="mis: Hanya untuk keperluan internal pemerintah." />
                    </div>

                    {showBboxLocation && (
                    <div className="admin-form-group">
                      <label>Bounding Box / WGS84 <Req /></label>
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
                              required
                            />
                          )
                                                })}
                      </div>
                      {showShapefileUpload && <small>Otomatis terisi dari file .shp bila diunggah di atas.</small>}
                    </div>
                    )}

                    {showLinkedResources && (
                      <div className="admin-form-group">
                        <label>Linked Resources <Req /></label>
                        <textarea
                          rows={4}
                          value={linkedResourcesText}
                          onChange={(e) => setLinkedResourcesText(e.target.value)}
                          placeholder={'Satu item per baris, contoh:\nPeta Fasilitas Perlengkapan Jalan\nRELKA_LN_25K\nHALTE_PT_25K'}
                          required
                        />
                        <small>Daftar layer/dataset terkait yang ditampilkan di tab "Linked Resources" halaman detail peta.</small>
                      </div>
                    )}

                  </div>

                </section>

              )}

              {showAttributeTable && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <h2>Attributes <Req /></h2>
                      <p>
                        Daftar kolom/atribut dataset — otomatis terisi dari file .dbf (nama & tipe kolom),
                        atau isi manual/lewat Excel. Wajib minimal 1 baris. Label & Description tetap perlu
                        dilengkapi manual.
                      </p>
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
                              <th>Name</th><th>Label</th><th>Description</th><th>Tipe</th><th></th>
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
                                  <span style={{ fontSize: '12px', opacity: 0.7 }}>{row.type || '-'}</span>
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