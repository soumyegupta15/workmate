import React, { useState } from 'react'
import {
  AuthCard,
  Heading,
  Label,
  BodyText,
  PasswordField,
  AuthButton,
  ErrorMessage,
  FieldError,
  TextField,
} from '../../components'
import { useTheme } from '../../context/theme'
import { useForm } from '../../hooks/useForm'
import { validatePassword } from '../../validators'
import { ROUTES, STORAGE_KEYS } from '../../utils/constants'
import { resetChangePassword, resetPassword } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/icons/logo.png'
import authBackgroundVideo from '../../assets/videos/6917969_Motion_Graphics_Motion_Graphic_1920x1080.mp4'

const ResetPassword = () => {
  const t = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const searchParams = new URLSearchParams(window.location.search)
  const flow = searchParams.get('flow') || ''
  const isChangePasswordFlow = flow === 'change_password'
  const isForgotPasswordFlow = flow === 'forgot_password'

  const validators = {
    email: (value) => {
      if (isChangePasswordFlow || isForgotPasswordFlow) {
        return { isValid: true, error: '' }
      }
      if (!value || value.trim() === '') {
        return {
          isValid: false,
          error: 'Please enter your email',
        }
      }
      return {
        isValid: true,
        error: '',
      }
    },
    newPassword: (value) => validatePassword(value, { minLength: 6 }),
    confirmPassword: (value, allValues) => {
      if (!value || value.trim() === '') {
        return {
          isValid: false,
          error: 'Please confirm your password',
        }
      }

      if (value !== allValues.newPassword) {
        return {
          isValid: false,
          error: 'Passwords do not match',
        }
      }

      return {
        isValid: true,
        error: '',
      }
    },
  }

  const handleResetPassword = async (values) => {
    setSuccessMessage('')
    setErrorMessage('')

    try {
      // Supabase typically sends `access_token` in the reset URL; we forward it as `token`
      const token =
        searchParams.get('token') ||
        searchParams.get('access_token') ||
        ''

      if (!token) {
        setErrorMessage('Invalid or expired reset link. Please request a new one.')
        return
      }

      if (isChangePasswordFlow) {
        await resetChangePassword({ token, newPassword: values.newPassword })
        setSuccessMessage('Your password has been updated successfully.')
        try {
          await logout()
        } catch {
          // ignore
        }
        navigate(ROUTES.LOGIN)
      } else if (isForgotPasswordFlow) {
        // Get email from localStorage or use the one from URL state
        const email = values.email || localStorage.getItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL) || ''
        if (!email) {
          setErrorMessage('Email not found. Please request a new password reset.')
          return
        }
        await resetPassword({
          email,
          newPassword: values.newPassword,
          token,
        })
        setSuccessMessage('Your password has been updated successfully.')
        // Clear stored email
        localStorage.removeItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL)
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate(ROUTES.LOGIN)
        }, 1500)
      } else {
        await resetPassword({
          email: values.email,
          newPassword: values.newPassword,
          token,
        })
        setSuccessMessage('Your password has been updated successfully.')
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to reset password.')
    }
  }

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      email: isChangePasswordFlow || isForgotPasswordFlow
        ? (user?.email || localStorage.getItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL) || '')
        : '',
      newPassword: '',
      confirmPassword: '',
    },
    {
      email: (value) => validators.email(value),
      newPassword: (value) => validators.newPassword(value),
      confirmPassword: (value) => validators.confirmPassword(value, values),
    },
    handleResetPassword,
  )

  // Ignore submit-level errors when determining if the button should be enabled
  const { submit: _submitError, ...fieldErrors } = errors
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  const isFormValid =
    values.email.trim() !== '' &&
    values.newPassword.trim() !== '' &&
    values.confirmPassword.trim() !== '' &&
    !hasFieldErrors

  return (
    <AuthCard backgroundVideo={authBackgroundVideo} dimBackground={false}>
      <div style={{ textAlign: 'center', marginBottom: t.spacing(6) }}>
        <img
          src={logo}
          alt="Workmate AI logo"
          style={{ height: 140, objectFit: 'contain' }}
        />
      </div>

      <Heading
        style={{
          textAlign: 'left',
          fontSize: t.font.size.xl,
          fontWeight: t.font.weight.regular,
          marginBottom: t.spacing(2),
        }}
      >
        Change Password
      </Heading>

      <BodyText muted style={{ marginBottom: t.spacing(4) }}>
        Enter your new password below.
      </BodyText>

      <ErrorMessage message={errors.submit} style={{ marginBottom: t.spacing(4) }} />

      {errorMessage && (
        <div
          style={{
            marginBottom: t.spacing(4),
            padding: t.spacing(2),
            borderRadius: t.radius.input,
            backgroundColor: t.colors.danger + '20',
            color: t.colors.danger,
            fontSize: t.font.size.sm,
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            marginBottom: t.spacing(4),
            padding: t.spacing(2),
            borderRadius: t.radius.input,
            backgroundColor: t.colors.progressTrack,
            color: t.colors.buttonText,
            fontSize: t.font.size.sm,
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: t.spacing(3) }}>
          <Label htmlFor="email">Email</Label>
          <TextField
            id="email"
            type="email"
            placeholder="Enter your email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={touched.email && errors.email}
            disabled={isChangePasswordFlow || isForgotPasswordFlow}
          />
          <FieldError error={touched.email ? errors.email : null} />
        </div>

        <div style={{ marginBottom: t.spacing(3) }}>
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordField
            id="newPassword"
            placeholder="Enter new password"
            value={values.newPassword}
            onChange={(e) => handleChange('newPassword', e.target.value)}
            onBlur={() => handleBlur('newPassword')}
            error={touched.newPassword && errors.newPassword}
          />
          <FieldError error={touched.newPassword ? errors.newPassword : null} />
        </div>

        <div style={{ marginBottom: t.spacing(4) }}>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordField
            id="confirmPassword"
            placeholder="Re-enter new password"
            value={values.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            error={touched.confirmPassword && errors.confirmPassword}
          />
          <FieldError
            error={touched.confirmPassword ? errors.confirmPassword : null}
          />
        </div>

        <AuthButton type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? 'Updating password...' : 'Change Password'}
        </AuthButton>
      </form>

      <div
        style={{
          marginTop: t.spacing(6),
          textAlign: 'center',
        }}
      >
        <BodyText muted>
          Back to{' '}
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: t.colors.link,
              fontSize: t.font.size.sm,
              cursor: 'pointer',
              padding: 0,
            }}
            onClick={() => {
              window.location.href = ROUTES.LOGIN
            }}
          >
            Log In
          </button>
        </BodyText>
      </div>
    </AuthCard>
  )
}

export default ResetPassword


