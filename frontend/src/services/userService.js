import { apiClient } from '../utils/apiClient'
import { API_ENDPOINTS } from '../utils/constants'

export const searchUsersByEmail = async (query, { limit = 10 } = {}) => {
  const q = String(query || '').trim()
  if (!q) return { data: [] }
  const params = new URLSearchParams()
  params.set('q', q)
  if (limit) params.set('limit', String(limit))
  return apiClient.get(`${API_ENDPOINTS.USER.SEARCH}?${params.toString()}`)
}



