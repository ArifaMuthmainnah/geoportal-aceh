import { useEffect, useMemo, useState } from 'react'

import { getAllDocuments } from '../api/documentApi'
import { getPublishedByType } from '../api/myDatasetApi'
import { mergeResourceLists, sortByDateDesc, getResourceOwnerName } from '../utils/ownDataAdapter'

import DatasetCard from '../components/DatasetCard'

function Dokumen() {

  const [documents, setDocuments] = useState([])
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

        let oldDocs = []
        try {
          const data = await getAllDocuments()
          oldDocs = Array.isArray(data) ? data.map((d) => ({ ...d, resource_type: 'document' })) : []
        } catch (err) {
          console.error('Gagal mengambil dokumen API lama:', err)
        }

        let ownDocs = []
        try {
          ownDocs = await getPublishedByType('document')
        } catch (err) {
          console.error('Gagal mengambil dokumen upload sendiri:', err)
        }

        if (!mounted) return

        setDocuments(sortByDateDesc(mergeResourceLists(oldDocs, ownDocs)))

      } catch (err) {

        console.error('Gagal mengambil data dokumen:', err)

        if (mounted) {
          setDocuments([])
          setError('Gagal mengambil data dokumen.')
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
    documents.forEach((item) => {
      const name = getResourceOwnerName(item)
      if (name && name !== 'Tidak diketahui') set.add(name)
    })
    return ['Semua', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))]
  }, [documents])

  const filteredDocuments = useMemo(() => {
    const keyword = search.toLowerCase().trim()
    return documents.filter((item) => {
      const title = String(item.title || '').toLowerCase()
      const matchSearch = !keyword || title.includes(keyword)
      const ownerName = getResourceOwnerName(item)
      const matchInstansi = instansi === 'Semua' || ownerName === instansi
      return matchSearch && matchInstansi
    })
  }, [documents, search, instansi])

  return (

    <main className="katalog-page">

      <section className="catalog-hero">
        <div className="container">
          <div className="catalog-hero-content">
            <span className="catalog-eyebrow">GEOPORTAL ACEH</span>
            <h1>Dokumen</h1>
            <p>Kumpulan dokumen pendukung data geospasial Aceh.</p>
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
            placeholder="Cari berdasarkan judul dokumen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <small className="information-result-count">Menampilkan {filteredDocuments.length} dokumen</small>
          <select className="jign-sort-select" value={instansi} onChange={(e) => setInstansi(e.target.value)}>
            {instansiList.map((item) => (
              <option key={item} value={item}>{item === 'Semua' ? 'Semua Instansi' : item}</option>
            ))}
          </select>
        </div>

      </section>

      <section className="container information-content">

        {loading && <div className="information-empty"><p>Memuat data dokumen...</p></div>}

        {!loading && error && <div className="information-empty"><p>{error}</p></div>}

        {!loading && !error && filteredDocuments.length > 0 && (
          <div className="row g-4">
            {filteredDocuments.map((item) => (
              <div className="col-md-6 col-lg-4" key={item.pk || item.uuid || item.id}>
                <DatasetCard dataset={{ ...item, resource_type: 'document' }} owner={item.owner} />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredDocuments.length === 0 && (
          <div className="information-empty">
            <h5>Dokumen tidak ditemukan</h5>
            <p>Coba gunakan kata kunci atau instansi yang berbeda.</p>
          </div>
        )}

      </section>

    </main>

  )
}

export default Dokumen