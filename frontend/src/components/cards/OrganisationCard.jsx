import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/theme'
import folderIcon from '../../assets/icons/folderIcon.png'
import peopleIcon from '../../assets/icons/peopleIcon.png'
import calanderIcon from '../../assets/icons/calanderIcon.png'

const OrganisationCard = ({ organisation }) => {
  const t = useTheme()
  const navigate = useNavigate()
  const hasLogo = organisation.hasLogo || false

  return (
    <div
    style={{
      backgroundColor: t.colors.cardBackground,
      borderRadius: '18px',
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.15)',
      border: `1px solid ${t.colors.cardBorder}`,
        transition: 'transform 0.3s, box-shadow 0.3s, background-color 0.3s',
      }}
      onClick={() => navigate(`/organisations/${organisation.id}/overview`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.backgroundColor = 'rgba(170, 173, 174, 0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.backgroundColor = t.colors.organisationCardBackground
      }}
    >
      {/* Logo/Image Area */}
      <div
        style={{
          height: '120px',
          backgroundColor: hasLogo ? t.colors.primary : t.colors.secondary,
          display: 'flex',
          alignItems: 'center',
          borderColor: t.colors.cardBorder,
          marginLeft: 10,
          marginRight: 10,
          marginTop: 10,
          borderRadius: 10,
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {hasLogo ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: t.colors.primary,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontSize: '32px',
                fontWeight: 'bold',
                color: t.colors.buttonText,
              }}
            >
              Q
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: t.colors.buttonText,
                letterSpacing: '1px',
              }}
            >
              QUANTUM SOLUTIONS
            </div>
          </div>
        ) : null}
      </div>

      {/* Content Area */}
      <div style={{ padding: t.spacing(4) }}>
        <h3
          style={{
            margin: 0,
            marginBottom: t.spacing(4),
            fontSize: t.font.size.lg,
            fontWeight: t.font.weight.semiBold,
            color: '#1f2937',
            fontFamily: t.font.family, // Poppins
          }}
        >
          {organisation.name}
        </h3>

        {/* Statistics */}
        <div
          style={{
            display: 'flex',
            gap: t.spacing(4),
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: t.spacing(1.5) }}>
            <img
              src={peopleIcon}
              alt="Members"
              style={{
                width: '20px',
                height: '20px',
                objectFit: 'contain',
              }}
            />
            <span style={{ fontSize: t.font.size.md, color: t.colors.textSecondary, fontFamily: t.font.family }}>
              {organisation.members ?? 0}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: t.spacing(1.5) }}>
            <img
              src={calanderIcon}
              alt="Projects"
              style={{
                width: '20px',
                height: '20px',
                objectFit: 'contain',
              }}
            />
            <span style={{ fontSize: t.font.size.md, color: t.colors.textSecondary, fontFamily: t.font.family }}>
              {organisation.projects ?? 0}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: t.spacing(1.5) }}>
            <img
              src={folderIcon}
              alt="Tasks"
              style={{
                width: '20px',
                height: '20px',
                objectFit: 'contain',
              }}
            />
            <span style={{ fontSize: t.font.size.md, color: t.colors.textSecondary, fontFamily: t.font.family }}>
              {organisation.tasks ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrganisationCard

