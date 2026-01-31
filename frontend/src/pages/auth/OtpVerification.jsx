import React, { useEffect, useState } from 'react'
import {
  AuthCard,
  Heading,
  BodyText,
  AuthButton,
  OtpInput,
} from '../../components'
import { useTheme } from '../../context/theme'
import { ROUTES, STORAGE_KEYS } from '../../utils/constants'
import { sendChangePasswordOtp, verifyChangePasswordOtp, verifyOtp, verifyForgotPasswordOtp, forgotPassword } from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/icons/logo.png'
import authBackgroundVideo from '../../assets/videos/6917969_Motion_Graphics_Motion_Graphic_1920x1080.mp4'

const OTP_LENGTH = 6
const INITIAL_SECONDS = 60

const OtpVerification = () => {
  const t = useTheme()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS)
  const [isResendEnabled, setIsResendEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsResendEnabled(true)
      return
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsLeft])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (code.length !== OTP_LENGTH) return

    setIsSubmitting(true)
    setError('')
    try {
      const params = new URLSearchParams(window.location.search)
      const flow = params.get('flow') || ''

      if (flow === 'change_password') {
        const res = await verifyChangePasswordOtp({ otp: code })
        const token = res?.token || res?.data?.token
        if (!token) throw new Error('Missing reset token')
        navigate(`${ROUTES.RESET_PASSWORD}?flow=change_password&token=${encodeURIComponent(String(token))}`)
      } else if (flow === 'forgot_password') {
        const email = localStorage.getItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL)
        if (!email) {
          setError('Password reset session expired. Please request a new OTP.')
          setIsSubmitting(false)
          return
        }

        const res = await verifyForgotPasswordOtp({ email, otp: code })
        const token = res?.token || res?.data?.token
        if (!token) throw new Error('Missing reset token')
        // Keep email in localStorage for ResetPassword page
        navigate(`${ROUTES.RESET_PASSWORD}?flow=forgot_password&token=${encodeURIComponent(String(token))}`)
      } else {
        const email = localStorage.getItem(STORAGE_KEYS.SIGNUP_EMAIL)
        if (!email) {
          setError('Signup session expired. Please sign up again.')
          setIsSubmitting(false)
          return
        }

        await verifyOtp({ email, otp: code })
        // After successful verification, redirect to login
        navigate(ROUTES.LOGIN)
      }
    } catch (err) {
      setError(err?.message || 'Failed to verify OTP. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = () => {
    if (!isResendEnabled || isResending) return
    const params = new URLSearchParams(window.location.search)
    const flow = params.get('flow') || ''
    if (flow === 'change_password') {
      setIsResending(true)
      setError('')
      // Immediately disable + restart timer to prevent double clicks; rollback if request fails.
      setSecondsLeft(INITIAL_SECONDS)
      setIsResendEnabled(false)
      sendChangePasswordOtp()
        .then(() => {
          // timer already restarted
        })
        .catch((e) => {
          setError(e?.message || 'Failed to resend OTP.')
          setSecondsLeft(0)
          setIsResendEnabled(true)
        })
        .finally(() => setIsResending(false))
      return
    }

    // Signup resend not implemented yet
    setSecondsLeft(INITIAL_SECONDS)
    setIsResendEnabled(false)
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  const isFormValid = code.length === OTP_LENGTH

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
          fontWeight: t.font.weight.regular
        }}
      >
        OTP Verification
      </Heading>

      <BodyText
        style={{
          marginBottom: t.spacing(6),
        }}
      >
        Enter the verification code sent to your registered email address
      </BodyText>

      {error && (
        <BodyText
          style={{
            marginBottom: t.spacing(4),
            color: t.colors.danger,
          }}
        >
          {error}
        </BodyText>
      )}

      <form onSubmit={handleVerify}>
        <div
          style={{
            marginBottom: t.spacing(6),
          }}
        >
          <OtpInput value={code} onChange={setCode} length={OTP_LENGTH} />
        </div>

        <div
          style={{
            marginBottom: t.spacing(4),
            textAlign: 'center',
            fontSize: t.font.size.sm,
            color: t.colors.subtleText,
          }}
        >
          Code expires in{' '}
          <span style={{ fontWeight: t.font.weight.bold }}>
            {minutes}:{seconds}
          </span>
        </div>

        <AuthButton type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </AuthButton>
      </form>

      <div
        style={{
          marginTop: t.spacing(6),
          textAlign: 'center',
        }}
      >
        <BodyText muted>
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={!isResendEnabled || isResending}
            style={{
              background: 'none',
              border: 'none',
              color: isResendEnabled ? t.colors.link : t.colors.subtleText,
              fontSize: t.font.size.sm,
              cursor: isResendEnabled && !isResending ? 'pointer' : 'default',
              padding: 0,
            }}
          >
            {isResending ? 'Sending...' : 'Resend'}
          </button>
        </BodyText>
      </div>
    </AuthCard>
  )
}

export default OtpVerification


