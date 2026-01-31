/**
 * Validates a full name
 * @param {string} name - The name to validate
 * @returns {{isValid: boolean, error: string}}
 */
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      error: 'Name is required',
    }
  }

  if (name.trim().length < 2) {
    return {
      isValid: false,
      error: 'Name must be at least 2 characters long',
    }
  }

  return {
    isValid: true,
    error: '',
  }
}


