import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAllGeoapps,
} from '../api/geoappApi'

import {
  getPublishedByType,
} from '../api/myDatasetApi'

import {
  mergeResourceLists,
  sortByDateDesc,
  getResourceOwnerName,
} from '../utils/ownDataAdapter'

import {
  getResourceTypeLabel,
} from '../utils/datasetUtils'

import GeoappCard from '../components/ApplicationCard'


function Aplikasi() {

  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [instansi, setInstansi] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    async function fetchApplications() {

      try {

        setLoading(true)
        setError('')

        let oldList = []

        try {
          const data = await getAllGeoapps()
          oldList = Array.isArray(data) ? data : []
        } catch (err) {
          console.error('Gagal mengambil aplikasi API lama:', err)
        }

        let ownDashboards = []

        try {
          ownDashboards = await getPublishedByType('dashboard')
        } catch (err) {
          console.error('Gagal mengambil dashboard upload sendiri:', err)
        }

        let ownApplications = []

        try {
          ownApplications = await getPublishedByType('application')
        } catch (err) {
          console.error('Gagal mengambil aplikasi upload sendiri:', err)
        }

        const mergedApplications =
          sortByDateDesc(
            mergeResourceLists(oldList, [...ownDashboards, ...ownApplications])
          )

        setApplications(mergedApplications)

      } catch (err) {

        console.error('Gagal mengambil aplikasi:', err)

        setApplications([])
        setError('Gagal mengambil data aplikasi.')

      } finally {

        setLoading(false)

      }

    }

    fetchApplications()

  }, [])

  function getApplicationTypeLabel(application) {
    return getResourceTypeLabel(
      application.resource_type === 'application' ? 'application' : 'dashboard'
    )
  }

  const categories = useMemo(() => {

    const categorySet = new Set()

    applications.forEach((application) => {
      categorySet.add(getApplicationTypeLabel(application))
    })

    return ['Semua', ...Array.from(categorySet)]

  }, [applications])


  const instansiList = useMemo(() => {

    const nameSet = new Set()

    applications.forEach((application) => {
      const name = getResourceOwnerName(application)
      if (name && name !== 'Tidak diketahui') nameSet.add(name)
    })

    return ['Semua', ...Array.from(nameSet).sort((a, b) => a.localeCompare(b, 'id'))]

  }, [applications])

  const filteredApplications = useMemo(() => {

    const keyword = search.toLowerCase().trim()

    return applications.filter((application) => {

      const title = (application.title || application.name || '').toLowerCase()
      const matchSearch = title.includes(keyword)

      const applicationCategory = getApplicationTypeLabel(application)

      const matchCategory = category === 'Semua' || applicationCategory === category

      const ownerName = getResourceOwnerName(application)
      const matchInstansi = instansi === 'Semua' || ownerName === instansi

      const matchPublished = application.is_published === true

      return matchSearch && matchCategory && matchInstansi && matchPublished

    })

  }, [applications, search, category, instansi])

  return (

    <main className="applications-page">

      <section className="applications-hero">
        <div className="container">
          <div className="applications-hero-content">
            <span className="applications-eyebrow">GEOPORTAL ACEH</span>
            <h1>Aplikasi Geospasial</h1>
            <p>Jelajahi berbagai aplikasi dan layanan geospasial yang mendukung pengelolaan informasi spasial di Aceh.</p>
          </div>
        </div>
      </section>

      <section className="container information-toolbar-wrapper">

        <div className="catalog-search-wrapper" style={{ marginBottom: '14px' }}>
          <span className="catalog-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>

          <input
            type="text"
            className="information-search"
            placeholder="Cari berdasarkan judul aplikasi..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >

          <small className="information-result-count">
            Menampilkan {filteredApplications.length} aplikasi
          </small>

          <select
            className="jign-sort-select"
            value={instansi}
            onChange={(event) => setInstansi(event.target.value)}
            aria-label="Filter berdasarkan instansi"
          >
            {instansiList.map((item) => (
              <option key={item} value={item}>
                {item === 'Semua' ? 'Semua Instansi' : item}
              </option>
            ))}
          </select>

        </div>

      </section>

      <section className="container information-content">

        <div className="catalog-heading-layout">

          <div className="catalog-heading-title">
            <span className="section-eyebrow">APLIKASI GEOSPASIAL</span>
            <h2>Aplikasi Terbaru</h2>
            <p>Temukan berbagai aplikasi dan dashboard geospasial yang tersedia di Geoportal Aceh.</p>
          </div>

          <div className="catalog-category-wrapper">
            <div className="information-categories">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`information-category ${category === item ? 'active' : ''}`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

        </div>

        {loading && (
          <div className="information-empty">
            <p>Memuat aplikasi...</p>
          </div>
        )}

        {!loading && error && (
          <div className="information-empty">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredApplications.length > 0 && (
          <div className="row g-4">
            {filteredApplications.map((application) => (
              <div className="col-md-6 col-lg-4" key={application.pk || application.uuid}>
                <GeoappCard application={application} />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredApplications.length === 0 && (
          <div className="information-empty">
            <h5>Aplikasi tidak ditemukan</h5>
            <p>Coba gunakan kata kunci, kategori, atau instansi yang berbeda.</p>
          </div>
        )}

      </section>

    </main>

  )

}

export default Aplikasi