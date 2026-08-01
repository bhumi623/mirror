// frontend/src/hooks/useDebateSocket.js
import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../services/api'

const POLL_INTERVAL = 3000 // ms

// Manages polling and interactive actions for a live debate session.
export function useDebateSocket(debateId, userId) {
  const pollRef             = useRef(null)
  const turnIntervalRef     = useRef(null)
  const thinkingIntervalRef = useRef(null)
  const userIdRef           = useRef(userId)
  const currentTurnRef      = useRef(null)
  const challengerIdRef     = useRef(null)
  const lastMessageCountRef = useRef(0)

  useEffect(() => { userIdRef.current = userId }, [userId])

  const [debate,              setDebate]              = useState(null)
  const [messages,            setMessages]            = useState([])
  const [connected,           setConnected]           = useState(false)
  const [error,               setError]               = useState('')
  const [challengerTime,      setChallengerTime]      = useState(null)
  const [opponentTime,        setOpponentTime]        = useState(null)
  const [currentTurnId,       setCurrentTurnId]       = useState(null)
  const [thinkingSecondsLeft, setThinkingSecondsLeft] = useState(null)
  const [isMyTurn,            setIsMyTurn]            = useState(false)

  const startTurnTick = useCallback((currentTurn, cTime, oTime) => {
    clearInterval(turnIntervalRef.current)
    currentTurnRef.current = currentTurn

    let cRemaining = cTime ?? 0
    let oRemaining = oTime ?? 0

    turnIntervalRef.current = setInterval(() => {
      const turn    = currentTurnRef.current
      const challId = challengerIdRef.current
      if (turn === null) return

      if (String(turn) === String(challId)) {
        cRemaining = Math.max(0, cRemaining - 1)
        setChallengerTime(cRemaining)
      } else {
        oRemaining = Math.max(0, oRemaining - 1)
        setOpponentTime(oRemaining)
      }
    }, 1000)
  }, [])

  const startThinkingCountdown = useCallback((totalSeconds, startedAt) => {
    clearInterval(thinkingIntervalRef.current)
    const endTime = new Date(startedAt).getTime() + totalSeconds * 1000

    const tick = () => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000))
      setThinkingSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(thinkingIntervalRef.current)
        sendAction('thinking_done')
      }
    }
    tick()
    thinkingIntervalRef.current = setInterval(tick, 1000)
  }, []) 
  const applyDebateState = useCallback((d) => {
    challengerIdRef.current = d.challenger?.id
    currentTurnRef.current  = d.current_turn_user_id

    setDebate(d)
    setMessages(d.messages || [])
    lastMessageCountRef.current = (d.messages || []).length
    setCurrentTurnId(d.current_turn_user_id)
    setIsMyTurn(String(d.current_turn_user_id) === String(userIdRef.current))

    let cTime = d.challenger_time_remaining
    let oTime = d.opponent_time_remaining

    if (d.status === 'active' && d.turn_started_at) {
      const elapsed = (Date.now() - new Date(d.turn_started_at).getTime()) / 1000
      if (String(d.current_turn_user_id) === String(d.challenger?.id)) {
        cTime = Math.max(0, cTime - elapsed)
      } else {
        oTime = Math.max(0, oTime - elapsed)
      }
    }

    setChallengerTime(cTime)
    setOpponentTime(oTime)

    if (d.status === 'thinking' && d.thinking_started_at) {
      startThinkingCountdown(d.thinking_seconds, d.thinking_started_at)
    }
    if (d.status === 'active') {
      startTurnTick(d.current_turn_user_id, cTime, oTime)
    }
    if (d.status === 'ended') {
      clearInterval(turnIntervalRef.current)
      clearInterval(thinkingIntervalRef.current)
      stopPolling()
    }
  }, [startThinkingCountdown, startTurnTick])

  const stopPolling = useCallback(() => {
    clearInterval(pollRef.current)
  }, [])

  const poll = useCallback(async () => {
    if (!debateId) return
    try {
      const res = await api.get(`/debate/${debateId}/state/`)
      setConnected(true)
      setError('')
      applyDebateState(res.data)
    } catch (e) {
      const code = e.response?.status
      if (code === 401) setError('Session expired. Please log in again.')
      else if (code === 403) setError('You are not a participant in this debate.')
      else {
        setConnected(false)
        setError('Connection lost. Retrying...')
      }
    }
  }, [debateId, applyDebateState])

  useEffect(() => {
    if (!debateId || !userId) return

    userIdRef.current = userId

    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      stopPolling()
      clearInterval(turnIntervalRef.current)
      clearInterval(thinkingIntervalRef.current)
    }
  }, [debateId, userId, poll, stopPolling])

  const sendMessage = useCallback(async (text) => {
    try {
      await api.post(`/debate/${debateId}/message/`, { text })
      await poll()
    } catch (e) {
      const msg = e.response?.data?.error || 'Failed to send message. Check your connection.'
      setError(msg)
    }
  }, [debateId, poll])
  const sendAction = useCallback(async (action, extra = {}) => {
    try {
      await api.post(`/debate/${debateId}/action/`, { action, ...extra })
      await poll()
    } catch (e) {
      console.error('Action failed', e)
    }
  }, [debateId, poll])

  const amIChallenger = String(challengerIdRef.current) === String(userId)
  const myTime  = amIChallenger ? challengerTime : opponentTime
  const oppTime = amIChallenger ? opponentTime   : challengerTime

  return {
    debate, messages, connected, error,
    thinkingSecondsLeft, challengerTime, opponentTime,
    currentTurnId, isMyTurn, myTime, oppTime, sendMessage,
  }
}