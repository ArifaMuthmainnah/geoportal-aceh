function OwnerBadge({ name, avatar, className = '' }) {

  return (
    <span className={`dataset-owner-row ${className}`}>
      {avatar && (
        <img
          src={avatar}
          alt={name || 'Instansi'}
          className="dataset-owner-logo"
          onError={(event) => { event.currentTarget.style.display = 'none' }}
        />
      )}
      <span>{name || 'Tidak diketahui'}</span>
    </span>
  )

}

export default OwnerBadge