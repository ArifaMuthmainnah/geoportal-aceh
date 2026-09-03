import { parseExtraMetadata } from './resourceFields'

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api'

const SERVER_BASE_URL = AUTH_API_URL.replace(/\/api\/?$/, '')


export function buildOwnFileUrl(filePath) {
  if (!filePath) return null
  return `${SERVER_BASE_URL}/uploads/${filePath}`
}

export function buildOwnAvatarUrl(avatarPath) {
  if (!avatarPath) return null
  return `${SERVER_BASE_URL}/uploads/${avatarPath}`
}


export function adaptOwnResource(item) {

  if (!item) return null

  const keywordList =
    String(item.keywords || '')
      .split(',').map((k) => k.trim()).filter(Boolean).map((name) => ({ name }))

  const metadata = parseExtraMetadata(item.extra_metadata)

  let fileList = []

  if (item.files_json) {
    try {
      const parsed = JSON.parse(item.files_json)
      if (Array.isArray(parsed)) fileList = parsed
    } catch { fileList = [] }
  }

  if (fileList.length === 0 && item.file_path) {
    fileList = [{ file_path: item.file_path, file_name: item.file_name }]
  }

  const hasLink = Boolean(item.external_url)
  const hasFiles = fileList.length > 0

  // #1: gambar sampul untuk card
  const thumbnailUrl = buildOwnFileUrl(item.thumbnail_path)

  const fileLinks =
    fileList.map((f) => ({
      name: f.file_name || 'File',
      link_type: 'data',
      url: buildOwnFileUrl(f.file_path),
      extension: (f.file_name || '').split('.').pop()?.toUpperCase(),
    }))

  const linkEntries =
    hasLink
      ? [{ name: 'Link Sumber', link_type: 'data', url: item.external_url, extension: 'LINK' }]
      : []

  // #9: embed_url manual dari form (dataset/map/dashboard)
  // diprioritaskan, baru fallback ke link eksternal
  const embedUrl = metadata.embed_url || (hasLink ? item.external_url : null)

  // detail_url: link kalau ada, kalau tidak file pertama
  const detailUrl = hasLink ? item.external_url : buildOwnFileUrl(fileList[0]?.file_path)

  const extent =
    metadata.bbox
      ? { coords: [metadata.bbox.minLon, metadata.bbox.minLat, metadata.bbox.maxLon, metadata.bbox.maxLat] }
      : undefined

  return {

    pk: `own-${item.id}`,
    id: `own-${item.id}`,
    uuid: `own-${item.id}`,

    title: item.title || 'Tanpa judul',
    abstract: item.abstract || '',
    description: item.abstract || '',

    category: { identifier: item.category || 'lainnya' },

    keywords: keywordList,
    regions: metadata.region ? [{ name: metadata.region }] : [],

    owner: {
      username: item.owner_username || 'operator',
      first_name: item.owner_username || 'Operator',
      avatar: buildOwnAvatarUrl(item.owner_avatar_url),
    },

    date: item.created_at,
    created: item.created_at,
    last_updated: item.created_at,

    resource_type: item.resource_type || 'dataset',
    is_published: Boolean(item.is_published),
    published: Boolean(item.is_published),

    content_type: item.content_type || 'file',
    file_name: fileList[0]?.file_name,
    file_path: fileList[0]?.file_path,
    external_url: item.external_url,

        srid: metadata.srid,
    attribution: metadata.attribution,
    purpose: metadata.purpose,
    supplemental_information: metadata.supplemental_information,
    constraints_other: metadata.constraints_other,
    extent,
    language: metadata.language,
    license: metadata.license,
    group: metadata.group,
    date_type: metadata.date_type,

    thumbnail_url: thumbnailUrl,

    download_url: hasFiles ? buildOwnFileUrl(fileList[0]?.file_path) : null,

    links: [...linkEntries, ...fileLinks],

    // #8: untuk halaman detail Peta (tab Linked Resources)
    _linked_resources: Array.isArray(metadata.linked_resources) ? metadata.linked_resources : [],

    sub_type: item.sub_type || null,

    embed_url: embedUrl,
    detail_url: detailUrl,

    _attributes: Array.isArray(metadata.attributes) ? metadata.attributes : [],
    _source: 'own',
    _rawId: item.id,

  }

}


export function adaptOwnResourceList(list) {
  if (!Array.isArray(list)) return []
  return list.map(adaptOwnResource).filter(Boolean)
}

export function mergeResourceLists(oldList = [], ownList = []) {
  const safeOld = Array.isArray(oldList) ? oldList : []
  const safeOwn = adaptOwnResourceList(ownList)
  return [...safeOwn, ...safeOld]
}

export function sortByDateDesc(list = []) {
  return [...list].sort((a, b) => {
    const dateA = a?.date ? new Date(a.date).getTime() : 0
    const dateB = b?.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
}

export function adaptOwnOwner(user) {
  if (!user) return null
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
  return {
    pk: `own-user-${user.id}`,
    username: user.username,
    first_name: fullName,
    last_name: '',
    count: Number(user.count || 0),
    avatar: buildOwnAvatarUrl(user.avatar_url),
    _source: 'own',
  }
}

export function mergeOwnerLists(oldOwners = [], ownUsers = []) {

  const merged = Array.isArray(oldOwners) ? [...oldOwners] : []
  const safeOwnUsers = Array.isArray(ownUsers) ? ownUsers.map(adaptOwnOwner).filter(Boolean) : []

  safeOwnUsers.forEach((ownOwner) => {
    const existingIndex = merged.findIndex(
      (owner) => String(owner.username || '').toLowerCase() === String(ownOwner.username || '').toLowerCase()
    )
    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        count: Number(merged[existingIndex].count || 0) + Number(ownOwner.count || 0),
        avatar: merged[existingIndex].avatar || ownOwner.avatar,
      }
    } else {
      merged.push(ownOwner)
    }
  })

  return merged

}

export function isOwnResource(item) { return item?._source === 'own' }
export function getOwnRawId(item) { return item?._rawId }

export function getResourceOwnerName(item) {
  const owner = item?.owner
  if (!owner) return item?.owner_username || 'Tidak diketahui'
  const fullName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim()
  return fullName || owner.username || 'Tidak diketahui'
}