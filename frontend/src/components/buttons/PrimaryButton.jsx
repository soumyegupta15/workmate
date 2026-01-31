import React from 'react'
import { useTheme } from '../../context/theme'

const PrimaryButton = ({
  children,
  disabled = false,
  icon,
  ...rest
}) => {
  const t = useTheme()

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.spacing(2),
        width: 'auto',
        minWidth: '180px',
        minHeight: '50px',
        padding: `${t.spacing(2.5)} ${t.spacing(5)}`,
        borderRadius: '15px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: t.colors.buttonPrimary,
        opacity: disabled ? 0.7 : 1,
        color: t.colors.buttonText,
        fontSize: t.font.size.md,
        fontWeight: t.font.weight.medium,
        letterSpacing: '0.03em',
      }}
      disabled={disabled}
      {...rest}
    >
      {icon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            fontSize: '18px',
            lineHeight: 5,
          }}
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}

export default PrimaryButton

