import React, { useState } from 'react'

const dummyDatasets = [
  { id: 92, name: "Jumlah Penduduk Berdasar Agama", institution: "DISDUKCAPIL", category: "Batas Wilayah" },
  { id: 93, name: "Peta Jaringan Jalan Aceh", institution: "DISHUB", category: "Transportasi" },
  { id: 94, name: "Kawasan Hutan Lindung", institution: "DLHK", category: "Lingkungan" },
];

function AddLayerModal({ onClose, onAdd }) {
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = dummyDatasets.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="aceh-modal dark-theme large" onClick={e => e.stopPropagation()}>
        <div className="aceh-modal-header">
          <span>Tambahkan Peta</span>
          <button onClick={onClose} className="close-btn-x">✖</button>
        </div>
        
        <div className="modal-tabs">
          <button className="tab active">DATASET</button>
          <button className="tab">SIMPUL</button>
          <button className="tab">FILE</button>
        </div>

        <div className="modal-body">
          <div className="search-box-container">
             <input 
              type="text" 
              placeholder="Cari Peta Dataset..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
             <button className="btn-search">Cari</button>
          </div>

          <div className="dataset-list">
            {filtered.map(d => (
              <div 
                key={d.id} 
                className={`dataset-card ${selected?.id === d.id ? 'selected' : ''}`}
                onClick={() => setSelected(d)}
              >
                <div className="dataset-icon">🗺️</div>
                <div className="dataset-info">
                  <h6>[{d.id}] {d.name}</h6>
                  <p>Instansi : {d.institution}</p>
                  <p>Kategori : {d.category}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="selected-label">
            Selected Layer: <span className="highlight">{selected ? selected.name : '-'}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close-modal" onClick={onClose}>✖ Close</button>
          <button className="btn-add-modal" onClick={() => selected && onAdd(selected)}>➕ Add</button>
        </div>
      </div>
    </div>
  )
}

export default AddLayerModal