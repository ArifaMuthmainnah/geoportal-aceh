import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useParams,
} from 'react-router'
import {
  getOwners,
} from '../api/jignApi'
import {
  getDatasets,
} from '../api/datasetApi'
import {
  getAllGeoapps,
} from '../api/geoappApi'
import {
  getPublishedDatasets,
} from '../api/myDatasetApi'
import {
  mergeResourceLists,
  sortByDateDesc,
} from '../utils/ownDataAdapter'
import DatasetCard from '../components/DatasetCard'

function JIGNDetail() {

  const { username } = useParams()

  const [owner, setOwner] = useState(null)
  const [resources, setResources] = useState([])
  const [typeFilter, setTypeFilter] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    let mounted = true

    async function fetchData() {

      try {

        setLoading(true)
        setError('')

        try {
          const ownerResponse = await getOwners()
          const ownerList =
            Array.isArray(ownerResponse) ? ownerResponse : ownerResponse?.results || ownerResponse?.owners || []
          const foundOwner = ownerList.find((item) => item.username === username) || null
          if (mounted) setOwner(foundOwner)
        } catch (err) {
          console.error('Gagal mengambil info owner:', err)
        }

        let oldDatasets = []
        try {
          const response = await getDatasets(`?page_size=100`)
          const rawList = Array.isArray(response) ? response : response?.results || response?.datasets || []
          oldDatasets = rawList.filter((item) => item?.owner?.username === username)
        } catch (err) {
          console.error('Gagal mengambil dataset owner API lama:', err)
        }

        // =====================================================
        // FIX #2: tandai setiap geoapp dengan resource_type =
        // 'dashboard' secara eksplisit. Data mentah dari API
        // lama tidak selalu punya field ini, padahal DatasetCard
        // memakainya untuk menentukan tujuan link (/aplikasi/:id
        // vs /katalog/:id). Tanpa ini, klik dashboard di halaman
        // JIGN salah diarahkan ke endpoint dataset dan gagal.
        // =====================================================

        let oldGeoapps = []
        try {
          const response = await getAllGeoapps()
          const rawList = Array.isArray(response) ? response : []
          oldGeoapps =
            rawList
              .filter((item) => item?.owner?.username === username)
              .map((item) => ({ ...item, resource_type: 'dashboard' }))
        } catch (err) {
          console.error('Gagal mengambil geoapp owner API lama:', err)
        }

        let ownResources = []
        try {
          const allOwn = await getPublishedDatasets()
          ownResources = allOwn.filter((item) => item.owner_username === username)
        } catch (err) {
          console.error('Gagal mengambil data lokal owner:', err)
        }

        if (!mounted) return

        const merged =
          sortByDateDesc(mergeResourceLists([...oldDatasets, ...oldGeoapps], ownResources))

        setResources(merged)

      } catch (err) {

        console.error('Gagal memuat detail instansi:', err)
        if (mounted) setError('Gagal memuat detail instansi.')

      } finally {

        if (mounted) setLoading(false)

      }

    }

    if (username) fetchData()

    return () => { mounted = false }

  }, [username])

  const filteredResources = useMemo(() => {
    if (typeFilter === 'Semua') return resources
    return resources.filter((item) => {
      const type = item.resource_type === 'dashboard' ? 'dashboard' : 'dataset'
      return type === typeFilter
    })
  }, [resources, typeFilter])

  const displayName =
    owner
      ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.username
      : username

  return (

    <main className="jign-page">

      <section className="catalog-hero">
        <div className="container">

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

            <Link
              to="/jign"
              style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none', fontSize: '14px' }}
            >
              ← Kembali
            </Link>

            {/* =====================================================
                FIX #1: pakai class badge yang sama dengan halaman
                detail aplikasi (application-detail-category), yang
                berbentuk pill kecil — bukan teks eyebrow yang
                melebar sampai ujung kotak.
            ===================================================== */}

            <span
              style={{
                display: 'inline-block',
                width: 'fit-content',
                marginTop: '10px',
                padding: '6px 16px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.15)',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              {displayName || 'Instansi'}
            </span>

            <h1 style={{ margin: 0 }}>Simpul Jaringan</h1>

            <p style={{ margin: 0 }}>@{username}</p>

          </div>

        </div>
      </section>


      <section className="container jign-content-section">

        <div className="jign-heading">
          <div className="jign-heading-text">
            <span className="section-eyebrow">DATA TERSEDIA</span>
            <h2>Dataset & Aplikasi dari Instansi Ini</h2>
            <p>Menampilkan {filteredResources.length} data yang telah dipublikasikan oleh instansi ini.</p>
          </div>
        </div>

        <div className="information-categories" style={{ marginBottom: '20px' }}>
          {[
            { key: 'Semua', label: 'Semua' },
            { key: 'dataset', label: 'Dataset' },
            { key: 'dashboard', label: 'Dashboard' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              className={`information-category ${typeFilter === option.key ? 'active' : ''}`}
              onClick={() => setTypeFilter(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="information-empty"><p>Memuat data instansi...</p></div>
        )}

        {!loading && error && (
          <div className="information-empty"><p>{error}</p></div>
        )}

        {!loading && !error && filteredResources.length > 0 && (
          <div className="row g-4" style={{ marginBottom: '40px' }}>
            {filteredResources.map((resource) => (
              <div className="col-md-6 col-lg-4" key={resource.pk || resource.uuid || resource.id}>
                <DatasetCard dataset={resource} owner={resource.owner || owner} />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredResources.length === 0 && (
          <div className="information-empty" style={{ marginBottom: '40px' }}>
            <h5>Belum ada data</h5>
            <p>Instansi ini belum mempublikasikan data apa pun untuk kategori ini.</p>
          </div>
        )}

      </section>

    </main>

  )

}

export default JIGNDetail