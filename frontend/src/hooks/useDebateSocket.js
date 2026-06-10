// frontend/src/hooks/useDebateSocket.js
import { useEffect, useRef, useState, useCallback } from 'react'
const WS_BASE = 'ws://localhost:8000'

const getFreshToken = async () => {
  let token = localStorage.getItem('access_token')
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiresAt = payload.exp * 1000
    const fiveMinutes = 5 * 60 * 1000
    if (Date.now() > expiresAt - fiveMinutes) {
      const refresh = localStorage.getItem('refresh_token')
      const res = await fetch('http://localhost:8000/api/auth/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      const data = await res.json()
      if (data.access) {
        localStorage.setItem('access_token', data.access)
        token = data.access
      }
    }
  } catch (e) {
    console.error('Token refresh failed', e)
  }
  return token
}

export function useDebateSocket(debateId, userId) {
  const socketRef = useRef(null)

  const [debate,       setDebate]      = useState(null)
  const [messages,     setMessages]    = useState([])
  const [connected,    setConnected]   = useState(false)
  const [error,        setError]       = useState('')

  const [challengerTime, setChallengerTime] = useState(null)
  const [opponentTime,   setOpponentTime]   = useState(null)
  const [currentTurnId,  setCurrentTurnId]  = useState(null)

  const [thinkingSecondsLeft, setThinkingSecondsLeft] = useState(null)
  const thinkingIntervalRef = useRef(null)
  const turnIntervalRef     = useRef(null)
  useEffect(() => {
    if (!debateId || !userId) return

    const connect = async () => {
      const token = await getFreshToken()
      if (!token) {
        setError('Not logged in. Please log in again.')
        return
      }

      const ws = new WebSocket(`${WS_BASE}/ws/debate/${debateId}/?token=${token}`)
      socketRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setError('')
      }

      ws.onclose = (event) => {
        setConnected(false)
        if (event.code === 4001) setError('Session expired. Please log in again.')
        else if (event.code === 4003) setError('You are not a participant in this debate.')
        else if (event.code !== 1000) setError('Connection lost. Please refresh.')
      }

      ws.onerror = () => {
        setError('WebSocket error. Check that the server is running.')
      }

      ws.onmessage = (event) => {
        handleMessage(JSON.parse(event.data))
      }
    }

    connect()

    return () => {
      socketRef.current?.close(1000)
      clearInterval(thinkingIntervalRef.current)
      clearInterval(turnIntervalRef.current)
    }
  }, [debateId, userId])
  const handleMessage = useCallback((data) => {
    switch (data.type) {

      case 'state_sync': {
        const d = data.debate
        setDebate(d)
        setMessages(d.messages || [])
        setChallengerTime(d.challenger_time_remaining)
        setOpponentTime(d.opponent_time_remaining)
        setCurrentTurnId(d.current_turn_user_id)
        if (d.status === 'thinking' && d.thinking_started_at) {
          startThinkingCountdown(d.thinking_seconds, d.thinking_started_at)
        }
        if (d.status === 'active') {
          restartTurnTick(d.current_turn_user_id, d.challenger_time_remaining, d.opponent_time_remaining)
        }
        break
      }

      case 'thinking_started': {
        setDebate(prev => prev ? { ...prev, status: 'thinking' } : prev)
        startThinkingCountdown(data.thinking_seconds, data.thinking_started_at)
        break
      }

      case 'debate_active': {
        clearInterval(thinkingIntervalRef.current)
        setThinkingSecondsLeft(null)
        setCurrentTurnId(data.current_turn_user_id)
        setChallengerTime(data.challenger_time_remaining)
        setOpponentTime(data.opponent_time_remaining)
        setDebate(prev => prev ? { ...prev, status: 'active' } : prev)
        restartTurnTick(data.current_turn_user_id, data.challenger_time_remaining, data.opponent_time_remaining)
        break
      }

      case 'new_message': {
        setMessages(prev => [...prev, data.message])
        setCurrentTurnId(data.current_turn_user_id)
        setChallengerTime(data.challenger_time_remaining)
        setOpponentTime(data.opponent_time_remaining)
        restartTurnTick(data.current_turn_user_id, data.challenger_time_remaining, data.opponent_time_remaining)
        break
      }

      case 'debate_ended': {
        clearInterval(turnIntervalRef.current)
        setDebate(prev => prev ? { ...prev, status: 'ended' } : prev)
        break
      }

      case 'error': {
        setError(data.message)
        break
      }

      default:
        break
    }
  }, [])
  const startThinkingCountdown = (totalSeconds, startedAt) => {
    clearInterval(thinkingIntervalRef.current)
    const endTime = new Date(startedAt).getTime() + totalSeconds * 1000

    const tick = () => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000))
      setThinkingSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(thinkingIntervalRef.current)
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'thinking_done' }))
        }
      }
    }
    tick()
    thinkingIntervalRef.current = setInterval(tick, 1000)
  }
  const restartTurnTick = (currentTurn, cTime, oTime) => {
    clearInterval(turnIntervalRef.current)
    let challengerRemaining = cTime
    let opponentRemaining   = oTime

    turnIntervalRef.current = setInterval(() => {
      if (currentTurn === null) return
      if (String(currentTurn) === String(userId)) {
        challengerRemaining = Math.max(0, challengerRemaining - 1)
        setChallengerTime(challengerRemaining)
      } else {
        opponentRemaining = Math.max(0, opponentRemaining - 1)
        setOpponentTime(opponentRemaining)
      }
    }, 1000)
  }
  const sendMessage = useCallback((text) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected. Please refresh.')
      return
    }
    socketRef.current.send(JSON.stringify({ type: 'send_message', text }))
  }, [])

  const isMyTurn = String(currentTurnId) === String(userId)
  const myTime   = debate?.challenger_id === userId ? challengerTime : opponentTime
  const oppTime  = debate?.challenger_id === userId ? opponentTime   : challengerTime

  return {
    debate,
    messages,
    connected,
    error,
    thinkingSecondsLeft,
    challengerTime,
    opponentTime,
    currentTurnId,
    isMyTurn,
    myTime,
    oppTime,
    sendMessage,
  }
}