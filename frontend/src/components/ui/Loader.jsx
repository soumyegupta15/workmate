import React from 'react'
import { useTheme } from '../../context/theme'

/**
 * Reusable Loader/Spinner component
 */
const Loader = ({ size = 24, color, style, ...props }) => {
  const t = useTheme()
  const spinnerColor = color || t.colors.primary
  const spinnerSize = typeof size === 'number' ? size : 24

  return (
    <div
      style={{
        display: 'inline-block',
        width: spinnerSize,
        height: spinnerSize,
        border: `3px solid ${spinnerColor}20`,
        borderTop: `3px solid ${spinnerColor}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        ...style,
      }}
      {...props}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Loader

