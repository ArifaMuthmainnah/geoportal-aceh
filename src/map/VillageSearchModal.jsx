import React, { useState } from 'react'

function VillageSearchModal({
  onClose,
  onSelectVillage
}) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim()

    if (!trimmedKeyword) {
      setResults([])
      setError('')
      setHasSearched(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      setHasSearched(true)

      const params = new URLSearchParams({
        name: trimmedKeyword,
        level: '4',
        limit: '20',
        page: '1',
      })

      const response = await fetch(
        `https://wilayah.smartartstudio.my.id/api/wilayah/search?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(
          `Gagal mencari desa: ${response.status}`
        )
      }

      const data = await response.json()

      const villages = data?.data || []

      setResults(villages)

    } catch (err) {
      console.error(
        'Gagal mencari desa:',
        err
      )

      setResults([])
      setError(
        'Terjadi kesalahan saat mencari desa.'
      )

    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (village) => {
    onSelectVillage(village)
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="aceh-modal dark-theme village-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="aceh-modal-header village-header">
          <span>Basis Desa</span>
        </div>

        <div className="modal-body">

          <div className="village-search-bar">

            <input
              type="text"
              placeholder="Masukkan nama desa..."
              value={keyword}
              onChange={(e) =>
                setKeyword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
            />

            <button
              className="btn-cari-village"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Mencari...' : 'Cari'}
            </button>

          </div>

          <div className="village-results-container">

            {error && (
              <p className="no-result">
                {error}
              </p>
            )}

            {!loading &&
              results.length > 0 &&
              results.map((village) => (

                <div
                  key={village.kode}
                  className="village-result-item"
                  onClick={() =>
                    handleSelect(village)
                  }
                >

                  <span className="pin-icon">
                    📍
                  </span>

                  <div className="location-text">

                    <div>
                      {village.nama}
                    </div>

                    <small>
                      {village.level}
                      {' • '}
                      {village.kode}
                    </small>

                  </div>

                </div>

              ))}

            {!loading &&
              hasSearched &&
              results.length === 0 &&
              !error && (

                <p className="no-result">
                  Desa tidak ditemukan...
                </p>

              )}

          </div>

        </div>

        <div className="modal-footer-village">

          <button
            className="btn-close-village"
            onClick={onClose}
          >
            <span className="close-icon">
              ✖
            </span>
            {' '}
            Close
          </button>

        </div>

      </div>
    </div>
  )
}

export default VillageSearchModal