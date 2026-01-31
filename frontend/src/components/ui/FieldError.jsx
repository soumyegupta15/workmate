import React from 'react'
import { useTheme } from '../../context/theme'

/**
 * Field Error Component
 * Displays field-level validation errors
 */
const FieldError = ({ error, style }) => {
  const t = useTheme()

  if (!error) return null

  return (
    <div
      style={{
        marginTop: t.spacing(1),
        color: t.colors.error,
        fontSize: t.font.size.xs,
        ...style,
      }}
    >
      {error}
    </div>
  )
}

export default FieldError

