export function isValidUrl(value) {

  if (!value || !value.trim()) {
    return true
  }

  try {

    const url = new URL(value.trim())

    return url.protocol === 'http:' || url.protocol === 'https:'

  } catch {

    return false

  }

}

export function urlErrorMessage(value, { required = false, label = 'Link' } = {}) {

  const trimmed = (value || '').trim()

  if (!trimmed) {
    return required ? `${label} wajib diisi.` : ''
  }

  if (!isValidUrl(trimmed)) {
    return `Format ${label.toLowerCase()} tidak valid. Harus berupa URL lengkap yang diawali http:// atau https://, contoh: https://contoh.acehprov.go.id`
  }

  return ''

}