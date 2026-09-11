function OwnerBadge({ name, avatar, className = '' }) {

  return (
    <span className={`dataset-owner-row ${className}`}>
      {avatar && (
        <img
          src={avatar}
          alt={name || 'Instansi'}
          className="dataset-owner-logo"
          style={{ width: 26, height: 26, maxWidth: 26, maxHeight: 26, objectFit: 'contain', flexShrink: 0 }}
          onError={(event) => { event.currentTarget.style.display = 'none' }}
        />
      )}
      <span>{name || 'Tidak diketahui'}</span>
    </span>
  )

}

export default OwnerBadge