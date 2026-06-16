// frontend/src/pages/LandingPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO_TEXT = `Aaj bahut thaka hua hoon. College mein presentation deni thi and I completely blanked out in front of everyone. Yeh feeling bahut weird hai — like you know everything but your mind just... stops. Main sochta hoon ki maybe I'm not cut out for this. Phir bhi kal fir try karunga. Kuch toh seekhne milega.`

const DEMO_RESULTS = [
  {
    key: 'vibe',
    label: 'Your Vibe',
    score: 34,
    cardLabel: 'Grounded Realist 🪨',
    description: 'You\'re not dreaming right now — you\'re processing. Your writing stays close to what actually happened, not what you wish had.',
    color: '#D4AF37',
  },
  {
    key: 'mood',
    label: 'Your Mood',
    score: 28,
    cardLabel: 'Carrying A Lot 🌧️',
    description: 'There\'s real heaviness in these words. That blanking-out moment hit hard. You\'re not pretending it didn\'t.',
    color: '#9B72CF',
  },
  {
    key: 'inner_critic',
    label: 'Your Inner Critic',
    score: 62,
    cardLabel: 'Hardest on Yourself 💭',
    description: '"Maybe I\'m not cut out for this" — that\'s a big leap from one bad presentation. Your inner critic is louder than the situation deserves.',
    color: '#D4AF37',
  },
  {
    key: 'mind',
    label: 'How Your Mind Works',
    score: 71,
    cardLabel: 'Pure Heart Energy 💛',
    description: 'You lead with feeling, not analysis. You\'re not breaking down what went wrong — you\'re sitting with how it felt.',
    color: '#9B72CF',
  },
  {
    key: 'word_power',
    label: 'Your Word Power',
    score: 45,
    cardLabel: 'Getting There 🌱',
    description: 'Honest, conversational Hinglish. You write how you think, which is authentic — vocabulary grows with practice.',
    color: '#D4AF37',
  },
  {
    key: 'voice',
    label: 'Your Voice',
    score: 52,
    cardLabel: 'Quietly Resolute 🎯',
    description: '"Kal fir try karunga" — you hedge your feelings but commit to the action. That quiet determination is real.',
    color: '#9B72CF',
  },
]

const DEBATE_MESSAGES = [
  { role: 'challenger', name: 'Priya', text: 'Social media does more harm than good. It creates unrealistic standards and increases anxiety among young people. Studies show 60% of teens feel worse about themselves after scrolling Instagram.', time: '2:47' },
  { role: 'opponent',   name: 'Arjun', text: 'That\'s correlation, not causation. Teens who are already anxious use social media more. The platforms themselves give marginalised communities a voice they never had before — that\'s real, documented good.', time: '2:51' },
  { role: 'challenger', name: 'Priya', text: 'Even if we accept that — the algorithmic design actively exploits psychological vulnerabilities. They optimise for outrage and addiction. That\'s not a side effect, it\'s the business model.', time: '2:31' },
  { role: 'opponent',   name: 'Arjun', text: 'And books were blamed for corrupting youth. Radio. Television. Every medium gets this. The question is regulation, not elimination. We don\'t ban cars because of accidents.', time: '2:44' },
]

const HOW_STEPS = [
  { num: '01', title: 'Paste anything', body: 'A rant, a diary entry, an essay, a text message. Minimum 20 words. Hindi, English, Hinglish — Mirror auto-detects.' },
  { num: '02', title: 'Get your Mirror', body: 'Six dimensions of yourself reflected back — your vibe, mood, inner critic, thinking style, word power, and voice.' },
  { num: '03', title: 'Challenge a friend', body: 'Start a real-time debate on any topic. Chess-style timers. One topic, two people, full pressure.' },
  { num: '04', title: 'See how you argue', body: 'When the debate ends, Mirror scores both of you — argument strength, logical coherence, composure, rebuttal quality, and clarity.' },
]

function LandingPage() {
  const navigate = useNavigate()
  return (
    <div style={styles.page}>
      <Hero navigate={navigate} />
      <DemoSection />
      <DebateSection />
      <HowItWorks navigate={navigate} />
      <Footer navigate={navigate} />
    </div>
  )
}

function Hero({ navigate }) {
  const { user, loading } = useAuth()

  const goToAnalyze  = () => navigate(user ? '/analyze' : '/login')
  const goToDebate   = () => navigate(user ? '/debate/new' : '/login')
  const goToRegister = () => navigate('/register')

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section style={styles.hero}>
      <div style={styles.heroContent}>
        <div style={styles.mirrorWrap}>
          <h1 style={styles.mirrorText} className="m-gleam">MIRROR</h1>
          <div style={styles.reflectionWrap} aria-hidden="true">
            <h1 style={{ ...styles.mirrorText, ...styles.reflectionText }} className="m-gleam">MIRROR</h1>
          </div>
          <div style={styles.horizonLine} />
        </div>

        <p style={styles.tagline}>Know yourself. Challenge yourself.</p>

        <p style={styles.subtext}>
          Paste your writing and see six dimensions of yourself reflected back —
          your mood, your voice, your mind. Then debate a friend in real time
          and find out how you argue under pressure.
        </p>

        {!loading && (
          <div style={styles.ctaGroup}>
            <div style={styles.ctaRow}>
              <button style={styles.btnPrimary} onClick={goToAnalyze}>
                Analyze My Writing →
              </button>
              <button style={styles.btnOutline} onClick={goToDebate}>
                Challenge a Friend →
              </button>
            </div>
            {!user && (
              <p style={styles.registerNudge}>
                New here?{' '}
                <span style={styles.registerLink} onClick={goToRegister}>
                  Create a free account
                </span>
              </p>
            )}
            {user && (
              <p style={styles.registerNudge}>
                Welcome back,{' '}
                <span style={{ color: '#D4AF37', fontWeight: 700 }}>
                  {user.name || user.username}
                </span>
              </p>
            )}
          </div>
        )}

        <button style={styles.scrollHint} onClick={scrollToDemo}>
          <span style={styles.scrollLabel}>See it in action</span>
          <div style={styles.scrollLine} />
        </button>
      </div>
    </section>
  )
}

function DemoSection() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = document.getElementById('demo')
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="demo" style={styles.demoSection}>
      <div style={styles.sectionInner}>

        {/* Section header */}
        <div style={styles.sectionLabel}>Analysis</div>
        <div style={styles.goldLine} />
        <h2 style={styles.sectionHeading}>
          THIS IS WHAT<br />YOUR WRITING SAYS.
        </h2>
        <p style={styles.sectionSub}>
          A student typed this after a rough day. Mirror detected Hinglish
          automatically and reflected six dimensions back.
        </p>

        {/* The input text — shown as a quote */}
        <div style={styles.demoQuote}>
          <p style={styles.demoQuoteText}>"{DEMO_TEXT}"</p>
          <div style={styles.demoQuoteMeta}>
            <span style={styles.langBadge}>🌐 Hinglish detected</span>
            <span style={styles.modeBadge}>About Me mode</span>
          </div>
        </div>

        {/* 6 dimension cards */}
        <div style={styles.cardsGrid}>
          {DEMO_RESULTS.map((dim, i) => (
            <DemoCard key={dim.key} dim={dim} index={i} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  )
}

function DemoCard({ dim, index, visible }) {
  return (
    <div
      style={{
        ...styles.demoCard,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <span style={styles.dimLabel}>{dim.label}</span>
        <span style={styles.dimScore}>{dim.score}</span>
      </div>
      <div style={styles.scoreBarBg}>
        <div style={{
          ...styles.scoreBarFill,
          width: visible ? `${dim.score}%` : '0%',
          background: dim.color,
          transition: `width 0.8s ease ${index * 0.1 + 0.2}s`,
        }} />
      </div>
      <div style={styles.dimCardLabel}>{dim.cardLabel}</div>
      <div style={styles.dimDescription}>{dim.description}</div>
    </div>
  )
}

function DebateSection() {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (visibleCount >= DEBATE_MESSAGES.length) return
    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1)
    }, visibleCount === 0 ? 800 : 2200)
    return () => clearTimeout(timer)
  }, [visibleCount])

  useEffect(() => {
    const el = document.getElementById('debate-preview')
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && visibleCount === 0) setVisibleCount(1) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="debate-preview" style={styles.debateSection}>
      <div style={styles.sectionInner}>

        <div style={{ ...styles.sectionLabel, color: '#9B72CF' }}>Debate Engine</div>
        <div style={{ ...styles.goldLine, background: '#9B72CF' }} />
        <h2 style={styles.sectionHeading}>
          ARGUE BETTER.<br />KNOW HOW.
        </h2>
        <p style={styles.sectionSub}>
          Challenge a friend to a real-time debate. Chess-style timers.
          When it ends, Mirror scores both of you across five dimensions.
        </p>

        {/* Animated debate chat */}
        <div style={styles.debateArena}>

          {/* Timer bar */}
          <div style={styles.debateTimerBar}>
            <div style={styles.debateTimer}>
              <span style={styles.debateTimerName}>Priya</span>
              <span style={{ ...styles.debateTimerVal, color: '#D4AF37' }}>1:43</span>
            </div>
            <div style={{ fontSize: '14px', color: '#8B7355', fontWeight: 700 }}>VS</div>
            <div style={{ ...styles.debateTimer, alignItems: 'flex-end' }}>
              <span style={styles.debateTimerName}>Arjun</span>
              <span style={styles.debateTimerVal}>2:18</span>
            </div>
          </div>

          {/* Topic */}
          <div style={styles.debateTopic}>
            <span style={styles.debateTopicLabel}>Topic</span>
            <span style={styles.debateTopicText}>Social media does more harm than good</span>
          </div>

          {/* Messages */}
          <div style={styles.debateMessages}>
            {DEBATE_MESSAGES.slice(0, visibleCount).map((msg, i) => {
              const isChallenger = msg.role === 'challenger'
              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: isChallenger ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                  animation: 'm-fade-in 0.4s ease',
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '14px 18px',
                    background: isChallenger ? '#1a1000' : 'white',
                    color: isChallenger ? '#F5F0E8' : '#1a1000',
                  }}>
                    <p style={{
                      fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
                      textTransform: 'uppercase',
                      color: isChallenger ? '#D4AF37' : '#8B7355',
                      margin: '0 0 6px',
                    }}>
                      {msg.name}
                    </p>
                    <p style={{ fontSize: '14px', margin: '0', lineHeight: 1.7 }}>
                      {msg.text}
                    </p>
                    <p style={{
                      fontSize: '10px',
                      color: isChallenger ? 'rgba(245,240,232,0.35)' : '#8B7355',
                      margin: '6px 0 0',
                    }}>
                      {msg.time} left
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Typing indicator for next message */}
            {visibleCount < DEBATE_MESSAGES.length && visibleCount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: DEBATE_MESSAGES[visibleCount]?.role === 'challenger' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{ padding: '12px 18px', background: 'rgba(26,16,0,0.06)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: '#8B7355',
                      animation: `m-typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scorecard preview — visible after all messages */}
        {visibleCount >= DEBATE_MESSAGES.length && (
          <div style={{ ...styles.scorecardPreview, animation: 'm-fade-in 0.6s ease' }}>
            <p style={styles.scorecardLabel}>Scorecard preview</p>
            <div style={styles.scorecardGrid}>
              {[
                { label: 'Argument Strength', priya: 74, arjun: 81 },
                { label: 'Logical Coherence', priya: 68, arjun: 77 },
                { label: 'Rebuttal Quality',  priya: 70, arjun: 85 },
                { label: 'Clarity',           priya: 72, arjun: 69 },
                { label: 'Composure',         priya: 88, arjun: 91 },
              ].map(dim => (
                <div key={dim.label} style={styles.scorecardRow}>
                  <span style={styles.scorecardDimLabel}>{dim.label}</span>
                  <div style={styles.scorecardBars}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={styles.scorecardName}>Priya</span>
                      <div style={styles.miniBarBg}>
                        <div style={{ ...styles.miniBarFill, width: `${dim.priya}%`, background: '#D4AF37' }} />
                      </div>
                      <span style={styles.scorecardVal}>{dim.priya}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={styles.scorecardName}>Arjun</span>
                      <div style={styles.miniBarBg}>
                        <div style={{ ...styles.miniBarFill, width: `${dim.arjun}%`, background: '#9B72CF' }} />
                      </div>
                      <span style={styles.scorecardVal}>{dim.arjun}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ ...styles.sectionSub, margin: '16px 0 0', fontSize: '13px', fontStyle: 'italic' }}>
              No winner declared. Just insight.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function HowItWorks({ navigate }) {
  const { user } = useAuth()
  const goToAnalyze = () => navigate(user ? '/analyze' : '/register')

  return (
    <section style={styles.howSection}>
      <div style={styles.sectionInner}>
        <div style={styles.sectionLabel}>How it works</div>
        <div style={styles.goldLine} />
        <h2 style={styles.sectionHeading}>FOUR STEPS.<br />THAT'S IT.</h2>

        <div style={styles.stepsGrid}>
          {HOW_STEPS.map((step, i) => (
            <div key={step.num} style={styles.stepCard}>
              <div style={styles.stepNum}>{step.num}</div>
              <div style={styles.stepTitle}>{step.title}</div>
              <div style={styles.stepBody}>{step.body}</div>
            </div>
          ))}
        </div>

        <button style={{ ...styles.btnPrimaryDark, marginTop: '48px' }} onClick={goToAnalyze}>
          {user ? 'Analyze My Writing →' : 'Get Started — It\'s Free →'}
        </button>
      </div>
    </section>
  )
}
function Footer({ navigate }) {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <div style={styles.footerLogo}>MIRROR</div>
        <p style={styles.footerTagline}>Know yourself. Challenge yourself.</p>
        <div style={styles.footerLinks}>
          <span style={styles.footerLink} onClick={() => navigate('/analyze')}>Analyze</span>
          <span style={styles.footerDivider}>·</span>
          <span style={styles.footerLink} onClick={() => navigate('/debate/new')}>Debate</span>
          <span style={styles.footerDivider}>·</span>
          <span style={styles.footerLink} onClick={() => navigate('/register')}>Register</span>
        </div>
      </div>
    </footer>
  )
}

//STYLES
const styles = {
  page: { margin: 0, width: '100%' },

  // Hero (dark)
  hero: {
    background: '#0F0A05',
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '40px 24px',
    boxSizing: 'border-box',
  },
  heroContent: {
    maxWidth: '720px',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  mirrorWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '8px',
  },
  mirrorText: {
    fontFamily: 'MirrorFont, serif',
    fontSize: 'clamp(64px, 14vw, 140px)',
    fontWeight: 400,
    letterSpacing: '0.08em',
    color: '#F5F0E8',
    margin: 0,
    lineHeight: 1,
  },
  reflectionWrap: {
    width: '100%',
    overflow: 'hidden',
    maxHeight: '0.55em',
    marginTop: '4px',
    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 90%)',
    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 90%)',
  },
  reflectionText: { transform: 'scaleY(-1)', color: '#D4AF37', opacity: 0.5 },
  horizonLine: {
    width: 'clamp(120px, 24vw, 240px)',
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.6), transparent)',
    marginTop: '2px',
  },
  tagline: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 'clamp(15px, 2.4vw, 19px)',
    fontWeight: 600,
    color: '#D4AF37',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    margin: '32px 0 16px',
  },
  subtext: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 'clamp(14px, 1.8vw, 17px)',
    lineHeight: 1.7,
    color: 'rgba(245,240,232,0.65)',
    maxWidth: '520px',
    margin: '0 0 36px',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '56px',
  },
  ctaRow: { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' },
  btnPrimary: {
    background: '#D4AF37',
    color: '#1a1000',
    padding: '18px 40px',
    border: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  btnOutline: {
    background: 'transparent',
    color: '#F5F0E8',
    padding: '18px 40px',
    border: '1.5px solid rgba(245,240,232,0.3)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  registerNudge: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '13px',
    color: 'rgba(245,240,232,0.4)',
    margin: 0,
  },
  registerLink: { color: '#D4AF37', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' },
  scrollHint: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '12px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
  },
  scrollLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
    textTransform: 'uppercase', color: 'rgba(245,240,232,0.35)',
  },
  scrollLine: {
    width: '1px', height: '36px',
    background: 'rgba(245,240,232,0.2)',
    animation: 'm-scroll-pulse 2s ease-in-out infinite',
  },

  // Shared section layout
  sectionInner: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 24px',
  },
  sectionLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
    textTransform: 'uppercase', color: '#8B7355',
    marginBottom: '12px',
  },
  goldLine: { width: '36px', height: '3px', background: '#D4AF37', marginBottom: '16px' },
  sectionHeading: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 'clamp(28px, 5vw, 48px)',
    fontWeight: 900, color: '#1a1000',
    letterSpacing: '-1.5px', lineHeight: 1,
    margin: '0 0 16px',
  },
  sectionSub: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '15px', color: '#8B7355',
    lineHeight: 1.7, maxWidth: '560px',
    margin: '0 0 40px',
  },

  // Demo section (light)
  demoSection: {
    background: '#F5F0E8',
    padding: '96px 0',
  },
  demoQuote: {
    background: 'white',
    padding: '24px 28px',
    borderLeft: '3px solid #D4AF37',
    marginBottom: '40px',
  },
  demoQuoteText: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '15px', color: '#1a1000',
    lineHeight: 1.8, margin: '0 0 12px',
    fontStyle: 'italic',
  },
  demoQuoteMeta: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  langBadge: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '11px', fontWeight: 700,
    color: '#9B72CF', letterSpacing: '1px',
  },
  modeBadge: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '11px', fontWeight: 700,
    color: '#8B7355', letterSpacing: '1px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2px',
  },
  demoCard: {
    background: 'white',
    padding: '24px 28px',
  },
  dimLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '10px', fontWeight: 700,
    letterSpacing: '2px', textTransform: 'uppercase', color: '#8B7355',
  },
  dimScore: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '22px', fontWeight: 900, color: '#1a1000', letterSpacing: '-1px',
  },
  scoreBarBg: { height: '3px', background: 'rgba(26,16,0,0.08)', marginBottom: '14px' },
  scoreBarFill: { height: '100%', transition: 'width 0.8s ease' },
  dimCardLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '13px', fontWeight: 700, color: '#1a1000', marginBottom: '4px',
  },
  dimDescription: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '13px', color: '#8B7355', lineHeight: 1.6,
  },

  // Debate preview section (cream, slightly darker)
  debateSection: {
    background: '#EDE8DE',
    padding: '96px 0',
  },
  debateArena: {
    background: '#F5F0E8',
    padding: '24px',
    marginBottom: '32px',
  },
  debateTimerBar: {
    display: 'flex', gap: '16px', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: '16px',
  },
  debateTimer: {
    display: 'flex', flexDirection: 'column', gap: '2px',
    background: 'white', padding: '12px 16px', flex: 1,
  },
  debateTimerName: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
    textTransform: 'uppercase', color: '#8B7355',
  },
  debateTimerVal: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '28px', fontWeight: 900, letterSpacing: '-2px', color: '#1a1000',
  },
  debateTopic: {
    padding: '12px 16px', background: 'white',
    borderLeft: '3px solid #D4AF37',
    marginBottom: '16px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  debateTopicLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
    textTransform: 'uppercase', color: '#8B7355',
  },
  debateTopicText: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '14px', fontWeight: 700, color: '#1a1000',
  },
  debateMessages: { display: 'flex', flexDirection: 'column' },

  // Scorecard preview
  scorecardPreview: {
    background: 'white',
    padding: '28px',
  },
  scorecardLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
    textTransform: 'uppercase', color: '#8B7355',
    margin: '0 0 16px',
  },
  scorecardGrid: { display: 'flex', flexDirection: 'column', gap: '14px' },
  scorecardRow: {
    display: 'flex', gap: '16px', alignItems: 'center',
    flexWrap: 'wrap',
  },
  scorecardDimLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: '#8B7355',
    width: '140px', flexShrink: 0,
  },
  scorecardBars: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  scorecardName: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '11px', color: '#8B7355', width: '36px', flexShrink: 0,
  },
  miniBarBg: { flex: 1, height: '4px', background: 'rgba(26,16,0,0.08)' },
  miniBarFill: { height: '100%' },
  scorecardVal: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '12px', fontWeight: 700, color: '#1a1000', width: '24px',
  },

  // How it works (white)
  howSection: {
    background: 'white',
    padding: '96px 0',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '2px',
  },
  stepCard: {
    background: '#F5F0E8',
    padding: '28px 24px',
  },
  stepNum: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '32px', fontWeight: 900,
    color: '#D4AF37', letterSpacing: '-2px',
    marginBottom: '12px',
  },
  stepTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '14px', fontWeight: 700, color: '#1a1000',
    textTransform: 'uppercase', letterSpacing: '1px',
    marginBottom: '8px',
  },
  stepBody: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '13px', color: '#8B7355', lineHeight: 1.7,
  },
  btnPrimaryDark: {
    background: '#D4AF37',
    color: '#1a1000',
    padding: '18px 48px',
    border: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '12px', fontWeight: 700,
    letterSpacing: '2px', textTransform: 'uppercase',
    cursor: 'pointer',
    display: 'block',
  },

  // Footer
  footer: {
    background: '#0F0A05',
    padding: '64px 24px',
  },
  footerInner: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  footerLogo: {
    fontFamily: 'MirrorFont, serif',
    fontSize: '32px', fontWeight: 400,
    letterSpacing: '0.08em', color: '#F5F0E8',
  },
  footerTagline: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '12px', color: 'rgba(245,240,232,0.4)',
    letterSpacing: '1.5px', textTransform: 'uppercase',
    margin: 0,
  },
  footerLinks: { display: 'flex', gap: '12px', alignItems: 'center' },
  footerLink: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '12px', color: 'rgba(245,240,232,0.5)',
    cursor: 'pointer',
    fontWeight: 600,
  },
  footerDivider: { color: 'rgba(245,240,232,0.2)', fontSize: '12px' },
  footerNote: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '11px', color: 'rgba(245,240,232,0.2)',
    margin: 0, letterSpacing: '0.5px',
  },
}

export default LandingPage