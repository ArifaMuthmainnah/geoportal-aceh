import React from 'react'

function FeatureInfoPanel({ info, onClose }) {
  if (!info) return null

  const {
    layerName,
    coordinates,
    attributes = [],
  } = info

  return (
    <div className="feature-info-panel">

      {/* HEADER */}
      <div className="feature-info-header">
        <div className="feature-info-title">
          <span className="feature-location-icon">📍</span>
          <span>Informasi Objek</span>
        </div>

        <button
          type="button"
          className="feature-info-close"
          onClick={onClose}
          title="Tutup"
        >
          ✕
        </button>
      </div>

      <div className="feature-info-layer">
        <span className="feature-layer-icon">🗺️</span>
        <span>{layerName || 'Layer'}</span>
      </div>

      {coordinates && (
        <div className="feature-info-coordinate">
          <span>📍</span>

          <strong>
            Lat: {coordinates.lat.toFixed(5)}
            {'  -  '}
            Long: {coordinates.lng.toFixed(5)}
          </strong>
        </div>
      )}

      <div className="feature-info-body">

        {attributes.length > 0 ? (
          attributes.map((attribute, index) => (
            <div
              className="feature-attribute-row"
              key={`${attribute.key}-${index}`}
            >
              <div className="feature-attribute-key">
                {attribute.label}:
              </div>

              <div className="feature-attribute-value">
                {attribute.value}
              </div>
            </div>
          ))
        ) : (
          <div className="feature-info-empty">
            Tidak ada informasi atribut yang tersedia.
          </div>
        )}

      </div>

    </div>
  )
}

export default FeatureInfoPanel