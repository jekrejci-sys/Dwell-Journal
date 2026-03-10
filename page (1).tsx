'use client'

// ─── DWELL JOURNAL — Journal Entry Page ───────────────────────────────────────
// This page lets signed-in users:
//   1. See today's reading passage
//   2. Write entries in the 4 DWELL sections (Scripture, Hear, Obey, Tell)
//   3. Save entries to Supabase
//   4. Browse past entries

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────
type JournalEntry = {
  id: string
  entry_date: string
  passage: string
  scripture: string
  hear: string
  obey: string
  tell: string
  created_at: string
}

// ── Reading plan (mirrors the PDF Jan–Mar 2026) ───────────────────────────────
const READING_PLAN: Record<string, string> = {
  '2026-01-01': '1 Kings 1',   '2026-01-02': 'Psalm 55',
  '2026-01-05': '1 Kings 2',   '2026-01-06': '1 Kings 3',
  '2026-01-07': '1 Kings 4',   '2026-01-08': '1 Kings 5',
  '2026-01-09': 'Psalm 56',    '2026-01-12': '1 Kings 6',
  '2026-01-13': '1 Kings 7',   '2026-01-14': '1 Kings 8',
  '2026-01-15': '1 Kings 9',   '2026-01-16': 'Psalm 57',
  '2026-01-19': '1 Kings 10',  '2026-01-20': '1 Kings 11',
  '2026-01-21': '1 Kings 12',  '2026-01-22': '1 Kings 13',
  '2026-01-23': 'Psalm 58',    '2026-01-26': '1 Kings 14',
  '2026-01-27': '1 Kings 15',  '2026-01-28': '1 Kings 16',
  '2026-01-29': '1 Kings 17',  '2026-01-30': 'Psalm 59',
  '2026-02-02': '1 Kings 18',  '2026-02-03': '1 Kings 19',
  '2026-02-04': '1 Kings 20',  '2026-02-05': '1 Kings 21',
  '2026-02-06': 'Psalm 60',    '2026-02-09': '1 Kings 22',
  '2026-02-10': 'Song of Solomon 1', '2026-02-11': 'Song of Solomon 2',
  '2026-02-12': 'Song of Solomon 3', '2026-02-13': 'Psalm 61',
  '2026-02-16': 'Song of Solomon 4', '2026-02-17': 'Song of Solomon 5',
  '2026-02-18': 'Song of Solomon 6', '2026-02-19': 'Song of Solomon 7',
  '2026-02-20': 'Psalm 62',    '2026-02-23': 'Song of Solomon 8',
  '2026-02-24': 'Romans 1',    '2026-02-25': 'Romans 2',
  '2026-02-26': 'Romans 3',    '2026-02-27': 'Psalm 63',
  '2026-03-02': 'Romans 4',    '2026-03-03': 'Romans 5',
  '2026-03-04': 'Romans 6',    '2026-03-05': 'Romans 7',
  '2026-03-06': 'Psalm 64',    '2026-03-09': 'Romans 8',
  '2026-03-10': 'Romans 9',    '2026-03-11': 'Romans 10',
  '2026-03-12': 'Romans 11',   '2026-03-13': 'Psalm 65',
  '2026-03-16': 'Romans 12',   '2026-03-17': 'Romans 13',
  '2026-03-18': 'Romans 14',   '2026-03-19': 'Romans 15',
  '2026-03-20': 'Psalm 66',    '2026-03-23': 'Romans 16',
  '2026-03-24': '2 Thessalonians 1', '2026-03-25': '2 Thessalonians 2',
  '2026-03-26': '2 Thessalonians 3', '2026-03-27': 'Psalm 67',
}

// ── Helper: get today's date string ──────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Section config ─────────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: 'scripture' as const,
    label: 'SCRIPTURE',
    color: '#2D4F9E',
    prompt: 'Write out 2–3 verses that stood out to you from today\'s reading.',
    icon: '📖',
  },
  {
    key: 'hear' as const,
    label: 'HEAR',
    color: '#B8933A',
    prompt: 'What do you hear God saying to you through these verses?',
    icon: '👂',
  },
  {
    key: 'obey' as const,
    label: 'OBEY',
    color: '#2D4F9E',
    prompt: 'How can you be obedient to what God is telling you today?',
    icon: '🙏',
  },
  {
    key: 'tell' as const,
    label: 'TELL',
    color: '#B8933A',
    prompt: 'Who do you know that might need this word of encouragement today?',
    icon: '💬',
  },
]

// ── Main Component ─────────────────────────────────────────────────────────
export default function JournalPage() {
  const supabase = createClient()
  const router   = useRouter()

  // State
  const [today]           = useState(todayStr())
  const [passage, setPassage]     = useState(READING_PLAN[todayStr()] ?? 'No passage today')
  const [scripture, setScripture] = useState('')
  const [hear, setHear]           = useState('')
  const [obey, setObey]           = useState('')
  const [tell, setTell]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([])
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [tab, setTab] = useState<'write' | 'history'>('write')

  // ── Load user + existing entry for today + past entries ─────────────────
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email ?? '')

    // Check if entry already exists for today
    const { data: existing } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('entry_date', today)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      setScripture(existing.scripture ?? '')
      setHear(existing.hear ?? '')
      setObey(existing.obey ?? '')
      setTell(existing.tell ?? '')
      setPassage(existing.passage ?? passage)
    }

    // Load all past entries
    const { data: all } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    setPastEntries(all ?? [])
  }, [supabase, router, today, passage])

  useEffect(() => { loadData() }, [loadData])

  // ── Sign out ─────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Save entry ────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const entryData = {
      user_id: user.id,
      entry_date: today,
      passage,
      scripture,
      hear,
      obey,
      tell,
    }

    // Upsert = insert if new, update if already exists
    const { error } = await supabase
      .from('journal_entries')
      .upsert(entryData, { onConflict: 'user_id,entry_date' })

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      loadData()  // refresh history
    }
    setSaving(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerLogo}>dwell</span>
          <span style={styles.headerLogoSub}>journal</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerEmail}>{userEmail}</span>
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out</button>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setTab('write')}
          style={{ ...styles.tab, ...(tab === 'write' ? styles.tabActive : {}) }}
        >
          Today's Entry
        </button>
        <button
          onClick={() => setTab('history')}
          style={{ ...styles.tab, ...(tab === 'history' ? styles.tabActive : {}) }}
        >
          Past Entries ({pastEntries.length})
        </button>
      </div>

      <main style={styles.main}>

        {/* ════════ WRITE TAB ════════ */}
        {tab === 'write' && (
          <div>
            {/* Date + Passage banner */}
            <div style={styles.passageBanner}>
              <p style={styles.passageDate}>{formatDisplayDate(today)}</p>
              <div style={styles.passageRow}>
                <h2 style={styles.passageTitle}>{passage}</h2>
                <input
                  value={passage}
                  onChange={e => setPassage(e.target.value)}
                  style={styles.passageEdit}
                  placeholder="Edit passage…"
                />
              </div>
              <p style={styles.passageHint}>
                Read the passage above, then fill out the four sections below.
              </p>
            </div>

            {/* 4 Journal Sections */}
            <div style={styles.sectionsGrid}>
              {SECTIONS.map(section => (
                <div key={section.key} style={styles.sectionCard}>
                  <div style={{ ...styles.sectionHeader, borderLeftColor: section.color }}>
                    <span style={styles.sectionIcon}>{section.icon}</span>
                    <h3 style={{ ...styles.sectionLabel, color: section.color }}>
                      {section.label}
                    </h3>
                  </div>
                  <p style={styles.sectionPrompt}>{section.prompt}</p>
                  <textarea
                    value={
                      section.key === 'scripture' ? scripture :
                      section.key === 'hear'      ? hear      :
                      section.key === 'obey'      ? obey      : tell
                    }
                    onChange={e => {
                      const val = e.target.value
                      if (section.key === 'scripture') setScripture(val)
                      else if (section.key === 'hear') setHear(val)
                      else if (section.key === 'obey') setObey(val)
                      else setTell(val)
                    }}
                    placeholder={`Write your ${section.label.toLowerCase()} here…`}
                    style={styles.textarea}
                    rows={5}
                  />
                </div>
              ))}
            </div>

            {/* Save button */}
            <div style={styles.saveRow}>
              {saved && <span style={styles.savedBadge}>✓ Entry saved!</span>}
              <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </div>
        )}

        {/* ════════ HISTORY TAB ════════ */}
        {tab === 'history' && !viewingEntry && (
          <div>
            <h2 style={styles.historyTitle}>Your Journal Entries</h2>
            {pastEntries.length === 0 && (
              <p style={styles.emptyState}>No entries yet. Start writing today!</p>
            )}
            <div style={styles.entryList}>
              {pastEntries.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => setViewingEntry(entry)}
                  style={styles.entryCard}
                >
                  <div style={styles.entryCardLeft}>
                    <p style={styles.entryCardDate}>{formatDisplayDate(entry.entry_date)}</p>
                    <p style={styles.entryCardPassage}>{entry.passage}</p>
                    {entry.scripture && (
                      <p style={styles.entryCardPreview}>
                        "{entry.scripture.slice(0, 80)}{entry.scripture.length > 80 ? '…' : ''}"
                      </p>
                    )}
                  </div>
                  <span style={styles.entryCardArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════════ ENTRY DETAIL VIEW ════════ */}
        {tab === 'history' && viewingEntry && (
          <div>
            <button onClick={() => setViewingEntry(null)} style={styles.backBtn}>
              ← Back to entries
            </button>
            <div style={styles.passageBanner}>
              <p style={styles.passageDate}>{formatDisplayDate(viewingEntry.entry_date)}</p>
              <h2 style={styles.passageTitle}>{viewingEntry.passage}</h2>
            </div>
            <div style={styles.sectionsGrid}>
              {SECTIONS.map(section => (
                <div key={section.key} style={styles.sectionCard}>
                  <div style={{ ...styles.sectionHeader, borderLeftColor: section.color }}>
                    <span style={styles.sectionIcon}>{section.icon}</span>
                    <h3 style={{ ...styles.sectionLabel, color: section.color }}>
                      {section.label}
                    </h3>
                  </div>
                  <p style={styles.readonlyText}>
                    {viewingEntry[section.key] || <em style={{ color: '#bbb' }}>Not filled in</em>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const BLUE  = '#2D4F9E'
const GOLD  = '#B8933A'
const CREAM = '#FAF7F2'

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: CREAM,
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  header: {
    background: BLUE,
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
  },
  headerLeft: { display: 'flex', alignItems: 'baseline', gap: '8px' },
  headerLogo: {
    color: '#fff',
    fontSize: '22px',
    fontStyle: 'italic',
    letterSpacing: '1px',
  },
  headerLogoSub: {
    color: GOLD,
    fontSize: '11px',
    letterSpacing: '4px',
    textTransform: 'uppercase',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  headerEmail: { color: 'rgba(255,255,255,0.65)', fontSize: '12px' },
  signOutBtn: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    letterSpacing: '1px',
    fontFamily: "'Georgia', serif",
  },
  tabBar: {
    background: '#fff',
    borderBottom: '1px solid #E8E0D4',
    display: 'flex',
    padding: '0 32px',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '14px 20px',
    fontSize: '13px',
    letterSpacing: '1px',
    color: '#999',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
    transition: 'color 0.2s',
  },
  tabActive: {
    color: BLUE,
    borderBottomColor: GOLD,
  },
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px 24px 80px',
  },
  passageBanner: {
    background: BLUE,
    borderRadius: '6px',
    padding: '28px 32px',
    marginBottom: '28px',
    color: '#fff',
  },
  passageDate: {
    fontSize: '12px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
    margin: '0 0 8px',
  },
  passageRow: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  passageTitle: {
    fontSize: '28px',
    fontWeight: '400',
    margin: '0',
    fontStyle: 'italic',
    letterSpacing: '0.5px',
  },
  passageEdit: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '3px',
    color: '#fff',
    padding: '6px 10px',
    fontSize: '13px',
    fontFamily: "'Georgia', serif",
    outline: 'none',
    width: '180px',
  },
  passageHint: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    margin: '12px 0 0',
    fontStyle: 'italic',
  },
  sectionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  sectionCard: {
    background: '#fff',
    borderRadius: '6px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #EDE8E0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderLeft: '4px solid',
    paddingLeft: '12px',
    marginBottom: '10px',
  },
  sectionIcon: { fontSize: '18px' },
  sectionLabel: {
    fontSize: '13px',
    letterSpacing: '3px',
    fontWeight: '700',
    margin: '0',
    fontFamily: "'Georgia', serif",
  },
  sectionPrompt: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 14px',
    fontStyle: 'italic',
    lineHeight: '1.6',
  },
  textarea: {
    width: '100%',
    border: '1px solid #E8E0D4',
    borderRadius: '4px',
    padding: '12px',
    fontSize: '15px',
    fontFamily: "'Georgia', serif",
    color: '#2A2A2A',
    lineHeight: '1.7',
    resize: 'vertical',
    background: '#FDFBF8',
    outline: 'none',
    boxSizing: 'border-box',
  },
  readonlyText: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#333',
    whiteSpace: 'pre-wrap',
    margin: '0',
  },
  saveRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '16px',
  },
  savedBadge: {
    background: '#e8f5e9',
    color: '#2e7d32',
    border: '1px solid #c8e6c9',
    borderRadius: '4px',
    padding: '8px 14px',
    fontSize: '13px',
    fontFamily: "'Georgia', serif",
  },
  saveBtn: {
    background: GOLD,
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    padding: '14px 32px',
    fontSize: '13px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    fontFamily: "'Georgia', serif",
    cursor: 'pointer',
  },
  historyTitle: {
    fontSize: '22px',
    color: BLUE,
    fontStyle: 'italic',
    marginBottom: '20px',
    fontWeight: '400',
  },
  emptyState: {
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '48px',
  },
  entryList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  entryCard: {
    background: '#fff',
    border: '1px solid #EDE8E0',
    borderRadius: '6px',
    padding: '20px 24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    width: '100%',
    fontFamily: "'Georgia', serif",
    transition: 'box-shadow 0.2s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  entryCardLeft: { flex: 1 },
  entryCardDate: { fontSize: '12px', color: '#999', margin: '0 0 4px', letterSpacing: '1px' },
  entryCardPassage: { fontSize: '18px', color: BLUE, fontStyle: 'italic', margin: '0 0 6px' },
  entryCardPreview: { fontSize: '13px', color: '#888', margin: '0', fontStyle: 'italic' },
  entryCardArrow: { fontSize: '20px', color: GOLD, marginLeft: '16px' },
  backBtn: {
    background: 'none',
    border: 'none',
    color: BLUE,
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Georgia', serif",
    padding: '0',
    marginBottom: '20px',
    textDecoration: 'underline',
  },
}
