import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import {
  getMyDatasetDetail,
  updateMyDataset,
  updateMyDatasetWithFiles,
} from '../../api/myDatasetApi'

import { useAuth } from '../../context/AuthContext'

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
  supportsAgendaSchedule,
  supportsShapefileUpload,
  requiresLinkOnly,
  buildExtraMetadata,
  parseExtraMetadata,
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
import GeoJsonVertexEditor from '../../components/GeoJsonVertexEditor'

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api'
const SERVER_BASE_URL = AUTH_API_URL.replace(/\/api\/?$/, '')

function buildAvatarUrl(path) {
  if (!path) return null
  return `${SERVER_BASE_URL}/uploads/${path}`
}

function parseCurrentFiles(dataset) {
  if (dataset?.files_json) {
    try {
      const parsed = JSON.parse(dataset.files_json)
      if (Array.isArray(parsed)) return parsed
    } catch {}
  }
  if (dataset?.file_path) {
    return [{ file_path: dataset.file_path, file_name: dataset.file_name }]
  }
  return []
}

function Req() {
  return <span className="field-required-mark">*</span>
}

function Opt() {
  return <span className="field-optional">(Opsional)</span>
}

function EditMyDataset() {

  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [resourceType, setResourceType] = useState('dataset')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [keywords, setKeywords] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [subType, setSubType] = useState('pemberitahuan')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [linkedResourcesText, setLinkedResourcesText] = useState('')
  const [region, setRegion] = useState('')
  const [language, setLanguage] = useState('')
  const [srid, setSrid] = useState('')
  const [attribution, setAttribution] = useState('')
  const [purpose, setPurpose] = useState('')
  const [supplementalInformation, setSupplementalInformation] = useState('')
  const [constraintsOther, setConstraintsOther] = useState('')
  const [bbox, setBbox] = useState({ minLon: '', minLat: '', maxLon: '', maxLat: '' })
  const [attributes, setAttributes] = useState([])
  const [attributeExcelError, setAttributeExcelError] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [currentFiles, setCurrentFiles] = useState([])
  const [newSpatialFiles, setNewSpatialFiles] = useState([])
  const [newAssetFiles, setNewAssetFiles] = useState([])
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [currentThumbnail, setCurrentThumbnail] = useState('')
  const [geometryType, setGeometryType] = useState('')
  const [geojson, setGeojson] = useState(null)
  const [shapefileNotice, setShapefileNotice] = useState('')
  const linkOnly = requiresLinkOnly(resourceType)
  const externalUrlError = urlErrorMessage(externalUrl, { required: linkOnly, label: 'Link/URL' })
  const embedUrlError = urlErrorMessage(embedUrl, { label: 'Embed URL' })
  const showAgendaSchedule = supportsAgendaSchedule(resourceType, subType)
  const showShapefileUpload = supportsShapefileUpload(resourceType)
  const showEmbedUrl = supportsEmbedUrl(resourceType)
  const showMetadataPanel = supportsExtraMetadataForm(resourceType)
  const showBboxLocation = supportsBboxLocation(resourceType)
  const showLinkedResources = supportsLinkedResources(resourceType)
  const showAttributeTable = supportsAttributeTable(resourceType)

  useEffect(() => {

    async function load() {

      try {

        const dataset = await getMyDatasetDetail(id)

        if (!dataset) {
          setNotFound(true)
          return
        }

        setTitle(dataset.title || '')
        setAbstract(dataset.abstract || '')
        setResourceType(dataset.resource_type || 'dataset')
        setKeywords(dataset.keywords || '')
        setExternalUrl(dataset.external_url || '')
        setSubType(dataset.sub_type || 'pemberitahuan')
        setIsPublished(Boolean(dataset.is_published))
        setCurrentFiles(parseCurrentFiles(dataset))
        setCurrentThumbnail(dataset.thumbnail_path || '')

        const isKnown = CATEGORY_OPTIONS.includes(dataset.category)
        setCategory(isKnown ? dataset.category : (dataset.category ? '__custom__' : ''))
        setCustomCategory(isKnown ? '' : (dataset.category || ''))

        const metadata = parseExtraMetadata(dataset.extra_metadata)
        setRegion(metadata.region || '')
        setLanguage(metadata.language || '')
        setSrid(metadata.srid || '')
        setAttribution(metadata.attribution || '')
        setPurpose(metadata.purpose || '')
        setSupplementalInformation(metadata.supplemental_information || '')
        setConstraintsOther(metadata.constraints_other || '')
        setEmbedUrl(metadata.embed_url || '')
        setLinkedResourcesText(
          Array.isArray(metadata.linked_resources) ? metadata.linked_resources.join('\n') : ''
        )
        setBbox({
          minLon: metadata.bbox?.minLon ?? '',
          minLat: metadata.bbox?.minLat ?? '',
          maxLon: metadata.bbox?.maxLon ?? '',
          maxLat: metadata.bbox?.maxLat ?? '',
        })
        setAttributes(Array.isArray(metadata.attributes) ? metadata.attributes : [])
        setGeometryType(metadata.geometry_type || '')
        setGeojson(metadata.geojson || null)
        setEventDate(metadata.event_date || '')
        setEventTime(metadata.event_time || '')
        setEventLocation(metadata.event_location || '')

      } catch (err) {

        console.error('Gagal memuat data untuk diedit:', err)
        setNotFound(true)

      } finally {

        setLoading(false)

      }

    }

    load()

  }, [id])


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
    setNewSpatialFiles(selectedFiles)
    setShapefileNotice('')

    if (selectedFiles.length === 0) {
      return
    }

    if (!hasAnyShapefilePart(selectedFiles)) {
      setShapefileNotice('File terpilih tidak dikenali sebagai bagian shapefile (.shp/.shx/.dbf/.prj).')
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

      if (meta.srid) setSrid(meta.srid)
      if (meta.geometryType) setGeometryType(meta.geometryType)
      if (meta.geojson) setGeojson(meta.geojson)
      if (meta.attributes.length > 0) {
        setAttributes(meta.attributes)
      }

      setShapefileNotice(
        `File baru berhasil dibaca (${meta.filesUsed.join(', ')}). Geometri, bounding box, dan attributes di bawah SUDAH DIGANTI dengan data dari file baru ini — akan tersimpan permanen setelah kamu klik "Simpan Perubahan".`
      )

    } catch (err) {

      console.error('Gagal membaca metadata shapefile:', err)
      setShapefileNotice('Gagal membaca sebagian file shapefile baru.')

    }

  }

  async function handleSubmit(event) {

    event.preventDefault()

    if (isPublished) {
      window.alert('Data sudah dipublikasikan, tidak dapat diedit lagi.')
      return
    }

    if (!title.trim()) {
      setError('Judul wajib diisi.')
      return
    }

    if (!abstract.trim()) {
      setError('Deskripsi / Abstract wajib diisi.')
      return
    }

    const finalCategory = category === '__custom__' ? customCategory.trim() : category

    if (!finalCategory) {
      setError('Kategori wajib diisi.')
      return
    }

    if (!keywords.trim()) {
      setError('Keyword wajib diisi.')
      return
    }

    if (!thumbnailFile && !currentThumbnail) {
      setError('Gambar Sampul / Thumbnail wajib diisi.')
      return
    }

    if (externalUrlError) {
      setError(externalUrlError)
      return
    }

    if (embedUrlError) {
      setError(embedUrlError)
      return
    }

    if (showShapefileUpload) {
      const hasExisting = currentFiles.length > 0
      const hasNewSpatial = newSpatialFiles.length > 0
      const hasEmbed = Boolean(embedUrl && embedUrl.trim())
      if (!hasExisting && !hasNewSpatial && !hasEmbed) {
        setError('Data Utama/Spasial wajib diisi: unggah File Shapefile ATAU isi Embed URL.')
        return
      }
    }

    if (showAgendaSchedule) {
      if (!eventDate || !eventTime.trim() || !eventLocation.trim()) {
        setError('Tanggal Acara, Waktu, dan Tempat wajib diisi untuk Agenda.')
        return
      }
    }

    if (showMetadataPanel) {

      if (!region.trim()) { setError('Wilayah / Region wajib diisi.'); return }
      if (!language.trim()) { setError('Bahasa wajib diisi.'); return }
      if (!srid.trim()) { setError('Sistem Koordinat / CRS wajib diisi.'); return }
      if (!attribution.trim()) { setError('Atribusi wajib diisi.'); return }

      if (showBboxLocation && (!bbox.minLon || !bbox.minLat || !bbox.maxLon || !bbox.maxLat)) {
        setError('Bounding Box wajib diisi lengkap (4 kolom).')
        return
      }

      if (showLinkedResources && !linkedResourcesText.trim()) {
        setError('Linked Resources wajib diisi.')
        return
      }

    }

    if (showAttributeTable && attributes.filter((a) => a.name && a.name.trim()).length === 0) {
      setError('Attributes wajib diisi, minimal 1 baris.')
      return
    }

    setSaving(true)
    setError('')

    try {

      const extraMetadata =
        buildExtraMetadata({
          resourceType, subType, region, language, srid, attribution, purpose,
          supplementalInformation, constraintsOther, bbox, attributes,
          embedUrl,
          linkedResources: linkedResourcesText.split('\n'),
          eventDate, eventTime, eventLocation,
          geometryType, geojson,
        })

      const hasNewFiles = newSpatialFiles.length > 0 || newAssetFiles.length > 0
      const hasNewThumbnail = Boolean(thumbnailFile)

      if (hasNewFiles || hasNewThumbnail) {

        await updateMyDatasetWithFiles(id, {
          title, abstract, category: finalCategory, keywords,
          externalUrl: externalUrl || null, extraMetadata,
          subType: resourceType === 'informasi' ? subType : undefined,
          resourceType,
          files: [...newSpatialFiles, ...newAssetFiles],
          thumbnailFile,
        })

      } else {

        const payload = {
          title,
          abstract,
          category: finalCategory,
          keywords,
          external_url: externalUrl || null,
          extra_metadata: extraMetadata,
          resource_type: resourceType,
        }

        if (resourceType === 'informasi') {
          payload.sub_type = subType
        }

        await updateMyDataset(id, payload)

      }

      window.alert('Data berhasil diperbarui.')
      navigate('/dashboard/datasets')

    } catch (err) {

      console.error('Gagal memperbarui data:', err)
      setError(err.message || 'Gagal memperbarui data.')

    } finally {

      setSaving(false)

    }

  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading" style={{ padding: '40px' }}>Memuat data...</div>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="admin-page">
        <div className="admin-empty" style={{ padding: '40px' }}>
          <strong>Data tidak ditemukan</strong>
          <Link to="/dashboard/datasets" className="admin-secondary-button" style={{ marginTop: '12px', display: 'inline-block' }}>
            Kembali ke Data Saya
          </Link>
        </div>
      </main>
    )
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
            <div><strong>{currentUser?.username || 'Operator'}</strong><span>Operator</span></div>
          </div>
          <nav className="admin-sidebar-nav">
            <Link to="/dashboard" className="admin-sidebar-link"><span>▦</span>Dashboard</Link>
            <Link to="/dashboard/datasets" className="admin-sidebar-link"><span>◈</span>Data Saya</Link>
            <Link to="/dashboard/ambil-api" className="admin-sidebar-link"><span>⇩</span>Ambil dari API</Link>
            <Link to="/dashboard/profil" className="admin-sidebar-link"><span>◍</span>Profil</Link>
            <Link to="/dashboard/upload" className="admin-sidebar-link"><span>⬆</span>Upload</Link>
            <Link to="/katalog" className="admin-sidebar-link"><span>◉</span>Lihat Katalog</Link>
          </nav>
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>← Logout</button>
        </aside>


        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">OPERATOR</span>
              <h1>Edit Data</h1>
              <p>
                Perbarui informasi data sebelum dipublikasikan admin. Field bertanda
                <span className="field-required-mark">*</span> wajib diisi.
              </p>
            </div>
          </header>

          {isPublished && (
            <div className="admin-alert">
              Data ini sudah dipublikasikan admin dan tidak dapat diedit lagi.
            </div>
          )}

          {error && <div className="admin-alert">{error}</div>}

          <form onSubmit={handleSubmit}>

            <section className="admin-panel">
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div className="admin-form-group">
                  <label>Jenis Resource <Req /></label>
                  <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} disabled={isPublished} required>
                    {RESOURCE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <small>
                    {isPublished
                      ? 'Data sudah dipublikasikan, Jenis Resource tidak bisa diubah lagi. Hubungi admin bila perlu diubah.'
                      : 'Jenis Resource bisa diubah selama data belum dipublikasikan. Mengubah jenis ini akan mengubah field apa saja yang tampil di bawah.'}
                  </small>
                </div>

                {resourceType === 'informasi' && (
                  <div className="admin-form-group">
                    <label>Jenis Informasi <Req /></label>
                    <select value={subType} onChange={(e) => setSubType(e.target.value)} disabled={isPublished} required>
                      {INFORMASI_SUBTYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {showAgendaSchedule && (
                  <>
                    <div className="admin-form-group">
                      <label>Tanggal Acara <Req /></label>
                      <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} disabled={isPublished} required />
                      <small>Tanggal pelaksanaan kegiatan (boleh beda dari tanggal upload).</small>
                    </div>

                    <div className="admin-form-group">
                      <label>Waktu <Req /></label>
                      <input
                        type="text"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        disabled={isPublished}
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
                        disabled={isPublished}
                        placeholder="mis: Aula Diskominsa Provinsi Aceh"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="admin-form-group">
                  <label>Gambar Sampul / Thumbnail <Req /></label>
                  {currentThumbnail && !thumbnailFile && (
                    <div style={{ marginBottom: '8px' }}>
                      <img
                        src={buildAvatarUrl(currentThumbnail)}
                        alt="Thumbnail saat ini"
                        style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} disabled={isPublished} />
                  <small>Kosongkan kalau tidak ingin mengganti gambar sampul yang sudah ada.</small>
                </div>

                <div className="admin-form-group">
                  <label>File Saat Ini</label>
                  {currentFiles.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px' }}>
                      {currentFiles.map((f, index) => (
                        <li key={index}>{f.file_name || f.file_path}</li>
                      ))}
                    </ul>
                  ) : (
                    <small>Belum ada file yang diunggah untuk data ini.</small>
                  )}
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
                        Kosongkan kalau tidak ingin mengganti file/embed URL yang sudah ada — data lama tetap
                        dipakai. Wajib ada SALAH SATU (file lama/baru, ATAU Embed URL).
                      </p>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Ganti File Shapefile — .shp, .shx, .dbf, .prj <Opt /></label>
                      <input
                        type="file"
                        multiple
                        accept=".shp,.shx,.dbf,.prj"
                        onChange={handleSpatialFilesChange}
                        disabled={isPublished}
                      />
                      <small>
                        Kosongkan kalau tidak ingin mengganti file spasial. Kalau diisi, file &amp; geometri LAMA
                        akan diganti seluruhnya oleh file baru ini.
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
                    </div>

                    {showEmbedUrl && (
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label>Embed URL <Req /></label>
                        {embedUrl && (
                          <div className="field-current-value">
                            Link saat ini: <a href={embedUrl} target="_blank" rel="noreferrer">{embedUrl}</a>
                          </div>
                        )}
                        <input
                          type="url"
                          value={embedUrl}
                          onChange={(e) => setEmbedUrl(e.target.value)}
                          disabled={isPublished}
                          placeholder="https://sig.acehprov.go.id/maps/123/embed"
                          className={embedUrlError ? 'input-invalid' : ''}
                        />
                        {embedUrlError && <span className="field-error-text">{embedUrlError}</span>}
                        <small>Kalau diisi, halaman detail akan menampilkan tampilan tertanam (iframe) dari URL ini.</small>
                      </div>
                    )}

                    {showBboxLocation && geojson && (
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label>Edit Titik di Peta <Opt /></label>
                        <GeoJsonVertexEditor geojson={geojson} onChange={setGeojson} />
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
                        : 'Boleh isi file saja, link saja, keduanya sekaligus, atau dikosongkan semua kalau tidak ingin mengganti apapun.'}
                    </p>
                  </div>

                  {!linkOnly && (
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>{showShapefileUpload ? 'Ganti File Assets Tambahan' : 'Ganti File'} <Opt /></label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setNewAssetFiles(Array.from(e.target.files || []))}
                        disabled={isPublished}
                      />
                      {newAssetFiles.length > 0 && (
                        <small>{newAssetFiles.length} file baru dipilih: {newAssetFiles.map((f) => f.name).join(', ')}</small>
                      )}
                    </div>
                  )}

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>
                      Link / URL {linkOnly ? <Req /> : <Opt />}
                    </label>
                    {externalUrl && (
                      <div className="field-current-value">
                        Link saat ini: <a href={externalUrl} target="_blank" rel="noreferrer">{externalUrl}</a>
                      </div>
                    )}
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      disabled={isPublished}
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
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPublished} required />
                </div>

                <div className="admin-form-group">
                  <label>Deskripsi / Abstract <Req /></label>
                  <textarea
                    rows={4}
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    disabled={isPublished}
                    placeholder="Ringkasan singkat: data ini berisi apa, sumbernya dari mana, dan untuk keperluan apa."
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Kategori <Req /></label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isPublished} required>
                    <option value="">Pilih kategori</option>
                    {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
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
                        disabled={isPublished}
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
                    disabled={isPublished}
                    placeholder="mis: kesehatan, puskesmas, fasilitas (pisahkan dengan koma)"
                    required
                  />
                </div>

              </div>
            </section>

            {showMetadataPanel && (

              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Metadata {resourceType === 'map' ? 'Peta' : resourceType === 'document' ? 'Dokumen' : 'Dataset'}</h2>
                  </div>
                </div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div className="admin-form-group">
                    <label>Wilayah / Region <Req /></label>
                    <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} disabled={isPublished} placeholder="mis: Kabupaten Aceh Besar" required />
                  </div>

                  <div className="admin-form-group">
                    <label>Bahasa <Req /></label>
                    <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isPublished} placeholder="mis: Indonesia" required />
                  </div>

                  <div className="admin-form-group">
                    <label>Sistem Koordinat (CRS) <Req /></label>
                    <input type="text" value={srid} onChange={(e) => setSrid(e.target.value)} disabled={isPublished} placeholder="EPSG:4326" required />
                  </div>

                  <div className="admin-form-group">
                    <label>Atribusi <Req /></label>
                    <input type="text" value={attribution} onChange={(e) => setAttribution(e.target.value)} disabled={isPublished} placeholder="mis: Diskominsa Provinsi Aceh" required />
                  </div>

                  <div className="admin-form-group">
                    <label>Tujuan <Opt /></label>
                    <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} disabled={isPublished} placeholder="Tujuan data ini dibuat/dikumpulkan." />
                  </div>

                  <div className="admin-form-group">
                    <label>Informasi Tambahan <Opt /></label>
                    <textarea rows={3} value={supplementalInformation} onChange={(e) => setSupplementalInformation(e.target.value)} disabled={isPublished} placeholder="Catatan tambahan yang perlu diketahui pengguna data." />
                  </div>

                  <div className="admin-form-group">
                    <label>Batasan Penggunaan <Opt /></label>
                    <textarea rows={3} value={constraintsOther} onChange={(e) => setConstraintsOther(e.target.value)} disabled={isPublished} placeholder="mis: Hanya untuk keperluan internal pemerintah." />
                  </div>

                  {showBboxLocation && (
                    <div className="admin-form-group">
                      <label>Bounding Box (WGS84) <Req /></label>
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
                              disabled={isPublished}
                              onChange={(e) => setBbox((current) => ({ ...current, [shortKey]: e.target.value }))}
                              required
                            />
                          )
                        })}
                      </div>
                      <small>Ikut menyesuaikan otomatis kalau kamu geser titik di peta atau ganti file shapefile di atas.</small>
                    </div>
                  )}

                  {showLinkedResources && (
                    <div className="admin-form-group">
                      <label>Linked Resources <Req /></label>
                      <textarea
                        rows={4}
                        value={linkedResourcesText}
                        onChange={(e) => setLinkedResourcesText(e.target.value)}
                        disabled={isPublished}
                        placeholder={'Satu item per baris'}
                        required
                      />
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
                    <p>Isi manual, atau unggah lewat Excel. Wajib minimal 1 baris.</p>
                  </div>

                  {!isPublished && (

                    <div className="admin-panel-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                      <button type="button" className="admin-secondary-button" onClick={downloadAttributeTemplate}>
                        ⬇ Unduh Template Excel
                      </button>

                      <label className="admin-secondary-button" style={{ cursor: 'pointer', margin: 0 }}>
                        ⬆ Upload Excel
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          style={{ display: 'none' }}
                          onChange={handleAttributeExcelUpload}
                        />
                      </label>

                      <button type="button" className="admin-secondary-button" onClick={addAttributeRow}>
                        + Tambah Baris Manual
                      </button>

                    </div>

                  )}

                </div>

                <div style={{ padding: '0 22px 20px' }}>

                  {attributeExcelError && (
                    <div className="admin-alert" style={{ marginBottom: '12px' }}>
                      {attributeExcelError}
                    </div>
                  )}

                  {attributes.length === 0 ? (

                    <div className="admin-empty"><p>Belum ada atribut ditambahkan.</p></div>

                  ) : (

                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead><tr><th>Name</th><th>Label</th><th>Description</th><th></th></tr></thead>
                        <tbody>
                          {attributes.map((row, index) => (
                            <tr key={index}>
                              <td><input type="text" value={row.name} disabled={isPublished} onChange={(e) => updateAttributeRow(index, 'name', e.target.value)} /></td>
                              <td><input type="text" value={row.label} disabled={isPublished} onChange={(e) => updateAttributeRow(index, 'label', e.target.value)} /></td>
                              <td><input type="text" value={row.description} disabled={isPublished} onChange={(e) => updateAttributeRow(index, 'description', e.target.value)} /></td>
                              <td>
                                {!isPublished && (
                                  <button type="button" className="admin-action-delete" onClick={() => removeAttributeRow(index)}>Hapus</button>
                                )}
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

            {!isPublished && (
              <div style={{ padding: '0 0 30px', display: 'flex', gap: '10px' }}>
                <button type="submit" className="admin-view-site" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <Link to="/dashboard/datasets" className="admin-secondary-button">Batal</Link>
              </div>
            )}

          </form>

        </section>

      </div>

    </main>

  ) 

}

export default EditMyDataset