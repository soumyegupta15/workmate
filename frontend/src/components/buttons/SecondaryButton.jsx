import React from 'react'
import { useTheme } from '../../context/theme'
import addIcon from '../../assets/icons/addIcon.png'

const SecondaryButton = ({ children, icon, onClick, ...rest }) => {
  const t = useTheme()
  const baseBackground = t.colors.buttonSecondary
  const baseShadow =
    '0 10px 20px rgba(55, 65, 81, 0.35), 0 4px 8px rgba(0, 0, 0, 0.2)'
  const hoverShadow =
    '0 14px 24px rgba(55, 65, 81, 0.45), 0 8px 16px rgba(0, 0, 0, 0.25)'

  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: t.spacing(2),
        padding: `${t.spacing(2.5)} ${t.spacing(4)}`,
        borderRadius: t.radius.button,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: baseBackground,
        color: t.colors.buttonText,
        fontSize: t.font.size.md,
        fontWeight: t.font.weight.medium,
        fontFamily: t.font.family, // Poppins
        boxShadow: baseShadow,
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = t.colors.primary
        e.currentTarget.style.boxShadow = hoverShadow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = baseBackground
        e.currentTarget.style.boxShadow = baseShadow
      }}
      {...rest}
    >
      {icon && (
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: t.colors.cardBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            boxSizing: 'border-box',
          }}
        >
          {icon === 'plus' && (
            <img
              src={addIcon}
              alt="Add"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </div>
      )}
      {children}
    </button>
  )
}

export default SecondaryButton

