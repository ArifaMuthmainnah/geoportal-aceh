import { Link } from 'react-router'
import {
  mapCategory,
  getOwnerName,
  getOwnerAvatar,
  stripHtml,
} from '../utils/datasetUtils'

function DatasetCard({ dataset, owner }) {
  const description = stripHtml(
    dataset.abstract || dataset.description || ''
  )

  const category = mapCategory(
    dataset.category?.identifier
  )

  const ownerName = getOwnerName(owner)

  const ownerAvatar = getOwnerAvatar(owner)

  const thumbnail =
    dataset.thumbnail_url ||
    dataset.thumbnail ||
    dataset.thumbnailUrl ||
    null

  const isPublished =
    dataset.is_published === true ||
    dataset.published === true ||
    dataset.is_approved === true

  const formattedDate = dataset.date
    ? new Date(dataset.date).toLocaleDateString(
        'id-ID',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      )
    : '-'

  // =====================================================
  // TUJUAN LINK (fix #2)
  // =====================================================
  //
  // Card ini dipakai untuk dataset MAUPUN dashboard (mis.
  // di halaman detail JIGN yang menggabungkan keduanya).
  // Sebelumnya selalu diarahkan ke /katalog/:id walau
  // jenisnya dashboard, sehingga gagal diambil (endpoint
  // dataset dipanggil untuk id geoapp). Sekarang dicek
  // dulu resource_type-nya.
  //
  // =====================================================

  const linkTo =
    dataset.resource_type === 'dashboard'
      ? `/aplikasi/${dataset.pk}`
      : `/katalog/${dataset.pk}`

  return (
    <Link
      to={linkTo}
      className="text-decoration-none text-reset dataset-card-link"
    >
      <article className="card katalog-card h-100">

        {/* ================================
            THUMBNAIL
        ================================= */}
        <div className="katalog-card-image">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={dataset.title || 'Dataset'}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement.classList.add(
                  'has-image-error'
                )
              }}
            />
          ) : (
            <div className="katalog-card-image-placeholder">
              <span>GIS</span>
            </div>
          )}

          <div className="katalog-card-image-fallback">
            <span>GIS</span>
          </div>
        </div>

        {/* ================================
            CONTENT
        ================================= */}
        <div className="card-body katalog-card-body">

          {/* CATEGORY */}
          <span className="katalog-card-category">
            {category}
          </span>

          {/* TITLE */}
          <h5
            className="katalog-card-title"
            title={dataset.title || 'Tanpa judul'}
          >
            {dataset.title || 'Tanpa judul'}

            {!isPublished && (
              <span
                className="katalog-card-unpublished-icon"
                title="This resource is unpublished and not approved"
              >
                i
              </span>
            )}
          </h5>

          {/* DESCRIPTION */}
          <p className="katalog-card-description">
            {description.slice(0, 150)}
            {description.length > 150 ? '...' : ''}
          </p>

          {/* ================================
              OWNER + DATE
          ================================= */}
          <div className="katalog-card-meta">

            {/* OWNER */}
            <div
              className="katalog-card-owner"
              title={ownerName}
            >
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  className="katalog-card-owner-avatar"
                />
              ) : (
                <div className="katalog-card-owner-avatar-placeholder">
                  👤
                </div>
              )}

              <span className="katalog-card-owner-name">
                {ownerName}
              </span>
            </div>

            {/* DATE */}
            <small className="katalog-card-date">
              {formattedDate}
            </small>

          </div>

        </div>
      </article>
    </Link>
  )
}

export default DatasetCard