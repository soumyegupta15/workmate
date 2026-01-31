import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/theme'
import { ROUTES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import logo from '../../assets/icons/logo.png'
import dashboardIcon from '../../assets/icons/dashboardIcon.png'
import orgsIcon from '../../assets/icons/orgsIcon.png'
import notificationsIcon from '../../assets/icons/notificationsIcon.png'
import profileIcon from '../../assets/icons/profileIcon.png'
import settingsIcon from '../../assets/icons/settingsIcon.png'
import signoutIcon from '../../assets/icons/signoutIcon.png'
import teamIcon from '../../assets/icons/teamIcon.png'
import projectIcon from '../../assets/icons/projectIcon.png'

const Sidebar = () => {
  const t = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const segments = location.pathname.split('/').filter(Boolean)

  const isProjectDetail =
    segments[0] === 'organisations' && segments[2] === 'projects' && segments.length >= 5

  const isOrganisationDetail =
    segments[0] === 'organisations' && !isProjectDetail && segments.length >= 3

  let menuItems

  if (isProjectDetail) {
    const orgId = segments[1]
    const projectId = segments[3]
    const projectPath = (section) =>
      `/organisations/${orgId}/projects/${projectId}/${section}`

    menuItems = [
      {
        id: 'overview',
        label: 'Overview',
        icon: dashboardIcon,
        path: projectPath('overview'),
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: projectIcon,
        path: projectPath('tasks'),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: settingsIcon,
        path: projectPath('settings'),
      },
    ]
  } else if (isOrganisationDetail) {
    const orgId = segments[1]
    const orgPath = (section) => `/organisations/${orgId}/${section}`

    menuItems = [
      {
        id: 'overview',
        label: 'Overview',
        icon: dashboardIcon,
        path: orgPath('overview'),
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: projectIcon,
        path: orgPath('projects'),
      },
      {
        id: 'team',
        label: 'Team Members',
        icon: teamIcon,
        path: orgPath('team'),
      },
      {
        id: 'ai-assistant',
        label: 'AI Assistant',
        icon: dashboardIcon,
        path: orgPath('ai-assistant'),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: settingsIcon,
        path: orgPath('settings'),
      },
    ]
  } else {
    menuItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: dashboardIcon,
        path: ROUTES.DASHBOARD,
      },
      {
        id: 'organisations',
        label: 'Organisations',
        icon: orgsIcon,
        path: ROUTES.ORGANISATIONS,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: notificationsIcon,
        path: ROUTES.NOTIFICATIONS,
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: profileIcon,
        path: ROUTES.PROFILE,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: settingsIcon,
        path: ROUTES.SETTINGS,
      },
    ]
  }

  const handleSignOut = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const isActive = (path) => {
    if (!isOrganisationDetail && !isProjectDetail && path === ROUTES.DASHBOARD) {
      return location.pathname === ROUTES.DASHBOARD
    }

    if (isOrganisationDetail || isProjectDetail) {
      return location.pathname === path
    }

    return location.pathname.startsWith(path)
  }

  // Determine back navigation based on current route
  const getBackPath = () => {
    if (isProjectDetail) {
      // On project page: go to organisation overview
      const orgId = segments[1]
      return `/organisations/${orgId}/overview`
    } else if (isOrganisationDetail) {
      // On organisation page: go to organisations list
      return ROUTES.ORGANISATIONS
    }
    return null
  }

  const backPath = getBackPath()
  const showBackButton = backPath !== null

  const handleBack = () => {
    if (backPath) {
      navigate(backPath)
    }
  }

  return (
    <div
      style={{
        width: '320px',
        height: '100vh',
        backgroundColor: t.colors.primary,
        display: 'flex',
        flexDirection: 'column',
        padding: t.spacing(4),
        boxSizing: 'border-box',
      }}
    >
      {/* Back Button */}
      {showBackButton && (
        <button
          onClick={handleBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: t.colors.textPrimary,
            cursor: 'pointer',
            marginBottom: t.spacing(3),
            transition: 'background-color 0.2s',
            fontSize: '20px',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
          }}
          title={isProjectDetail ? 'Back to Organisation' : 'Back to Organisations'}
        >
          <span style={{ lineHeight: 1 }}>←</span>
        </button>
      )}

      {/* Logo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: t.spacing(6),
          paddingBottom: t.spacing(4),
          borderBottom: `1px solid ${t.colors.cardBorder}`,
        }}
      >
        <img
          src={logo}
          alt="Workmate AI logo"
          style={{
            height: 110,
            objectFit: 'contain',
          }}
        />
      </div>

      {menuItems.map((item) => {
        const active = isActive(item.path)
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: t.spacing(3),
              padding: t.spacing(3),
              marginBottom: t.spacing(1),
              backgroundColor: active ? '#374151' : 'transparent',
              border: 'none',
              borderRadius: t.radius.input,
              color: t.colors.textPrimary,
              fontSize: t.font.size.md,
              fontFamily: t.font.family, // Poppins
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = '#374151'
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <img
              src={item.icon}
              alt={item.label}
              style={{
                width: '25px',
                height: '25px',
                objectFit: 'contain',
              }}
            />
            <span>{item.label}</span>
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      <button
        onClick={handleSignOut}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: t.spacing(3),
          padding: t.spacing(3),
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: t.radius.input,
          color: t.colors.textPrimary,
          fontSize: t.font.size.md,
          fontFamily: t.font.family, // Poppins
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#374151'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <img
          src={signoutIcon}
          alt="Sign Out"
          style={{
            width: '20px',
            height: '20px',
            objectFit: 'contain',
          }}
        />
        <span>Sign Out</span>
      </button>
    </div>
  )
}

export default Sidebar

