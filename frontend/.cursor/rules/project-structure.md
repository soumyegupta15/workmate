# Project Structure Rules

## Folder Organization

### @src/components
- **buttons/**: All button components (PrimaryButton, SecondaryButton, IconButton, etc.)
- **forms/**: Form-related components (TextField, TextArea, Select, Checkbox, Radio, etc.)
- **cards/**: Card components (AuthCard, InfoCard, etc.)
- **typography/**: Typography components (Heading, Label, BodyText, etc.)
- **layout/**: Layout components (Container, Grid, Flex, etc.)
- **ui/**: Generic UI components (Modal, Dropdown, Tooltip, etc.)

### @src/validators
- All validation functions should be placed here
- Each validator should be a pure function
- Export validators as named exports
- Example: `emailValidator.js`, `passwordValidator.js`, `formValidators.js`

### @src/services
- API service functions organized by domain
- Each service file should handle one resource/domain
- Use axios or fetch wrapper from @utils
- Example: `authService.js`, `userService.js`, `apiService.js`

### @src/utils
- Helper functions and utilities
- API client configuration
- Constants
- Formatters (date, currency, etc.)
- Example: `apiClient.js`, `constants.js`, `formatters.js`

### @src/hooks
- Custom React hooks
- Reusable logic hooks
- Example: `useAuth.js`, `useForm.js`, `useApi.js`, `useLocalStorage.js`

### @src/context
- React Context providers
- Global state management
- Example: `theme.js`, `authContext.js`, `appContext.js`

### @src/pages
- Page components (one per route)
- Pages should be mostly presentational
- Business logic should be in hooks or services

### @src/routes
- Route configuration
- Route guards and protected routes
- Example: `routes.js`, `PrivateRoute.js`

### @src/layouts
- Layout components that wrap pages
- Example: `AuthLayout.js`, `DashboardLayout.js`, `MainLayout.js`

### @src/styles
- Global styles
- CSS modules (if needed)
- Theme variables
- Example: `global.css`, `variables.css`

### @src/assets
- Static assets (images, icons, fonts)
- Organized by type: `images/`, `icons/`, `fonts/`

## Import Rules

1. Use absolute imports with path aliases (configure in vite.config.js)
2. Import order:
   - React and external libraries
   - Internal components
   - Hooks
   - Utils and services
   - Types (if using TypeScript)
   - Styles

3. Example:
```javascript
import React, { useState } from 'react'
import { useTheme } from '@/context/theme'
import { PrimaryButton } from '@/components/buttons'
import { TextField } from '@/components/forms'
import { validateEmail } from '@/validators'
import { loginUser } from '@/services/authService'
```

## Component Rules

1. Use functional components with hooks
2. One component per file
3. Use named exports for components
4. Props should be destructured
5. Use PropTypes for prop validation
6. Components should be reusable and composable

## Validation Rules

1. All form validations should use validators from @validators
2. Validators should return `{ isValid: boolean, error: string }`
3. Use validators in form hooks or directly in components

## API Rules

1. All API calls should go through services in @services
2. Use API client from @utils for consistent error handling
3. Handle loading and error states
4. Use hooks for API calls when possible (useApi, useAuth, etc.)

## State Management

1. Use Context API for global state (theme, auth, etc.)
2. Use local state for component-specific state
3. Consider custom hooks for complex state logic

## File Naming

1. Components: PascalCase (e.g., `PrimaryButton.jsx`)
2. Hooks: camelCase with "use" prefix (e.g., `useAuth.js`)
3. Utils: camelCase (e.g., `apiClient.js`)
4. Services: camelCase (e.g., `authService.js`)
5. Validators: camelCase (e.g., `emailValidator.js`)
6. Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`)

## Code Quality

1. No console.log in production code
2. Use meaningful variable names
3. Add comments for complex logic
4. Keep functions small and focused
5. Avoid deep nesting (max 3 levels)

