import React from 'react'
import { Sidebar } from '../components/layout'
import { useTheme } from '../context/theme'

/**
 * Dashboard Layout Component
 * Layout wrapper for dashboard pages with sidebar
 */
const DashboardLayout = ({ children, showSidebar = true }) => {
  const t = useTheme()

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: t.colors.pageBackground, // Use theme page background
        fontFamily: t.font.family,
      }}
    >
      {showSidebar && <Sidebar />}
      <div
        style={{
          flex: 1,
          backgroundColor: t.colors.pageBackground, // Use theme page background
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout

