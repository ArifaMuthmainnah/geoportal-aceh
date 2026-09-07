import { useEffect, useMemo, useState } from 'react'

import { getAllMaps } from '../api/mapApi'
import { getPublishedByType } from '../api/myDatasetApi'
import { mergeResourceLists, sortByDateDesc, getResourceOwnerName } from '../utils/ownDataAdapter'

import DatasetCard from '../components/DatasetCard'

function Peta() {

  const [maps, setMaps] = useState([])
  const [search, setSearch] = useState('')
  const [instansi, setInstansi] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    let mounted = true

    async function fetchData() {

      try {

        setLoading(true)
        setError('')

        let oldMaps = []
        try {
          const data = await getAllMaps()
          oldMaps = Array.isArray(data) ? data.map((m) => ({ ...m, resource_type: 'map' })) : []
        } catch (err) {
          console.error('Gagal mengambil peta API lama:', err)
        }

        let ownMaps = []
        try {
          ownMaps = await getPublishedByType('map')
        } catch (err) {
          console.error('Gagal mengambil peta upload sendiri:', err)
        }

        if (!mounted) return

        setMaps(sortByDateDesc(mergeResourceLists(oldMaps, ownMaps)))

      } catch (err) {

        console.error('Gagal mengambil data peta:', err)

        if (mounted) {
          setMaps([])
          setError('Gagal mengambil data peta.')
        }

      } finally {

        if (mounted) setLoading(false)

      }

    }

    fetchData()

    return () => { mounted = false }

  }, [])

  const instansiList = useMemo(() => {
    const set = new Set()
    maps.forEach((item) => {
      const name = getResourceOwnerName(item)
      if (name && name !== 'Tidak diketahui') set.add(name)
    })
    return ['Semua', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))]
  }, [maps])

  const filteredMaps = useMemo(() => {
    const keyword = search.toLowerCase().trim()
    return maps.filter((item) => {
      const title = String(item.title || '').toLowerCase()
      const matchSearch = !keyword || title.includes(keyword)
      const ownerName = getResourceOwnerName(item)
      const matchInstansi = instansi === 'Semua' || ownerName === instansi
      return matchSearch && matchInstansi
    })
  }, [maps, search, instansi])

  return (

    <main className="katalog-page">

      <section className="catalog-hero">
        <div className="container">
          <div className="catalog-hero-content">
            <span className="catalog-eyebrow">GEOPORTAL ACEH</span>
            <h1>Peta</h1>
            <p>Jelajahi koleksi peta interaktif yang tersedia di Geoportal Aceh.</p>
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
            placeholder="Cari berdasarkan judul peta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <small className="information-result-count">Menampilkan {filteredMaps.length} peta</small>
          <select className="jign-sort-select" value={instansi} onChange={(e) => setInstansi(e.target.value)}>
            {instansiList.map((item) => (
              <option key={item} value={item}>{item === 'Semua' ? 'Semua Instansi' : item}</option>
            ))}
          </select>
        </div>

      </section>

      <section className="container information-content">

        {loading && <div className="information-empty"><p>Memuat data peta...</p></div>}

        {!loading && error && <div className="information-empty"><p>{error}</p></div>}

        {!loading && !error && filteredMaps.length > 0 && (
          <div className="row g-4">
            {filteredMaps.map((item) => (
              <div className="col-md-6 col-lg-4" key={item.pk || item.uuid || item.id}>
                <DatasetCard dataset={{ ...item, resource_type: 'map' }} owner={item.owner} />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredMaps.length === 0 && (
          <div className="information-empty">
            <h5>Peta tidak ditemukan</h5>
            <p>Coba gunakan kata kunci atau instansi yang berbeda.</p>
          </div>
        )}

      </section>

    </main>

  )
}

export default Peta