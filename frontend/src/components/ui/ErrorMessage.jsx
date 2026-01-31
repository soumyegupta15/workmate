import React from 'react'
import { useTheme } from '../../context/theme'

/**
 * Error Message Component
 * Displays error messages in a consistent style
 */
const ErrorMessage = ({ message, style }) => {
  const t = useTheme()

  if (!message) return null

  return (
    <div
      style={{
        padding: t.spacing(2),
        marginBottom: t.spacing(2),
        backgroundColor: t.colors.error + '20',
        color: t.colors.error,
        borderRadius: t.radius.input,
        fontSize: t.font.size.sm,
        ...style,
      }}
    >
      {message}
    </div>
  )
}

export default ErrorMessage

