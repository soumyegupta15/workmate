import { useState, useCallback } from 'react'

/**
 * Custom hook for form management
 * @param {object} initialValues - Initial form values
 * @param {object} validators - Validator functions for each field
 * @param {function} onSubmit - Submit handler
 * @returns {object} Form state and handlers
 */
export const useForm = (initialValues = {}, validators = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Handle input change
   */
  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  /**
   * Handle input blur (field touched)
   */
  const handleBlur = useCallback((name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))

    // Validate field on blur
    if (validators[name]) {
      const validation = validators[name](values[name])
      if (!validation.isValid) {
        setErrors((prev) => ({
          ...prev,
          [name]: validation.error,
        }))
      }
    }
  }, [values, validators])

  /**
   * Validate all fields
   */
  const validate = useCallback(() => {
    const newErrors = {}
    
    Object.keys(validators).forEach((name) => {
      const validator = validators[name]
      if (validator) {
        const validation = validator(values[name])
        if (!validation.isValid) {
          newErrors[name] = validation.error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validators])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault()
    }

    // Mark all fields as touched
    const allTouched = {}
    Object.keys(values).forEach((key) => {
      allTouched[key] = true
    })
    setTouched(allTouched)

    // Validate form
    if (!validate()) {
      return
    }

    // Submit form
    if (onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit: error.message || 'An error occurred',
        }))
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validate, onSubmit])

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
  }
}

