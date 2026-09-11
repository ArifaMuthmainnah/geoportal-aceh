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
  getAllMaps,
} from '../api/mapApi'
import {
  getAllDocuments,
} from '../api/documentApi'
import {
  getPublishedDatasets,
} from '../api/myDatasetApi'
import {
  getAgencyProfile,
  updateAgencyProfile,
} from '../api/agencyApi'
import {
  mergeResourceLists,
  sortByDateDesc,
} from '../utils/ownDataAdapter'
import { getOwnerAvatar } from '../utils/datasetUtils'
import { useAuth } from '../context/AuthContext'
import DatasetCard from '../components/DatasetCard'
import CopyLinkButton from '../components/CopyLinkButton'
import BackToTopButton from '../components/BackToTopButton'

function getResourceBucket(item) {
  const type = item?.resource_type
  if (type === 'dashboard') return 'dashboard'
  if (type === 'application') return 'application'
  if (type === 'map') return 'map'
  if (type === 'document') return 'document'
  if (type === 'informasi') return 'informasi'
  return 'dataset'
}

const JIGN_FILTER_OPTIONS = [
  { key: 'Semua', label: 'Semua' },
  { key: 'dataset', label: 'Dataset' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'application', label: 'Aplikasi' },
  { key: 'map', label: 'Peta' },
  { key: 'document', label: 'Dokumen' },
  { key: 'informasi', label: 'Informasi' },
]


function JIGNDetail() {

  const { username } = useParams()
  const { isAdmin } = useAuth()
  const [owner, setOwner] = useState(null)
  const [resources, setResources] = useState([])
  const [typeFilter, setTypeFilter] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agencyProfile, setAgencyProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState({ description: '', website_url: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

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

        let oldMaps = []
        try {
          const response = await getAllMaps()
          const rawList = Array.isArray(response) ? response : []
          oldMaps =
            rawList
              .filter((item) => item?.owner?.username === username)
              .map((item) => ({ ...item, resource_type: 'map' }))
        } catch (err) {
          console.error('Gagal mengambil peta owner API lama:', err)
        }

        let oldDocuments = []
        try {
          const response = await getAllDocuments()
          const rawList = Array.isArray(response) ? response : []
          oldDocuments =
            rawList
              .filter((item) => item?.owner?.username === username)
              .map((item) => ({ ...item, resource_type: 'document' }))
        } catch (err) {
          console.error('Gagal mengambil dokumen owner API lama:', err)
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
          sortByDateDesc(
            mergeResourceLists(
              [...oldDatasets, ...oldGeoapps, ...oldMaps, ...oldDocuments],
              ownResources
            )
          )

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

  useEffect(() => {

    let mounted = true

    async function fetchProfile() {

      if (!username) return

      setProfileLoading(true)

      try {

        const profile = await getAgencyProfile(username)

        if (mounted) {
          setAgencyProfile(profile)
          setProfileDraft({
            description: profile?.description || '',
            website_url: profile?.website_url || '',
          })
        }

      } finally {

        if (mounted) setProfileLoading(false)

      }

    }

    fetchProfile()

    return () => { mounted = false }

  }, [username])


  async function handleSaveProfile(event) {

    event.preventDefault()

    setSavingProfile(true)
    setProfileError('')

    try {

      const response = await updateAgencyProfile(username, profileDraft)

      setAgencyProfile(
        response?.profile || { username, ...profileDraft }
      )

      setIsEditingProfile(false)

    } catch (err) {

      console.error('Gagal menyimpan profil instansi:', err)
      setProfileError(err.message || 'Gagal menyimpan profil instansi.')

    } finally {

      setSavingProfile(false)

    }

  }

  const filteredResources = useMemo(() => {
    if (typeFilter === 'Semua') return resources
    return resources.filter((item) => getResourceBucket(item) === typeFilter)
  }, [resources, typeFilter])

  const displayName =
    owner
      ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.username
      : username

  const ownerAvatar = getOwnerAvatar(owner)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (

    <main className="jign-page">

      <section className="catalog-hero">
        <div className="container">

          <div style={{ marginBottom: '22px' }}>
            <BackToTopButton to="/jign" label="Kembali ke JIGN" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                width: 'fit-content',
                padding: '6px 16px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.15)',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              {ownerAvatar && (
                <img
                  src={ownerAvatar}
                  alt={displayName || 'Instansi'}
                  className="dataset-owner-logo"
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                />
              )}
              {displayName || 'Instansi'}
            </span>

            <div className="dataset-title-row">
              <h1 style={{ margin: 0 }}>Simpul Jaringan</h1>
              <CopyLinkButton text={shareUrl} label="Salin tautan halaman ini" className="on-dark" />
            </div>

            <p style={{ margin: 0 }}>@{username}</p>

          </div>

        </div>
      </section>


      <section className="container jign-content-section">
        <div
          style={{
            marginBottom: '32px',
            padding: '24px',
            border: '1px solid #e0e8f1',
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 7px 20px rgba(8, 59, 115, 0.045)',
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '14px',
            }}
          >

            <div>
              <span className="section-eyebrow">TENTANG INSTANSI</span>
              <h3 style={{ margin: '6px 0 0', color: '#083b73', fontSize: '1.15rem', fontWeight: 800 }}>
                {displayName}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

              {agencyProfile?.website_url && (
                <a
                  href={agencyProfile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-tooltip-btn"
                  data-tooltip="Kunjungi situs resmi instansi"
                  aria-label="Kunjungi situs resmi instansi"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#eef5fb',
                    color: '#0b5cab',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18" />
                    <path d="M12 3c2.5 2.7 4 6.1 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6.1-4-9s1.5-6.3 4-9z" />
                  </svg>
                </a>
              )}

              {isAdmin && !isEditingProfile && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                  onClick={() => setIsEditingProfile(true)}
                >
                  {agencyProfile ? 'Edit Profil' : '+ Lengkapi Profil'}
                </button>
              )}

            </div>

          </div>

          {isEditingProfile ? (

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {profileError && (
                <div className="admin-alert">{profileError}</div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Deskripsi Instansi
                </label>
                <textarea
                  rows={3}
                  value={profileDraft.description}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Tuliskan deskripsi singkat tentang instansi ini..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d8e2ed', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Link Website Resmi
                </label>
                <input
                  type="url"
                  value={profileDraft.website_url}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, website_url: event.target.value }))}
                  placeholder="https://situs-resmi-instansi.go.id"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d8e2ed', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="admin-view-site" disabled={savingProfile}>
                  {savingProfile ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => {
                    setIsEditingProfile(false)
                    setProfileError('')
                    setProfileDraft({
                      description: agencyProfile?.description || '',
                      website_url: agencyProfile?.website_url || '',
                    })
                  }}
                >
                  Batal
                </button>
              </div>

            </form>

          ) : (

            <p style={{ margin: 0, color: '#5b6b7a', fontSize: '0.9rem', lineHeight: 1.7 }}>
              {profileLoading
                ? 'Memuat profil instansi...'
                : (agencyProfile?.description || 'Instansi ini belum melengkapi deskripsi profil.')}
            </p>

          )}

        </div>


        <div className="jign-heading">
          <div className="jign-heading-text">
            <span className="section-eyebrow">DATA TERSEDIA</span>
            <h2>Dataset & Aplikasi dari Instansi Ini</h2>
            <p>Menampilkan {filteredResources.length} data yang telah dipublikasikan oleh instansi ini.</p>
          </div>
        </div>

        <div className="information-categories" style={{ marginBottom: '20px' }}>
          {JIGN_FILTER_OPTIONS.map((option) => (
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