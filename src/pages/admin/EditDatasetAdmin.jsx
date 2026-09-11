import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import {
  getAdminDatasetDetail,
  updateMyDataset,
  updateMyDatasetWithFiles,
} from '../../api/myDatasetApi'

import {
  getAdminDatasetsRaw,
  getAdminDatasetDetailRaw,
  getDatasetAttributes,
  updateDataset,
} from '../../api/datasetApi'

import {
  getAdminGeoappsRaw,
  getAdminGeoappDetailRaw,
  updateGeoapp,
} from '../../api/geoappApi'

import {
  getAdminMapDetailRaw,
  updateMap,
} from '../../api/mapApi'

import {
  getAdminDocumentDetailRaw,
  updateDocument,
} from '../../api/documentApi'

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
import AttributeDataTable from '../../components/AttributeDataTable'

import {
  getDatasetFeatures,
  getAttributeDataOverride,
  saveAttributeDataOverride,
  saveOwnAttributeRows,
  featuresToRows,
  rowsToFeatures,
  mergeAttributeOverride,
  buildAttributeOverride,
} from '../../api/attributeDataApi'

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

function extractRawBbox(extent) {
  const coords = extent?.coords
  if (!Array.isArray(coords) || coords.length < 4) return null
  const [minLon, minLat, maxLon, maxLat] = coords
  return { minLon, minLat, maxLon, maxLat }
}

function joinRegions(regions) {
  if (!Array.isArray(regions) || regions.length === 0) return ''
  return regions
    .map((region) => (typeof region === 'string' ? region : region?.name || region?.code || ''))
    .filter(Boolean)
    .join(', ')
}

function joinKeywords(keywords) {
  if (!keywords) return ''
  if (typeof keywords === 'string') return keywords
  if (Array.isArray(keywords)) {
    return keywords
      .map((kw) => (typeof kw === 'string' ? kw : kw?.name || ''))
      .filter(Boolean)
      .join(', ')
  }
  return ''
}

function Req() {
  return <span className="field-required-mark">*</span>
}

function Opt() {
  return <span className="field-optional">(Opsional)</span>
}

function EditDatasetAdmin() {

  const { source, id } = useParams()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const isLocal = source === 'local'
  const isApiDataset = source === 'api-dataset'
  const isApiGeoapp = source === 'api-geoapp'
  const isApiMap = source === 'api-map'
  const isApiDocument = source === 'api-document'
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
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [currentFiles, setCurrentFiles] = useState([])
  const [newSpatialFiles, setNewSpatialFiles] = useState([])
  const [newAssetFiles, setNewAssetFiles] = useState([])
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [currentThumbnail, setCurrentThumbnail] = useState('')
  const [geometryType, setGeometryType] = useState('')
  const [geojson, setGeojson] = useState(null)
  const [shapefileNotice, setShapefileNotice] = useState('')
  const [attrRawFeatures, setAttrRawFeatures] = useState(null)
  const [attrOverrideRaw, setAttrOverrideRaw] = useState(null)
  const [attrSaving, setAttrSaving] = useState(false)
  const [simpleTypeLabel, setSimpleTypeLabel] = useState('')
  const effectiveResourceType = isLocal
    ? resourceType
    : (isApiDataset ? 'dataset' : isApiMap ? 'map' : isApiDocument ? 'document' : 'dashboard')

  const linkOnly = isLocal && requiresLinkOnly(resourceType)
  const externalUrlError = urlErrorMessage(externalUrl, { required: linkOnly, label: 'Link/URL' })
  const embedUrlError = urlErrorMessage(embedUrl, { label: 'Embed URL' })

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

          const item = await getAdminDatasetDetailRaw(id)

          if (!item) {
            setNotFound(true)
            return
          }

          setResourceType('dataset')
          setSimpleTypeLabel('Dataset (API Geoportal Aceh lama)')
          setTitle(item.title || '')
          setAbstract(item.abstract || item.description || '')
          setKeywords(joinKeywords(item.keywords))

          const rawCategory = item.category?.identifier || ''
          const isKnown = CATEGORY_OPTIONS.includes(rawCategory)
          setCategory(isKnown ? rawCategory : (rawCategory ? '__custom__' : ''))
          setCustomCategory(isKnown ? '' : rawCategory)

          const overrideMeta = parseExtraMetadata(item._override_extra_metadata)
          const rawBbox = extractRawBbox(item.extent)

          const rowAttributeId =
            item.alternate || item.typename || item.type_name || item.uuid || id

          try {

            const [rawFeatures, overrideRaw] = await Promise.all([
              getDatasetFeatures(rowAttributeId).catch(() => ({ type: 'FeatureCollection', features: [] })),
              getAttributeDataOverride('dataset', id).catch(() => null),
            ])

            setAttrRawFeatures(rawFeatures)
            setAttrOverrideRaw(overrideRaw)

          } catch (rowErr) {
            console.error('Gagal mengambil isi atribut dari GeoServer:', rowErr)
          }

          setRegion(overrideMeta.region || joinRegions(item.regions) || '')
          setLanguage(overrideMeta.language || item.language || '')
          setSrid(overrideMeta.srid || item.srid || '')
          setAttribution(overrideMeta.attribution || item.attribution || '')
          setPurpose(overrideMeta.purpose || item.purpose || '')
          setSupplementalInformation(overrideMeta.supplemental_information || item.supplemental_information || '')
          setConstraintsOther(overrideMeta.constraints_other || item.constraints_other || '')
          setEmbedUrl(overrideMeta.embed_url || '')
          setBbox({
            minLon: overrideMeta.bbox?.minLon ?? rawBbox?.minLon ?? '',
            minLat: overrideMeta.bbox?.minLat ?? rawBbox?.minLat ?? '',
            maxLon: overrideMeta.bbox?.maxLon ?? rawBbox?.maxLon ?? '',
            maxLat: overrideMeta.bbox?.maxLat ?? rawBbox?.maxLat ?? '',
          })

          if (Array.isArray(overrideMeta.attributes) && overrideMeta.attributes.length > 0) {
            setAttributes(overrideMeta.attributes)
          } else {

            setAttributesLoading(true)

            const attributeId =
              item.alternate || item.typename || item.type_name || item.uuid || id

            try {
              const liveAttributes = await getDatasetAttributes(attributeId)
              setAttributes(
                Array.isArray(liveAttributes)
                  ? liveAttributes.map((a) => ({
                      name: a.name || '',
                      label: a.label && a.label !== 'N/A' ? a.label : '',
                      description: a.description && a.description !== 'N/A' ? a.description : '',
                    }))
                  : []
              )
            } catch (attrErr) {
              console.error('Gagal mengambil attributes dari GeoServer:', attrErr)
              setAttributes([])
            } finally {
              setAttributesLoading(false)
            }

          }

        } else if (isApiGeoapp) {

          const item = await getAdminGeoappDetailRaw(id)

          if (!item) {
            setNotFound(true)
            return
          }

          setResourceType('dashboard')
          setSimpleTypeLabel('Dashboard (API Geoportal Aceh lama)')
          setTitle(item.title || '')
          setAbstract(item.abstract || item.description || '')
          setKeywords(joinKeywords(item.keywords))
          const rawCategory = item.category?.identifier || ''
          const isKnown = CATEGORY_OPTIONS.includes(rawCategory)
          setCategory(isKnown ? rawCategory : (rawCategory ? '__custom__' : ''))
          setCustomCategory(isKnown ? '' : rawCategory)

        } else if (isApiMap) {

          const item = await getAdminMapDetailRaw(id)

          if (!item) {
            setNotFound(true)
            return
          }

          setResourceType('map')
          setSimpleTypeLabel('Peta (API Geoportal Aceh lama)')
          setTitle(item.title || '')
          setAbstract(item.abstract || item.description || '')
          setKeywords(joinKeywords(item.keywords))
          const rawCategory = item.category?.identifier || ''
          const isKnown = CATEGORY_OPTIONS.includes(rawCategory)
          setCategory(isKnown ? rawCategory : (rawCategory ? '__custom__' : ''))
          setCustomCategory(isKnown ? '' : rawCategory)
          const overrideMeta = parseExtraMetadata(item._override_extra_metadata)
          const rawBbox = extractRawBbox(item.extent)
          setRegion(overrideMeta.region || joinRegions(item.regions) || '')
          setLanguage(overrideMeta.language || item.language || '')
          setSrid(overrideMeta.srid || item.srid || '')
          setAttribution(overrideMeta.attribution || item.attribution || '')
          setPurpose(overrideMeta.purpose || item.purpose || '')
          setSupplementalInformation(overrideMeta.supplemental_information || item.supplemental_information || '')
          setConstraintsOther(overrideMeta.constraints_other || item.constraints_other || '')
          setEmbedUrl(overrideMeta.embed_url || '')
          setLinkedResourcesText(
            Array.isArray(overrideMeta.linked_resources) ? overrideMeta.linked_resources.join('\n') : ''
          )
          setBbox({
            minLon: overrideMeta.bbox?.minLon ?? rawBbox?.minLon ?? '',
            minLat: overrideMeta.bbox?.minLat ?? rawBbox?.minLat ?? '',
            maxLon: overrideMeta.bbox?.maxLon ?? rawBbox?.maxLon ?? '',
            maxLat: overrideMeta.bbox?.maxLat ?? rawBbox?.maxLat ?? '',
          })

        } else if (isApiDocument) {

          const item = await getAdminDocumentDetailRaw(id)

          if (!item) {
            setNotFound(true)
            return
          }

          setResourceType('document')
          setSimpleTypeLabel('Dokumen (API Geoportal Aceh lama)')
          setTitle(item.title || '')
          setAbstract(item.abstract || item.description || '')
          setKeywords(joinKeywords(item.keywords))
          const rawCategory = item.category?.identifier || ''
          const isKnown = CATEGORY_OPTIONS.includes(rawCategory)
          setCategory(isKnown ? rawCategory : (rawCategory ? '__custom__' : ''))
          setCustomCategory(isKnown ? '' : rawCategory)
          const overrideMeta = parseExtraMetadata(item._override_extra_metadata)
          setRegion(overrideMeta.region || joinRegions(item.regions) || '')
          setLanguage(overrideMeta.language || item.language || '')
          setSrid(overrideMeta.srid || item.srid || '')
          setAttribution(overrideMeta.attribution || item.attribution || '')
          setPurpose(overrideMeta.purpose || item.purpose || '')
          setSupplementalInformation(overrideMeta.supplemental_information || item.supplemental_information || '')
          setConstraintsOther(overrideMeta.constraints_other || item.constraints_other || '')

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

  }, [source, id, isLocal, isApiDataset, isApiGeoapp, isApiMap, isApiDocument])


  function addAttributeRow() {
    setAttributes((current) => [...current, { name: '', label: '', description: '' }])
  }

  function updateAttributeRow(index, field, value) {
    setAttributes((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

    function removeAttributeRow(index) {
    setAttributes((current) => current.filter((_, i) => i !== index))
  }

    const attributeRows = useMemo(() => {
    return isLocal
      ? featuresToRows(geojson || { type: 'FeatureCollection', features: [] })
      : (attrRawFeatures ? mergeAttributeOverride(attrRawFeatures, attrOverrideRaw) : [])
  }, [isLocal, geojson, attrRawFeatures, attrOverrideRaw])

  async function handleSaveAttributeRows(nextRows) {

    setAttrSaving(true)

    try {

      if (isLocal) {

        await saveOwnAttributeRows(id, nextRows)

        setGeojson({
          type: 'FeatureCollection',
          features: rowsToFeatures(nextRows),
        })

      } else if (isApiDataset) {

        const overrideData = buildAttributeOverride(attrRawFeatures, nextRows)

        await saveAttributeDataOverride('dataset', id, overrideData)

        setAttrOverrideRaw(JSON.stringify(overrideData))

      }

    } finally {

      setAttrSaving(false)

    }

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

    if (externalUrlError) {
      setError(externalUrlError)
      return
    }

    if (embedUrlError) {
      setError(embedUrlError)
      return
    }

    if (isLocal) {

      if (!thumbnailFile && !currentThumbnail) {
        setError('Gambar Sampul / Thumbnail wajib diisi.')
        return
      }

      if (supportsShapefileUpload(resourceType)) {
        const hasExisting = currentFiles.length > 0
        const hasNewSpatial = newSpatialFiles.length > 0
        const hasEmbed = Boolean(embedUrl && embedUrl.trim())
        if (!hasExisting && !hasNewSpatial && !hasEmbed) {
          setError('Data Utama/Spasial wajib diisi: unggah File Shapefile ATAU isi Embed URL.')
          return
        }
      }

      if (supportsAgendaSchedule(resourceType, subType)) {
        if (!eventDate || !eventTime.trim() || !eventLocation.trim()) {
          setError('Tanggal Acara, Waktu, dan Tempat wajib diisi untuk Agenda.')
          return
        }
      }

    }

    if (supportsExtraMetadataForm(effectiveResourceType)) {

      if (!region.trim()) { setError('Wilayah / Region wajib diisi.'); return }
      if (!language.trim()) { setError('Bahasa wajib diisi.'); return }
      if (!srid.trim()) { setError('Sistem Koordinat / CRS wajib diisi.'); return }
      if (!attribution.trim()) { setError('Atribusi wajib diisi.'); return }

      if (supportsBboxLocation(effectiveResourceType) && (!bbox.minLon || !bbox.minLat || !bbox.maxLon || !bbox.maxLat)) {
        setError('Bounding Box wajib diisi lengkap (4 kolom).')
        return
      }

      if (supportsLinkedResources(effectiveResourceType) && !linkedResourcesText.trim()) {
        setError('Linked Resources wajib diisi.')
        return
      }

    }

    if (supportsAttributeTable(effectiveResourceType) && attributes.filter((a) => a.name && a.name.trim()).length === 0) {
      setError('Attributes wajib diisi, minimal 1 baris.')
      return
    }

    setSaving(true)
    setError('')

    try {

            if (isApiDataset || isApiGeoapp || isApiMap || isApiDocument) {

        const extraMetadata =
          supportsExtraMetadataForm(effectiveResourceType)
            ? buildExtraMetadata({
                resourceType: effectiveResourceType,
                region, language, srid, attribution, purpose,
                supplementalInformation, constraintsOther, bbox, attributes,
                embedUrl,
                linkedResources: linkedResourcesText.split('\n'),
              })
            : null

        const overridePayload = {
          title: title.trim(),
          abstract,
          category: finalCategory,
          keywords,
          extraMetadata,
        }

        if (isApiDataset) {
          await updateDataset(id, overridePayload)
        } else if (isApiGeoapp) {
          await updateGeoapp(id, overridePayload)
        } else if (isApiMap) {
          await updateMap(id, overridePayload)
        } else {
          await updateDocument(id, overridePayload)
        }

      } else {

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
  const showEmbedUrl = supportsEmbedUrl(effectiveResourceType)
  const showAttributeTable = supportsAttributeTable(effectiveResourceType)
  const showMetadataPanel = supportsExtraMetadataForm(effectiveResourceType)
  const showBboxLocation = supportsBboxLocation(effectiveResourceType)
  const showLinkedResources = supportsLinkedResources(effectiveResourceType)

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
                {' '}Field bertanda <span className="field-required-mark">*</span> wajib diisi.
              </p>
            </div>
          </header>

          {error && <div className="admin-alert">{error}</div>}

          {!isLocal && (
            <div className="admin-alert" style={{ background: 'var(--admin-success-bg)', color: 'var(--admin-success)' }}>
              Field di bawah sudah otomatis terisi dari data asli di Geoportal Aceh lama. Ubah kalau perlu, lalu simpan.
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <section className="admin-panel">
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {!isLocal && (
                  <div className="admin-form-group">
                    <label>Sumber Data</label>
                    <input type="text" value={simpleTypeLabel} disabled />
                    <small>Jenis resource ini mengikuti data aslinya di Geoportal Aceh lama, tidak bisa diubah.</small>
                  </div>
                )}

                {isLocal && (
                  <>
                    <div className="admin-form-group">
                      <label>Jenis Resource <Req /></label>
                      <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} required>
                        {RESOURCE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                        <option value="webgis">WebGIS (data lama)</option>
                      </select>
                      <small>Sebagai admin, kamu boleh mengubah jenis resource data ini. Mengubah jenis ini akan mengubah field apa saja yang tampil di bawah.</small>
                    </div>

                    <div className="admin-form-group">
                      <label>Status Publikasi <Req /></label>
                      <select value={isPublished ? 'published' : 'unpublished'} onChange={(e) => setIsPublished(e.target.value === 'published')} required>
                                                <option value="unpublished">Unpublished</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    {resourceType === 'informasi' && (
                      <div className="admin-form-group">
                        <label>Jenis Informasi <Req /></label>
                        <select value={subType} onChange={(e) => setSubType(e.target.value)} required>
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
                          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
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
                          placeholder="https://contoh.acehprov.go.id"
                          required={linkOnly}
                          className={externalUrlError ? 'input-invalid' : ''}
                        />
                        {externalUrlError && <span className="field-error-text">{externalUrlError}</span>}
                        <small>Harus link lengkap yang diawali <code>https://</code> atau <code>http://</code>.</small>
                      </div>

                    </div>
                  </>
                )}

                {showEmbedUrl && (
                  <div className="admin-form-group">
                    <label>
                      Embed URL — {isLocal ? 'alternatif dari file Shapefile ' : ''}<Req />
                    </label>
                    {embedUrl && (
                      <div className="field-current-value">
                        Link saat ini: <a href={embedUrl} target="_blank" rel="noreferrer">{embedUrl}</a>
                      </div>
                    )}
                    <input
                      type="url"
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      placeholder="https://sig.acehprov.go.id/maps/123/embed"
                      className={embedUrlError ? 'input-invalid' : ''}
                    />
                    {embedUrlError && <span className="field-error-text">{embedUrlError}</span>}
                    <small>Kalau diisi, halaman detail akan menampilkan tampilan tertanam (iframe) dari URL ini.</small>
                  </div>
                )}

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
                </div>

              </div>
            </section>


            {showMetadataPanel && (

              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Metadata {effectiveResourceType === 'map' ? 'Peta' : effectiveResourceType === 'document' ? 'Dokumen' : 'Dataset'}</h2>
                    {!isLocal && (
                      <p>Sudah terisi otomatis dari data asli di Geoportal Aceh lama. Perubahan di sini HANYA tersimpan di web kita.</p>
                    )}
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
                            field.key.replace('bbox_min_lon', 'minLon').replace('bbox_min_lat', 'minLat').replace('bbox_max_lon', 'maxLon').replace('bbox_max_lat', 'maxLat')
                          return (
                            <input
                              key={field.key} type="number" step="any" placeholder={field.label}
                              value={bbox[shortKey] || ''}
                              onChange={(e) => setBbox((current) => ({ ...current, [shortKey]: e.target.value }))}
                              required
                            />
                          )
                        })}
                      </div>
                      <small>
                        {isLocal
                          ? 'Ikut menyesuaikan otomatis kalau kamu ganti file shapefile di atas.'
                          : 'Terisi otomatis dari data asli. Bisa diubah kalau perlu.'}
                      </small>
                    </div>
                  )}

                  {showLinkedResources && (
                    <div className="admin-form-group">
                      <label>Linked Resources <Req /></label>
                      <textarea
                        rows={4}
                        value={linkedResourcesText}
                        onChange={(e) => setLinkedResourcesText(e.target.value)}
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
                    <p>
                      {attributesLoading
                        ? 'Sedang mengambil attributes dari GeoServer…'
                        : 'Sudah otomatis ditarik dari GeoServer (kalau tersedia). Isi manual atau unggah lewat Excel untuk melengkapi Label/Description. Wajib minimal 1 baris.'}
                    </p>
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

                  {attributesLoading ? (

                    <div className="admin-loading">Memuat attributes...</div>

                  ) : attributes.length === 0 ? (

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


            {showAttributeTable && (

              <section className="admin-panel">

                <div className="admin-panel-header">
                  <div>
                    <h2>Isi Atribut</h2>
                    <p>
                      Isi tiap baris data atribut dataset ini. Tekan ikon
                      pensil (Edit Mode) untuk mulai mengedit, menambah,
                      atau menghapus baris.
                    </p>
                  </div>
                </div>

                <div style={{ padding: '0 22px 20px' }}>

                  <AttributeDataTable
                    rows={attributeRows}
                    attributeMeta={attributes}
                    saving={attrSaving}
                    emptyMessage={
                      isLocal
                        ? 'Dataset ini belum memiliki data geometri/atribut per-baris.'
                        : 'Baris data belum tersedia dari GeoServer untuk dataset ini.'
                    }
                    onSaveRows={handleSaveAttributeRows}
                  />

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