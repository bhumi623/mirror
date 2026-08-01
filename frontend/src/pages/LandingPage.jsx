// frontend/src/pages/LandingPage.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LandingPage.css'

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
    <div className="landing-page">
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
    <section className="hero">
      <div className="heroContent">
        <div className="mirrorWrap">
          <h1 className="mirrorText">MIRROR</h1>
          <div className="reflectionWrap" aria-hidden="true">
            <h1 className="mirrorText reflectionText">MIRROR</h1>
          </div>
          <div className="horizonLine" />
        </div>

        <p className="tagline">Know yourself. Challenge yourself.</p>

        <p className="subtext">
          Paste your writing and see six dimensions of yourself reflected back —
          your mood, your voice, your mind. Then debate a friend in real time
          and find out how you argue under pressure.
        </p>

        {!loading && (
          <div className="ctaGroup">
            <div className="ctaRow">
              <button className="btnPrimary" onClick={goToAnalyze}>
                Analyze My Writing →
              </button>
              <button className="btnOutline" onClick={goToDebate}>
                Challenge a Friend →
              </button>
            </div>
            {!user && (
              <p className="registerNudge">
                New here?{' '}
                <span className="registerLink" onClick={goToRegister}>
                  Create a free account
                </span>
              </p>
            )}
            {user && (
              <p className="registerNudge">
                Welcome back,{' '}
                <span style={{ color: '#D4AF37', fontWeight: 700 }}>
                  {user.name || user.username}
                </span>
              </p>
            )}
          </div>
        )}

        <button className="scrollHint" onClick={scrollToDemo}>
          <span className="scrollLabel">See it in action</span>
          <div className="scrollLine" />
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
    <section id="demo" className="demoSection">
      <div className="sectionInner">

        {/* Section header */}
        <div className="sectionLabel">Analysis</div>
        <div className="goldLine" />
        <h2 className="sectionHeading">
          THIS IS WHAT<br />YOUR WRITING SAYS.
        </h2>
        <p className="sectionSub">
          A student typed this after a rough day. Mirror detected Hinglish
          automatically and reflected six dimensions back.
        </p>

        {/* The input text — shown as a quote */}
        <div className="demoQuote">
          <p className="demoQuoteText">"{DEMO_TEXT}"</p>
          <div className="demoQuoteMeta">
            <span className="langBadge">🌐 Hinglish detected</span>
            <span className="modeBadge">About Me mode</span>
          </div>
        </div>

        {/* 6 dimension cards */}
        <div className="cardsGrid">
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
      className="demoCard"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
      }}
    >
      <div className="dimHeader">
        <span className="dimLabel">{dim.label}</span>
        <span className="dimScore">{dim.score}</span>
      </div>
      <div className="scoreBarBg">
        <div className="scoreBarFill" style={{
          width: visible ? `${dim.score}%` : '0%',
          background: dim.color,
          transition: `width 0.8s ease ${index * 0.1 + 0.2}s`,
        }} />
      </div>
      <div className="dimCardLabel">{dim.cardLabel}</div>
      <div className="dimDescription">{dim.description}</div>
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
    <section id="debate-preview" className="debateSection">
      <div className="sectionInner">

        <div className="sectionLabel" style={{ color: '#9B72CF'  }}>Debate Engine</div>
        <div className="goldLine" style={{ background: '#9B72CF'  }} />
        <h2 className="sectionHeading">
          ARGUE BETTER.<br />KNOW HOW.
        </h2>
        <p className="sectionSub">
          Challenge a friend to a real-time debate. Chess-style timers.
          When it ends, Mirror scores both of you across five dimensions.
        </p>

        {/* Animated debate chat */}
        <div className="debateArena">

          {/* Timer bar */}
          <div className="debateTimerBar">
            <div className="debateTimer">
              <span className="debateTimerName">Priya</span>
              <span className="debateTimerVal" style={{ color: '#D4AF37'  }}>1:43</span>
            </div>
            <div style={{ fontSize: '14px', color: '#8B7355', fontWeight: 700 }}>VS</div>
            <div className="debateTimer" style={{ alignItems: 'flex-end'  }}>
              <span className="debateTimerName">Arjun</span>
              <span className="debateTimerVal">2:18</span>
            </div>
          </div>

          {/* Topic */}
          <div className="debateTopic">
            <span className="debateTopicLabel">Topic</span>
            <span className="debateTopicText">Social media does more harm than good</span>
          </div>

          {/* Messages */}
          <div className="debateMessages">
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
          <div className="scorecardPreview" style={{ animation: 'm-fade-in 0.6s ease'  }}>
            <p className="scorecardLabel">Scorecard preview</p>
            <div className="scorecardGrid">
              {[
                { label: 'Argument Strength', priya: 74, arjun: 81 },
                { label: 'Logical Coherence', priya: 68, arjun: 77 },
                { label: 'Rebuttal Quality',  priya: 70, arjun: 85 },
                { label: 'Clarity',           priya: 72, arjun: 69 },
                { label: 'Composure',         priya: 88, arjun: 91 },
              ].map(dim => (
                <div key={dim.label} className="scorecardRow">
                  <span className="scorecardDimLabel">{dim.label}</span>
                  <div className="scorecardBars">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="scorecardName">Priya</span>
                      <div className="miniBarBg">
                        <div className="miniBarFill" style={{ width: `${dim.priya}%`, background: '#D4AF37' }} />
                      </div>
                      <span className="scorecardVal">{dim.priya}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="scorecardName">Arjun</span>
                      <div className="miniBarBg">
                        <div className="miniBarFill" style={{ width: `${dim.arjun}%`, background: '#9B72CF' }} />
                      </div>
                      <span className="scorecardVal">{dim.arjun}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="sectionSub" style={{ margin: '16px 0 0', fontSize: '13px', fontStyle: 'italic'  }}>
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
    <section className="howSection">
      <div className="sectionInner">
        <div className="sectionLabel">How it works</div>
        <div className="goldLine" />
        <h2 className="sectionHeading">FOUR STEPS.<br />THAT'S IT.</h2>

        <div className="stepsGrid">
          {HOW_STEPS.map((step, i) => (
            <div key={step.num} className="stepCard">
              <div className="stepNum">{step.num}</div>
              <div className="stepTitle">{step.title}</div>
              <div className="stepBody">{step.body}</div>
            </div>
          ))}
        </div>

        <button className="btnPrimaryDark" style={{ marginTop: '48px'  }} onClick={goToAnalyze}>
          {user ? 'Analyze My Writing →' : 'Get Started — It\'s Free →'}
        </button>
      </div>
    </section>
  )
}
function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerLogo">MIRROR</div>
        <p className="footerTagline">Know yourself. Challenge yourself.</p>
        <div className="footerLinks">
          <span className="footerLink" onClick={() => navigate('/analyze')}>Analyze</span>
          <span className="footerDivider">·</span>
          <span className="footerLink" onClick={() => navigate('/debate/new')}>Debate</span>
          <span className="footerDivider">·</span>
          <span className="footerLink" onClick={() => navigate('/register')}>Register</span>
        </div>
      </div>
    </footer>
  )
}

//STYLES
export default LandingPage
