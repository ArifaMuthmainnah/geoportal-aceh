function LayerPanel() {
    return (
      <div className="layer-panel">
  
        <div className="layer-panel-header">
          <h6>Layer</h6>
        </div>
  
        <div className="layer-panel-body">
  
          <label className="layer-item">
            <input type="checkbox" defaultChecked />
            <span>Batas Administrasi</span>
          </label>
  
          <label className="layer-item">
            <input type="checkbox" defaultChecked />
            <span>Lokasi</span>
          </label>
  
          <label className="layer-item">
            <input type="checkbox" />
            <span>Jaringan Jalan</span>
          </label>
  
          <label className="layer-item">
            <input type="checkbox" />
            <span>Sungai</span>
          </label>
  
        </div>
  
      </div>
    )
  }
  
  export default LayerPanel