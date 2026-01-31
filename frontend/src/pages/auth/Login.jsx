import React from 'react'
import {
  AuthCard,
  Heading,
  Label,
  BodyText,
  TextField,
  PasswordField,
  AuthButton,
  ErrorMessage,
  FieldError,
} from '../../components'
import { useTheme } from '../../context/theme'
import { useForm } from '../../hooks/useForm'
import { validateEmail, validatePassword } from '../../validators'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'
import logo from '../../assets/icons/logo.png'
import loginBackgroundVideo from '../../assets/videos/6917969_Motion_Graphics_Motion_Graphic_1920x1080.mp4'

const Login = () => {
  const t = useTheme()
  const { login } = useAuth()
  const navigate = useNavigate()

  // Form validators
  const validators = {
    email: validateEmail,
    password: (value) => validatePassword(value, { minLength: 6}),
  }

  // Form submission handler
  const handleLogin = async (values) => {
    try {
      const res = await login({
        email: values.email,
        password: values.password,
      })
      const profile = res?.profile || res?.user || null
      // On successful login, route based on user.is_admin
      if (profile && profile.is_admin === false) {
        navigate(ROUTES.EMPLOYEE_DASHBOARD)
      } else {
      navigate(ROUTES.DASHBOARD)
      }
    } catch (error) {
      throw error
    }
  }

  // Use form hook
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
      password: '',
    },
    validators,
    handleLogin
  )

  // Ignore submit-level errors when determining if the button should be enabled
  const { submit: _submitError, ...fieldErrors } = errors
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  const isFormValid =
    values.email.trim() !== '' &&
    values.password.trim() !== '' &&
    !hasFieldErrors

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
        }}
      >
        Login
      </Heading>

      <ErrorMessage message={errors.submit} style={{ marginBottom: t.spacing(4) }} />

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: t.spacing(4) }}>
          <Label htmlFor="email">Email</Label>
          <TextField
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={touched.email && errors.email}
          />
          <FieldError error={touched.email ? errors.email : null} />
        </div>

        <div style={{ marginBottom: t.spacing(2) }}>
          <Label htmlFor="password">Password</Label>
          <PasswordField
            id="password"
            placeholder="Enter your password"
            value={values.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            error={touched.password && errors.password}
          />
          <FieldError error={touched.password ? errors.password : null} />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: t.spacing(6),
          }}
        >
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: t.colors.link,
              fontSize: t.font.size.xs,
              cursor: 'pointer',
              padding: 0,
            }}
            onClick={() => {
              window.location.href = ROUTES.FORGOT_PASSWORD
            }}
          >
            Forgot Password?
          </button>
        </div>

        <AuthButton type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </AuthButton>
      </form>

      <div
        style={{
          marginTop: t.spacing(6),
          textAlign: 'center',
        }}
      >
        <BodyText muted>
          Don&apos;t have an account?{' '}
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
              window.location.href = ROUTES.REGISTER
            }}
          >
            Sign up
          </button>
        </BodyText>
      </div>
    </AuthCard>
  )
}

export default Login
