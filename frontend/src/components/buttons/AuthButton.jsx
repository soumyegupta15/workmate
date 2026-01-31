import React from 'react'
import { useTheme } from '../../context/theme'

const AuthButton = ({ children, fullWidth = true, disabled = false, ...rest }) => {
  const t = useTheme()

  return (
    <button
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: `${t.spacing(3)} ${t.spacing(4)}`,
        borderRadius: t.radius.button,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#6b7280' : t.colors.buttonSecondary,
        opacity: disabled ? 0.7 : 1,
        color: t.colors.buttonText,
        fontSize: t.font.size.md,
        fontWeight: t.font.weight.medium,
        letterSpacing: '0.03em',
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}

export default AuthButton


