export const theme = {
  colors: {
    // Core palette
    primary: '#263238',
    secondary: '#E3E3E3',

    // Layout backgrounds
    pageBackground: '#dbdbdb', // light grey outer background
    backgroundColor: '#E3E3E3',

    // Cards
    cardBackground: 'rgba(250, 254, 255, 0.2)', // #FAFEFF at 20% opacity
    popupBackground: 'rgba(250, 254, 255, 1)', // #FAFEFF at 20% opacity
    organisationCardBackground: 'rgba(250, 254, 255, 0.2)',
    cardBorder: '#FFFFFF',
    blackBorder: '#000000',
    dangerBorder: '#D40000',

    // Task sections
    taskSectionBackground: 'rgba(70, 81, 87, 0.1)', // #465157 at 10%

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#000000',
    heading: '#ffffff',
    textHeadingDark: '#1f2937',
    textBodyDark: '#4b5563',
    textMutedDark: '#6b7280',
    borderLight: '#e5e7eb',
    accentBlue: '#2563eb',

    // Inputs
    inputBackground: '#374151',
    inputPlaceholder: '#9ca3af',
    inputText: '#f9fafb',
    divider: '#6b7280',

    // Buttons
    buttonPrimary: '#263238',
    buttonSecondary: '#7B858A',
    buttonText: '#ffffff',

    // Links & status
    link: '#0088FF',
    linkHover: '#93c5fd',
    subtleText: '#9ca3af',
    error: '#f87171',
    progressTrack: 'rgba(120, 120, 120, 0.2)', // #787878 at 20% opacity
    progressBar: '#0088FF',
  },
  radius: {
    card: '12px',
    input: '6px',
    button: '15px',
  },
  spacing: (factor) => `${factor * 4}px`,
  font: {
    family: `'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    heading: `'Song Myung', 'Times New Roman', serif`,
    size: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      display: '24px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 500,
    },
  },
  shadow: {
    card: '0 18px 40px rgba(15, 23, 42, 0.7)',
  },
  layout: {
    maxCardWidth: '420px',
  },
}

import React, { createContext, useContext } from 'react'

const ThemeContext = createContext(theme)

export const ThemeProvider = ({ children }) => {
  return React.createElement(ThemeContext.Provider, { value: theme }, children)
}

export const useTheme = () => useContext(ThemeContext)


