import React, { useState } from 'react'

const dummyLocations = [
  { id: 1, name: "SDN 3 Banda Aceh", address: "Jl. Teungku Chik Ditiro, Peuniti, Baiturrahman", coords: [5.548, 95.323] },
  { id: 2, name: "Masjid Raya Baiturrahman", address: "Jl. Moh. Jam, Banda Aceh", coords: [5.553, 95.317] },
  { id: 3, name: "Pelabuhan Ulee Lheue", address: "Kec. Meuraxa, Banda Aceh", coords: [5.545, 95.285] },
  { id: 4, name: "Kantor Gubernur Aceh", address: "Jl. Teuku Nyak Arief, Banda Aceh", coords: [5.565, 95.337] },
];

function SearchPanel({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    if (!query) {
      setResults([]);
      return;
    }
    const filtered = dummyLocations.filter(loc => 
      loc.name.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  }

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <h6>Pencarian</h6>
      </div>

      <div className="search-input-group">
        <input 
          type="text" 
          placeholder="Cari Lokasi..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        {query && <button className="btn-clear-search" onClick={clearSearch}>✖</button>}
        <button className="btn-search-icon" onClick={handleSearch}>🔍</button>
      </div>

      {results.length > 0 && (
        <div className="search-results-list">
          {results.map(loc => (
            <div 
              key={loc.id} 
              className="search-result-item"
              onClick={() => onSelectLocation(loc.coords)}
            >
              <div className="res-name">{loc.name}</div>
              <div className="res-address">{loc.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchPanel