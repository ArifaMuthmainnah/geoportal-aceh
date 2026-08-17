import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import MapControls from './MapControls'
import LayerPanel from './LayerPanel'
import MouseCoordinate from './MouseCoordinate'
import AddLayerModal from './AddLayerModal' 
import RemoveLayerModal from './RemoveLayerModal' 
import VillageSearchModal from './VillageSearchModal'
import SearchPanel from './SearchPanel'
import 'leaflet/dist/leaflet.css'

// --- KOMPONEN PEMBANTU UNTUK FLY TO (Pindah Lokasi Peta) ---
// Komponen ini harus di dalam MapContainer agar bisa memakai useMap()
function MapFlyTo({ destination }) {
  const map = useMap();
  useEffect(() => {
    if (destination) {
      // Peta otomatis terbang ke koordinat dengan zoom 16
      map.flyTo(destination, 16, { duration: 2 });
    }
  }, [destination, map]);
  return null;
}

function MapView() {
  const center = [5.55, 95.32]
  
  // --- 1. STATE UNTUK KOORDINAT PENCARIAN ---
  const [targetCoords, setTargetCoords] = useState(null);

  // --- 2. STATE UNTUK LAYER YANG AKTIF ---
  const [layers, setLayers] = useState([
    { id: 1, name: 'Batas Administrasi', visible: true, institution: 'BAPPEDA', category: 'Wilayah' },
    { id: 2, name: 'Lokasi Penting', visible: true, institution: 'DISKOMINSA', category: 'Sosial' },
    { id: 3, name: 'Jaringan Jalan', visible: false, institution: 'DISHUB', category: 'Transportasi' },
    { id: 4, name: 'Sungai', visible: false, institution: 'PUPR', category: 'Lingkungan' },
  ])

  // --- 3. STATE UNTUK BASEMAP ---
  const [activeBasemap, setActiveBasemap] = useState("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
  
  const basemapOptions = [
    { name: 'OSM Default', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { name: 'Esri - Dark Gray', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}' },
    { name: 'Esri Relief', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}' },
    { name: 'Esri Topografi', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
    { name: 'Esri Terrain', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}' },
    { name: 'Esri StreetMap', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}' },
    { name: 'Esri Imagery', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  ]

  // --- 4. STATE KONTROL MODAL ---
  const [showBasemapModal, setShowBasemapModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [showVillageSearch, setShowVillageSearch] = useState(false);

  // --- 5. FUNGSI LOGIC ---
  const toggleLayer = (id) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l))
  }

  const handleAddLayer = (newDataset) => {
    if (layers.find(l => l.id === newDataset.id)) {
      alert("Layer ini sudah ada di dalam list!");
      return;
    }
    setLayers([...layers, { ...newDataset, visible: true }]);
    setShowAddModal(false);
  }

  const handleRemoveLayers = (idsToRemove) => {
    if (idsToRemove.length === 0) return;
    setLayers(prev => prev.filter(l => !idsToRemove.includes(l.id)));
    setShowRemoveModal(false);
  }

  return (
    <div className="webgis-map-wrapper">
      <MapContainer center={center} zoom={8} className="map-container" zoomControl={false}>
        {/* Layer Peta Dasar */}
        <TileLayer url={activeBasemap} attribution='&copy; Geoportal Aceh' />
        
        {/* Koordinat Live */}
        <MouseCoordinate />
        
        {/* Kontrol Zoom & Custom */}
        <ZoomControl position="topright" />
        <MapControls />

        {/* LOGIC TERBANG KE LOKASI CARI */}
        <MapFlyTo destination={targetCoords} />
        
        {/* SIDEBAR KIRI: Tempat LayerPanel & SearchPanel Bertumpuk */}
        <div className="webgis-sidebar-left">
          {/* Panel Atas: Daftar Layer & Toolbar */}
          <LayerPanel 
            layers={layers} 
            toggleLayer={toggleLayer} 
            openBasemap={() => setShowBasemapModal(true)} 
            openAdd={() => setShowAddModal(true)}
            openRemove={() => setShowRemoveModal(true)}
            openVillageSearch={() => setShowVillageSearch(true)}
          />

          {/* Panel Bawah: Pencarian Lokasi (Jarak diatur via CSS gap: 20px) */}
          <SearchPanel onSelectLocation={(coords) => setTargetCoords(coords)} />
        </div>

        {/* Marker untuk lokasi yang dicari */}
        {targetCoords && (
          <Marker position={targetCoords}>
            <Popup>Lokasi ditemukan!</Popup>
          </Marker>
        )}

        {/* Marker contoh untuk Banda Aceh */}
        {layers.find(l => l.id === 2)?.visible && (
          <Marker position={[5.55, 95.32]}><Popup>Ibukota Banda Aceh</Popup></Marker>
        )}
      </MapContainer>

      {/* --- SEMUA MODAL/POP-UP --- */}

      {/* MODAL BASEMAP */}
      {showBasemapModal && (
        <div className="modal-overlay" onClick={() => setShowBasemapModal(false)}>
          <div className="aceh-modal dark-theme" onClick={(e) => e.stopPropagation()}>
            <div className="aceh-modal-header">
              <span>Basemap Layers</span>
              <button onClick={() => setShowBasemapModal(false)} className="close-btn-x">✖</button>
            </div>
            <div className="basemap-grid">
              {basemapOptions.map((b, idx) => (
                <div 
                  key={idx} 
                  className={`basemap-option-card ${activeBasemap === b.url ? 'active' : ''}`}
                  onClick={() => { setActiveBasemap(b.url); setShowBasemapModal(false); }}
                >
                  <div className="basemap-thumb-placeholder"></div>
                  <span>{b.name}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
               <button className="btn-close-modal" onClick={() => setShowBasemapModal(false)}>✖ Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PETA */}
      {showAddModal && (
        <AddLayerModal 
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAddLayer} 
        />
      )}

      {/* MODAL HAPUS PETA */}
      {showRemoveModal && (
        <RemoveLayerModal 
          layers={layers}
          onClose={() => setShowRemoveModal(false)} 
          onRemove={handleRemoveLayers} 
        />
      )}

       {/* MODAL BASIS DESA */}
       {showVillageSearch && (
        <VillageSearchModal onClose={() => setShowVillageSearch(false)} />
      )}
    </div>
  )
}

export default MapView