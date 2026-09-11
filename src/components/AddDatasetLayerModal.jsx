import { useEffect, useMemo, useState } from 'react'

import { getMyDatasets, getPublishedByType } from '../api/myDatasetApi'
import { getAllDatasets } from '../api/datasetApi'

// =====================================================
// SESI 17: MODAL PILIH DATASET UNTUK DIJADIKAN LAYER.
// Sekarang menampilkan dataset dari KEDUA sumber: upload
// sendiri (own) DAN dataset API Geoportal Aceh lama.
// =====================================================

function AddDatasetLayerModal({ onClose, onAdd, excludeKeys = [], saving = false }) {

  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)

  useEffect(() => {

    let cancelled = false

    async function load() {

      try {

        setLoading(true)

        // ---------- DATASET UPLOAD SENDIRI ----------

        let own = []
        try {
          const mine = await getMyDatasets()
          own = mine.filter((item) => item.resource_type === 'dataset')
        } catch (err) {
          console.error('Gagal mengambil dataset milik sendiri:', err)
        }

        let published = []
        try {
          published = await getPublishedByType('dataset')
        } catch (err) {
          console.error('Gagal mengambil dataset publik:', err)
        }

        const ownMap = new Map()

        ;[...own, ...published].forEach((item) => {
          ownMap.set(item.id, {
            key: `own-${item.id}`,
            id: item.id,
            source: 'own',
            title: item.title,
            category: item.category,
          })
        })

        let apiList = []
        try {
          const raw = await getAllDatasets()
          apiList = (Array.isArray(raw) ? raw : []).map((item) => ({
            key: `api-${item.pk}`,
            id: item.pk,
            source: 'api',
            title: item.title,
            category: item.category?.identifier,
          }))
        } catch (err) {
          console.error('Gagal mengambil dataset API lama:', err)
        }

        if (!cancelled) {
          setDatasets([...Array.from(ownMap.values()), ...apiList])
        }

      } finally {

        if (!cancelled) setLoading(false)

      }

    }

    load()

    return () => { cancelled = true }

  }, [])

  const filtered = useMemo(() => {

    const keyword = search.trim().toLowerCase()
    const list = datasets.filter((item) => !excludeKeys.includes(item.key))

    if (!keyword) return list

    return list.filter((item) =>
      String(item.title || '').toLowerCase().includes(keyword)
    )

  }, [datasets, search, excludeKeys])

  return (

    <div className="layer-modal-overlay" onClick={onClose}>

      <div className="layer-modal-box" onClick={(event) => event.stopPropagation()}>

        <div className="layer-modal-header">
          <h3>Tambah Dataset sebagai Layer</h3>
          <button type="button" className="layer-modal-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <div className="layer-modal-body">

          <input
            type="search"
            className="layer-modal-search"
            placeholder="Cari dataset (upload sendiri maupun API lama)..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {loading ? (

            <p className="layer-modal-loading">Memuat dataset...</p>

          ) : filtered.length === 0 ? (

            <p className="layer-modal-empty">Tidak ada dataset yang bisa ditambahkan.</p>

          ) : (

            <div className="layer-modal-list">
              {filtered.map((item) => (
                <label
                  key={item.key}
                  className={`layer-modal-item ${selectedKey === item.key ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="add-layer-dataset"
                    checked={selectedKey === item.key}
                    onChange={() => setSelectedKey(item.key)}
                  />
                  <div>
                    <strong>{item.title || 'Tanpa judul'}</strong>
                    <small>
                      {item.category || 'Tanpa kategori'}
                      {' · '}
                      <span className={`layer-modal-badge ${item.source}`}>
                        {item.source === 'api' ? 'API Lama' : 'Upload Sendiri'}
                      </span>
                    </small>
                  </div>
                </label>
              ))}
            </div>

          )}

        </div>

        <div className="layer-modal-footer">
          <button type="button" className="layer-modal-cancel-btn" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="layer-modal-add-btn"
            disabled={!selectedKey || saving}
            onClick={() => {
              const item = datasets.find((d) => d.key === selectedKey)
              if (item) onAdd(item)
            }}
          >
            {saving ? 'Menambahkan...' : 'Tambah'}
          </button>
        </div>

      </div>

    </div>

  )

}

export default AddDatasetLayerModal