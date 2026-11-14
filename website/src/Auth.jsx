import { useState } from 'react'
import './Auth.css'

const API_BASE = 'https://agrovision-ai-backend.onrender.com'

export default function Auth({ onAuthenticated }) {
  const [page, setPage] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [remember, setRemember] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const update = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const switchPage = (nextPage) => {
    setPage(nextPage)
    setError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (page === 'signup' && form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const endpoint = page === 'signup' ? '/auth/signup' : '/auth/login'
      const payload = page === 'signup'
        ? {
            full_name: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            role: 'farmer',
            password: form.password,
          }
        : {
            email: form.email.trim().toLowerCase(),
            password: form.password,
          }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong. Please try again.')
      }

      if (page === 'signup') {
        setMessage('Account created! You can now sign in.')
        setForm({ ...form, password: '', confirmPassword: '' })
        setPage('login')
      } else {
        const authenticatedUser = data.user || data
        const storage = remember ? localStorage : sessionStorage
        if (data.access_token) {
          storage.setItem('agrovision_token', data.access_token)
        }
        storage.setItem('agrovision_user', JSON.stringify(authenticatedUser))
        onAuthenticated?.(authenticatedUser)
      }
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Cannot connect to the server. Make sure the backend is running.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-identity">
  <svg className="brand-leaf" viewBox="0 0 100 100" aria-label="AgroVision leaf logo">
    <path d="M49 82 C20 73 12 43 35 19 C57 28 68 52 49 82Z" fill="#36C98A"/>
    <path d="M48 79 C48 55 43 39 34 26" stroke="#E8F5C7" strokeWidth="3" fill="none"/>
    <path d="M53 76 C75 66 85 43 75 15 C52 24 42 49 53 76Z" fill="#168B65"/>
    <path d="M53 75 C57 53 65 34 75 20" stroke="#F4D17A" strokeWidth="3" fill="none"/>
    <path d="M51 78 L51 94" stroke="#E8C36A" strokeWidth="4" strokeLinecap="round"/>
  </svg>
  <div className="brand-wordmark">AgroVision<span>AI</span></div>
</div>
        <p className="brand-tagline">Smart Agriculture · Better Decisions</p>
        <div className="brand-divider"></div>
        <h2>Grow Smarter.<br/>Harvest <span>Better.</span></h2>
        <p className="brand-description">
          AI-powered crop price prediction, market insights, weather updates
          and crop planning — all in one platform.
        </p>
        <p className="brand-footer">Technology for a greener tomorrow.</p>
      </div>
      <div className="auth-card-placeholder"><div className={`auth-card ${page === 'signup' ? 'auth-card-signup' : 'auth-card-login'}`}>
        <div className="brand-identity auth-card-brand">
          <svg className="brand-leaf" viewBox="0 0 100 100" aria-label="AgroVision leaf logo">
            <path d="M49 82 C20 73 12 43 35 19 C57 28 68 52 49 82Z" fill="#36C98A"/>
            <path d="M48 79 C48 55 43 39 34 26" stroke="#E8F5C7" strokeWidth="3" fill="none"/>
            <path d="M53 76 C75 66 85 43 75 15 C52 24 42 49 53 76Z" fill="#168B65"/>
            <path d="M53 75 C57 53 65 34 75 20" stroke="#F4D17A" strokeWidth="3" fill="none"/>
            <path d="M51 78 L51 94" stroke="#E8C36A" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <div className="brand-wordmark">AgroVision<span>AI</span></div>
        </div>

        <h1>{page === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>
        {page === 'login' && <p className="auth-subtitle">AgroVision AI</p>}

        <form onSubmit={handleSubmit}>
          {page === 'signup' && (
            <>
              <label className="auth-field auth-field-full">
                Full Name *
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={update}
                  placeholder="Ravi Kumar"
                  autoComplete="name"
                  required
                />
              </label>

              <div className="auth-grid">
                <label className="auth-field">
                  Email Address *
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={update}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="auth-field">
                  Phone Number
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={update}
                    placeholder="+91"
                    autoComplete="tel"
                  />
                </label>
              </div>
            </>
          )}

          {page === 'login' && (
            <label className="auth-field auth-field-full">
              Email Address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                placeholder="farmer@example.com"
                autoComplete="email"
                required
              />
            </label>
          )}

          <div className="auth-grid">
            <label className="auth-field">
              Password *
              <span className="auth-password-wrap">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update}
                  placeholder={page === 'login' ? 'Enter password' : 'Create password'}
                  autoComplete={page === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            {page === 'signup' && (
              <label className="auth-field">
                Confirm Password *
                <span className="auth-password-wrap">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={update}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirmation visibility">
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </span>
              </label>
            )}
          </div>

          {page === 'login' && (
            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className="auth-text-button" onClick={() => setMessage('Password recovery will be available after email verification is configured.')}>
                Forgot Password?
              </button>
            </div>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : page === 'signup'
                ? 'Create Account'
                : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          {page === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={() => switchPage(page === 'signup' ? 'login' : 'signup')}>
            {page === 'signup' ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
    </div>
  )
}
