import React from 'react'
import { useTheme } from '../../context/theme'

export const Heading = ({ children, style, ...rest }) => {
  const t = useTheme()
  return (
    <h1
      style={{
        margin: 0,
        marginBottom: t.spacing(4),
        color: t.colors.heading,
        fontFamily: t.font.heading,
        fontSize: t.font.size.display,
        fontWeight: t.font.weight.bold,
        ...style,
      }}
      {...rest}
    >
      {children}
    </h1>
  )
}

export const Label = ({ children, style, ...rest }) => {
  const t = useTheme()
  return (
    <label
      style={{
        display: 'block',
        marginBottom: t.spacing(1),
        color: t.colors.textPrimary,
        fontSize: t.font.size.sm,
        fontWeight: t.font.weight.medium,
        ...style,
      }}
      {...rest}
    >
      {children}
    </label>
  )
}

export const BodyText = ({ children, muted, style, ...rest }) => {
  const t = useTheme()
  return (
    <p
      style={{
        margin: 0,
        color: muted ? t.colors.subtleText : t.colors.textSecondary,
        fontSize: t.font.size.sm,
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  )
}

