import React, { useState } from 'react'

const dummyAcehVillages = [
  { id: 1, text: "BANDA ACEH, Meuraxa, Ulee Lheue" },
  { id: 2, text: "BANDA ACEH, Kuta Alam, Peunayong" },
  { id: 3, text: "ACEH BESAR, Darul Imarah, Garot" },
  { id: 4, text: "ACEH BESAR, Ingin Jaya, Lambaro" },
  { id: 5, text: "PIDIE, Sigli, Blang Paseh" },
];

function VillageSearchModal({ onClose }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    if (!keyword) {
      setResults([]);
      return;
    }
    const filtered = dummyAcehVillages.filter(v => 
      v.text.toLowerCase().includes(keyword.toLowerCase())
    );
    setResults(filtered);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="aceh-modal dark-theme village-modal" onClick={e => e.stopPropagation()}>
        <div className="aceh-modal-header village-header">
          <span>Basis Desa</span>
        </div>

        <div className="modal-body">
          <div className="village-search-bar">
            <input 
              type="text" 
              placeholder="Masukkan nama desa..." 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-cari-village" onClick={handleSearch}>Cari</button>
          </div>

          <div className="village-results-container">
            {results.length > 0 ? (
              results.map(r => (
                <div key={r.id} className="village-result-item">
                  <span className="pin-icon">📍</span>
                  <span className="location-text">{r.text}</span>
                </div>
              ))
            ) : keyword && (
              <p className="no-result">Desa tidak ditemukan...</p>
            )}
          </div>
        </div>

        <div className="modal-footer-village">
          <button className="btn-close-village" onClick={onClose}>
            <span className="close-icon">✖</span> Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default VillageSearchModal