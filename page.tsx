'use client'

// ─── DWELL JOURNAL — Login Page ───────────────────────────────────────────────
// This page handles Sign Up and Sign In using Supabase Auth.
// Users enter their email + password. On success they're sent to /journal.

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)   // toggle between Sign In / Sign Up
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')

  // ── Handle form submit ──────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      // Create a brand-new account
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Check your email for a confirmation link!')
      }
    } else {
      // Sign into an existing account
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/journal')   // ← go to journal on success
      }
    }

    setLoading(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Background texture overlay */}
      <div style={styles.bgOverlay} />

      <div style={styles.card}>
        {/* Logo area */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>✦</div>
          <h1 style={styles.logoTitle}>dwell</h1>
          <p style={styles.logoSub}>journal</p>
        </div>

        <p style={styles.tagline}>
          {isSignUp ? 'Create your account to begin.' : 'Welcome back. Open your journal.'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
          />

          {/* Error / success message */}
          {message && (
            <p style={message.includes('Check') ? styles.successMsg : styles.errorMsg}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle sign in / sign up */}
        <p style={styles.toggleText}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
            style={styles.toggleBtn}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <p style={styles.verse}>"Your word is a lamp to my feet and a light to my path." — Psalm 119:105</p>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────
const BLUE    = '#2D4F9E'
const GOLD    = '#B8933A'
const CREAM   = '#FAF7F2'
const WHITE   = '#FFFFFF'
const DARK    = '#1A2A4A'

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${BLUE} 0%, #1B3270 60%, #0E1F4A 100%)`,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: 'relative',
    padding: '24px',
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(184,147,58,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    background: CREAM,
    borderRadius: '4px',
    padding: '48px 44px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
    border: `1px solid rgba(184,147,58,0.25)`,
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  logoIcon: {
    fontSize: '22px',
    color: GOLD,
    marginBottom: '4px',
  },
  logoTitle: {
    fontFamily: "'Georgia', serif",
    fontSize: '36px',
    fontWeight: '400',
    color: BLUE,
    margin: '0',
    letterSpacing: '2px',
    fontStyle: 'italic',
  },
  logoSub: {
    fontFamily: "'Georgia', serif",
    fontSize: '13px',
    letterSpacing: '6px',
    color: GOLD,
    textTransform: 'uppercase',
    margin: '2px 0 0',
  },
  tagline: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    margin: '20px 0 28px',
    fontStyle: 'italic',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: BLUE,
    fontFamily: "'Georgia', serif",
    marginBottom: '2px',
    marginTop: '10px',
  },
  input: {
    border: 'none',
    borderBottom: `1.5px solid #C8C0B0`,
    padding: '10px 4px',
    fontSize: '15px',
    background: 'transparent',
    color: DARK,
    outline: 'none',
    fontFamily: "'Georgia', serif",
    transition: 'border-color 0.2s',
  },
  errorMsg: {
    fontSize: '13px',
    color: '#c0392b',
    background: '#fdf2f2',
    border: '1px solid #f5c6c6',
    borderRadius: '4px',
    padding: '10px 12px',
    marginTop: '8px',
  },
  successMsg: {
    fontSize: '13px',
    color: '#27ae60',
    background: '#f2fdf6',
    border: '1px solid #c6f0d4',
    borderRadius: '4px',
    padding: '10px 12px',
    marginTop: '8px',
  },
  button: {
    marginTop: '24px',
    background: BLUE,
    color: WHITE,
    border: 'none',
    borderRadius: '3px',
    padding: '14px',
    fontSize: '13px',
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    fontFamily: "'Georgia', serif",
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  toggleText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#888',
    marginTop: '20px',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: GOLD,
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: "'Georgia', serif",
    textDecoration: 'underline',
  },
  verse: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#AAA',
    marginTop: '28px',
    fontStyle: 'italic',
    lineHeight: '1.7',
    borderTop: '1px solid #E8E0D4',
    paddingTop: '20px',
  },
}
