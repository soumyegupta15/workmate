import { apiClient } from '../utils/apiClient'
import { API_ENDPOINTS } from '../utils/constants'

export const uploadAttachments = async ({ files = [], entityType, entityId } = {}) => {
  const list = Array.isArray(files) ? files : []
  if (!entityType) throw new Error('entityType is required')
  if (!entityId) throw new Error('entityId is required')
  if (list.length === 0) return { data: [] }

  const form = new FormData()
  form.append('entityType', String(entityType))
  form.append('entityId', String(entityId))
  list.forEach((f) => {
    if (f) form.append('files', f)
  })

  return apiClient.post(API_ENDPOINTS.ATTACHMENT.UPLOAD, form)
}

export const listAttachments = async ({ entityType, entityId } = {}) => {
  if (!entityType) throw new Error('entityType is required')
  if (!entityId) throw new Error('entityId is required')
  const params = new URLSearchParams()
  params.set('entityType', String(entityType))
  params.set('entityId', String(entityId))
  return apiClient.get(`${API_ENDPOINTS.ATTACHMENT.LIST}?${params.toString()}`)
}

export const deleteAttachmentById = async (attachmentId) => {
  if (!attachmentId) throw new Error('attachmentId is required')
  return apiClient.delete(
    `${API_ENDPOINTS.ATTACHMENT.LIST}/${encodeURIComponent(String(attachmentId))}`
  )
}


