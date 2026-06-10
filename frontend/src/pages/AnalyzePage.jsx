// frontend/src/pages/AnalyzePage.jsx
import { useState } from 'react'
import api from '../services/api'
const DIMENSION_LABELS = {
  self: {
    personality: 'Your Vibe',
    tone:        'Your Mood',
    bias:        'Your Inner Critic',
    thinking:    'How Your Mind Works',
    language:    'Your Word Power',
    communication: 'Your Voice',
  },
  story: {
    personality: 'Narrative Atmosphere',
    tone:        'Emotional Tone',
    bias:        'Character Depth',
    thinking:    'Storytelling Style',
    language:    'Descriptive Richness',
    communication: 'Narrative Confidence',
  },
  opinion: {
    personality: 'Argument Stance',
    tone:        'Emotional Charge',
    bias:        'Self-Awareness',
    thinking:    'Reasoning Style',
    language:    'Persuasive Language',
    communication: 'Conviction Level',
  }
}

function AnalyzePage() {
  const [stage,   setStage]   = useState('input')
  const [text,    setText]    = useState('')
  const [error,   setError]   = useState('')
  const [results, setResults] = useState(null)
  const [mode, setMode] = useState('self')
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  const handleAnalyze = async () => {
    if (wordCount < 20) {
      setError('Please write at least 20 words for a meaningful analysis.')
      return
    }
    setError('')
    setStage('loading')
    try {
      const response = await api.post('/analyze/submit/', { text, mode })
      setResults(response.data)
      setStage('results')
    } catch (err) {
      setError(
        err.response?.data?.error || 'Something went wrong. Please try again.'
      )
      setStage('input')
    }
  }
  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh', padding: '52px' }}>
      {stage === 'input' && (
        <InputStage
          text={text}
          setText={setText}
          mode={mode}
          setMode={setMode}
          wordCount={wordCount}
          error={error}
          onAnalyze={handleAnalyze}
        />
      )}
      {stage === 'loading' && <LoadingStage />}
      {stage === 'results' && (
        <ResultsStage
          results={results}
          mode={mode}
          onReset={() => { setStage('input'); setText(''); setResults(null) }}
        />
      )}
      
    </div>
  )
}

function InputStage({ text, setText, mode, setMode, wordCount, error, onAnalyze }) {
  const ready = wordCount >= 20
  const MODES = [
    { key: 'self',   label: 'About Me',   sub: 'journal, feelings, thoughts' },
    { key: 'story',   label: 'A Story',    sub: 'fiction, narrative, characters' },
    { key: 'opinion', label: 'My Opinion', sub: 'argument, views, debate' },
  ]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ width: '36px', height: '3px', background: '#D4AF37', marginBottom: '16px' }} />
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: '900',
          color: '#1a1000',
          letterSpacing: '-2px',
          lineHeight: '0.9',
          margin: '0 0 12px'
        }}>
          SHOW ME<br />YOUR WRITING.
        </h1>
        <p style={{ fontSize: '14px', color: '#8B7355', margin: '0' }}>
          Paste anything — a text, a rant, an essay. Minimum 20 words.
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <p style={{
          fontSize: '10px',
          fontWeight: '700',
          color: '#8B7355',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          What are you sharing today?
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              style={{
                padding: '14px 20px',
                border: mode === m.key
                  ? '2px solid #1a1000'
                  : '1.5px solid rgba(26,16,0,0.2)',
                background: mode === m.key ? '#1a1000' : 'transparent',
                color: mode === m.key ? '#F5F0E8' : '#1a1000',
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: '160px',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{m.emoji}</div>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}>
                {m.label}
              </div>
              <div style={{
                fontSize: '10px',
                opacity: mode === m.key ? 0.7 : 0.5
              }}>
                {m.sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={
          mode === 'self'    ? "Write about how you're feeling, what's on your mind..." :
          mode === 'story'   ? "Paste your story, scene, or narrative here..." : "Share your opinion, argument, or view on anything..."
        }
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: '280px',
          padding: '24px',
          border: '2px solid rgba(26,16,0,0.15)',
          background: 'white',
          fontSize: '15px',
          color: '#1a1000',
          lineHeight: '1.8',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          borderRadius: '0',
        }}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        marginBottom: '24px'
      }}>
        <span style={{
          fontSize: '11px',
          color: ready ? '#2D7A4F' : '#8B7355',
          letterSpacing: '1px'
        }}>
          {wordCount} / 20 words minimum
        </span>
        {error && <span style={{ fontSize: '11px', color: '#c0392b' }}>{error}</span>}
      </div>

      <button
        onClick={onAnalyze}
        disabled={!ready}
        style={{
          background: ready ? '#D4AF37' : 'rgba(212,175,55,0.3)',
          color: '#1a1000',
          padding: '18px 48px',
          border: 'none',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          cursor: ready ? 'pointer' : 'not-allowed',
        }}
      >
        Analyze My Writing →
      </button>

    </div>
  )
}

function LoadingStage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '24px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(212,175,55,0.2)',
        borderTop: '3px solid #D4AF37',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{
        fontSize: '13px',
        color: '#8B7355',
        letterSpacing: '2px',
        textTransform: 'uppercase'
      }}>
        Reading your writing...
      </p>
    </div>
  )
}
function ResultsStage({ results, mode, onReset }) {
  const labels = DIMENSION_LABELS[mode] || DIMENSION_LABELS.self
  const DIMENSIONS = [
    { key: 'personality',    color: '#D4AF37' },
    { key: 'tone',           color: '#9B72CF' },
    { key: 'bias',           color: '#D4AF37' },
    { key: 'thinking',       color: '#9B72CF' },
    { key: 'language',       color: '#D4AF37' },
    { key: 'communication',  color: '#9B72CF' },
  ]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }}>
        <div>
          <div style={{ width: '36px', height: '3px', background: '#D4AF37', marginBottom: '16px' }} />
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: '900',
            color: '#1a1000',
            letterSpacing: '-2px',
            lineHeight: '0.9',
            margin: '0'
          }}>
            YOUR<br />MIRROR.
          </h1>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'transparent',
            color: '#1a1000',
            padding: '10px 20px',
            border: '1.5px solid #1a1000',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Analyze Again
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {DIMENSIONS.map((dim, i) => (
          <DimensionCard
            key={dim.key}
            label={labels[dim.key]}
            score={results[`${dim.key}_score`]}
            cardLabel={results[`${dim.key}_label`]}
            description={results[`${dim.key}_description`]}
            color={dim.color}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}

function DimensionCard({ label, score, cardLabel, description, color, index }) {
  return (
    <div
      className="m-fade-in"
      style={{
        background: 'white',
        padding: '24px 28px',
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Top row — dimension name + score */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '10px'
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#8B7355'
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#1a1000',
          letterSpacing: '-1px'
        }}>
          {Math.round(score)}
        </span>
      </div>

      {/* Score bar */}
      <div style={{
        width: '100%',
        height: '3px',
        background: 'rgba(26,16,0,0.08)',
        marginBottom: '14px'
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: color,
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Label + description */}
      <div style={{
        fontSize: '13px',
        fontWeight: '700',
        color: '#1a1000',
        marginBottom: '4px'
      }}>
        {cardLabel}
      </div>
      <div style={{
        fontSize: '13px',
        color: '#8B7355',
        lineHeight: '1.6'
      }}>
        {description}
      </div>
    </div>
  )
}

export default AnalyzePage