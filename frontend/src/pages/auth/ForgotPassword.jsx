import React, { useState } from 'react'
import {
  AuthCard,
  Heading,
  Label,
  BodyText,
  TextField,
  AuthButton,
  ErrorMessage,
  FieldError,
} from '../../components'
import { useTheme } from '../../context/theme'
import { useForm } from '../../hooks/useForm'
import { validateEmail } from '../../validators'
import { ROUTES } from '../../utils/constants'
import { forgotPassword } from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/icons/logo.png'
import loginBackgroundVideo from '../../assets/videos/6917969_Motion_Graphics_Motion_Graphic_1920x1080.mp4'

const ForgotPassword = () => {
  const t = useTheme()
  const navigate = useNavigate()
  const [successMessage, setSuccessMessage] = useState('')

  const validators = {
    email: validateEmail,
  }

  const handleForgotPassword = async (values) => {
    setSuccessMessage('')
    try {
      await forgotPassword(values.email)
      // Navigate to OTP verification page
      navigate(`${ROUTES.OTP_VERIFICATION}?flow=forgot_password`)
    } catch (error) {
      throw error
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
      email: '',
    },
    validators,
    handleForgotPassword
  )

  // Ignore submit-level errors when determining if the button should be enabled
  const { submit: _submitError, ...fieldErrors } = errors
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  const isFormValid = values.email.trim() !== '' && !hasFieldErrors

  return (
    <AuthCard backgroundVideo={loginBackgroundVideo} dimBackground={false}>
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
        Forgot Password
      </Heading>

      <BodyText muted style={{ marginBottom: t.spacing(6) }}>
        Enter the email address to receive the password reset OTP
      </BodyText>

      <ErrorMessage message={errors.submit} style={{ marginBottom: t.spacing(4) }} />

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: t.spacing(6) }}>
          <Label htmlFor="email">Email</Label>
          <TextField
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={values.email}
            onChange={(e) => {
              setSuccessMessage('')
              handleChange('email', e.target.value)
            }}
            onBlur={() => handleBlur('email')}
            error={touched.email && errors.email}
          />
          <FieldError error={touched.email ? errors.email : null} />
        </div>

        <AuthButton type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send'}
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

export default ForgotPassword


