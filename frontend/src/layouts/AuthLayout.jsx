import React from 'react'
import { useTheme } from '../context/theme'

/**
 * Auth Layout Component
 * Layout wrapper for authentication pages (Login, Register, etc.)
 */
const AuthLayout = ({ children }) => {
  const t = useTheme()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors.pageBackground,
        fontFamily: t.font.family,
        padding: t.spacing(4),
      }}
    >
      {children}
    </div>
  )
}

export default AuthLayout

