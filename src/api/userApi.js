import {
  authGet,
  authPost,
  authPatch,
  authDelete,
} from './apiClient'


// =====================================================
// GET ALL USERS
// =====================================================

export async function getAllUsers() {

  const response =
    await authGet('/users')


  return (
    response?.users ||
    []
  )

}


// =====================================================
// CREATE USER
// =====================================================

export async function createUser(
  userData
) {

  const response =
    await authPost(
      '/users',
      userData
    )


  return response

}


// =====================================================
// UPDATE USER
// =====================================================

export async function updateUser(
  id,
  userData
) {

  const response =
    await authPatch(
      `/users/${id}`,
      userData
    )


  return response

}


// =====================================================
// DELETE USER
// =====================================================

export async function deleteUser(
  id
) {

  const response =
    await authDelete(
      `/users/${id}`
    )


  return response

}