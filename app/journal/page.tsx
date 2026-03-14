'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type JournalEntry = {
  id: string; entry_date: string; passage: string
  scripture: string; hear: string; obey: string; tell: string; created_at: string
}

// ── ESV API fetch ─────────────────────────────────────────────────────────────
// Uses the free Crossway ESV API. Key lives in lib/supabase.ts as ESV_API_KEY.
async function fetchESVText(passage: string, apiKey: string): Promise<string> {
  if (!passage || passage === 'No passage scheduled today') return ''
  try {
    const url = `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(passage)}`
      + `&include-headings=false&include-footnotes=false&include-verse-numbers=true`
      + `&include-short-copyright=false&include-passage-references=false`
    const res = await fetch(url, { headers: { Authorization: `Token ${apiKey}` } })
    if (!res.ok) return `Could not load scripture (error ${res.status}).`
    const data = await res.json()
    const text: string = (data.passages ?? [])[0] ?? ''
    return text.trim()
  } catch {
    return 'Could not load scripture. Check your internet connection.'
  }
}

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const formatDate = (d: string) => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})

const SECTIONS = [
  {key:'scripture' as const,label:'SCRIPTURE',color:'#2D4F9E',icon:'📖',prompt:"Write out 2–3 verses that stood out to you from today's reading."},
  {key:'hear'      as const,label:'HEAR',     color:'#B8933A',icon:'👂',prompt:'What do you hear God saying to you through these verses?'},
  {key:'obey'      as const,label:'OBEY',     color:'#2D4F9E',icon:'🙏',prompt:'How can you be obedient to what God is telling you today?'},
  {key:'tell'      as const,label:'TELL',     color:'#B8933A',icon:'💬',prompt:'Who do you know that might need this word of encouragement today?'},
]

// Reading plan — still hardcoded as fallback; Supabase table overrides when populated
const READING_PLAN: Record<string, string> = {
  '2026-01-01':'1 Kings 1','2026-01-02':'Psalm 55','2026-01-05':'1 Kings 2',
  '2026-01-06':'1 Kings 3','2026-01-07':'1 Kings 4','2026-01-08':'1 Kings 5',
  '2026-01-09':'Psalm 56','2026-01-12':'1 Kings 6','2026-01-13':'1 Kings 7',
  '2026-01-14':'1 Kings 8','2026-01-15':'1 Kings 9','2026-01-16':'Psalm 57',
  '2026-01-19':'1 Kings 10','2026-01-20':'1 Kings 11','2026-01-21':'1 Kings 12',
  '2026-01-22':'1 Kings 13','2026-01-23':'Psalm 58','2026-01-26':'1 Kings 14',
  '2026-01-27':'1 Kings 15','2026-01-28':'1 Kings 16','2026-01-29':'1 Kings 17',
  '2026-01-30':'Psalm 59','2026-02-02':'1 Kings 18','2026-02-03':'1 Kings 19',
  '2026-02-04':'1 Kings 20','2026-02-05':'1 Kings 21','2026-02-06':'Psalm 60',
  '2026-02-09':'1 Kings 22','2026-02-10':'Song of Solomon 1','2026-02-11':'Song of Solomon 2',
  '2026-02-12':'Song of Solomon 3','2026-02-13':'Psalm 61','2026-02-16':'Song of Solomon 4',
  '2026-02-17':'Song of Solomon 5','2026-02-18':'Song of Solomon 6','2026-02-19':'Song of Solomon 7',
  '2026-02-20':'Psalm 62','2026-02-23':'Song of Solomon 8','2026-02-24':'Romans 1',
  '2026-02-25':'Romans 2','2026-02-26':'Romans 3','2026-02-27':'Psalm 63',
  '2026-03-02':'Romans 4','2026-03-03':'Romans 5','2026-03-04':'Romans 6',
  '2026-03-05':'Romans 7','2026-03-06':'Psalm 64','2026-03-09':'Romans 8',
  '2026-03-10':'Romans 9','2026-03-11':'Romans 10','2026-03-12':'Romans 11',
  '2026-03-13':'Psalm 65','2026-03-16':'Romans 12','2026-03-17':'Romans 13',
  '2026-03-18':'Romans 14','2026-03-19':'Romans 15','2026-03-20':'Psalm 66',
  '2026-03-23':'Romans 16','2026-03-24':'2 Thessalonians 1','2026-03-25':'2 Thessalonians 2',
  '2026-03-26':'2 Thessalonians 3','2026-03-27':'Psalm 67',
}


const BLUE='#2D4F9E', GOLD='#B8933A', CREAM='#FAF7F2', WHITE='#FFFFFF'

const S: Record<string,React.CSSProperties> = {
  loadingPage:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:CREAM,fontFamily:"'Georgia',serif"},
  loadingText:{fontSize:'18px',color:BLUE,fontStyle:'italic'},
  page:{minHeight:'100vh',background:CREAM,fontFamily:"'Georgia','Times New Roman',serif"},
  header:{background:BLUE,padding:'14px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 12px rgba(0,0,0,0.2)'},
  headerLeft:{display:'flex',alignItems:'baseline',gap:'8px'},
  headerLogo:{color:'#fff',fontSize:'22px',fontStyle:'italic',letterSpacing:'1px'},
  headerLogoSub:{color:GOLD,fontSize:'11px',letterSpacing:'4px',textTransform:'uppercase'},
  headerRight:{display:'flex',alignItems:'center',gap:'16px'},
  headerGreeting:{color:'rgba(255,255,255,0.65)',fontSize:'12px'},
  signOutBtn:{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',color:'#fff',padding:'6px 14px',borderRadius:'3px',cursor:'pointer',fontSize:'12px',fontFamily:"'Georgia',serif"},
  tabBar:{background:'#fff',borderBottom:'1px solid #E8E0D4',display:'flex',padding:'0 32px'},
  tab:{background:'none',border:'none',borderBottom:'3px solid transparent',padding:'14px 20px',fontSize:'13px',color:'#999',cursor:'pointer',fontFamily:"'Georgia',serif"},
  tabActive:{color:BLUE,borderBottomColor:GOLD},
  main:{maxWidth:'900px',margin:'0 auto',padding:'24px 16px 80px'},
  passageBanner:{background:BLUE,borderRadius:'6px 6px 0 0',padding:'28px 32px 20px',color:'#fff'},
  passageDate:{fontSize:'12px',letterSpacing:'2px',textTransform:'uppercase',color:'rgba(255,255,255,0.65)',margin:'0 0 8px'},
  passageTitleRow:{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'},
  passageTitle:{fontSize:'28px',fontWeight:'400',margin:'0',fontStyle:'italic'},
  inviteBtn:{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.35)',color:'#fff',borderRadius:'4px',padding:'10px 18px',fontSize:'13px',fontFamily:"'Georgia',serif",cursor:'pointer',textDecoration:'none',whiteSpace:'nowrap'},
  esvCard:{background:'#FFFEF9',border:'1px solid #E8E0D4',borderTop:'none',borderRadius:'0 0 6px 6px',padding:'24px 32px',marginBottom:'28px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'},
  esvBadge:{background:GOLD,color:WHITE,fontSize:'10px',letterSpacing:'2px',padding:'3px 10px',borderRadius:'20px',textTransform:'uppercase',fontFamily:"'Georgia',serif",display:'inline-block',marginBottom:'16px'},
  esvText:{fontSize:'15px',lineHeight:'2',color:'#2A2A2A',whiteSpace:'pre-wrap',fontFamily:"'Georgia',serif",margin:'0'},
  esvLoading:{color:'#AAA',fontStyle:'italic',fontSize:'14px',margin:'0'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(380px,100%),1fr))',gap:'20px',marginBottom:'28px',justifyItems:'stretch'},
  card:{background:'#fff',borderRadius:'6px',padding:'24px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',border:'1px solid #EDE8E0'},
  sectionHeader:{display:'flex',alignItems:'center',gap:'10px',borderLeft:'4px solid',paddingLeft:'12px',marginBottom:'10px'},
  sectionIcon:{fontSize:'18px'},
  sectionLabel:{fontSize:'13px',letterSpacing:'3px',fontWeight:'700',margin:'0',fontFamily:"'Georgia',serif"},
  sectionPrompt:{fontSize:'13px',color:'#888',margin:'0 0 14px',fontStyle:'italic',lineHeight:'1.6'},
  textarea:{width:'100%',border:'1px solid #E8E0D4',borderRadius:'4px',padding:'12px',fontSize:'15px',fontFamily:"'Georgia',serif",color:'#2A2A2A',lineHeight:'1.7',resize:'vertical',background:'#FDFBF8',outline:'none',boxSizing:'border-box'},
  readonlyText:{fontSize:'15px',lineHeight:'1.8',color:'#333',whiteSpace:'pre-wrap',margin:'0'},
  saveRow:{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'16px'},
  savedBadge:{background:'#e8f5e9',color:'#2e7d32',border:'1px solid #c8e6c9',borderRadius:'4px',padding:'8px 14px',fontSize:'13px',fontFamily:"'Georgia',serif"},
  saveBtn:{background:GOLD,color:WHITE,border:'none',borderRadius:'3px',padding:'14px 32px',fontSize:'13px',letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'Georgia',serif",cursor:'pointer'},
  historyTitle:{fontSize:'22px',color:BLUE,fontStyle:'italic',marginBottom:'20px',fontWeight:'400'},
  emptyState:{color:'#aaa',fontStyle:'italic',textAlign:'center',padding:'48px'},
  entryList:{display:'flex',flexDirection:'column',gap:'12px'},
  entryCard:{background:'#fff',border:'1px solid #EDE8E0',borderRadius:'6px',padding:'20px 24px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',textAlign:'left',width:'100%',fontFamily:"'Georgia',serif",boxShadow:'0 1px 4px rgba(0,0,0,0.05)'},
  entryCardLeft:{flex:1},
  entryCardDate:{fontSize:'12px',color:'#999',margin:'0 0 4px'},
  entryCardPassage:{fontSize:'18px',color:BLUE,fontStyle:'italic',margin:'0 0 6px'},
  entryCardPreview:{fontSize:'13px',color:'#888',margin:'0',fontStyle:'italic'},
  entryCardArrow:{fontSize:'20px',color:GOLD,marginLeft:'16px'},
  backBtn:{background:'none',border:'none',color:BLUE,cursor:'pointer',fontSize:'14px',fontFamily:"'Georgia',serif",padding:'0',marginBottom:'20px',textDecoration:'underline'},
}

export default function JournalPage() {
  const supabase  = createClient()
  const router    = useRouter()
  const [today]   = useState(todayStr())
  const [passage, setPassage]   = useState(READING_PLAN[todayStr()] ?? 'No passage scheduled today')
  const [scripture, setScripture] = useState('')
  const [hear, setHear]           = useState('')
  const [obey, setObey]           = useState('')
  const [tell, setTell]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [pastEntries, setPastEntries]   = useState<JournalEntry[]>([])
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null)
  const [firstName, setFirstName] = useState('')
  const [tab, setTab]     = useState<'write'|'history'>('write')
  const [loading, setLoading]     = useState(true)
  const [esvText, setEsvText]     = useState('')
  const [esvLoading, setEsvLoading] = useState(true)

  // ── ESV API key — stored in supabase.ts ───────────────────────────────────
  // Import it here so it stays out of env files (which disappear in StackBlitz)
  const ESV_KEY = '1f864b55276267b1bc4958e3de072c281f10fe12'

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const meta = session.user.user_metadata ?? {}
    setFirstName(meta.first_name ?? '')

    // Check Supabase reading_plan table first (overrides hardcoded plan)
    const { data: plan } = await supabase
      .from('reading_plan')
      .select('passage')
      .eq('entry_date', today)
      .single()
    if (plan?.passage) {
      setPassage(plan.passage)
    }

    // Load today's journal entry if it exists
    const { data: ex } = await supabase.from('journal_entries').select('*').eq('entry_date',today).eq('user_id',session.user.id).single()
    if (ex) { setScripture(ex.scripture??''); setHear(ex.hear??''); setObey(ex.obey??''); setTell(ex.tell??''); if(ex.passage) setPassage(ex.passage) }

    // Load all past entries
    const { data: all } = await supabase.from('journal_entries').select('*').eq('user_id',session.user.id).order('entry_date',{ascending:false})
    setPastEntries(all??[])
    setLoading(false)
  }, [supabase, router, today])

  useEffect(() => { loadData() }, [loadData])

  // Fetch ESV text whenever passage changes
  useEffect(() => {
    setEsvLoading(true)
    setEsvText('')
    fetchESVText(passage, ESV_KEY).then(text => {
      setEsvText(text)
      setEsvLoading(false)
    })
  }, [passage])

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  async function handleSave() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { error } = await supabase.from('journal_entries').upsert(
      { user_id: session.user.id, entry_date: today, passage, scripture, hear, obey, tell },
      { onConflict: 'user_id,entry_date' }
    )
    if (!error) { setSaved(true); setTimeout(()=>setSaved(false),3000); loadData() }
    setSaving(false)
  }

  if (loading) return <div style={S.loadingPage}><p style={S.loadingText}>Opening your journal…</p></div>

const inviteSmsUrl = "https://community.poweredbytext.com/go-sms/?to=&msg=Hey!%20I%27ve%20been%20using%20the%20PCBC%20Dwell%20Journal%20app%20for%20my%20daily%20Bible%20reading.%20I%20think%20you%27d%20love%20it!%20Sign%20up%20here%3A%20https%3A%2F%2Fdwell-journal.vercel.app"

  return (
    <div style={S.page}>
      <header style={S.header}>
       <div style={S.headerLeft}>
  <img src="/logo-white.png" alt="PCBC Dwell Journal" style={{ height: '60px', width: 'auto' }} />
</div>
        <div style={S.headerRight}>
          <span style={S.headerGreeting}>{firstName ? `Hi, ${firstName}` : ''}</span>
          <button onClick={handleSignOut} style={S.signOutBtn}>Sign Out</button>
        </div>
      </header>

      <div style={S.tabBar}>
        <button onClick={()=>setTab('write')}   style={{...S.tab,...(tab==='write'   ?S.tabActive:{})}}>Today's Entry</button>
        <button onClick={()=>setTab('history')} style={{...S.tab,...(tab==='history' ?S.tabActive:{})}}>Past Entries ({pastEntries.length})</button>
      </div>

      <main style={S.main}>
        {tab==='write' && (
          <div>
            {/* Blue passage banner */}
            <div style={S.passageBanner}>
              <p style={S.passageDate}>{formatDate(today)}</p>
              <div style={S.passageTitleRow}>
                <h2 style={S.passageTitle}>{passage}</h2>
                <a href={inviteSmsUrl} style={S.inviteBtn}>
                  ✉️ Invite a Friend
                </a>
              </div>
            </div>

            {/* ESV text card — attached directly below banner */}
            <div style={S.esvCard}>
              <span style={S.esvBadge}>English Standard Version</span>
              {esvLoading
                ? <p style={S.esvLoading}>Loading scripture…</p>
                : <p style={S.esvText}>{esvText}</p>
              }
            </div>

            {/* 4 Journal sections */}
            <div style={S.grid}>
              {SECTIONS.map(sec => (
                <div key={sec.key} style={S.card}>
                  <div style={{...S.sectionHeader,borderLeftColor:sec.color}}>
                    <span style={S.sectionIcon}>{sec.icon}</span>
                    <h3 style={{...S.sectionLabel,color:sec.color}}>{sec.label}</h3>
                  </div>
                  <p style={S.sectionPrompt}>{sec.prompt}</p>
                  <textarea
                    value={sec.key==='scripture'?scripture:sec.key==='hear'?hear:sec.key==='obey'?obey:tell}
                    onChange={e=>{const v=e.target.value;if(sec.key==='scripture')setScripture(v);else if(sec.key==='hear')setHear(v);else if(sec.key==='obey')setObey(v);else setTell(v)}}
                    placeholder={`Write your ${sec.label.toLowerCase()} here…`}
                    style={S.textarea} rows={5}
                  />
                </div>
              ))}
            </div>

            <div style={S.saveRow}>
              {saved && <span style={S.savedBadge}>✓ Entry saved!</span>}
              <button onClick={handleSave} disabled={saving} style={S.saveBtn}>{saving?'Saving…':'Save Entry'}</button>
            </div>
          </div>
        )}

        {tab==='history' && !viewingEntry && (
          <div>
            <h2 style={S.historyTitle}>Your Journal Entries</h2>
            {pastEntries.length===0 && <p style={S.emptyState}>No entries yet. Start writing today!</p>}
            <div style={S.entryList}>
              {pastEntries.map(entry=>(
                <button key={entry.id} onClick={()=>setViewingEntry(entry)} style={S.entryCard}>
                  <div style={S.entryCardLeft}>
                    <p style={S.entryCardDate}>{formatDate(entry.entry_date)}</p>
                    <p style={S.entryCardPassage}>{entry.passage}</p>
                    {entry.scripture && <p style={S.entryCardPreview}>"{entry.scripture.slice(0,80)}{entry.scripture.length>80?'…':''}"</p>}
                  </div>
                  <span style={S.entryCardArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab==='history' && viewingEntry && (
          <div>
            <button onClick={()=>setViewingEntry(null)} style={S.backBtn}>← Back to entries</button>
            <div style={{...S.passageBanner,borderRadius:'6px'}}>
              <p style={S.passageDate}>{formatDate(viewingEntry.entry_date)}</p>
              <div style={S.passageTitleRow}>
                <h2 style={S.passageTitle}>{viewingEntry.passage}</h2>
                <a href={inviteSmsUrl} style={S.inviteBtn}>
                  ✉️ Invite a Friend
                </a>
                  </a>
                )}
              </div>
            </div>
            <div style={S.grid}>
              {SECTIONS.map(sec=>(
                <div key={sec.key} style={S.card}>
                  <div style={{...S.sectionHeader,borderLeftColor:sec.color}}>
                    <span style={S.sectionIcon}>{sec.icon}</span>
                    <h3 style={{...S.sectionLabel,color:sec.color}}>{sec.label}</h3>
                  </div>
                  <p style={S.readonlyText}>{viewingEntry[sec.key]||<em style={{color:'#bbb'}}>Not filled in</em>}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
