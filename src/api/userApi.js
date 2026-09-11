const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  'http://localhost:5000/api'

import {
  authGet,
  authDelete,
} from './apiClient'

function getToken() {
  return sessionStorage.getItem('geoportal_auth_token')
}

export async function getAllUsers() {

  const response =
    await authGet('/users')

  return response?.users || []

}

export async function getPublicOwners() {

  const response =
    await authGet('/users/public')

  return response?.users || []

}

function buildUserFormData(userData) {

  const formData = new FormData()

  if (userData.username !== undefined) formData.append('username', userData.username)
  if (userData.email !== undefined) formData.append('email', userData.email || '')
  if (userData.password) formData.append('password', userData.password)
  if (userData.role !== undefined) formData.append('role', userData.role)

  if (userData.avatarFile) {
    formData.append('avatar', userData.avatarFile)
  }

  return formData

}

async function authRequestFormData(endpoint, method, formData) {

  const token = getToken()

  const headers = { Accept: 'application/json' }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response =
    await fetch(`${AUTH_API_URL}${endpoint}`, {
      method,
      headers,
      body: formData,
    })

  const text = await response.text()

  let data = {}

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    throw new Error(data?.message || `Gagal memproses permintaan (${response.status})`)
  }

  return data

}

export async function createUser(userData) {

  const formData = buildUserFormData(userData)

  return authRequestFormData('/users', 'POST', formData)

}

export async function updateUser(id, userData) {

  const formData = buildUserFormData(userData)

  return authRequestFormData(`/users/${id}`, 'PATCH', formData)

}

export async function updateMyProfile({ username, email, password, currentPassword, avatarFile }) {

  const formData = new FormData()

  if (username !== undefined) formData.append('username', username)
  if (email !== undefined) formData.append('email', email || '')
  if (password) formData.append('password', password)
  if (currentPassword) formData.append('current_password', currentPassword)
  if (avatarFile) formData.append('avatar', avatarFile)

  return authRequestFormData('/users/me', 'PATCH', formData)

}

export async function deleteUser(id) {

  return authDelete(`/users/${id}`)

}