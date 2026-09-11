import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getPublishedByType } from '../api/myDatasetApi'
import { adaptOwnResource } from '../utils/ownDataAdapter'
import {
  stripHtml,
  getOwnerName,
  getOwnerAvatar,
  markInformasiSeenNow,
} from '../utils/datasetUtils'

function formatDate(date) {
  if (!date) return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatEventDate(date) {
  if (!date) return null
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function Agenda() {

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState('newest')
  const [filterInstansi, setFilterInstansi] = useState('Semua')

  useEffect(() => {

    async function fetchData() {

      try {

        setLoading(true)

        const allInformasi = await getPublishedByType('informasi')
        const agendaItems =
          allInformasi
            .filter((item) => item.sub_type === 'agenda')
            .map(adaptOwnResource)

        setItems(agendaItems)

        markInformasiSeenNow('agenda')

      } catch (err) {

        console.error('Gagal mengambil agenda:', err)
        setItems([])

      } finally {

        setLoading(false)

      }

    }

    fetchData()

  }, [])

  const instansiOptions = useMemo(() => {
    const names = new Set()
    items.forEach((item) => names.add(getOwnerName(item.owner)))
    return ['Semua', ...Array.from(names).sort((a, b) => a.localeCompare(b))]
  }, [items])

  const activeFilterCount =
    (sortOrder !== 'newest' ? 1 : 0) +
    (filterInstansi !== 'Semua' ? 1 : 0)

  const filteredItems = items
    .filter((item) => {
      const keyword = search.toLowerCase().trim()
      const matchSearch = !keyword || (item.title || '').toLowerCase().includes(keyword)
      const matchInstansi = filterInstansi === 'Semua' || getOwnerName(item.owner) === filterInstansi
      return matchSearch && matchInstansi
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA
    })

  return (
    <main className="information-page">

      <section className="information-header">
        <div className="container information-header-inner">

          <div className="information-breadcrumb">
            <Link to="/">Home</Link><span> / </span><span className="current">Agenda</span>
          </div>

          <h1>Agenda</h1>
          <p>Informasi agenda dan kegiatan terkait geospasial Aceh.</p>
        </div>
      </section>

      <section className="container information-toolbar-wrapper">
        <div className="information-toolbar">

          <div className="information-toolbar-row">
            <input
              type="text"
              className="information-search"
              placeholder="Cari agenda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type="button"
              className="information-filter-btn"
              onClick={() => setFilterOpen((current) => !current)}
              aria-expanded={filterOpen}
            >
              <span>Filter</span>
              {activeFilterCount > 0 && <span className="filter-dot" />}
            </button>
          </div>

          {filterOpen && (
            <div className="information-filter-panel">

              <div>
                <label>Urutkan</label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>

              <div>
                <label>Instansi</label>
                <select value={filterInstansi} onChange={(e) => setFilterInstansi(e.target.value)}>
                  {instansiOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="information-filter-panel-actions">
                <button
                  type="button"
                  className="information-filter-close-btn"
                  onClick={() => setFilterOpen(false)}
                >
                  Tutup
                </button>
              </div>

            </div>
          )}

          <small className="information-result-count">Menampilkan {filteredItems.length} agenda</small>
        </div>
      </section>

      <section className="container information-content">

        {loading && (
          <div className="information-empty">
            <p>Memuat agenda...</p>
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="information-empty">
            <h5>Belum ada agenda</h5>
            <p>Agenda akan tampil di sini setelah dipublikasikan.</p>
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="row g-4 pb-5">
            {filteredItems.map((item) => {

              const ownerName = getOwnerName(item.owner)
              const ownerAvatar = getOwnerAvatar(item.owner)
              const description = stripHtml(item.abstract || '')
              const eventDateLabel = formatEventDate(item.event_date)

              return (
                <div className="col-md-6 col-lg-4" key={item.id}>
                  <article className="card katalog-card h-100">

                    <div className="katalog-card-image">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title || 'Agenda'}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.parentElement.classList.add('has-image-error')
                          }}
                        />
                      ) : (
                        <div className="katalog-card-image-placeholder">
                          <span>AGENDA</span>
                        </div>
                      )}
                      <div className="katalog-card-image-fallback">
                        <span>AGENDA</span>
                      </div>
                    </div>

                    <div className="card-body katalog-card-body">

                      <span className="katalog-card-category">AGENDA</span>

                      <h5 className="katalog-card-title" title={item.title || 'Tanpa judul'}>
                        {item.title || 'Tanpa judul'}
                      </h5>

                      <p className="katalog-card-description">
                        {description.slice(0, 150)}
                        {description.length > 150 ? '...' : ''}
                      </p>

                      {(eventDateLabel || item.event_time || item.event_location) && (
                        <div className="katalog-card-agenda-schedule">
                          {eventDateLabel && <div><span>📅 {eventDateLabel}</span></div>}
                          {item.event_time && <div><span>🕐 {item.event_time}</span></div>}
                          {item.event_location && <div><span>📍 {item.event_location}</span></div>}
                        </div>
                      )}

                      {item.external_url && (
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="katalog-card-watch-btn"
                        >
                          <span>▶</span> Tonton Sekarang
                        </a>
                      )}

                      <div className="katalog-card-meta">

                        <div className="katalog-card-owner" title={ownerName}>
                          {ownerAvatar ? (
                            <img src={ownerAvatar} alt={ownerName} className="katalog-card-owner-avatar" />
                          ) : (
                            <div className="katalog-card-owner-avatar-placeholder">👤</div>
                          )}
                          <span className="katalog-card-owner-name">{ownerName}</span>
                        </div>

                        <small className="katalog-card-date">{formatDate(item.date)}</small>

                      </div>

                    </div>

                  </article>

                </div>
              )

            })}
          </div>
        )}

      </section>

    </main>
  )
}

export default Agenda