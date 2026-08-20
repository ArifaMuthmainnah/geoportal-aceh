import React, { useState } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../index.css'; // Sesuaikan path ini jika perlu

function CSRT() {
  const [jenisCitra, setJenisCitra] = useState('CSRT PLEIADES');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Koordinat tengah Aceh
  const acehPosition = [4.6951, 96.7494]; 

  const handleSearch = () => {
    setHasSearched(true);
  };

  return (
    <div className="login-content-page">
      {/* HERO SECTION - KONSISTEN DENGAN LAYERS */}
      <section className="login-simple-hero">
        <span className="login-page-eyebrow">CSRT</span>
        <h1>Citra Satelit<br /><span>Resolusi Tinggi</span></h1>
        <p>Informasi dan layanan citra penginderaan jauh untuk mendukung kebutuhan geospasial di wilayah Aceh.</p>
      </section>

      {/* DASHBOARD CONTAINER */}
      <section className="csrt-main-container">
        
        {/* PANEL KIRI: FILTER (SIDEBAR) */}
        <aside className="csrt-sidebar">
          <button className="csrt-draw-btn">
            <span className="icon">✎</span> Gambar Cakupan Area
          </button>

          <div className="csrt-form-group">
            <label>Jenis Citra</label>
            <select 
              value={jenisCitra}
              onChange={(e) => setJenisCitra(e.target.value)}
            >
              <option>CSRT PLEIADES</option>
              <option>CSRT BIG</option>
              <option>CSRT LANDSAT</option>
              <option>RADAR SENTINEL 1</option>
              <option>CSRT SPOT</option>
              <option>CSRT DEM</option>
            </select>
          </div>

          <div className="csrt-form-group">
            <label>Tanggal Awal</label>
            <input type="date" />
          </div>

          <div className="csrt-form-group">
            <label>Tanggal Akhir</label>
            <input type="date" />
          </div>

          <button className="csrt-search-btn" onClick={handleSearch}>
            Cari Data
          </button>
        </aside>

        {/* PANEL TENGAH: PETA (MAP AREA) */}
        <main className="csrt-map-area">
          <MapContainer 
            center={acehPosition} 
            zoom={8} 
            zoomControl={false} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="topleft" />
          </MapContainer>
        </main>

        {/* PANEL KANAN: HASIL (RESULT AREA) */}
        <aside className="csrt-result-panel">
          <h2 className="csrt-result-title">Hasil Pencarian</h2>
          
          {hasSearched ? (
            <div className="csrt-alert-empty">
              <strong>Total Data : 0</strong>
              <p>data tidak ditemukan. Silahkan tentukan area dan parameter pencarian.</p>
            </div>
          ) : (
            <div className="csrt-empty-placeholder">
              <p>Silakan isi parameter di sebelah kiri dan tekan tombol cari untuk melihat hasil.</p>
            </div>
          )}
        </aside>

      </section>
    </div>
  );
}

export default CSRT;