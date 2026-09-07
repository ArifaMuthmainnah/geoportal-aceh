import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import {
  getAdminDatasetDetail,
  updateMyDataset,
  updateMyDatasetWithFiles,
} from '../../api/myDatasetApi'

import {
  getAdminDatasetsRaw,
  updateDataset,
} from '../../api/datasetApi'

import {
  getAdminGeoappsRaw,
  updateGeoapp,
} from '../../api/geoappApi'

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


// =========================================================
// SESI 8 (Poin 6): halaman PENUH untuk mengedit data dari
// Dashboard Admin — menggantikan modal/pop-up lama, dibuat
// mirip halaman "Edit Data" di Data Saya (EditMyDataset.jsx).
//
// Dipakai untuk 3 sumber data (dibedakan lewat parameter URL
// :source di /admin/edit/:source/:id):
// - "local"       -> data upload-an operator/admin sendiri,
//                    form LENGKAP (sama seperti Data Saya, TAPI
//                    admin boleh edit walau sudah published,
//                    boleh ganti Jenis Resource, dan boleh ganti
//                    Status Publikasi langsung dari sini).
// - "api-dataset" -> dataset dari API Geoportal Aceh lama, cuma
//                    "override" tampilan (Judul/Abstract/Kategori),
//                    TIDAK mengubah data asli di server lama.
// - "api-geoapp"  -> sama seperti api-dataset, untuk data
//                    Dashboard/Aplikasi dari API lama.
// =========================================================

function EditDatasetAdmin() {

  const { source, id } = useParams()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const isLocal = source === 'local'
  const isApiDataset = source === 'api-dataset'
  const isApiGeoapp = source === 'api-geoapp'

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ---- FORM DATA LOKAL (upload-an sendiri) — lengkap ----
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

  // #6: admin boleh ubah status publikasi langsung dari halaman edit
  const [isPublished, setIsPublished] = useState(false)

  const [currentFiles, setCurrentFiles] = useState([])
  const [newSpatialFiles, setNewSpatialFiles] = useState([])
  const [newAssetFiles, setNewAssetFiles] = useState([])
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [currentThumbnail, setCurrentThumbnail] = useState('')
  const [geometryType, setGeometryType] = useState('')
  const [geojson, setGeojson] = useState(null)
  const [shapefileNotice, setShapefileNotice] = useState('')

  // ---- FORM DATA API LAMA (api-dataset / api-geoapp) — ringkas ----
  const [simpleTitle, setSimpleTitle] = useState('')
  const [simpleAbstract, setSimpleAbstract] = useState('')
  const [simpleCategory, setSimpleCategory] = useState('')
  const [simpleTypeLabel, setSimpleTypeLabel] = useState('')


  useEffect(() => {

    async function load() {

      setLoading(true)
      setNotFound(false)
      setError('')

      try {

        if (isLocal) {

          const dataset = await getAdminDatasetDetail(id)

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

        } else if (isApiDataset) {

          const list = await getAdminDatasetsRaw()
          const item = Array.isArray(list) ? list.find((d) => String(d.pk) === String(id)) : null

          if (!item) {
            setNotFound(true)
            return
          }

          setSimpleTitle(item.title || '')
          setSimpleAbstract(item.abstract || item.description || '')
          setSimpleCategory(item.category?.identifier || '')
          setSimpleTypeLabel('Dataset (API Geoportal Aceh lama)')

        } else if (isApiGeoapp) {

          const list = await getAdminGeoappsRaw()
          const item = Array.isArray(list) ? list.find((d) => String(d.pk) === String(id)) : null

          if (!item) {
            setNotFound(true)
            return
          }

          setSimpleTitle(item.title || '')
          setSimpleAbstract(item.abstract || item.description || '')
          setSimpleCategory(item.category?.identifier || '')
          setSimpleTypeLabel('Dashboard (API Geoportal Aceh lama)')

        } else {

          setNotFound(true)

        }

      } catch (err) {

        console.error('Gagal memuat data untuk diedit:', err)
        setNotFound(true)

      } finally {

        setLoading(false)

      }

    }

    load()

  }, [source, id, isLocal, isApiDataset, isApiGeoapp])


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

      console.error('Gagal membaca metadata shapefile baru:', err)
      setShapefileNotice('Gagal membaca sebagian file shapefile baru.')

    }

  }


  async function handleSubmit(event) {

    event.preventDefault()

    setSaving(true)
    setError('')

    try {

      if (isApiDataset) {

        await updateDataset(id, {
          title: simpleTitle,
          abstract: simpleAbstract,
          category: simpleCategory,
        })

      } else if (isApiGeoapp) {

        await updateGeoapp(id, {
          title: simpleTitle,
          abstract: simpleAbstract,
          category: simpleCategory,
        })

      } else {

        if (!title.trim()) {
          setError('Judul wajib diisi.')
          setSaving(false)
          return
        }

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
        const hasNewThumbnail = Boolean(thumbnailFile)

        if (hasNewFiles || hasNewThumbnail) {

          await updateMyDatasetWithFiles(id, {
            title, abstract, category: finalCategory, keywords,
            externalUrl: externalUrl || null, extraMetadata,
            subType: resourceType === 'informasi' ? subType : undefined,
            files: [...newSpatialFiles, ...newAssetFiles],
            thumbnailFile,
            resourceType,
            isPublished,
          })

        } else {

          const payload = {
            title,
            abstract,
            category: finalCategory,
            keywords,
            resource_type: resourceType,
            external_url: externalUrl || null,
            extra_metadata: extraMetadata,
            is_published: isPublished,
          }

          if (resourceType === 'informasi') {
            payload.sub_type = subType
          }

          await updateMyDataset(id, payload)

        }

      }

      window.alert('Data berhasil diperbarui.')
      navigate('/admin')

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
          <Link to="/admin" className="admin-secondary-button" style={{ marginTop: '12px', display: 'inline-block' }}>
            Kembali ke Dashboard Admin
          </Link>
        </div>
      </main>
    )
  }

  const showAgendaSchedule = isLocal && supportsAgendaSchedule(resourceType, subType)
  const showShapefileUpload = isLocal && supportsShapefileUpload(resourceType)
  const showEmbedUrl = isLocal && supportsEmbedUrl(resourceType)
  const showAttributeTable = isLocal && supportsAttributeTable(resourceType)


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
                (currentUser?.username || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <strong>{currentUser?.username || 'Administrator'}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <nav className="admin-sidebar-nav">
            <Link to="/admin" className="admin-sidebar-link"><span>▦</span>Dashboard</Link>
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
              <span className="section-eyebrow">ADMINISTRATOR</span>
              <h1>Edit Data</h1>
              <p>
                {isLocal
                  ? 'Perbarui data upload-an ini. Sebagai admin, kamu bisa mengedit walau data sudah dipublikasikan.'
                  : 'Perbarui tampilan data ini di web kita. Data asli di Geoportal Aceh (API lama) tidak ikut berubah.'}
              </p>
            </div>
          </header>

          {error && <div className="admin-alert">{error}</div>}

          <form onSubmit={handleSubmit}>

            <section className="admin-panel">
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {!isLocal && (
                  <div className="admin-form-group">
                    <label>Sumber Data</label>
                    <input type="text" value={simpleTypeLabel} disabled />
                  </div>
                )}

                {isLocal && (
                  <>
                    <div className="admin-form-group">
                      <label>Jenis Resource</label>
                      <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                        {RESOURCE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                        <option value="webgis">WebGIS (data lama)</option>
                      </select>
                      <small>Sebagai admin, kamu boleh mengubah jenis resource data ini.</small>
                    </div>

                    <div className="admin-form-group">
                      <label>Status Publikasi</label>
                      <select value={isPublished ? 'published' : 'unpublished'} onChange={(e) => setIsPublished(e.target.value === 'published')}>
                        <option value="unpublished">Belum Publish</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

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

                    {showAgendaSchedule && (
                      <>
                        <div className="admin-form-group">
                          <label>Tanggal Acara (Opsional)</label>
                          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
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

                    <div className="admin-form-group">
                      <label>Gambar Sampul / Thumbnail (Opsional)</label>
                      {currentThumbnail && !thumbnailFile && (
                        <div style={{ marginBottom: '8px' }}>
                          <img
                            src={buildAvatarUrl(currentThumbnail)}
                            alt="Thumbnail saat ini"
                            style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                      <small>Kosongkan kalau tidak ingin mengganti gambar sampul.</small>
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

                    {showShapefileUpload ? (

                      <>
                        <div className="admin-form-group">
                          <label>Ganti File Shapefile — .shp, .shx, .dbf, .prj (Opsional)</label>
                          <input
                            type="file"
                            multiple
                            accept=".shp,.shx,.dbf,.prj"
                            onChange={handleSpatialFilesChange}
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
                          <label>Ganti File Assets Tambahan (Opsional)</label>
                          <input
                            type="file"
                            multiple
                            onChange={(e) => setNewAssetFiles(Array.from(e.target.files || []))}
                          />
                          {newAssetFiles.length > 0 && (
                            <small>{newAssetFiles.length} file baru dipilih: {newAssetFiles.map((f) => f.name).join(', ')}</small>
                          )}
                        </div>
                      </>

                    ) : (

                      <div className="admin-form-group">
                        <label>Ganti File (Opsional)</label>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setNewAssetFiles(Array.from(e.target.files || []))}
                        />
                        {newAssetFiles.length > 0 && (
                          <small>{newAssetFiles.length} file baru dipilih: {newAssetFiles.map((f) => f.name).join(', ')}</small>
                        )}
                      </div>

                    )}

                    {supportsBboxLocation(resourceType) && geojson && (
                      <div className="admin-form-group">
                        <label>Edit Titik di Peta (Opsional)</label>
                        <GeoJsonVertexEditor geojson={geojson} onChange={setGeojson} />
                      </div>
                    )}

                    <div className="admin-form-group">
                      <label>Link / URL (Opsional)</label>
                      <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
                    </div>

                    {showEmbedUrl && (
                      <div className="admin-form-group">
                        <label>Embed URL — alternatif dari file Shapefile (Opsional)</label>
                        <input type="url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
                        <small>Kalau diisi, halaman detail akan menampilkan tampilan tertanam (iframe) dari URL ini.</small>
                      </div>
                    )}
                  </>
                )}

                <div className="admin-form-group">
                  <label>Judul {isLocal ? '(Wajib)' : ''}</label>
                  <input
                    type="text"
                    value={isLocal ? title : simpleTitle}
                    onChange={(e) => (isLocal ? setTitle(e.target.value) : setSimpleTitle(e.target.value))}
                    required={isLocal}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Deskripsi / Abstract (Opsional)</label>
                  <textarea
                    rows={4}
                    value={isLocal ? abstract : simpleAbstract}
                    onChange={(e) => (isLocal ? setAbstract(e.target.value) : setSimpleAbstract(e.target.value))}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Kategori (Opsional)</label>

                  {isLocal ? (
                    <>
                      <select value={category} onChange={(e) => setCategory(e.target.value)}>
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
                          />
                          <small style={{ display: 'block', marginTop: '4px' }}>
                            Gunakan bahasa Indonesia untuk kategori baru ini.
                          </small>
                        </>
                      )}
                    </>
                  ) : (
                    <input type="text" value={simpleCategory} onChange={(e) => setSimpleCategory(e.target.value)} />
                  )}
                </div>

                {isLocal && (
                  <div className="admin-form-group">
                    <label>Keyword (Opsional)</label>
                    <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="pisahkan dengan koma" />
                  </div>
                )}

              </div>
            </section>


            {isLocal && supportsExtraMetadataForm(resourceType) && (

              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Metadata {resourceType === 'map' ? 'Peta' : resourceType === 'document' ? 'Dokumen' : 'Dataset'} (Opsional)</h2>
                  </div>
                </div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div className="admin-form-group">
                    <label>Wilayah / Region (Opsional)</label>
                    <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Bahasa (Opsional)</label>
                    <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Sistem Koordinat / CRS (Opsional)</label>
                    <input type="text" value={srid} onChange={(e) => setSrid(e.target.value)} />
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

                  {supportsBboxLocation(resourceType) && (
                    <div className="admin-form-group">
                      <label>Bounding Box / WGS84 (Opsional)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {DATASET_BBOX_FIELDS.map((field) => {
                          const shortKey =
                            field.key.replace('bbox_min_lon', 'minLon').replace('bbox_min_lat', 'minLat').replace('bbox_max_lon', 'maxLon').replace('bbox_max_lat', 'maxLat')
                          return (
                            <input
                              key={field.key} type="number" step="any" placeholder={field.label}
                              value={bbox[shortKey] || ''}
                              onChange={(e) => setBbox((current) => ({ ...current, [shortKey]: e.target.value }))}
                            />
                          )
                        })}
                      </div>
                      <small>Ikut menyesuaikan otomatis kalau kamu ganti file shapefile di atas.</small>
                    </div>
                  )}

                  {supportsLinkedResources(resourceType) && (
                    <div className="admin-form-group">
                      <label>Linked Resources (Opsional)</label>
                      <textarea
                        rows={4}
                        value={linkedResourcesText}
                        onChange={(e) => setLinkedResourcesText(e.target.value)}
                        placeholder={'Satu item per baris'}
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
                    <h2>Attributes (Opsional)</h2>
                    <p>Isi manual, atau unggah lewat Excel.</p>
                  </div>

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
                              <td><input type="text" value={row.name} onChange={(e) => updateAttributeRow(index, 'name', e.target.value)} /></td>
                              <td><input type="text" value={row.label} onChange={(e) => updateAttributeRow(index, 'label', e.target.value)} /></td>
                              <td><input type="text" value={row.description} onChange={(e) => updateAttributeRow(index, 'description', e.target.value)} /></td>
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


            {!isLocal && (
              <p style={{ fontSize: '13px', opacity: 0.75, padding: '0 4px' }}>
                Perubahan ini hanya berlaku di tampilan web kita. Data asli di Geoportal Aceh tidak ikut berubah.
              </p>
            )}

            <div style={{ padding: '0 0 30px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="admin-view-site" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <Link to="/admin" className="admin-secondary-button">Batal</Link>
            </div>

          </form>

        </section>

      </div>

    </main>

  )

}


export default EditDatasetAdmin