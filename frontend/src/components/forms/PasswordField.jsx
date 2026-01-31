import React, { useState } from 'react'
import { useTheme } from '../../context/theme'

const PasswordField = ({ value, onChange, error, placeholder, ...rest }) => {
  const t = useTheme()
  const [show, setShow] = useState(false)

  const toggleShow = () => {
    setShow((prev) => !prev)
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: t.spacing(3),
          paddingRight: t.spacing(8),
          borderRadius: t.radius.input,
          border: error ? `1px solid ${t.colors.error}` : 'none',
          outline: 'none',
          backgroundColor: t.colors.inputBackground,
          color: t.colors.inputText,
          fontSize: t.font.size.sm,
          boxSizing: 'border-box',
        }}
        {...rest}
      />
      <button
        type="button"
        onClick={toggleShow}
        style={{
          position: 'absolute',
          right: t.spacing(3),
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: t.colors.subtleText,
        }}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {show ? (
            <>
              <path
                d="M3 3L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.584 10.726C10.2145 11.0954 10.0022 11.5984 10.0022 12.122C10.0022 12.6456 10.2145 13.1486 10.584 13.518C10.9534 13.8875 11.4564 14.0998 11.98 14.0998C12.5036 14.0998 13.0066 13.8875 13.376 13.518"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.362 7.51C8.50194 6.8305 9.80011 6.47412 11.12 6.47599C14.4 6.47599 17.24 8.39599 19.12 11.476C18.53 12.426 17.832 13.306 17.04 14.1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.94 5.51599C9.84391 5.53045 8.7659 5.78784 7.77899 6.27027C6.79207 6.7527 5.91977 7.44934 5.22 8.31599C4.26 9.51599 3.54 10.926 3 12.476C3.768 14.456 4.992 16.176 6.54 17.476C7.68056 18.3876 9.00624 19.0315 10.424 19.36M14.88 18.876C15.9094 18.5745 16.8818 18.097 17.76 17.46C18.72 16.676 19.56 15.696 20.26 14.556C20.6867 13.854 21.0387 13.106 21.31 12.326"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <>
              <path
                d="M1.99902 12.0001C2.72956 10.4945 3.7735 9.16257 5.05902 8.10205C6.67569 6.76464 8.67788 6.03613 10.739 6.03613C12.8002 6.03613 14.8024 6.76464 16.419 8.10205C17.7045 9.16257 18.7485 10.4945 19.479 12.0001C18.7485 13.5057 17.7045 14.8376 16.419 15.8981C14.8024 17.2355 12.8002 17.964 10.739 17.964C8.67788 17.964 6.67569 17.2355 5.05902 15.8981C3.7735 14.8376 2.72956 13.5057 1.99902 12.0001Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.739 15.0001C11.5194 15.0001 12.2676 14.6891 12.8152 14.1415C13.3627 13.5939 13.6737 12.8457 13.6737 12.0653C13.6737 11.2849 13.3627 10.5367 12.8152 9.98912C12.2676 9.44155 11.5194 9.13062 10.739 9.13062C9.95862 9.13062 9.21042 9.44155 8.66285 9.98912C8.11528 10.5367 7.80435 11.2849 7.80435 12.0653C7.80435 12.8457 8.11528 13.5939 8.66285 14.1415C9.21042 14.6891 9.95862 15.0001 10.739 15.0001Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}

export default PasswordField


