import { stripHtml } from '../utils/datasetUtils'


function GeoappCard({ application }) {

  // =====================================================
  // DESCRIPTION
  // =====================================================

  const description = stripHtml(
    application.abstract ||
    application.description ||
    ''
  )


  // =====================================================
  // TITLE
  // =====================================================

  const title =
    application.title ||
    application.name ||
    'Tanpa judul'


  // =====================================================
  // OWNER
  // =====================================================

  const ownerName =
    application.owner?.first_name ||
    application.owner?.username ||
    application.metadata_author?.[0]?.username ||
    'Tidak diketahui'


  // =====================================================
  // AVATAR
  // =====================================================

  const ownerAvatar =
    application.owner?.avatar ||
    application.metadata_author?.[0]?.avatar ||
    null


  // =====================================================
  // THUMBNAIL
  // =====================================================

  const thumbnail =
    application.thumbnail_url ||
    application.links?.find(
      (link) =>
        link.link_type === 'image'
    )?.url ||
    null


  // =====================================================
  // DATE
  // =====================================================

  const formattedDate =
    application.date
      ? new Date(
          application.date
        ).toLocaleDateString(
          'id-ID',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }
        )
      : '-'


  // =====================================================
  // CATEGORY
  // =====================================================

  const category =
  application.resource_type === 'dashboard'
    ? 'Dashboard'
    : application.category?.identifier ||
      'Aplikasi'


  // =====================================================
  // OPEN URL
  // =====================================================

  const applicationUrl =
    application.detail_url ||
    application.embed_url ||
    '#'


  return (

    <article className="card katalog-card h-100">

      {/* =========================================
          THUMBNAIL
      ========================================= */}

      <div className="katalog-card-image">

        {thumbnail ? (

          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display =
                'none'

              e.currentTarget.parentElement.classList.add(
                'has-image-error'
              )
            }}
          />

        ) : (

          <div className="katalog-card-image-placeholder">

            <span>
              GIS
            </span>

          </div>

        )}

        <div className="katalog-card-image-fallback">

          <span>
            GIS
          </span>

        </div>

      </div>


      {/* =========================================
          CONTENT
      ========================================= */}

      <div className="card-body katalog-card-body">

        {/* CATEGORY */}

        <span className="katalog-card-category">

          {category}

        </span>


        {/* TITLE */}

        <h5
          className="katalog-card-title"
          title={title}
        >
          {title}
        </h5>


        {/* DESCRIPTION */}

        <p className="katalog-card-description">

          {description.slice(0, 150)}

          {description.length > 150
            ? '...'
            : ''}

        </p>


        {/* =====================================
            OWNER + DATE
        ===================================== */}

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


        {/* =====================================
            ACTION
        ===================================== */}

        <a
          href={applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="application-card-button"
        >

          Buka Aplikasi

          <span>
            →
          </span>

        </a>

      </div>

    </article>

  )
}


export default GeoappCard