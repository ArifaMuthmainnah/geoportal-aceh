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

import GeoJsonPreviewMap from '../../components/GeoJsonPreviewMap'


// =====================================================
// SESI 10 (Poin 6): "Jenis Resource" di halaman Upload Data
// TIDAK LAGI memisahkan Dashboard & Aplikasi jadi 2 baris
// dropdown — sekarang digabung jadi SATU opsi "Aplikasi/
// Dashboard" (value 'dashboard' dipakai sebagai penanda
// grup). Pilihan sebenarnya (Dashboard atau Aplikasi)
// dipilih lewat toggle kecil yang muncul di bawah dropdown
// ini — persis seperti pola yang sudah dipakai di halaman
// "Create Dashboard/Aplikasi".
// =====================================================

const UPLOAD_TYPE_OPTIONS = [
  { value: 'dataset', label: 'Dataset' },
  { value: 'dashboard', label: 'Aplikasi/Dashboard' },
  { value: 'map', label: 'Peta' },
  { value: 'document', label: 'Dokumen' },
  { value: 'informasi', label: 'Informasi' },
]


function UploadDataset() {

  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [resourceType, setResourceType] = useState('dataset')

  // =====================================================
  // SESI 10 (Poin 6): dropdown "Jenis Resource" sekarang
  // menggabungkan Dashboard & Aplikasi jadi SATU opsi
  // "Aplikasi/Dashboard" (value tetap 'dashboard' sebagai
  // penanda grup). Sub-pilihannya (Dashboard atau Aplikasi
  // yang sebenarnya) disimpan terpisah di sini, lewat toggle
  // kecil yang muncul begitu grup ini dipilih. Isi form yang
  // lain TETAP SAMA PERSIS untuk keduanya — cuma resource_type
  // yang tersimpan yang berbeda (lihat effectiveResourceType
  // di bawah).
  // =====================================================

  const [dashboardKind, setDashboardKind] = useState('dashboard')

  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [keywords, setKeywords] = useState('')

  // SESI 6: file dipisah jadi 2 kelompok yang jelas —
  // - spatialFiles : shp/shx/dbf/prj -> dipakai untuk narik
  //   otomatis metadata + peta di tab Info/Location/Attributes.
  // - assetFiles   : file lain (PDF, gambar pendukung, dst) ->
  //   HANYA muncul di tab Assets untuk diunduh, tidak diparsing.
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

  // SESI 10 (Poin 6): "resourceType" cuma menyimpan pilihan
  // GRUP di dropdown ('dataset' | 'dashboard' | 'map' |
  // 'document' | 'informasi' — 'dashboard' dipakai sebagai
  // penanda grup "Aplikasi/Dashboard"). Jenis resource yang
  // SEBENARNYA disimpan ke server dihitung di sini.
  const effectiveResourceType =
    resourceType === 'dashboard' ? dashboardKind : resourceType


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


  // ===================================================
  // SESI 6: UPLOAD FILE SHAPEFILE (.shp/.shx/.dbf/.prj)
  // — tanpa refresh halaman, langsung parsing di browser
  // lalu isi otomatis: Sistem Koordinat, Bounding Box,
  // Tipe Geometri, daftar Attributes (nama kolom), DAN
  // peta pratinjau interaktif dari geometri aslinya.
  // Yang belum bisa dibaca dari file (Label/Description
  // atribut, Wilayah, dll) tetap harus diisi manual.
  // ===================================================

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

    const combinedFiles = [...spatialFiles, ...assetFiles]
    const hasFiles = combinedFiles.length > 0
    const hasLink = externalUrl.trim().length > 0

    // SESI 8 (FIX Poin 7): Embed URL sekarang juga dihitung sebagai
    // "sudah punya sumber data/tampilan", karena fungsinya memang
    // pengganti file (lihat catatan di bawah tombol Embed URL).
    // Jadi validasi wajib-pilih-salah-satu ini mencakup ketiganya:
    // file (shapefile/assets), Link/URL, ATAU Embed URL.
    const hasEmbed = supportsEmbedUrl(effectiveResourceType) && embedUrl.trim().length > 0

    if (!hasFiles && !hasLink && !hasEmbed) {
      setErrorMessage(
        supportsEmbedUrl(effectiveResourceType)
          ? 'Isi minimal salah satu: unggah file, isi Link/URL, atau isi Embed URL.'
          : 'Isi minimal salah satu: unggah file atau isi Link/URL.'
      )
      return
    }

    const finalCategory =
      category === '__custom__' ? customCategory.trim() : category

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


  const showAttributeTable = supportsAttributeTable(effectiveResourceType)
  const showAgendaSchedule = supportsAgendaSchedule(effectiveResourceType, subType)
  const showShapefileUpload = supportsShapefileUpload(effectiveResourceType)

  // SESI 8 (FIX Poin 4 & 5): Embed URL sekarang HANYA untuk
  // dataset & peta (lihat resourceFields.js) — fungsinya adalah
  // ALTERNATIF berbasis-link dari file shapefile: kalau tidak ada
  // file .shp untuk ditarik jadi peta interaktif, tapi sudah ada
  // link tampilan peta/data interaktif dari sumber lain, link itu
  // bisa ditempel di sini dan halaman detail akan menampilkannya
  // sebagai iframe (menggantikan peta interaktif dari file).
  const showEmbedUrl = supportsEmbedUrl(effectiveResourceType)


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
                Unggah dataset, dashboard, atau WebGIS. Kolom bertanda <strong>(Wajib)</strong> harus
                diisi, sisanya boleh dikosongkan.
              </p>
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
                      {UPLOAD_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* SESI 10 (Poin 6): toggle Dashboard/Aplikasi — cuma
                      menentukan resource_type yang tersimpan, field form
                      di bawah TETAP SAMA untuk keduanya. */}
                  {resourceType === 'dashboard' && (
                    <div className="admin-form-group">
                      <label>Sub-jenis</label>
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
                      <small style={{ display: 'block', marginTop: '8px' }}>
                        Isi form di bawah ini sama saja untuk Dashboard maupun Aplikasi — yang beda cuma
                        kategori jenis resource-nya saja.
                      </small>
                    </div>
                  )}

                  {resourceType === 'informasi' && (
                    <div className="admin-form-group">
                      <label>Jenis Informasi</label>
                      <select value={subType} onChange={(e) => setSubType(e.target.value)}>
                        {INFORMASI_SUBTYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* SESI 5 (lanjutan): jadwal khusus Agenda — diisi
                      sendiri oleh user, tampil di card Agenda nantinya. */}
                  {showAgendaSchedule && (
                    <>
                      <div className="admin-form-group">
                        <label>Tanggal Acara (Opsional)</label>
                        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                        <small>Tanggal pelaksanaan kegiatan (boleh beda dari tanggal upload ini).</small>
                      </div>

                      <div className="admin-form-group">
                        <label>Waktu (Opsional)</label>
                        <input
                          type="text"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          placeholder="mis: 10:00 s/d 15:00 WIB"
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Tempat (Opsional)</label>
                        <input
                          type="text"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          placeholder="mis: Aula Diskominsa Provinsi Aceh"
                        />
                      </div>
                    </>
                  )}

                  {/* #1: gambar sampul, muncul di card semua jenis resource */}
                  <div className="admin-form-group">
                    <label>Gambar Sampul / Thumbnail (Opsional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                    <small>Gambar ini yang akan tampil di bagian atas card, seperti data dari API lama.</small>
                  </div>

                  {/* =========================================================
                      SESI 8 (FIX Poin 4): GRUP "DATA UTAMA / SPASIAL" — HANYA
                      untuk Dataset & Peta. Isinya file Shapefile (upload FILE)
                      dan tepat di bawahnya Embed URL (upload LINK) — sengaja
                      digabung berdekatan karena keduanya cara mengisi hal yang
                      SAMA (tampilan peta/data utama di halaman detail), cuma
                      medianya beda: satu lewat file, satu lewat link. Cukup
                      isi salah satu; TIDAK perlu isi dua-duanya.
                  ========================================================= */}

                  {showShapefileUpload && (

                    <div
                      style={{
                        border: '1px dashed #cbd5e1', borderRadius: '10px',
                        padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
                      }}
                    >

                      <div>
                        <strong style={{ fontSize: '14px' }}>📍 Data Utama / Spasial (Opsional)</strong>
                        <p style={{ fontSize: '12.5px', opacity: 0.75, margin: '4px 0 0' }}>
                          Isi SALAH SATU: unggah file Shapefile (kalau ada file mentahnya), ATAU isi Embed URL
                          (kalau sudah ada link tampilan peta/data interaktif dari sumber lain). Kalau dua-duanya
                          diisi, Embed URL yang akan diprioritaskan tampil di halaman detail.
                        </p>
                      </div>

                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label>File Shapefile — .shp, .shx, .dbf, .prj</label>
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
                          Unggah 4 file ini SEKALIGUS (pilih semua lewat satu dialog file). Sistem otomatis
                          menarik Sistem Koordinat, Bounding Box, Tipe Geometri, dan nama kolom Attributes
                          dari sini, PLUS menampilkan peta pratinjau geometrinya di bawah. File-file ini juga
                          tetap bisa diunduh lewat tab <strong>Assets</strong> pada halaman detail.
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
                          <label>Embed URL — alternatif dari file Shapefile</label>
                          <input type="url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
                          <small>
                            Kalau diisi, halaman detail akan menampilkan tampilan tertanam (iframe) dari URL ini
                            SEBAGAI GANTI peta interaktif hasil parsing file Shapefile di atas.
                          </small>
                        </div>
                      )}

                    </div>

                  )}

                  {/* =========================================================
                      SESI 8 (FIX Poin 4 & 7): GRUP "FILE & LINK PENDUKUNG" —
                      berlaku untuk SEMUA jenis resource. File pendukung (upload
                      FILE) dan Link/URL (upload LINK) digabung dalam satu grup
                      karena fungsinya SAMA (sumber/lampiran data pendukung),
                      cuma medianya beda. WAJIB isi salah satu (boleh dua-duanya),
                      makanya TIDAK ditulis "(opsional)" di judul grup ini.
                  ========================================================= */}

                  <div
                    style={{
                      border: '1px dashed #cbd5e1', borderRadius: '10px',
                      padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
                    }}
                  >

                    <div>
                      <strong style={{ fontSize: '14px' }}>📎 File &amp; Link Pendukung (Wajib pilih salah satu)</strong>
                      <p style={{ fontSize: '12.5px', opacity: 0.75, margin: '4px 0 0' }}>
                        Isi minimal SALAH SATU dari dua kolom di bawah ini — boleh isi file saja, link saja,
                        atau keduanya sekaligus.
                        {showShapefileUpload && ' (Kalau kamu sudah isi Data Utama/Spasial di atas, grup ini boleh dikosongkan.)'}
                      </p>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>{showShapefileUpload ? 'File Assets Tambahan' : 'File'}</label>
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

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Link / URL</label>
                      <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
                    </div>

                  </div>

                  <div className="admin-form-group">
                    <label>Judul (Wajib)</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>

                  <div className="admin-form-group">
                    <label>Deskripsi / Abstract (Opsional)</label>
                    <textarea rows={4} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Kategori (Opsional)</label>
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
                    <label>Keyword (Opsional)</label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="pisahkan dengan koma"
                    />
                  </div>

                </div>

              </section>


              {supportsExtraMetadataForm(effectiveResourceType) && (

                <section className="admin-panel">

                  <div className="admin-panel-header">
                    <div>
                      <h2>Metadata {effectiveResourceType === 'map' ? 'Peta' : effectiveResourceType === 'document' ? 'Dokumen' : 'Dataset'} (Opsional)</h2>
                      <p>
                        Diisi agar tab Info &amp; Location di halaman detail bisa lengkap.
                        {showShapefileUpload && ' Sebagian sudah otomatis terisi dari file shapefile di atas — tinggal lengkapi sisanya.'}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div className="admin-form-group">
                      <label>Wilayah / Region (Opsional)</label>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="mis: Kabupaten Aceh Besar" />
                    </div>

                    <div className="admin-form-group">
                      <label>Bahasa (Opsional)</label>
                      <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Sistem Koordinat / CRS (Opsional)</label>
                      <input type="text" value={srid} onChange={(e) => setSrid(e.target.value)} placeholder="EPSG:4326" />
                      {showShapefileUpload && <small>Otomatis terisi dari file .prj bila diunggah di atas.</small>}
                    </div>

                    <div className="admin-form-group">
                      <label>Atribusi (Opsional)</label>
                      <input type="text" value={attribution} onChange={(e) => setAttribution(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Tujuan (Opsional)</label>
                      <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Informasi Tambahan (Opsional)</label>
                      <textarea rows={3} value={supplementalInformation} onChange={(e) => setSupplementalInformation(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Batasan Penggunaan (Opsional)</label>
                      <textarea rows={3} value={constraintsOther} onChange={(e) => setConstraintsOther(e.target.value)} />
                    </div>

                    {supportsBboxLocation(effectiveResourceType) && (
                    <div className="admin-form-group">
                      <label>Bounding Box / WGS84 (Opsional)</label>
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
                      {showShapefileUpload && <small>Otomatis terisi dari file .shp bila diunggah di atas.</small>}
                    </div>
                    )}

                    {supportsLinkedResources(effectiveResourceType) && (
                      <div className="admin-form-group">
                        <label>Linked Resources (Opsional)</label>
                        <textarea
                          rows={4}
                          value={linkedResourcesText}
                          onChange={(e) => setLinkedResourcesText(e.target.value)}
                          placeholder={'Satu item per baris, contoh:\nPeta Fasilitas Perlengkapan Jalan\nRELKA_LN_25K\nHALTE_PT_25K'}
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
                      <h2>Attributes (Opsional)</h2>
                      <p>
                        Daftar kolom/atribut dataset — otomatis terisi dari file .dbf (nama & tipe kolom),
                        atau isi manual/lewat Excel. Label & Description tetap perlu dilengkapi manual.
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