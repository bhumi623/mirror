// frontend/src/pages/DebatePage.jsx

import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDebateSocket } from '../hooks/useDebateSocket'
import api from '../services/api'

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '--:--'
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function DebatePage() {
  const { id }     = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate   = useNavigate()
  const [ending,      setEnding]      = useState(false)
  const [endError,    setEndError]    = useState('')
  const [finalDebate, setFinalDebate] = useState(null)

  const userId = authLoading ? null : user?.id

  const {
    debate, messages, connected, error,
    thinkingSecondsLeft, challengerTime, opponentTime,
    currentTurnId, isMyTurn, myTime, oppTime,
    sendMessage,
  } = useDebateSocket(id, userId)

  const handleEndDebate = async () => {
    setEnding(true)
    setEndError('')
    try {
      const res = await api.post(`/debate/${id}/end/`)
      setFinalDebate(res.data)
    } catch (err) {
      setEndError(err.response?.data?.error || 'Could not end debate.')
      setEnding(false)
    }
  }
  useEffect(() => {
    if (debate?.status === 'ended' && debate?.challenger_argument_strength === null && !finalDebate) {
      api.get(`/debate/${id}/`)
        .then(res => {
          if (res.data.challenger_argument_strength === null) {
            setTimeout(() => {
              api.get(`/debate/${id}/`).then(res2 => setFinalDebate(res2.data))
            }, 2000)
          } else {
            setFinalDebate(res.data)
          }
        })
        .catch(err => console.error('Could not load scored debate:', err))
    }
  }, [debate?.status, debate?.challenger_argument_strength, finalDebate, id])

  if (authLoading) {
    return <LoadingScreen message="Loading..." />
  }

  if (!connected && !debate) {
    return <LoadingScreen message="Connecting to debate room..." />
  }

  if (error && !debate) {
    return <ErrorScreen message={error} onBack={() => navigate('/analyze')} />
  }

  if (!debate) {
    return <LoadingScreen message="Loading debate..." />
  }

  if (debate.status === 'waiting') {
    return <WaitingStage debate={debate} user={user} />
  }

  if (debate.status === 'thinking') {
    return <ThinkingStage debate={debate} user={user} secondsLeft={thinkingSecondsLeft} />
  }

  if (debate.status === 'ended' || finalDebate) {
    return (
      <ScorecardStage
        debate={finalDebate || debate}
        userId={user?.id}
        onNewDebate={() => navigate('/debate/new')}
      />
    )
  }

  return (
    <ArenaStage
      debate={debate}
      messages={messages}
      userId={user?.id}
      isMyTurn={isMyTurn}
      myTime={myTime}
      oppTime={oppTime}
      challengerTime={challengerTime}
      opponentTime={opponentTime}
      sendMessage={sendMessage}
      onEndDebate={handleEndDebate}
      ending={ending}
      endError={endError}
      connected={connected}
    />
  )
}

function WaitingStage({ debate, user }) {
  const inviteLink = `${window.location.origin}/debate/${debate.id}`
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.goldLine} />
        <h1 style={styles.heading}>WAITING FOR<br />OPPONENT.</h1>
        <p style={styles.sub}>Share this link with <strong>{debate.opponent?.name || debate.opponent?.username || 'your opponent'}</strong></p>

        <div style={{ marginTop: '32px', padding: '20px 24px', background: 'white', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#8B7355', flex: 1, wordBreak: 'break-all' }}>{inviteLink}</span>
          <button onClick={copyLink} style={copied ? styles.btnSuccess : styles.btnSecondary}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div style={{ marginTop: '32px', padding: '24px', background: 'white', borderLeft: '3px solid #D4AF37' }}>
          <p style={styles.label}>Topic</p>
          <p style={{ fontSize: '16px', color: '#1a1000', margin: '0', fontWeight: '600' }}>{debate.topic}</p>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '24px' }}>
          <div style={styles.statBox}>
            <span style={styles.label}>Thinking time</span>
            <span style={styles.statVal}>{debate.thinking_seconds}s</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.label}>Time per player</span>
            <span style={styles.statVal}>{formatTime(debate.time_per_player_seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ThinkingStage({ debate, user, secondsLeft }) {
  return (
    <div style={styles.page}>
      <div style={{ ...styles.container, textAlign: 'center' }}>
        <div style={styles.goldLine} />
        <h1 style={styles.heading}>THINK.</h1>
        <p style={styles.sub}>Prepare your argument. The debate starts when the timer ends.</p>

        <div style={{ margin: '48px auto', width: '160px', height: '160px', border: '3px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span style={{ fontSize: '52px', fontWeight: '900', color: '#1a1000', letterSpacing: '-3px', fontVariantNumeric: 'tabular-nums' }}>
            {secondsLeft ?? debate.thinking_seconds}
          </span>
          <span style={styles.label}>seconds</span>
        </div>

        <div style={{ padding: '20px 24px', background: 'white', borderLeft: '3px solid #D4AF37', textAlign: 'left', maxWidth: '480px', margin: '0 auto' }}>
          <p style={styles.label}>Topic</p>
          <p style={{ fontSize: '15px', color: '#1a1000', margin: '0', fontWeight: '600' }}>{debate.topic}</p>
        </div>

        <p style={{ marginTop: '24px', fontSize: '13px', color: '#8B7355' }}>
          You are debating <strong style={{ color: '#1a1000' }}>
            {user?.id === debate.challenger?.id
              ? (debate.opponent?.name || debate.opponent?.username)
              : (debate.challenger?.name || debate.challenger?.username)}
          </strong>
        </p>
      </div>
    </div>
  )
}

function ArenaStage({
  debate, messages, userId, isMyTurn,
  myTime, oppTime, challengerTime, opponentTime,
  sendMessage, onEndDebate, ending, endError, connected,
}) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  const isChallenger = userId === debate.challenger?.id
  const myName  = isChallenger
    ? (debate.challenger?.name || debate.challenger?.username)
    : (debate.opponent?.name   || debate.opponent?.username)
  const oppName = isChallenger
    ? (debate.opponent?.name   || debate.opponent?.username)
    : (debate.challenger?.name || debate.challenger?.username)
  const myTimeDisplay  = isChallenger ? challengerTime : opponentTime
  const oppTimeDisplay = isChallenger ? opponentTime   : challengerTime
  const myMsgCount  = messages.filter(m => m.sender_id === userId).length
  const canEnd      = myMsgCount >= 3 && messages.filter(m => m.sender_id !== userId).length >= 3

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = draft.trim()
    if (!text || !isMyTurn) return
    sendMessage(text)
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.arenaWrap}>

        {/* Header */}
        <div style={styles.arenaHeader}>
          <div style={{ flex: 1 }}>
            <p style={styles.label}>Topic</p>
            <p style={{ fontSize: '14px', color: '#1a1000', margin: '0', fontWeight: '700' }}>{debate.topic}</p>
          </div>
          {!connected && (
            <span style={{ fontSize: '11px', color: '#c0392b', letterSpacing: '1px' }}>RECONNECTING...</span>
          )}
        </div>

        {/* Timer bar */}
        <div style={styles.timerBar}>
          {/* My timer */}
          <div style={{ ...styles.timerBox, borderColor: isMyTurn ? '#D4AF37' : 'rgba(26,16,0,0.1)' }}>
            <span style={styles.label}>{myName} (you)</span>
            <span style={{
              ...styles.timerVal,
              color: (myTimeDisplay ?? 0) < 30 ? '#c0392b' : '#1a1000'
            }}>
              {formatTime(myTimeDisplay)}
            </span>
            {isMyTurn && <span style={styles.turnIndicator}>YOUR TURN</span>}
          </div>

          <div style={{ fontSize: '18px', color: '#D4AF37', fontWeight: '900' }}>VS</div>

          {/* Opponent timer */}
          <div style={{ ...styles.timerBox, borderColor: !isMyTurn ? '#9B72CF' : 'rgba(26,16,0,0.1)' }}>
            <span style={styles.label}>{oppName}</span>
            <span style={{
              ...styles.timerVal,
              color: (oppTimeDisplay ?? 0) < 30 ? '#c0392b' : '#1a1000'
            }}>
              {formatTime(oppTimeDisplay)}
            </span>
            {!isMyTurn && <span style={{ ...styles.turnIndicator, color: '#9B72CF' }}>THEIR TURN</span>}
          </div>
        </div>

        {/* Message thread */}
        <div style={styles.messageThread}>
          {messages.length === 0 && (
            <p style={{ textAlign: 'center', color: '#8B7355', fontSize: '13px', marginTop: '40px' }}>
              {isMyTurn ? 'You go first. Make your opening argument.' : `Waiting for ${oppName} to open...`}
            </p>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === userId
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  maxWidth: '72%',
                  padding: '14px 18px',
                  background: isMe ? '#1a1000' : 'white',
                  color: isMe ? '#F5F0E8' : '#1a1000',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: isMe ? '#D4AF37' : '#8B7355', margin: '0 0 6px' }}>
                    {msg.sender_name}
                  </p>
                  <p style={{ fontSize: '14px', margin: '0', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </p>
                  <p style={{ fontSize: '10px', color: isMe ? 'rgba(245,240,232,0.4)' : '#8B7355', margin: '6px 0 0', letterSpacing: '0.5px' }}>
                    {formatTime(msg.time_remaining_after_send)} left
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={styles.inputArea}>
          {endError && <p style={{ fontSize: '12px', color: '#c0392b', margin: '0 0 8px' }}>{endError}</p>}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isMyTurn}
              placeholder={isMyTurn ? 'Make your argument... (Enter to send, Shift+Enter for new line)' : `Waiting for ${oppName}...`}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: isMyTurn ? '2px solid #D4AF37' : '2px solid rgba(26,16,0,0.1)',
                background: isMyTurn ? 'white' : '#f9f6f0',
                fontSize: '14px',
                color: '#1a1000',
                lineHeight: '1.6',
                resize: 'none',
                minHeight: '80px',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: isMyTurn ? 'text' : 'not-allowed',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleSend}
                disabled={!isMyTurn || !draft.trim()}
                style={{
                  background: (isMyTurn && draft.trim()) ? '#D4AF37' : 'rgba(212,175,55,0.3)',
                  color: '#1a1000',
                  padding: '14px 20px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  cursor: (isMyTurn && draft.trim()) ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                Send →
              </button>
              {canEnd && (
                <button
                  onClick={onEndDebate}
                  disabled={ending}
                  style={styles.btnSecondary}
                >
                  {ending ? 'Ending...' : 'End Debate'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScorecardStage({ debate, userId, onNewDebate }) {
  const isChallenger = userId === debate.challenger?.id
  const me  = isChallenger ? 'challenger' : 'opponent'
  const opp = isChallenger ? 'opponent'   : 'challenger'
  const myName  = debate[me]?.name  || debate[me]?.username
  const oppName = debate[opp]?.name || debate[opp]?.username

  const DIMS = [
    { key: 'argument_strength', label: 'Argument Strength', color: '#D4AF37' },
    { key: 'logical_coherence', label: 'Logical Coherence', color: '#D4AF37' },
    { key: 'rebuttal_quality',  label: 'Rebuttal Quality',  color: '#9B72CF' },
    { key: 'clarity',           label: 'Clarity',           color: '#9B72CF' },
    { key: 'composure',         label: 'Composure',         color: '#2D7A4F' },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.goldLine} />
        <h1 style={styles.heading}>SCORECARD.</h1>
        <p style={styles.sub}>No winner. Just insight.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginTop: '32px' }}>
          {/* My scores */}
          <div style={{ background: '#1a1000', padding: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', margin: '0 0 16px' }}>
              {myName} (you)
            </p>
            {DIMS.map(d => (
              <ScoreRow
                key={d.key}
                label={d.label}
                score={debate[`${me}_${d.key}`]}
                color={d.color}
                dark
              />
            ))}
            <p style={{ fontSize: '13px', color: 'rgba(245,240,232,0.7)', marginTop: '16px', lineHeight: '1.6', fontStyle: 'italic' }}>
              {debate[`${me}_feedback`]}
            </p>
          </div>

          {/* Opponent scores */}
          <div style={{ background: 'white', padding: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#8B7355', margin: '0 0 16px' }}>
              {oppName}
            </p>
            {DIMS.map(d => (
              <ScoreRow
                key={d.key}
                label={d.label}
                score={debate[`${opp}_${d.key}`]}
                color={d.color}
                dark={false}
              />
            ))}
            <p style={{ fontSize: '13px', color: '#8B7355', marginTop: '16px', lineHeight: '1.6', fontStyle: 'italic' }}>
              {debate[`${opp}_feedback`]}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button onClick={onNewDebate} style={styles.btnPrimary}>New Debate →</button>
        </div>
      </div>
    </div>
  )
}

function ScoreRow({ label, score, color, dark }) {
  const val = score !== null && score !== undefined ? Math.round(score) : '—'
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: dark ? 'rgba(245,240,232,0.5)' : '#8B7355' }}>
          {label}
        </span>
        <span style={{ fontSize: '14px', fontWeight: '900', color: dark ? '#F5F0E8' : '#1a1000' }}>
          {val}
        </span>
      </div>
      <div style={{ height: '3px', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(26,16,0,0.08)' }}>
        <div style={{ height: '100%', width: `${score || 0}%`, background: color, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

function LoadingScreen({ message }) {
  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid rgba(212,175,55,0.2)', borderTop: '3px solid #D4AF37', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '12px', color: '#8B7355', letterSpacing: '2px', textTransform: 'uppercase' }}>{message}</p>
    </div>
  )
}

function ErrorScreen({ message, onBack }) {
  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={styles.container}>
        <div style={styles.goldLine} />
        <h1 style={{ ...styles.heading, fontSize: '32px' }}>ERROR.</h1>
        <p style={{ fontSize: '14px', color: '#8B7355', margin: '16px 0 32px' }}>{message}</p>
        <button onClick={onBack} style={styles.btnSecondary}>← Go Back</button>
      </div>
    </div>
  )
}

export function ChallengePage() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ opponent_username: '', topic: '', thinking_seconds: 60, time_per_player: 180 })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async () => {
    if (!form.opponent_username.trim() || !form.topic.trim()) {
      setError('Opponent username and topic are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/debate/challenge/', form)
      navigate(`/debate/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.opponent_username?.[0] || err.response?.data?.non_field_errors?.[0] || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.goldLine} />
        <h1 style={styles.heading}>CHALLENGE<br />SOMEONE.</h1>
        <p style={styles.sub}>Pick a topic. Pick an opponent. Debate.</p>

        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <p style={styles.label}>Opponent username</p>
            <input
              type="text"
              value={form.opponent_username}
              onChange={e => setForm(f => ({ ...f, opponent_username: e.target.value }))}
              placeholder="their username"
              style={styles.input}
            />
          </div>
          <div>
            <p style={styles.label}>Debate topic</p>
            <input
              type="text"
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. Social media does more harm than good"
              style={styles.input}
            />
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <p style={styles.label}>Thinking time</p>
              <select value={form.thinking_seconds} onChange={e => setForm(f => ({ ...f, thinking_seconds: Number(e.target.value) }))} style={styles.input}>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.label}>Time per player</p>
              <select value={form.time_per_player} onChange={e => setForm(f => ({ ...f, time_per_player: Number(e.target.value) }))} style={styles.input}>
                <option value={120}>2 minutes</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>
          </div>

          {error && <p style={{ fontSize: '12px', color: '#c0392b', margin: '0' }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading} style={loading ? { ...styles.btnPrimary, opacity: 0.5 } : styles.btnPrimary}>
            {loading ? 'Creating...' : 'Challenge →'}
          </button>
        </div>
      </div>
    </div>
  )
}
//STYLES
const styles = {
  page: {
    background: '#F5F0E8',
    minHeight: '100vh',
    padding: '52px',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  arenaWrap: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 104px)',
  },
  arenaHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  timerBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  timerBox: {
    flex: 1,
    padding: '16px 20px',
    background: 'white',
    border: '2px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  timerVal: {
    fontSize: '32px',
    fontWeight: '900',
    letterSpacing: '-2px',
    fontVariantNumeric: 'tabular-nums',
  },
  turnIndicator: {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#D4AF37',
    marginTop: '2px',
  },
  messageThread: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
    marginBottom: '16px',
  },
  inputArea: {
    borderTop: '2px solid rgba(26,16,0,0.08)',
    paddingTop: '16px',
  },
  goldLine: {
    width: '36px',
    height: '3px',
    background: '#D4AF37',
    marginBottom: '16px',
  },
  heading: {
    fontSize: 'clamp(32px, 5vw, 56px)',
    fontWeight: '900',
    color: '#1a1000',
    letterSpacing: '-2px',
    lineHeight: '0.9',
    margin: '0 0 12px',
  },
  sub: {
    fontSize: '14px',
    color: '#8B7355',
    margin: '0',
  },
  label: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#8B7355',
    margin: '0 0 6px',
  },
  statBox: {
    padding: '16px 20px',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statVal: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#1a1000',
    letterSpacing: '-1px',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0 0 10px',
    borderBottom: '2px solid rgba(26,16,0,0.15)',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    background: 'transparent',
    fontSize: '15px',
    color: '#1a1000',
    outline: 'none',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    background: '#D4AF37',
    color: '#1a1000',
    padding: '16px 40px',
    border: 'none',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent',
    color: '#1a1000',
    padding: '10px 20px',
    border: '1.5px solid #1a1000',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnSuccess: {
    background: '#2D7A4F',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
}

export default DebatePage