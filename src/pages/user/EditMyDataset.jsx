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

import GeoJsonVertexEditor from '../../components/GeoJsonVertexEditor'


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

  // SESI 6: file saat ini (untuk ditampilkan), file BARU yang
  // dipilih user (kalau mau mengganti), dan geometri (GeoJSON)
  // hasil parsing shapefile yang bisa diedit titiknya langsung.
  const [currentFiles, setCurrentFiles] = useState([])
  const [newSpatialFiles, setNewSpatialFiles] = useState([])
  const [newAssetFiles, setNewAssetFiles] = useState([])
  const [geometryType, setGeometryType] = useState('')
  const [geojson, setGeojson] = useState(null)
  const [shapefileNotice, setShapefileNotice] = useState('')


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

        // SESI 5 (lanjutan): jadwal Agenda
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


  // ===================================================
  // SESI 6: PILIH FILE SHAPEFILE BARU (mengganti seluruh
  // geometri lama) — sama seperti di halaman Upload.
  // ===================================================

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

    setSaving(true)
    setError('')

    try {

      const finalCategory = category === '__custom__' ? customCategory.trim() : category

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

      if (hasNewFiles) {

        await updateMyDatasetWithFiles(id, {
          title, abstract, category: finalCategory, keywords,
          externalUrl: externalUrl || null, extraMetadata,
          subType: resourceType === 'informasi' ? subType : undefined,
          files: [...newSpatialFiles, ...newAssetFiles],
        })

      } else {

        const payload = {
          title,
          abstract,
          category: finalCategory,
          keywords,
          external_url: externalUrl || null,
          extra_metadata: extraMetadata,
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

  const showAgendaSchedule = supportsAgendaSchedule(resourceType, subType)
  const showShapefileUpload = supportsShapefileUpload(resourceType)


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
              <p>Perbarui informasi data sebelum dipublikasikan admin.</p>
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
                  <label>Jenis Resource</label>
                  <select value={resourceType} disabled>
                    {RESOURCE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <small>Jenis resource hanya bisa diubah oleh admin.</small>
                </div>

                {resourceType === 'informasi' && (
                  <div className="admin-form-group">
                    <label>Jenis Informasi</label>
                    <select value={subType} onChange={(e) => setSubType(e.target.value)} disabled={isPublished}>
                      {INFORMASI_SUBTYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* SESI 5 (lanjutan): jadwal khusus Agenda */}
                {showAgendaSchedule && (
                  <>
                    <div className="admin-form-group">
                      <label>Tanggal Acara</label>
                      <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} disabled={isPublished} />
                      <small>Tanggal pelaksanaan kegiatan (boleh beda dari tanggal upload).</small>
                    </div>

                    <div className="admin-form-group">
                      <label>Waktu</label>
                      <input
                        type="text"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        disabled={isPublished}
                        placeholder="mis: 10:00 s/d 15:00 WIB"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Tempat</label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        disabled={isPublished}
                        placeholder="mis: Aula Diskominsa Provinsi Aceh"
                      />
                    </div>
                  </>
                )}

                {/* =========================================================
                    SESI 6: FILE SAAT INI + UPLOAD ULANG
                ========================================================= */}

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

                {showShapefileUpload ? (

                  <>
                    <div className="admin-form-group">
                      <label>Ganti File Shapefile — .shp, .shx, .dbf, .prj (opsional)</label>
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

                    <div className="admin-form-group">
                      <label>Ganti File Assets Tambahan (opsional)</label>
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
                  </>

                ) : (

                  <div className="admin-form-group">
                    <label>Ganti File (opsional)</label>
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

                {/* SESI 6: EDIT TITIK LANGSUNG DI PETA — kalau ada
                    geometri (dari upload sebelumnya, atau file baru
                    yang baru dipilih di atas). */}
                {supportsBboxLocation(resourceType) && geojson && (
                  <div className="admin-form-group">
                    <label>Edit Titik di Peta (opsional)</label>
                    <GeoJsonVertexEditor geojson={geojson} onChange={setGeojson} />
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Link / URL (opsional)</label>
                  <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} disabled={isPublished} />
                </div>

                {supportsEmbedUrl(resourceType) && (
                  <div className="admin-form-group">
                    <label>Embed URL (opsional)</label>
                    <input type="url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} disabled={isPublished} placeholder="https://..." />
                    <small>Kalau diisi, halaman detail akan menampilkan tampilan tertanam (iframe) dari URL ini.</small>
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Judul</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPublished} required />
                </div>

                <div className="admin-form-group">
                  <label>Deskripsi / Abstract</label>
                  <textarea rows={4} value={abstract} onChange={(e) => setAbstract(e.target.value)} disabled={isPublished} />
                </div>

                <div className="admin-form-group">
                  <label>Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isPublished}>
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
                        placeholder="Ketik kategori baru"
                        disabled={isPublished}
                      />
                      <small style={{ display: 'block', marginTop: '4px' }}>
                        Gunakan bahasa Indonesia untuk kategori baru ini.
                      </small>
                    </>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Keyword</label>
                  <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} disabled={isPublished} />
                </div>

              </div>
            </section>


            {supportsExtraMetadataForm(resourceType) && (

              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Metadata {resourceType === 'map' ? 'Peta' : resourceType === 'document' ? 'Dokumen' : 'Dataset'}</h2>
                  </div>
                </div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div className="admin-form-group">
                    <label>Wilayah / Region</label>
                    <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} disabled={isPublished} />
                  </div>

                  <div className="admin-form-group">
                    <label>Bahasa</label>
                    <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isPublished} />
                  </div>

                  <div className="admin-form-group">
                    <label>Sistem Koordinat (CRS)</label>
                    <input type="text" value={srid} onChange={(e) => setSrid(e.target.value)} disabled={isPublished} />
                  </div>

                  <div className="admin-form-group">
                    <label>Atribusi</label>
                    <input type="text" value={attribution} onChange={(e) => setAttribution(e.target.value)} disabled={isPublished} />
                  </div>

                  <div className="admin-form-group">
                    <label>Tujuan</label>
                    <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} disabled={isPublished} />
                  </div>

                  <div className="admin-form-group">
                    <label>Informasi Tambahan</label>
                    <textarea rows={3} value={supplementalInformation} onChange={(e) => setSupplementalInformation(e.target.value)} disabled={isPublished} />
                  </div>

                  <div className="admin-form-group">
                    <label>Batasan Penggunaan</label>
                    <textarea rows={3} value={constraintsOther} onChange={(e) => setConstraintsOther(e.target.value)} disabled={isPublished} />
                  </div>

                  {supportsBboxLocation(resourceType) && (
                    <div className="admin-form-group">
                      <label>Bounding Box (WGS84)</label>
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
                            />
                          )
                        })}
                      </div>
                      <small>Ikut menyesuaikan otomatis kalau kamu geser titik di peta atau ganti file shapefile di atas.</small>
                    </div>
                  )}

                  {supportsLinkedResources(resourceType) && (
                    <div className="admin-form-group">
                      <label>Linked Resources (opsional)</label>
                      <textarea
                        rows={4}
                        value={linkedResourcesText}
                        onChange={(e) => setLinkedResourcesText(e.target.value)}
                        disabled={isPublished}
                        placeholder={'Satu item per baris'}
                      />
                    </div>
                  )}

                </div>

              </section>

            )}


            {supportsAttributeTable(resourceType) && (

              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Attributes</h2>
                    <p>Isi manual, atau unggah lewat Excel.</p>
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