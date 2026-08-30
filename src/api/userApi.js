const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  'http://localhost:5000/api'

import {
  authGet,
  authDelete,
} from './apiClient'


// =====================================================
// GET TOKEN (dipakai untuk request multipart manual)
// =====================================================

function getToken() {
  return sessionStorage.getItem('geoportal_auth_token')
}


// =====================================================
// GET ALL USERS (ADMIN ONLY)
// =====================================================

export async function getAllUsers() {

  const response =
    await authGet('/users')

  return response?.users || []

}


// =====================================================
// GET PUBLIC OWNERS (UNTUK HALAMAN JIGN)
// =====================================================

export async function getPublicOwners() {

  const response =
    await authGet('/users/public')

  return response?.users || []

}


// =====================================================
// HELPER: BUILD FORM DATA USER (mendukung avatar)
// =====================================================

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


// =====================================================
// REQUEST MULTIPART KE BACKEND SENDIRI
// =====================================================

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


// =====================================================
// CREATE USER (mendukung avatar)
// =====================================================

export async function createUser(userData) {

  const formData = buildUserFormData(userData)

  return authRequestFormData('/users', 'POST', formData)

}


// =====================================================
// UPDATE USER (mendukung avatar) — INI YANG SEBELUMNYA
// SELALU 404 KARENA ROUTE PATCH BELUM ADA DI BACKEND
// =====================================================

export async function updateUser(id, userData) {

  const formData = buildUserFormData(userData)

  return authRequestFormData(`/users/${id}`, 'PATCH', formData)

}


// =====================================================
// DELETE USER
// =====================================================

export async function deleteUser(id) {

  return authDelete(`/users/${id}`)

}