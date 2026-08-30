import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import {
  getMyDatasetDetail,
  updateMyDataset,
} from '../../api/myDatasetApi'

import { useAuth } from '../../context/AuthContext'

import {
  RESOURCE_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  DATASET_BBOX_FIELDS,
  supportsAttributeTable,
  buildExtraMetadata,
  parseExtraMetadata,
} from '../../utils/resourceFields'

import {
  downloadAttributeTemplate,
  parseAttributeExcel,
} from '../../utils/attributeExcel'


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
        setIsPublished(Boolean(dataset.is_published))

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
        setBbox({
          minLon: metadata.bbox?.minLon ?? '',
          minLat: metadata.bbox?.minLat ?? '',
          maxLon: metadata.bbox?.maxLon ?? '',
          maxLat: metadata.bbox?.maxLat ?? '',
        })
        setAttributes(Array.isArray(metadata.attributes) ? metadata.attributes : [])

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

      event.target.value = ''

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
          resourceType, region, language, srid, attribution, purpose,
          supplementalInformation, constraintsOther, bbox, attributes,
        })

      await updateMyDataset(id, {
        title,
        abstract,
        category: finalCategory,
        keywords,
        external_url: externalUrl || null,
        extra_metadata: extraMetadata,
      })

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

                <div className="admin-form-group">
                  <label>Link / URL (opsional)</label>
                  <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} disabled={isPublished} />
                </div>

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


            {resourceType === 'dataset' && (

              <section className="admin-panel">
                <div className="admin-panel-header"><h2>Metadata Dataset</h2></div>
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
                  </div>

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