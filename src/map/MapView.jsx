import { useState, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  GeoJSON,
  useMap,
} from 'react-leaflet'
import MapControls from './MapControls'
import LayerPanel from './LayerPanel'
import MouseCoordinate from './MouseCoordinate'
import AddLayerModal from './AddLayerModal' 
import RemoveLayerModal from './RemoveLayerModal' 
import VillageSearchModal from './VillageSearchModal'
import SearchPanel from './SearchPanel'
import 'leaflet/dist/leaflet.css'
import {
  getDatasetDetail,
  getDatasetFeatures,
} from '../api/datasetApi'


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
  const [layers, setLayers] =
  useState([])

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

  const handleAddLayer =
  async (newDataset) => {

    try {

      const datasetId =
        newDataset.pk ??
        newDataset.id

      if (!datasetId) {

        alert(
          'ID dataset tidak tersedia.'
        )

        return
      }


      if (
        layers.some(
          (layer) =>
            String(layer.id) ===
            String(datasetId)
        )
      ) {

        alert(
          'Layer ini sudah ada di dalam list!'
        )

        return
      }


      // Ambil detail dataset
      const response =
        await getDatasetDetail(
          datasetId
        )


      // GeoNode bisa mengembalikan
      // object langsung atau { dataset: {...} }
      const detail =
        response?.dataset ||
        response


      const alternate =
        detail?.alternate ||
        newDataset?.alternate


      if (!alternate) {

        console.error(
          'Dataset tidak mempunyai field alternate:',
          detail
        )

        alert(
          'Dataset ini belum memiliki nama layer GeoServer.'
        )

        return
      }


      // Ambil data spasial asli dari GeoServer WFS
      const geojson =
        await getDatasetFeatures(
          alternate
        )


        const layer = {

          id:
            detail?.pk ??
            detail?.id ??
            datasetId,
        
          name:
            detail?.title ||
            detail?.name ||
            newDataset?.title ||
            newDataset?.name ||
            'Dataset',
        
          alternate,
        
          visible: true,
        
          geojson,
        
        }

      setLayers(
        (previous) => [
          ...previous,
          layer,
        ]
      )

      setShowAddModal(false)

    } catch (error) {

      console.error(
        'Gagal menambahkan layer:',
        error
      )

      alert(
        'Layer gagal dimuat dari Geoportal Aceh.'
      )

    }

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

        {layers
  .filter(
    (layer) =>
      layer.visible &&
      layer.geojson
  )
  .map(
    (layer) => (

      <GeoJSON
        key={layer.id}
        data={layer.geojson}
      />

    )
  )}
        
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