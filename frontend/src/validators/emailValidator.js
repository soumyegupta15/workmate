/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {{isValid: boolean, error: string}}
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'Email is required',
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    }
  }

  return {
    isValid: true,
    error: '',
  }
}

