import { apiClient } from '../utils/apiClient'
import { API_ENDPOINTS } from '../utils/constants'

export const listComments = async ({ taskId } = {}) => {
  if (!taskId) throw new Error('taskId is required')
  const params = new URLSearchParams()
  params.set('taskId', String(taskId))
  return apiClient.get(`${API_ENDPOINTS.COMMENT.LIST}?${params.toString()}`)
}

export const createComment = async (payload = {}) => {
  return apiClient.post(API_ENDPOINTS.COMMENT.CREATE, payload)
}

export const updateCommentById = async (commentId, payload = {}) => {
  if (!commentId) throw new Error('commentId is required')
  return apiClient.patch(
    `${API_ENDPOINTS.COMMENT.LIST}/${encodeURIComponent(String(commentId))}`,
    payload
  )
}

export const deleteCommentById = async (commentId) => {
  if (!commentId) throw new Error('commentId is required')
  return apiClient.delete(`${API_ENDPOINTS.COMMENT.LIST}/${encodeURIComponent(String(commentId))}`)
}


