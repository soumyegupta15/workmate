import React from 'react'
import { useTheme } from '../context/theme'

/**
 * Main Layout Component
 * Layout wrapper for main application pages
 */
const MainLayout = ({ children }) => {
  const t = useTheme()

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: t.colors.pageBackground,
        fontFamily: t.font.family,
      }}
    >
      {children}
    </div>
  )
}

export default MainLayout

