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
import FeatureInfoPanel from './FeatureInfoPanel'


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

  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState(null)

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

    setLayers(prev =>
      prev.map(layer =>
        layer.id === id
          ? {
              ...layer,
              visible: !layer.visible
            }
          : layer
      )
    )
  
    if (
      selectedFeatureInfo?.layerId === id
    ) {
  
      setSelectedFeatureInfo(null)
  
    }
  
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
        
          // Template atribut dari Geoportal Aceh
          featureInfoTemplate:
            detail?.featureinfo_custom_template ||
            newDataset?.featureinfo_custom_template ||
            null,
        
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

  const handleAddFileLayer = (
    fileLayer
  ) => {
  
    if (!fileLayer?.geojson) {
  
      alert(
        'Data file tidak tersedia.'
      )
  
      return
    }
  
  
    setLayers(previous => [
  
      ...previous,
  
      fileLayer
  
    ])
  
  
    setShowAddModal(false)
  
  }

  const handleRemoveLayers = (idsToRemove) => {

    if (idsToRemove.length === 0) return
  
    setLayers(
      prev =>
        prev.filter(
          l => !idsToRemove.includes(l.id)
        )
    )
  
    if (
      selectedFeatureInfo &&
      idsToRemove.includes(
        selectedFeatureInfo.layerId
      )
    ) {
  
      setSelectedFeatureInfo(null)
  
    }
  
    setShowRemoveModal(false)
  
  }

  const getFeatureAttributes = (
    properties = {},
    featureInfoTemplate = null
  ) => {
  
    if (!properties) return []
  
    // --------------------------------------------------
    // 1. COBA BACA FIELD DARI TEMPLATE RESMI GEONODE
    // --------------------------------------------------
  
    if (featureInfoTemplate) {
  
      const regex =
        /properties\[['"](.+?)['"]\]/g
  
      const fields = []
  
      let match
  
      while (
        (match = regex.exec(featureInfoTemplate)) !== null
      ) {
  
        const fieldName = match[1]
  
        if (!fields.includes(fieldName)) {
          fields.push(fieldName)
        }
  
      }
  
      if (fields.length > 0) {
  
        return fields.map((field) => ({
  
          key: field,
  
          label: field,
  
          value:
            properties[field] !== null &&
            properties[field] !== undefined &&
            properties[field] !== ''
              ? String(properties[field])
              : '-',
  
        }))
  
      }
  
    }
  
  
    // --------------------------------------------------
    // 2. FALLBACK:
    // Kalau dataset tidak mempunyai feature-info template,
    // tampilkan seluruh properties GeoJSON
    // --------------------------------------------------
  
    return Object.entries(properties)
  
      .filter(([key]) => {
  
        // Field teknis boleh kita sembunyikan
        const hiddenFields = [
          'id',
          'fid',
          'the_geom',
          'geom',
          'geometry',
        ]
  
        return !hiddenFields.includes(
          key.toLowerCase()
        )
  
      })
  
      .map(([key, value]) => ({
  
        key,
  
        label: key,
  
        value:
          value !== null &&
          value !== undefined &&
          value !== ''
            ? String(value)
            : '-',
  
      }))
  
  }

  const handleFeatureClick = (
    feature,
    event,
    layer
  ) => {
  
    const properties =
      feature?.properties || {}
  
    const attributes =
      getFeatureAttributes(
        properties,
        layer.featureInfoTemplate
      )
  
    setSelectedFeatureInfo({
  
      layerId: layer.id,
  
      layerName: layer.name,
  
      coordinates: {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      },
  
      attributes,
  
    })
  
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
  .map((layer) => (

    <GeoJSON
      key={layer.id}
      data={layer.geojson}

      onEachFeature={(feature, leafletLayer) => {

        leafletLayer.on({

          click: (event) => {

            handleFeatureClick(
              feature,
              event,
              layer
            )

          }

        })

      }}
    />

  ))
}
        
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

{selectedFeatureInfo?.coordinates && (

<Marker
  position={[
    selectedFeatureInfo.coordinates.lat,
    selectedFeatureInfo.coordinates.lng,
  ]}
/>

)}

        
      </MapContainer>

      {/* PANEL INFORMASI FEATURE */}
{selectedFeatureInfo && (

<FeatureInfoPanel

  info={selectedFeatureInfo}

  onClose={() =>
    setSelectedFeatureInfo(null)
  }

/>

)}

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

  onClose={() =>
    setShowAddModal(false)
  }

  onAdd={handleAddLayer}

  onAddFile={handleAddFileLayer}

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