import { API_CONFIG, API_ENDPOINTS } from '../utils/constants';
import apiClient from '../utils/apiClient';

/**
 * Process AI prompt and execute action
 */
export async function processAndExecute(prompt, orgId, context = null) {
  const response = await apiClient.post(API_ENDPOINTS.AI.PROCESS, {
    prompt,
    orgId,
    context: context || null
  });
  return response;
}
