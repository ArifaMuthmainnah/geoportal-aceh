import React, {
  useEffect,
  useState,
} from 'react'

import {
  getDatasets,
} from '../../api/datasetApi'

function Layers() {
  // State diatur ke null agar defaultnya semua list tertutup
  const [activeTab, setActiveTab] = useState(null); 
  const [activeChip, setActiveChip] = useState('POLA RUANG LAUT');

  // Fungsi Toggle: Jika klik button yang sama, maka tutup (set null)
  const toggleTab = (cat) => {
    setActiveTab(activeTab === cat ? null : cat);
  };

  const sidebarData = {
    SKPD: ['BAPPEDA', 'BPBD', 'DINKES', 'DISHUB', 'DLHK', 'PUPR'],
    KATEGORI: ['BATAS WILAYAH', 'GEOLOGI', 'HIDROGRAFI', 'TRANSPORTASI', 'KEBENCANAAN'],
    'TPB/SDGs': ['TANPA KEMISKINAN', 'TANPA KELAPARAN', 'KEHIDUPAN SEHAT', 'PENDIDIKAN BERKUALITAS']
  };

  const [
    datasets,
    setDatasets
  ] = useState([])
  
  const [
    loading,
    setLoading
  ] = useState(true)
  
  const [
    error,
    setError
  ] = useState('')
  
  const [
    page,
    setPage
  ] = useState(1)
  
  const [
    hasNext,
    setHasNext
  ] = useState(false)

  useEffect(() => {

    async function loadDatasets() {
  
      try {
  
        setLoading(true)
        setError('')
  
        const response =
          await getDatasets(
            `?page=${page}`
          )
  
        setDatasets(
          response?.datasets ||
          []
        )
  
        setHasNext(
          Boolean(
            response?.links?.next
          )
        )
  
      } catch (error) {
  
        console.error(
          'Gagal memuat layer:',
          error
        )
  
        setError(
          'Data layer gagal dimuat.'
        )
  
      } finally {
  
        setLoading(false)
  
      }
  
    }
  
    loadDatasets()
  
  }, [page])

  return (
    <div className="login-content-page">
      <section className="login-simple-hero">
        <span className="login-page-eyebrow">LAYERS</span>
        <h1>Layanan Layer<br /><span>Geospasial Aceh</span></h1>
        <p>Informasi mengenai layer geospasial yang tersedia dalam Geoportal Aceh.</p>
      </section>

      <section className="geoservice-container">
        <aside className="geoservice-sidebar">
          {Object.keys(sidebarData).map((cat) => (
            <div key={cat} className="sidebar-group">
              <button 
                className={`sidebar-main-btn ${activeTab === cat ? 'active' : ''}`}
                onClick={() => toggleTab(cat)}
              >
                {cat}
              </button>
              {activeTab === cat && (
                <ul className="sidebar-sub-list">
                  {sidebarData[cat].map(item => (
                    <li key={item}>
                      <span className="sub-item-text">{item}</span>
                      <span className="sub-item-count">{Math.floor(Math.random() * 100)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </aside>

        <main className="geoservice-main">
          {/* JUDUL BARU SESUAI RUJUKAN */}
          <h2 className="geoservice-title">Daftar Map Service</h2>

          <div className="geoservice-filter-top">
            <div className="geoservice-search-bar">
              <input type="text" placeholder="Cari Peta..." />
              <button className="search-btn">🔍</button>
            </div>

            <div className="geoservice-chips">
              {['POLA RUANG LAUT', 'RTRW', 'TOPONIMI'].map(chip => (
                <button 
                  key={chip}
                  className={`chip-btn ${activeChip === chip ? 'active' : ''}`}
                  onClick={() => setActiveChip(chip)}
                >
                  {chip} <span className="chip-icon">{"</>"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="geoservice-grid">
          {loading && (
  <p>
    Memuat data layer...
  </p>
)}

{error && (
  <p>
    {error}
  </p>
)}

{!loading &&
  !error &&
  datasets.map(
    (dataset) => (

      <div
        key={
          dataset.pk ??
          dataset.id
        }
        className="layer-card-item"
      >

        <div className="card-header-icons">

          <button title="Peta">
            🗺️
          </button>

          <button title="Globe">
            🌐
          </button>

          <button title="Info">
            ℹ️
          </button>

          <button title="Download">
            📥
          </button>

        </div>


        <div className="card-image-placeholder">

          {dataset.thumbnail_url ? (

            <img
              src={
                dataset.thumbnail_url
              }
              alt={
                dataset.title ||
                dataset.name
              }
              className="peta-thumb"
            />

          ) : (

            <div className="skeleton-map" />

          )}

        </div>


        <div className="card-body-info">

          <h3>
            [
            {dataset.pk ??
             dataset.id}
            ]{' '}
            {dataset.title ||
             dataset.name ||
             'Dataset'}
          </h3>

          <p className="card-date">

            {dataset.date
              ? new Date(
                  dataset.date
                ).toLocaleDateString(
                  'id-ID'
                )
              : '-'}

          </p>

          <span className="status-badge">

            {dataset.is_published
              ? 'Publik'
              : 'Dibatasi'}

          </span>

        </div>

      </div>

    )
  )}
          </div>

          <div className="pagination-actions">

  {page > 1 && (

    <button
      className="load-more-btn"
      onClick={
        () =>
          setPage(
            (previous) =>
              previous - 1
          )
      }
    >
      ← Halaman Sebelumnya
    </button>

  )}

  {hasNext && (

    <button
      className="load-more-btn"
      onClick={
        () =>
          setPage(
            (previous) =>
              previous + 1
          )
      }
    >
      Halaman Selanjutnya →
    </button>

  )}

</div>
        </main>
      </section>
    </div>
  );
}

export default Layers;