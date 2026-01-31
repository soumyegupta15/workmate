import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '../../context/theme'

const getStrength = (password) => {
  if (!password) {
    return { score: 0, label: '', color: 'transparent' }
  }

  let score = 0

  if (password.length >= 8) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  const levels = [
    { label: 'Too short', color: '#4b5563' },
    { label: 'Weak', color: '#f87171' },
    { label: 'Fair', color: '#facc15' },
    { label: 'Good', color: '#34d399' },
    { label: 'Strong', color: '#22c55e' },
  ]

  return {
    score,
    label: levels[score].label,
    color: levels[score].color,
  }
}

const PasswordStrengthMeter = ({ password }) => {
  const t = useTheme()

  const strength = useMemo(() => getStrength(password), [password])

  if (!password) {
    return null
  }

  return (
    <div style={{ marginTop: t.spacing(2),marginBottom: t.spacing(-5) }}>
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.15)',
        }}
      >
        <div
          style={{
            width: `${(strength.score / 4) * 100}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: strength.color,
            transition: 'width 200ms ease, background-color 200ms ease',
          }}
        />
      </div>
      <div
        style={{
          marginTop: t.spacing(1),
          textAlign: 'right',
          fontSize: t.font.size.xs,
          color: strength.color,
        }}
      >
        {strength.label}
      </div>
    </div>
  )
}

PasswordStrengthMeter.propTypes = {
  password: PropTypes.string,
}

export default PasswordStrengthMeter


