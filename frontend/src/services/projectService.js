import { apiClient } from '../utils/apiClient'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Create a project in an organisation (protected)
 *
 * Backend expects:
 * - orgId
 * - name
 * - description
 * - startDate
 * - endDate
 */
export const createProject = async (payload) => {
  return apiClient.post(API_ENDPOINTS.PROJECT.CREATE, payload, {
    invalidateCache: [`${API_ENDPOINTS.PROJECT.LIST}*`, `${API_ENDPOINTS.ORG.LIST}*`]
  })
}

export const getProjectById = async (projectId) => {
  if (!projectId) throw new Error('projectId is required')
  return apiClient.get(`${API_ENDPOINTS.PROJECT.LIST}/${encodeURIComponent(String(projectId))}`)
}

export const updateProjectById = async (projectId, payload = {}) => {
  if (!projectId) throw new Error('projectId is required')
  return apiClient.patch(
    `${API_ENDPOINTS.PROJECT.LIST}/${encodeURIComponent(String(projectId))}`,
    payload,
    {
      invalidateCache: [
        `${API_ENDPOINTS.PROJECT.LIST}*`,
        `${API_ENDPOINTS.PROJECT.LIST}/${encodeURIComponent(String(projectId))}*`
      ]
    }
  )
}

export const getProjectTaskStats = async (projectId) => {
  if (!projectId) throw new Error('projectId is required')
  return apiClient.get(
    `${API_ENDPOINTS.PROJECT.LIST}/${encodeURIComponent(String(projectId))}/tasks/stats`
  )
}

export const getProjectTeamStats = async (projectId) => {
  if (!projectId) throw new Error('projectId is required')
  return apiClient.get(
    `${API_ENDPOINTS.PROJECT.LIST}/${encodeURIComponent(String(projectId))}/team/stats`
  )
}

export const deleteProjectById = async (projectId) => {
  if (!projectId) throw new Error('projectId is required')
  return apiClient.delete(
    `${API_ENDPOINTS.PROJECT.LIST}/${encodeURIComponent(String(projectId))}`,
    {
      invalidateCache: [
        `${API_ENDPOINTS.PROJECT.LIST}*`,
        `${API_ENDPOINTS.ORG.LIST}*`
      ]
    }
  )
}

export const listMyProjects = async () => {
  return apiClient.get(`${API_ENDPOINTS.PROJECT.LIST}/mine?assignedOnly=true`)
}



