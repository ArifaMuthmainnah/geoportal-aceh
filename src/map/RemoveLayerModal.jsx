import React, { useState } from 'react'

function RemoveLayerModal({ layers, onClose, onRemove }) {
  const [toRemove, setToRemove] = useState([]);

  const toggleCheck = (id) => {
    setToRemove(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="aceh-modal dark-theme" onClick={e => e.stopPropagation()}>
        <div className="aceh-modal-header">
          <span>Remove Layers</span>
          <button onClick={onClose} className="close-btn-x">✖</button>
        </div>

        <div className="modal-body scrollable">
          {layers.map(l => (
            <label key={l.id} className="remove-item">
              <input 
                type="checkbox" 
                checked={toRemove.includes(l.id)} 
                onChange={() => toggleCheck(l.id)}
              />
              <span>{l.name}</span>
            </label>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-close-red" onClick={onClose}>✖ Close</button>
          <button className="btn-delete" onClick={() => onRemove(toRemove)}>🗑️ Hapus</button>
        </div>
      </div>
    </div>
  )
}

export default RemoveLayerModal