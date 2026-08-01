// frontend/src/pages/AnalyzePage.jsx
import { useState } from 'react'
import api from '../services/api'
import './AnalyzePage.css'

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
    <div className="analyze-page">
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
    { key: 'self',   label: 'About Me',   sub: 'journal, feelings, thoughts', emoji: '📝' },
    { key: 'story',   label: 'A Story',    sub: 'fiction, narrative, characters', emoji: '📖' },
    { key: 'opinion', label: 'My Opinion', sub: 'argument, views, debate', emoji: '⚖️' },
  ]

  return (
    <div className="container">
      <div style={{ marginBottom: '40px' }}>
        <div className="gold-line" />
        <h1 className="heading">SHOW ME<br />YOUR WRITING.</h1>
        <p className="sub">Paste anything — a text, a rant, an essay. Minimum 20 words.</p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <p className="label">What are you sharing today?</p>
        <div className="modes-grid">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`mode-btn ${mode === m.key ? 'active' : ''}`}
            >
              <div className="mode-emoji">{m.emoji}</div>
              <div className="mode-title">{m.label}</div>
              <div className="mode-sub">{m.sub}</div>
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
        className="textarea"
      />

      <div className="status-bar">
        <span className={`word-count ${ready ? 'ready' : ''}`}>
          {wordCount} / 20 words minimum
        </span>
        {error && <span className="error">{error}</span>}
      </div>

      <button
        onClick={onAnalyze}
        disabled={!ready}
        className={`btn-primary ${ready ? 'ready' : ''}`}
      >
        Analyze My Writing →
      </button>
    </div>
  )
}

function LoadingStage() {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <p className="loading-text">Reading your writing...</p>
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
    <div className="container">
      <div className="results-header">
        <div>
          <div className="gold-line" />
          <h1 className="heading" style={{ margin: 0 }}>YOUR<br />MIRROR.</h1>
        </div>
        <button onClick={onReset} className="btn-outline">
          Analyze Again
        </button>
      </div>

      <div className="dim-cards-grid">
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
      className="dim-card m-fade-in"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="dim-header">
        <span className="dim-label">{label}</span>
        <span className="dim-score">{Math.round(score)}</span>
      </div>

      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{
          width: `${score}%`,
          background: color
        }} />
      </div>

      <div className="card-label">{cardLabel}</div>
      <div className="card-desc">{description}</div>
    </div>
  )
}

export default AnalyzePage