import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAllDatasets,
} from '../api/datasetApi'

import {
  getAllOwners,
} from '../api/jignApi'

import {
  getPublishedByType,
} from '../api/myDatasetApi'

import {
  getPublicOwners,
} from '../api/userApi'

import {
  mapCategory,
} from '../utils/datasetUtils'

import {
  mergeResourceLists,
  sortByDateDesc,
  mergeOwnerLists,
  getResourceOwnerName,
} from '../utils/ownDataAdapter'

import DatasetCard from '../components/DatasetCard'


function Katalog() {

  const [datasets, setDatasets] = useState([])
  const [owners, setOwners] = useState([])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [instansi, setInstansi] = useState('Semua')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {

    let mounted = true

    async function fetchData() {

      try {

        setLoading(true)
        setError('')

        let datasetList = []

        try {
          const datasetData = await getAllDatasets()
          datasetList =
            Array.isArray(datasetData)
              ? datasetData
              : datasetData?.datasets ||
                datasetData?.results ||
                datasetData?.data ||
                []
        } catch (err) {
          console.error('Gagal mengambil dataset API lama:', err)
        }

        let ownDatasetList = []

        try {
          ownDatasetList = await getPublishedByType('dataset')
        } catch (err) {
          console.error('Gagal mengambil dataset upload sendiri:', err)
        }

        let ownerList = []

        try {
          const ownerData = await getAllOwners()
          ownerList =
            Array.isArray(ownerData)
              ? ownerData
              : ownerData?.owners ||
                ownerData?.results ||
                ownerData?.data ||
                []
        } catch (err) {
          console.error('Gagal mengambil owner API lama:', err)
        }

        let ownUserList = []

        try {
          ownUserList = await getPublicOwners()
        } catch (err) {
          console.error('Gagal mengambil pengguna sendiri:', err)
        }

        if (!mounted) return

        const mergedDatasets =
          sortByDateDesc(
            mergeResourceLists(datasetList, ownDatasetList)
          )

        const mergedOwners =
          mergeOwnerLists(ownerList, ownUserList)

        setDatasets(mergedDatasets)
        setOwners(mergedOwners)

      } catch (err) {

        console.error('Gagal mengambil data katalog:', err)

        if (!mounted) return

        setDatasets([])
        setOwners([])
        setError('Gagal mengambil data katalog.')

      } finally {

        if (mounted) setLoading(false)

      }

    }

    fetchData()

    return () => { mounted = false }

  }, [])


  const ownerMap = useMemo(() => {
    return new Map(
      owners.map((owner) => [owner.pk || owner.id || owner.uuid, owner])
    )
  }, [owners])


  const categories = useMemo(() => {

    const categorySet = new Set()

    datasets.forEach((dataset) => {
      const identifier = dataset?.category?.identifier
      if (!identifier) return
      const mappedCategory = mapCategory(identifier)
      if (mappedCategory !== 'Umum') categorySet.add(mappedCategory)
    })

    return ['Semua', ...Array.from(categorySet)]

  }, [datasets])


  // ===================================================
  // DAFTAR INSTANSI (UNTUK FILTER)
  // ===================================================

  const instansiList = useMemo(() => {

    const nameSet = new Set()

    owners.forEach((owner) => {
      const fullName =
        `${owner.first_name || ''} ${owner.last_name || ''}`.trim() ||
        owner.username

      if (fullName) nameSet.add(fullName)
    })

    return ['Semua', ...Array.from(nameSet).sort((a, b) => a.localeCompare(b, 'id'))]

  }, [owners])


  const filteredDatasets = useMemo(() => {

    const keyword = search.toLowerCase().trim()

    return datasets.filter((dataset) => {

      const title = String(dataset?.title || '').toLowerCase()
      const matchSearch = title.includes(keyword)

      const mappedCategory = mapCategory(dataset?.category?.identifier)
      const matchCategory = category === 'Semua' || mappedCategory === category

      const ownerName = getResourceOwnerName(dataset)
      const matchInstansi = instansi === 'Semua' || ownerName === instansi

      return matchSearch && matchCategory && matchInstansi

    })

  }, [datasets, search, category, instansi])


  return (

    <main className="katalog-page">

      <section className="catalog-hero">
        <div className="container">
          <div className="catalog-hero-content">
            <span className="catalog-eyebrow">GEOPORTAL ACEH</span>
            <h1>Katalog Data</h1>
            <p>Temukan dan jelajahi berbagai data geospasial yang tersedia di Aceh.</p>
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
            placeholder="Cari berdasarkan judul dataset..."
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
            Menampilkan {filteredDatasets.length} dataset
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
            <span className="section-eyebrow">DATA GEOSPASIAL</span>
            <h2>Dataset Terbaru</h2>
            <p>Temukan dataset berdasarkan kategori informasi.</p>
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
            <p>Memuat data...</p>
          </div>
        )}


        {!loading && error && (
          <div className="information-empty">
            <p>{error}</p>
          </div>
        )}


        {!loading && !error && filteredDatasets.length > 0 && (
          <div className="row g-4">
            {filteredDatasets.map((dataset) => {

              const ownerId =
                dataset?.owner?.pk ??
                dataset?.owner?.id ??
                dataset?.owner_pk ??
                dataset?.owner_id

              const owner =
                ownerMap.get(ownerId) ||
                dataset?.owner ||
                null

              return (
                <div className="col-md-6 col-lg-4" key={dataset.pk || dataset.uuid || dataset.id}>
                  <DatasetCard dataset={dataset} owner={owner} />
                </div>
              )

            })}
          </div>
        )}


        {!loading && !error && filteredDatasets.length === 0 && (
          <div className="information-empty">
            <h5>Dataset tidak ditemukan</h5>
            <p>Coba gunakan kata kunci judul, kategori, atau instansi yang berbeda.</p>
          </div>
        )}

      </section>

    </main>

  )
}


export default Katalog