import React, { useState } from 'react';
import '../../index.css';

// Data Dummy sesuai rujukan
const AGENCIES = [
  { id: 1, name: 'BAPPEDA', count: 26 },
  { id: 2, name: 'BPBD', count: 90 },
  { id: 3, name: 'DISHUB', count: 125 },
  { id: 4, name: 'Dinas Sosial', count: 32 },
  { id: 5, name: 'Dinas Pendidikan', count: 25 },
];

const MOCK_MAPS = [
  {
    id: 1,
    title: 'Tutupan Lahan Kota Banda Aceh',
    agency: 'BAPPEDA',
    desc: 'Peta tutupan lahan dibuat menggunakan metode klasifikasi unsupervised.',
    date: '2023-10-23',
    size: '1.99 MB',
    operator: 'Hidayatul Rahman, S.Kom',
    thumb: 'https://via.placeholder.com/300x200?text=Peta+Aceh+1'
  },
  {
    id: 2,
    title: 'Sebaran Banjir Aceh Besar',
    agency: 'BPBD',
    desc: 'Data sebaran titik banjir periode Januari 2024.',
    date: '2024-01-15',
    size: '2.5 MB',
    operator: 'Admin Geoportal',
    thumb: 'https://via.placeholder.com/300x200?text=Peta+Aceh+2'
  }
];

function Kartografi() {
  const [selectedAgency, setSelectedAgency] = useState('BAPPEDA');
  const [selectedMap, setSelectedMap] = useState(null);
  const [isLoggedIn] = useState(false); // Simulasi status login

  const handleDownload = () => {
    if (!isLoggedIn) {
      alert("⚠️ Perhatian: Anda harus Login terlebih dahulu untuk mengunduh data peta.");
    } else {
      alert("Memulai unduhan...");
    }
  };

  return (
    <div className="login-content-page">
      {/* HEADER HERO (Tetap) */}
      <section className="login-simple-hero" style={{ paddingLeft: '40px' }}>
        <span className="login-page-eyebrow">KARTOGRAFI</span>
        <h1>Kartografi<br /><span>Geoportal Aceh</span></h1>
        <p>Informasi dan layanan kartografi untuk mendukung penyajian data geospasial secara informatif dan mudah dipahami.</p>
      </section>

      {/* DASHBOARD KARTOGRAFI */}
      <div className="kartografi-main-container">
        
        {/* SIDEBAR KIRI */}
        <aside className="kartografi-sidebar">
          <input type="text" placeholder="Search..." className="sidebar-search" />
          <ul className="agency-list">
            {AGENCIES.map(item => (
              <li 
                key={item.id} 
                className={`agency-item ${selectedAgency === item.name ? 'active' : ''}`}
                onClick={() => setSelectedAgency(item.name)}
              >
                {item.id}. {item.name}
                <span className="agency-badge">{item.count}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* CONTENT TENGAH */}
        <div className="kartografi-content">
          <div className="search-peta-wrapper">
            <input type="text" placeholder="Cari Peta..." className="input-cari-peta" />
            <button className="btn-cari-peta">🔍</button>
          </div>

          <div className="peta-grid">
            {MOCK_MAPS.filter(m => m.agency === selectedAgency || selectedAgency === '').map(peta => (
              <div key={peta.id} className="peta-card" onClick={() => setSelectedMap(peta)}>
                <img src={peta.thumb} alt="thumb" className="peta-thumb" />
                <div className="peta-title">{peta.title}</div>
              </div>
            ))}
          </div>

          <button style={{ 
            marginTop: '30px', padding: '10px 20px', backgroundColor: '#0056b3', 
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' 
          }}>
            ︾ Halaman Selanjutnya
          </button>
        </div>
      </div>

      {/* MODAL POPUP */}
      {selectedMap && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span style={{fontWeight: 'bold', color: '#166534'}}>Informasi</span>
              <button onClick={() => setSelectedMap(null)} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px'}}>×</button>
            </div>
            <div className="modal-body">
              <table className="info-table">
                <tbody>
                  <tr><td className="label-td">Nama Peta</td><td className="value-td">{selectedMap.title}</td></tr>
                  <tr><td className="label-td">Deskripsi</td><td className="value-td">{selectedMap.desc}</td></tr>
                  <tr><td className="label-td">Tanggal Peta</td><td className="value-td">{selectedMap.date}</td></tr>
                  <tr><td className="label-td">Pembuat</td><td className="value-td">{selectedMap.agency}</td></tr>
                  <tr><td className="label-td">Operator</td><td className="value-td">{selectedMap.operator}</td></tr>
                  <tr><td className="label-td">Ukuran File</td><td className="value-td">{selectedMap.size}</td></tr>
                  <tr>
                    <td className="label-td">Preview</td>
                    <td><img src={selectedMap.thumb} alt="preview" style={{width: '100%', borderRadius: '5px'}}/></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-modal" onClick={() => setSelectedMap(null)} style={{background: '#e2e8f0'}}>Close</button>
              <button className="btn-modal" onClick={handleDownload} style={{background: '#f1f5f9', border: '1px solid #cbd5e1'}}>📥 Download</button>
              <button className="btn-modal" style={{background: '#ef4444', color: 'white'}}>💾 Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kartografi;