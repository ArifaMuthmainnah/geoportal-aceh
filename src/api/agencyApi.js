import {
  authGet,
  authPatch,
} from './apiClient'

export async function getAgencyProfile(username) {

  if (!username) {
    return null
  }

  try {

    const response =
      await authGet(`/agency-profiles/${encodeURIComponent(username)}`)

    return response?.profile || null

  } catch (err) {

    console.error('Gagal mengambil profil instansi:', err)

    return null

  }

}

export function updateAgencyProfile(username, data = {}) {

  return authPatch(`/agency-profiles/${encodeURIComponent(username)}`, {
    description: data.description || '',
    website_url: data.website_url || '',
  })

}