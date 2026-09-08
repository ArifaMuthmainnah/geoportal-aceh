import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { getPublishedDetail } from '../api/myDatasetApi'
import { adaptOwnResource } from '../utils/ownDataAdapter'
import { getOwnerName, getOwnerAvatar, stripHtml } from '../utils/datasetUtils'

import CopyLinkButton from '../components/CopyLinkButton'
import BackToTopButton from '../components/BackToTopButton'

function formatDateOnly(date) {
  if (!date) return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PemberitahuanDetail() {

  const { id } = useParams()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    async function fetchDetail() {

      try {

        setLoading(true)
        setError('')

        const rawId = String(id || '').replace(/^own-/, '')
        const raw = await getPublishedDetail(rawId)

        if (!raw || raw.resource_type !== 'informasi' || raw.sub_type !== 'pemberitahuan') {
          setError('Pemberitahuan tidak ditemukan.')
          setItem(null)
          return
        }

        setItem(adaptOwnResource(raw))

      } catch (err) {

        console.error('Gagal mengambil detail pemberitahuan:', err)
        setError('Gagal mengambil detail pemberitahuan.')

      } finally {

        setLoading(false)

      }

    }

    if (id) fetchDetail()

  }, [id])

  if (loading) {
    return (
      <main className="dataset-detail-page">
        <div className="container py-5"><p>Memuat pemberitahuan...</p></div>
      </main>
    )
  }

  if (error || !item) {
    return (
      <main className="dataset-detail-page">
        <div className="container py-5">
          <h4>Pemberitahuan tidak ditemukan</h4>
          <p>{error || 'Data pemberitahuan tidak tersedia.'}</p>
          <Link to="/informasi/pemberitahuan" className="btn btn-primary">Kembali ke Pemberitahuan</Link>
        </div>
      </main>
    )
  }

  const ownerName = getOwnerName(item.owner)
  const ownerAvatar = getOwnerAvatar(item.owner)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const fullDescription = stripHtml(item.abstract || '')
  const teaserDescription =
    fullDescription.length > 220 ? `${fullDescription.slice(0, 220)}...` : fullDescription

  return (
    <main className="dataset-detail-page">

      {/* =================================================
          HEADER — tema biru sama seperti halaman detail
          Dataset / Peta / Dokumen / Dashboard-Aplikasi
      ================================================= */}

      <section className="dataset-detail-header">
        <div className="container">

          <div className="dataset-detail-topbar">
            <BackToTopButton to="/informasi/pemberitahuan" label="Kembali ke Pemberitahuan" />
          </div>

          <div className="dataset-breadcrumb">
            <Link to="/informasi/pemberitahuan">Pemberitahuan</Link>
            <span> / </span>
            <span>Detail</span>
          </div>

          <div className="dataset-resource-type">
            <span className="dataset-type-icon">📢</span>
            <span>Pemberitahuan</span>
            <span className="dataset-from">dari</span>
            <span className="dataset-owner-link">{ownerName}</span>
            <span className="dataset-from">/</span>
            <span>{formatDateOnly(item.date)}</span>
          </div>

          <div className="dataset-title-row">
            <h1>{item.title}</h1>
            <CopyLinkButton text={shareUrl} label="Salin tautan halaman ini" className="on-dark" />
          </div>

          {teaserDescription && (
            <p className="dataset-header-description">{teaserDescription}</p>
          )}

        </div>
      </section>

      {/* =================================================
          ISI PEMBERITAHUAN — cuma teks & foto (kalau ada),
          tanpa tab Info/Location/Attributes/Assets.
      ================================================= */}

      <section className="container dataset-detail-content informasi-detail-content">

        {item.thumbnail_url && (
          <div className="informasi-detail-cover">
            <img src={item.thumbnail_url} alt={item.title} loading="lazy" />
          </div>
        )}

        <article className="informasi-detail-body">
          {fullDescription || 'Belum ada isi pemberitahuan.'}
        </article>

      </section>

    </main>
  )
}

export default PemberitahuanDetail