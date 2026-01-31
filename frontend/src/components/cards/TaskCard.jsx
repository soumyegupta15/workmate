import React from 'react'
import { useTheme } from '../../context/theme'

/**
 * Reusable Task Card
 * Matches the visual style of StatsCard / other dashboard cards.
 */
const TaskCard = ({
  priority,
  title,
  dueDate,
  assigneeInitials,
  avatarColor,
  onClick,
}) => {
  const t = useTheme()

  const getPriorityStyles = (value) => {
    switch (value) {
      case 'High':
        return {
          backgroundColor: 'rgba(248, 113, 113, 0.15)',
          color: '#b91c1c',
        }
      case 'Medium':
        return {
          backgroundColor: 'rgba(234, 179, 8, 0.15)',
          color: '#92400e',
        }
      case 'Low':
      default:
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          color: '#15803d',
        }
    }
  }

  const priorityStyles = getPriorityStyles(priority)

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      style={{
        backgroundColor: t.colors.cardBackground,
        borderRadius: '18px',
        padding: t.spacing(2.5),
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.15)',
        border: `1px solid ${t.colors.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        gap: t.spacing(1.5),
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '999px',
          padding: `${t.spacing(0.5)} ${t.spacing(2)}`,
          fontSize: t.font.size.xs,
          fontWeight: t.font.weight.medium,
          ...priorityStyles,
          alignSelf: 'flex-start',
        }}
      >
        {priority}
      </div>

      <div>
        <div
          style={{
            fontSize: t.font.size.md,
            fontWeight: t.font.weight.semiBold,
            color: t.colors.textHeadingDark,
            marginBottom: t.spacing(0.25),
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          marginTop: t.spacing(1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: t.spacing(2),
        }}
      >
        <div
          style={{
            fontSize: t.font.size.xs,
            color: t.colors.textMutedDark,
            flex: 1,
          }}
        >
          {dueDate ? `Due ${dueDate}` : null}
        </div>
        {assigneeInitials && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '999px',
              backgroundColor: avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: t.font.size.xs,
              fontWeight: t.font.weight.semiBold,
              flexShrink: 0,
            }}
          >
            {assigneeInitials}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard


