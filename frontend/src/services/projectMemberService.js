import { apiClient } from '../utils/apiClient'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * List members of a project (protected)
 * Backend: GET /project-members?projectId=...
 */
export const listProjectMembers = async ({ projectId } = {}) => {
  const params = new URLSearchParams()
  if (projectId !== undefined && projectId !== null && String(projectId) !== '') {
    params.set('projectId', String(projectId))
  }
  const qs = params.toString()
  return apiClient.get(`${API_ENDPOINTS.PROJECT_MEMBER.LIST}${qs ? `?${qs}` : ''}`)
}

/**
 * Add a member to a project (protected)
 * Backend: POST /project-members
 */
export const createProjectMember = async (payload) => {
  return apiClient.post(API_ENDPOINTS.PROJECT_MEMBER.LIST, payload)
}

/**
 * Remove a project member by id (protected)
 * Backend: DELETE /project-members/:id
 */
export const deleteProjectMemberById = async (projectMemberId) => {
  if (!projectMemberId) throw new Error('projectMemberId is required')
  return apiClient.delete(
    `${API_ENDPOINTS.PROJECT_MEMBER.LIST}/${encodeURIComponent(String(projectMemberId))}`
  )
}


