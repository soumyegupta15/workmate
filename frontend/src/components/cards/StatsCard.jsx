import React from 'react'
import { useTheme } from '../../context/theme'

const StatsCard = ({ label, value, delta, progress }) => {
  const t = useTheme()
  const isNegative = typeof delta === 'string' && delta.trim().startsWith('-')
  const hasProgress = typeof progress === 'number'

  return (
    <div
      style={{
        backgroundColor: t.colors.cardBackground,
        borderRadius: '18px',
        padding: t.spacing(4),
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.15)',
        border: `1px solid ${t.colors.cardBorder}`,
      }}
    >
      <div
        style={{
          fontSize: t.font.size.sm,
          color: t.colors.textMutedDark,
          marginBottom: t.spacing(1),
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: t.font.size.display,
          fontWeight: t.font.weight.bold,
          color: t.colors.textHeadingDark,
          marginBottom: t.spacing(1),
        }}
      >
        {value}
      </div>
      {delta != null && (
        <div
          style={{
            fontSize: t.font.size.sm,
            color: isNegative ? t.colors.error : '#15803d',
          }}
        >
          {delta}
        </div>
      )}
      {hasProgress && (
        <div
          style={{
            marginTop: t.spacing(3),
          }}
        >
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '999px',
              backgroundColor: t.colors.progressTrack,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, progress))}%`,
                height: '100%',
                backgroundColor: t.colors.progressBar,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsCard



