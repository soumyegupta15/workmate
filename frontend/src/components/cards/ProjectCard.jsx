import React from 'react'
import { useTheme } from '../../context/theme'

const ProjectCard = ({ project, onClick }) => {
  const t = useTheme()

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: t.colors.cardBackground,
        borderRadius: '18px',
        padding: t.spacing(4),
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.15)',
        border: `1px solid ${t.colors.cardBorder}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 22px 50px rgba(15, 23, 42, 0.25)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow =
          '0 18px 40px rgba(15, 23, 42, 0.15)'
      }}
    >
      {/* Title & Due date */}
      <div
        style={{
          marginBottom: t.spacing(2.5),
        }}
      >
        <div
          style={{
            fontSize: t.font.size.md,
            fontWeight: t.font.weight.semiBold,
            color: '#111827',
            marginBottom: t.spacing(0.5),
          }}
        >
          {project.name}
        </div>
        <div
          style={{
            fontSize: t.font.size.sm,
            color: '#6b7280',
          }}
        >
          Due {project.due}
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          marginBottom: t.spacing(3),
        }}
      >
        <div
          style={{
            fontSize: t.font.size.sm,
            color: '#6b7280',
            marginBottom: t.spacing(1),
          }}
        >
          Progress
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: t.spacing(2),
          }}
        >
          <div
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '999px',
              backgroundColor: t.colors.progressTrack,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${project.progress}%`,
                height: '100%',
                background: t.colors.progressBar,
              }}
            />
          </div>
          <div
            style={{
              fontSize: t.font.size.sm,
              color: '#2563eb',
              fontWeight: t.font.weight.medium,
              minWidth: '40px',
              textAlign: 'right',
            }}
          >
            {project.progress}%
          </div>
        </div>
      </div>

      {/* Members row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                width: 28,
                height: 28,
                borderRadius: '999px',
                border: '2px solid #ffffff',
                backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#6366f1'][index],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: t.font.size.xs,
                fontWeight: t.font.weight.medium,
                transform: `translateX(-${index * 8}px)`,
                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.3)',
              }}
            >
              {project.initials && project.initials[index] ? project.initials[index] : ''}
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: t.font.size.sm,
            color: '#4b5563',
          }}
        >
          + {project.members} Members
        </div>
      </div>
    </div>
  )
}

export default ProjectCard




