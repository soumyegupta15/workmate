import { validateEmail } from './emailValidator'
import { validatePassword } from './passwordValidator'

/**
 * Validates login form fields
 * @param {object} fields - Form fields
 * @param {string} fields.email - Email address
 * @param {string} fields.password - Password
 * @returns {{isValid: boolean, errors: object}}
 */
export const validateLoginForm = (fields) => {
  const { email, password } = fields
  const errors = {}

  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error
  }

  const passwordValidation = validatePassword(password, { minLength: 6 })
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validates a form field in real-time
 * @param {string} fieldName - Name of the field
 * @param {string} value - Field value
 * @param {object} validators - Validator functions for each field
 * @returns {{isValid: boolean, error: string}}
 */
export const validateField = (fieldName, value, validators) => {
  const validator = validators[fieldName]
  if (!validator) {
    return { isValid: true, error: '' }
  }

  return validator(value)
}

