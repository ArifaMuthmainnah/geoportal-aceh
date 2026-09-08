import React, { useState } from 'react'

function SearchPanel({ onSelectLocation }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    const keyword = query.trim()

    if (!keyword) {
      setResults([])
      setError('')
      setHasSearched(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      setHasSearched(true)
      setResults([])

      const params = new URLSearchParams({
        q: keyword,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '5',

        // Batasi hasil ke Indonesia
        countrycodes: 'id',

        // Prioritaskan bahasa Indonesia
        'accept-language': 'id',

        // Bias pencarian ke wilayah Aceh.
        // bounded=0 artinya lokasi di luar kotak ini
        // masih boleh muncul jika memang paling cocok.
        viewbox: '94.9,6.7,98.7,1.8',
        bounded: '0',
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(
          `Nominatim error: ${response.status}`
        )
      }

      const data = await response.json()

      const formattedResults = data.map((item) => {
        const lat = Number(item.lat)
        const lon = Number(item.lon)

        const displayName =
          item.display_name || 'Lokasi'

        // Ambil bagian pertama dari display_name
        // sebagai nama utama jika field name tidak tersedia.
        const locationName =
          item.name ||
          displayName.split(',')[0] ||
          'Lokasi'

        return {
          id: `${item.osm_type}-${item.osm_id}`,
          name: locationName,
          address: displayName,
          coords: [lat, lon],
          type: item.type,
        }
      })

      setResults(formattedResults)

    } catch (err) {
      console.error(
        'Gagal mencari lokasi:',
        err
      )

      setResults([])
      setError(
        'Gagal mencari lokasi. Silakan coba lagi.'
      )

    } finally {
      setLoading(false)
    }
  }


  const clearSearch = () => {
    setQuery('')
    setResults([])
    setError('')
    setHasSearched(false)
  }


  const handleSelectLocation = (location) => {
    onSelectLocation(location.coords)
  
    // Tampilkan nama lokasi yang dipilih di input
    setQuery(location.name)
  
    // Tutup daftar hasil
    setResults([])
  
    // Pencarian sudah berhasil dipilih,
    // jadi jangan tampilkan "Lokasi tidak ditemukan"
    setHasSearched(false)
  
    setError('')
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
          onChange={(e) =>
            setQuery(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
        />


        {query && (
          <button
            type="button"
            className="btn-clear-search"
            onClick={clearSearch}
            title="Hapus pencarian"
          >
            ✖
          </button>
        )}


        <button
          type="button"
          className="btn-search-icon"
          onClick={handleSearch}
          disabled={loading}
          title="Cari lokasi"
        >
          {loading ? '...' : '🔍'}
        </button>

      </div>


      {/* LOADING */}
      {loading && (
        <div className="search-status">
          Mencari lokasi...
        </div>
      )}


      {/* ERROR */}
      {error && (
        <div className="search-error">
          {error}
        </div>
      )}


      {/* TIDAK DITEMUKAN */}
      {!loading &&
        !error &&
        hasSearched &&
        results.length === 0 && (
          <div className="search-no-result">
            Lokasi tidak ditemukan.
          </div>
        )}


      {/* HASIL PENCARIAN */}
      {results.length > 0 && (

        <div className="search-results-list">

          {results.map((loc) => (

            <div
              key={loc.id}
              className="search-result-item"
              onClick={() =>
                handleSelectLocation(loc)
              }
            >

              <div className="res-name">
                {loc.name}
              </div>

              <div className="res-address">
                {loc.address}
              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  )
}

export default SearchPanel