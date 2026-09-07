import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { fetchExternalApiData } from '../../api/externalApi'
import { uploadMyDataset } from '../../api/myDatasetApi'
import { mapExternalApiResponse } from '../../utils/externalApiMapper'
import { useAuth } from '../../context/AuthContext'

import {
  RESOURCE_TYPE_OPTIONS,
  INFORMASI_SUBTYPE_OPTIONS,
  CATEGORY_OPTIONS,
  DATASET_BBOX_FIELDS,
  supportsBboxLocation,
  supportsExtraMetadataForm,
  buildExtraMetadata,
} from '../../utils/resourceFields'


function AmbilApi() {

  const navigate = useNavigate()
  const { currentUser, logout, isAdmin } = useAuth()

  const [step, setStep] = useState('input') // input -> review -> success

  const [resourceType, setResourceType] = useState('dataset')
  const [subType, setSubType] = useState('pemberitahuan')
  const [endpoint, setEndpoint] = useState('')

  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [keywords, setKeywords] = useState('')
  const [sourceLink, setSourceLink] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState('')

  const [region, setRegion] = useState('')
  const [language, setLanguage] = useState('')
  const [srid, setSrid] = useState('')
  const [attribution, setAttribution] = useState('')
  const [purpose, setPurpose] = useState('')
  const [supplementalInformation, setSupplementalInformation] = useState('')
  const [bbox, setBbox] = useState({ minLon: '', minLat: '', maxLon: '', maxLat: '' })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')


  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }


  async function handleFetch(event) {

    event.preventDefault()
    setFetchError('')

    if (!endpoint.trim()) {
      setFetchError('URL endpoint API wajib diisi.')
      return
    }

    setFetching(true)

    try {

      const json = await fetchExternalApiData(endpoint.trim())
      const mapped = mapExternalApiResponse(json)

      setTitle(mapped.title)
      setAbstract(mapped.abstract)

      const isKnownCategory = CATEGORY_OPTIONS.includes(mapped.category)
      setCategory(isKnownCategory ? mapped.category : (mapped.category ? '__custom__' : ''))
      setCustomCategory(isKnownCategory ? '' : mapped.category)

      setKeywords(mapped.keywords)
      setSrid(mapped.srid || 'EPSG:4326')
      setLanguage(mapped.language || 'Indonesia')
      setAttribution(mapped.attribution)
      setPurpose(mapped.purpose)
      setSupplementalInformation(mapped.supplementalInformation)

      if (mapped.bbox) {
        setBbox({
          minLon: String(mapped.bbox.minLon), minLat: String(mapped.bbox.minLat),
          maxLon: String(mapped.bbox.maxLon), maxLat: String(mapped.bbox.maxLat),
        })
      }

      setSourceLink(mapped.sourceLink || endpoint.trim())
      setThumbnailPreview(mapped.thumbnailUrl || '')

      setStep('review')

    } catch (err) {

      console.error('Gagal mengambil data dari API:', err)
      setFetchError(err.message || 'Gagal mengambil data dari endpoint tersebut.')

    } finally {

      setFetching(false)

    }

  }


  async function handleSubmit(event) {

    event.preventDefault()

    if (!title.trim()) {
      setSubmitError('Judul wajib diisi.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {

      const finalCategory = category === '__custom__' ? customCategory.trim() : category

      const extraMetadataString =
        buildExtraMetadata({
          resourceType, subType, region, language, srid, attribution, purpose,
          supplementalInformation, constraintsOther: '', bbox, attributes: [],
        })

      // SESI 6: catat sumber API-nya di extra_metadata untuk jejak asal data
      const metadataObj = extraMetadataString ? JSON.parse(extraMetadataString) : {}
      metadataObj.source_api = endpoint.trim()
      const finalExtraMetadata = JSON.stringify(metadataObj)

      await uploadMyDataset({
        files: [],
        title,
        abstract,
        resourceType,
        subType: resourceType === 'informasi' ? subType : undefined,
        category: finalCategory,
        keywords,
        externalUrl: sourceLink || endpoint.trim(),
        extraMetadata: finalExtraMetadata,
      })

      setStep('success')

    } catch (err) {

      console.error('Gagal menambahkan data dari API:', err)
      setSubmitError(err.message || 'Gagal menambahkan data.')

    } finally {

      setSubmitting(false)

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
            <div><strong>{currentUser?.username || 'Pengguna'}</strong><span>{isAdmin ? 'Administrator' : 'Operator'}</span></div>
          </div>

          <nav className="admin-sidebar-nav">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="admin-sidebar-link"><span>▦</span>Dashboard</Link>
            <Link to="/dashboard/datasets" className="admin-sidebar-link"><span>◈</span>Data Saya</Link>
            <Link to="/dashboard/upload" className="admin-sidebar-link"><span>⬆</span>Upload</Link>
            <button type="button" className="active"><span>⇩</span>Ambil dari API</button>
            <Link to="/dashboard/profil" className="admin-sidebar-link"><span>◍</span>Profil</Link>
            <Link to="/katalog" className="admin-sidebar-link"><span>◉</span>Lihat Katalog</Link>
          </nav>

          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>← Logout</button>

        </aside>


        <section className="admin-main">

          <header className="admin-header">
            <div>
              <span className="section-eyebrow">{isAdmin ? 'ADMINISTRATOR' : 'OPERATOR'}</span>
              <h1>Ambil Data dari API</h1>
              <p>Tambahkan data dengan menarik dari endpoint API web GIS/portal data lain.</p>
            </div>
          </header>

          {step === 'success' ? (

            <div className="admin-panel">
              <div className="admin-empty">
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
                <strong>Data berhasil ditambahkan</strong>
                <p>Data akan berstatus "Belum Publish" hingga disetujui admin — sama seperti data unggahan biasa.</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <Link to="/dashboard/datasets" className="admin-secondary-button">Lihat Data Saya</Link>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => {
                      setStep('input')
                      setEndpoint('')
                      setTitle(''); setAbstract(''); setCategory(''); setCustomCategory('')
                      setKeywords(''); setSourceLink(''); setThumbnailPreview('')
                    }}
                  >
                    Ambil Data Lain
                  </button>
                </div>
              </div>
            </div>

          ) : step === 'input' ? (

            <section className="admin-panel">

              <div className="admin-panel-header">
                <div>
                  <h2>Langkah 1 — Masukkan Endpoint</h2>
                  <p>Sistem akan mencoba menarik judul, deskripsi, kategori, dan info lokasi (kalau tersedia) dari endpoint ini.</p>
                </div>
              </div>

              <form onSubmit={handleFetch}>
                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {fetchError && <div className="admin-alert">{fetchError}</div>}

                  <div className="admin-form-group">
                    <label>Jenis Data</label>
                    <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                      {RESOURCE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
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

                  <div className="admin-form-group">
                    <label>Endpoint API</label>
                    <input
                      type="url"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="https://portal-lain.go.id/api/v2/datasets/123/"
                      required
                    />
                    <small>Endpoint harus mengembalikan respons berformat JSON.</small>
                  </div>

                  <div>
                    <button type="submit" className="admin-view-site" disabled={fetching}>
                      {fetching ? 'Mengambil...' : 'Ambil Data'}
                    </button>
                  </div>

                </div>
              </form>

            </section>

          ) : (

            <form onSubmit={handleSubmit}>

              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Langkah 2 — Periksa & Lengkapi</h2>
                    <p>Beberapa field terisi otomatis dari endpoint. Periksa dan lengkapi yang masih kosong sebelum menambahkan.</p>
                  </div>
                </div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {submitError && <div className="admin-alert">{submitError}</div>}

                  {thumbnailPreview && (
                    <div className="admin-form-group">
                      <label>Thumbnail Terdeteksi (tidak diunduh otomatis)</label>
                      <img src={thumbnailPreview} alt="Preview" style={{ maxWidth: '220px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                      <small>Gambar ini hanya pratinjau dari sumber asli — tidak disimpan ke server kita.</small>
                    </div>
                  )}

                  <div className="admin-form-group">
                    <label>Judul</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>

                  <div className="admin-form-group">
                    <label>Deskripsi / Abstract (opsional)</label>
                    <textarea rows={4} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Kategori (opsional)</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="">Pilih kategori</option>
                      {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="__custom__">Lainnya...</option>
                    </select>
                    {category === '__custom__' && (
                      <input
                        type="text"
                        style={{ marginTop: '8px' }}
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Ketik kategori baru"
                      />
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label>Keyword (opsional)</label>
                    <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                  </div>

                  <div className="admin-form-group">
                    <label>Link Sumber</label>
                    <input type="url" value={sourceLink} onChange={(e) => setSourceLink(e.target.value)} />
                    <small>Ditampilkan sebagai link "Sumber" di halaman detail nanti.</small>
                  </div>

                </div>

              </section>

              {supportsExtraMetadataForm(resourceType) && (

                <section className="admin-panel">

                  <div className="admin-panel-header"><div><h2>Metadata Tambahan</h2></div></div>

                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div className="admin-form-group">
                      <label>Wilayah / Region (opsional)</label>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Bahasa</label>
                      <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Sistem Koordinat (CRS)</label>
                      <input type="text" value={srid} onChange={(e) => setSrid(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Atribusi (opsional)</label>
                      <input type="text" value={attribution} onChange={(e) => setAttribution(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Tujuan (opsional)</label>
                      <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                    </div>

                    <div className="admin-form-group">
                      <label>Informasi Tambahan (opsional)</label>
                      <textarea rows={3} value={supplementalInformation} onChange={(e) => setSupplementalInformation(e.target.value)} />
                    </div>

                    {supportsBboxLocation(resourceType) && (
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
                                key={field.key} type="number" step="any" placeholder={field.label}
                                value={bbox[shortKey] || ''}
                                onChange={(e) => setBbox((c) => ({ ...c, [shortKey]: e.target.value }))}
                              />
                            )
                          })}
                        </div>
                        <small>Otomatis terisi kalau endpoint menyediakan info bounding box (mis. field "extent").</small>
                      </div>
                    )}

                  </div>

                </section>

              )}

              <div style={{ padding: '0 0 30px', display: 'flex', gap: '10px' }}>
                <button type="submit" className="admin-view-site" disabled={submitting}>
                  {submitting ? 'Menambahkan...' : 'Tambah Data'}
                </button>
                <button type="button" className="admin-secondary-button" onClick={() => setStep('input')}>
                  ← Kembali
                </button>
              </div>

            </form>

          )}

        </section>

      </div>

    </main>

  )

}

export default AmbilApi