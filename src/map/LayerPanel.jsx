import React from 'react'

function LayerPanel({ layers = [], toggleLayer, openBasemap, openAdd, openRemove, openVillageSearch }) {
  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h6>Layer Peta</h6>
      </div>
      
      {/* TOOLBAR ICON */}
      <div className="layer-toolbar">
        <button className="tool-box" onClick={openBasemap} title="Basemap"><span>🗺️</span></button>
        <button className="tool-box" onClick={openRemove} title="Hapus Peta"><span>🗑️</span></button>
        <button className="tool-box" onClick={openAdd} title="Tambah Peta"><span>➕</span></button>
        <button className="tool-box" onClick={openVillageSearch} title="Pencarian Lokasi Desa"><span>📍</span></button>
      </div>

      {/* LIST LAYER (BODY) */}
      <div className="layer-panel-body">
        {layers && layers.length > 0 ? (
          layers.map((layer) => (
            <div key={layer.id} className="layer-item-wrapper">
              <label className="layer-item">
                <input 
                  type="checkbox" 
                  checked={layer.visible} 
                  onChange={() => toggleLayer(layer.id)}
                />
                <span>{layer.name}</span>
              </label>
            </div>
          ))
        ) : (
          <p className="loading-text">Memuat data layer...</p>
        )}
      </div>
    </div>
  )
}

export default LayerPanel