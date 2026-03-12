'use client'

// ─── DWELL JOURNAL — Login + Ministry by Text Opt-In ─────────────────────────
// This single form does two things at once when submitted:
//   1. Calls the Ministry by Text API to opt the user into your texting group
//   2. Creates or signs into their Supabase journal account
// Users only ever see one simple form — name + phone number.

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ── Ministry by Text API config ───────────────────────────────────────────────
const MBT_URL =
  'https://api.ministrybytext.com/accounts/75dbe793-56c9-4a80-8d37-54dcffe469b7/' +
  'campus/ca1e8adb-550e-47c3-8475-5f116c3211ff/' +
  'groups/1e11a339-8f71-4f3b-8cf6-0398f9022e58/optin-subscriber'

// ── Supabase auth helpers ─────────────────────────────────────────────────────
function cleanPhone(raw: string): string { return raw.replace(/\D/g, '') }
function phoneToEmail(phone: string): string { return `${phone}@dwell.journal` }
const INTERNAL_PASSWORD = 'DwellJournal!SecureInternalKey#2026'

export default function LoginPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [message,   setMessage]   = useState('')
  const [isError,   setIsError]   = useState(false)

  // ── Phone formatting ──────────────────────────────────────────────────────
  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = cleanPhone(e.target.value)
    let formatted = digits
    if      (digits.length >= 7) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`
    else if (digits.length >= 4) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
    else if (digits.length >= 1) formatted = `(${digits}`
    setPhone(formatted)
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    const digits = cleanPhone(phone)

    // Validate inputs
    if (!firstName.trim()) {
      setMessage('Please enter your first name.'); setIsError(true); setLoading(false); return
    }
    if (digits.length !== 10) {
      setMessage('Please enter a valid 10-digit phone number.'); setIsError(true); setLoading(false); return
    }

    // ── Step 1: Opt into Ministry by Text ─────────────────────────────────
    // We call the MBT API first. If it fails we still let them into the journal
    // — we don't want a network hiccup to block someone from journaling.
    try {
      await fetch(MBT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          FirstName: firstName.trim(),
          LastName:  lastName.trim(),
          MobileNo:  digits,   // MBT expects digits only, no formatting
        }),
      })
      // We intentionally don't block on the response — MBT will handle
      // duplicate opt-ins gracefully on their end.
    } catch {
      // Silent fail — journal login still proceeds
      console.warn('Ministry by Text opt-in could not be reached.')
    }

    // ── Step 2: Sign into (or create) Supabase journal account ────────────
    const email = phoneToEmail(digits)

    // Try signing in first (returning user)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email, password: INTERNAL_PASSWORD,
    })

    if (!signInError) {
      // Existing user — update their name in case it changed
      await supabase.auth.updateUser({
        data: { first_name: firstName.trim(), last_name: lastName.trim(), phone_number: digits }
      })
      router.push('/journal')
      return
    }

    // New user — create account
    if (signInError.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: INTERNAL_PASSWORD,
        options: { data: { first_name: firstName.trim(), last_name: lastName.trim(), phone_number: digits } }
      })

      if (signUpError) {
        setMessage('Something went wrong creating your account. Please try again.')
        setIsError(true)
      } else {
        const { error: finalError } = await supabase.auth.signInWithPassword({ email, password: INTERNAL_PASSWORD })
        if (finalError) {
          setMessage('Account created! Please enter your details again to sign in.')
        } else {
          router.push('/journal')
        }
      }
    } else {
      setMessage(signInError.message)
      setIsError(true)
    }

    setLoading(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.bgOverlay} />
      <div style={S.card}>

        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoIcon}>✦</div>
          <h1 style={S.logoTitle}>dwell</h1>
          <p style={S.logoSub}>journal</p>
        </div>

        <p style={S.tagline}>
          Sign up to receive daily scripture texts and access your personal journal.
        </p>

        <form onSubmit={handleSubmit} style={S.form}>

          {/* Name row */}
          <div style={S.nameRow}>
            <div style={S.nameField}>
              <label style={S.label}>First Name</label>
              <input
                type="text" required value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Jane" style={S.input}
                autoComplete="given-name"
              />
            </div>
            <div style={S.nameField}>
              <label style={S.label}>Last Name</label>
              <input
                type="text" value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Smith" style={S.input}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Phone */}
          <label style={{ ...S.label, marginTop: '20px' }}>Mobile Number</label>
          <input
            type="tel" required value={phone}
            onChange={handlePhoneChange}
            placeholder="(214) 555-1234"
            maxLength={14} inputMode="numeric"
            style={{ ...S.input, fontSize: '20px', letterSpacing: '2px' }}
            autoComplete="tel"
          />
          <p style={S.inputHint}>
            By submitting, you agree to receive recurring automated text messages
            from PCBC. Message &amp; data rates may apply. Reply STOP to opt out.
          </p>

          {/* Error / info message */}
          {message && (
            <p style={isError ? S.errorMsg : S.infoMsg}>{message}</p>
          )}

          <button type="submit" disabled={loading} style={S.button}>
            {loading ? 'Submitting…' : 'Join & Open My Journal →'}
          </button>
        </form>

        {/* What they're signing up for */}
        <div style={S.infoBox}>
          <p style={S.infoBoxTitle}>What happens when you sign up?</p>
          <p style={S.infoBoxText}>
            You'll receive daily scripture text messages and get access to your
            private DWELL journal — all with just your phone number.
            Returning? Enter the same details to pick up where you left off.
          </p>
        </div>

        <p style={S.verse}>
          "Your word is a lamp to my feet and a light to my path." — Psalm 119:105
        </p>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const BLUE='#2D4F9E', GOLD='#B8933A', CREAM='#FAF7F2', WHITE='#FFFFFF', DARK='#1A2A4A'

const S: Record<string, React.CSSProperties> = {
  page:{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${BLUE} 0%,#1B3270 60%,#0E1F4A 100%)`,fontFamily:"'Georgia','Times New Roman',serif",position:'relative',padding:'24px' },
  bgOverlay:{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 20% 80%,rgba(184,147,58,0.12) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(255,255,255,0.06) 0%,transparent 40%)',pointerEvents:'none' },
  card:{ position:'relative',background:CREAM,borderRadius:'4px',padding:'48px 44px 40px',width:'100%',maxWidth:'440px',boxShadow:'0 32px 80px rgba(0,0,0,0.4)',border:'1px solid rgba(184,147,58,0.25)' },
  logoWrap:{ textAlign:'center',marginBottom:'8px' },
  logoIcon:{ fontSize:'22px',color:GOLD,marginBottom:'4px' },
  logoTitle:{ fontFamily:"'Georgia',serif",fontSize:'36px',fontWeight:'400',color:BLUE,margin:'0',letterSpacing:'2px',fontStyle:'italic' },
  logoSub:{ fontFamily:"'Georgia',serif",fontSize:'13px',letterSpacing:'6px',color:GOLD,textTransform:'uppercase',margin:'2px 0 0' },
  tagline:{ textAlign:'center',fontSize:'14px',color:'#666',margin:'16px 0 24px',fontStyle:'italic',lineHeight:'1.6' },
  form:{ display:'flex',flexDirection:'column',gap:'4px' },
  nameRow:{ display:'flex',gap:'16px' },
  nameField:{ flex:1,display:'flex',flexDirection:'column',gap:'4px' },
  label:{ fontSize:'11px',letterSpacing:'2px',textTransform:'uppercase',color:BLUE,fontFamily:"'Georgia',serif",marginBottom:'2px' },
  input:{ border:'none',borderBottom:'1.5px solid #C8C0B0',padding:'10px 4px',fontSize:'16px',background:'transparent',color:DARK,outline:'none',fontFamily:"'Georgia',serif",width:'100%',boxSizing:'border-box' },
  inputHint:{ fontSize:'11px',color:'#AAA',margin:'8px 0 0',lineHeight:'1.6' },
  errorMsg:{ fontSize:'13px',color:'#c0392b',background:'#fdf2f2',border:'1px solid #f5c6c6',borderRadius:'4px',padding:'10px 12px',marginTop:'8px' },
  infoMsg:{ fontSize:'13px',color:'#27ae60',background:'#f2fdf6',border:'1px solid #c6f0d4',borderRadius:'4px',padding:'10px 12px',marginTop:'8px' },
  button:{ marginTop:'24px',background:BLUE,color:WHITE,border:'none',borderRadius:'3px',padding:'16px',fontSize:'13px',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'Georgia',serif",cursor:'pointer',width:'100%' },
  infoBox:{ marginTop:'28px',background:'rgba(45,79,158,0.06)',border:'1px solid rgba(45,79,158,0.12)',borderRadius:'4px',padding:'16px 18px' },
  infoBoxTitle:{ fontSize:'11px',letterSpacing:'2px',textTransform:'uppercase',color:BLUE,margin:'0 0 6px',fontFamily:"'Georgia',serif" },
  infoBoxText:{ fontSize:'13px',color:'#666',margin:'0',lineHeight:'1.7',fontStyle:'italic' },
  verse:{ textAlign:'center',fontSize:'11px',color:'#AAA',marginTop:'28px',fontStyle:'italic',lineHeight:'1.7',borderTop:'1px solid #E8E0D4',paddingTop:'20px' },
}
