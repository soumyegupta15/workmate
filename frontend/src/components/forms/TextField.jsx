import React from 'react'
import { useTheme } from '../../context/theme'

const TextField = ({ type = 'text', placeholder, value, onChange, error, ...rest }) => {
  const t = useTheme()

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: t.spacing(3),
        borderRadius: t.radius.input,
        border: error ? `1px solid ${t.colors.error}` : 'none',
        outline: 'none',
        backgroundColor: t.colors.inputBackground,
        color: t.colors.inputText,
        fontSize: t.font.size.sm,
        boxSizing: 'border-box',
      }}
      {...rest}
    />
  )
}

export default TextField

