import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '../../context/theme'

const OtpInput = ({ value, length = 6, onChange }) => {
  const t = useTheme()
  const inputsRef = useRef([])

  const safeValue = (value || '').padEnd(length, ' ')

  const handleChange = (index, char) => {
    const sanitized = char.replace(/[^0-9]/g, '')
    const current = safeValue.split('')

    current[index] = sanitized || ' '
    const nextValue = current.join('').trimEnd()
    onChange?.(nextValue)

    if (sanitized && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !safeValue[index] && index > 0) {
      e.preventDefault()
      inputsRef.current[index - 1]?.focus()
      const current = safeValue.split('')
      current[index - 1] = ' '
      onChange?.(current.join('').trimEnd())
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputsRef.current[index + 1]?.focus()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: t.spacing(4),
        justifyContent: 'center',
      }}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={safeValue[index] === ' ' ? '' : safeValue[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          style={{
            width: 40,
            height: 48,
            borderRadius: 8,
            border: 'none',
            outline: 'none',
            textAlign: 'center',
            fontSize: t.font.size.lg,
            backgroundColor: t.colors.inputBackground,
            color: t.colors.inputText,
            boxShadow: '0 0 0 1px rgba(148,163,184,0.4)',
          }}
        />
      ))}
    </div>
  )
}

OtpInput.propTypes = {
  value: PropTypes.string,
  length: PropTypes.number,
  onChange: PropTypes.func,
}

export default OtpInput


