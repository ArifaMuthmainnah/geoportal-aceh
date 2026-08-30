import { Link } from 'react-router'
import { stripHtml } from '../utils/datasetUtils'


function GeoappCard({ application }) {

  const description = stripHtml(application.abstract || application.description || '')

  const title = application.title || application.name || 'Tanpa judul'

  const ownerName =
    application.owner?.first_name ||
    application.owner?.username ||
    application.metadata_author?.[0]?.username ||
    'Tidak diketahui'

  const ownerAvatar =
    application.owner?.avatar ||
    application.metadata_author?.[0]?.avatar ||
    null

  const thumbnail =
    application.thumbnail_url ||
    application.links?.find((link) => link.link_type === 'image')?.url ||
    null

  const formattedDate =
    application.date
      ? new Date(application.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-'

  const category =
    application.resource_type === 'dashboard'
      ? 'Dashboard'
      : application.category?.identifier || 'Aplikasi'

  // #9: selalu ke halaman detail INTERNAL kita, bukan langsung ke link luar
  const internalDetailUrl = `/aplikasi/${application.pk || application.uuid || application.id}`


  return (

    <Link
      to={internalDetailUrl}
      className="text-decoration-none text-reset dataset-card-link"
    >
      <article className="card katalog-card h-100">

        <div className="katalog-card-image">

          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement.classList.add('has-image-error')
              }}
            />
          ) : (
            <div className="katalog-card-image-placeholder"><span>GIS</span></div>
          )}

          <div className="katalog-card-image-fallback"><span>GIS</span></div>

        </div>


        <div className="card-body katalog-card-body">

          <span className="katalog-card-category">{category}</span>

          <h5 className="katalog-card-title" title={title}>{title}</h5>

          <p className="katalog-card-description">
            {description.slice(0, 150)}{description.length > 150 ? '...' : ''}
          </p>

          <div className="katalog-card-meta">

            <div className="katalog-card-owner" title={ownerName}>
              {ownerAvatar ? (
                <img src={ownerAvatar} alt={ownerName} className="katalog-card-owner-avatar" />
              ) : (
                <div className="katalog-card-owner-avatar-placeholder">👤</div>
              )}
              <span className="katalog-card-owner-name">{ownerName}</span>
            </div>

            <small className="katalog-card-date">{formattedDate}</small>

          </div>

        </div>

      </article>
    </Link>

  )
}


export default GeoappCard