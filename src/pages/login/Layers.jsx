import React, { useState } from 'react';

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

  const dummyLayers = [
    { id: 1, title: '[1] Pos Keamanan Lingkungan', date: '01 July 2026', status: 'Dibatasi', type: 'POLA RUANG LAUT' },
    { id: 2, title: '[2] BATAS ADMINISTRASI KABUPATEN', date: '09 March 2026', status: 'SKPD', type: 'RTRW' },
    { id: 3, title: '[3] ASET TANAH DAN BANGUNAN ACEH', date: '01 January 2025', status: 'Dibatasi', type: 'TOPONIMI' },
    { id: 4, title: '[4] DESA TOPONIM PT 10K', date: '01 January 2020', status: 'Dibatasi', type: 'TOPONIMI' },
    { id: 5, title: '[5] KECAMATAN ADMINISTRASI PT 25K', date: '19 December 2025', status: 'SKPD', type: 'RTRW' },
    { id: 6, title: '[6] PETA PENERTIBAN TRANTIBUM 2026', date: '12 June 2026', status: 'SKPD', type: 'POLA RUANG LAUT' },
  ];

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
            {dummyLayers.map(layer => (
              <div key={layer.id} className="layer-card-item">
                <div className="card-header-icons">
                  <button title="Peta">🗺️</button>
                  <button title="Globe">🌐</button>
                  <button title="Info">ℹ️</button>
                  <button title="Download">📥</button>
                </div>
                <div className="card-image-placeholder">
                  <div className="skeleton-map"></div>
                </div>
                <div className="card-body-info">
                  <h3>{layer.title}</h3>
                  <p className="card-date">{layer.date}</p>
                  <span className={`status-badge ${layer.status.toLowerCase()}`}>
                    {layer.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="load-more-btn">︾ Halaman Selanjutnya</button>
        </main>
      </section>
    </div>
  );
}

export default Layers;