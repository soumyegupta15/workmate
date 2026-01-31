import React from 'react'
import { useTheme } from '../../context/theme'

const AuthCard = ({
  children,
  backgroundVideo,
  dimBackground = true,
  fixedHeight = false,
}) => {
  const t = useTheme()

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors.pageBackground,
        fontFamily: t.font.family,
        overflow: 'hidden',
      }}
    >
      {backgroundVideo && (
        <>
          <video
            autoPlay
            muted
            loop
            playsInline
            src={backgroundVideo}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: dimBackground ? 'brightness(0.4)' : 'brightness(1)',
              zIndex: 0,
            }}
          />
          {dimBackground && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.65) 100%)',
                zIndex: 0,
              }}
            />
          )}
        </>
      )}
      <div
        className={fixedHeight ? 'auth-card-scroll' : undefined}
        style={{
          position: 'relative',
          zIndex: 1,
          height: fixedHeight ? 'calc(108vh - 80px)' : 'auto',
          maxHeight: fixedHeight ? 'calc(108vh - 80px)' : 'none',
          overflowY: fixedHeight ? 'auto' : 'visible',
          backgroundColor: t.colors.primary,
          borderRadius: t.radius.card,
          border: 'none',
          boxShadow: t.shadow.card,
          width: '100%',
          maxWidth: t.layout.maxCardWidth,
          padding: t.spacing(8),
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default AuthCard

