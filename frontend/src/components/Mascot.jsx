import { useState, useEffect, useRef, useCallback } from 'react'
import imgBlank     from '../assets/mascot/blank.png'
import imgEyes      from '../assets/mascot/eyes.png'
import imgThinkEyes from '../assets/mascot/thinkeyes.png'
import imgBlink     from '../assets/mascot/blink.png'
import imgClosed    from '../assets/mascot/closed.png'
import imgPeek      from '../assets/mascot/peek.png'
import imgAngry     from '../assets/mascot/angry.png'
import imgDizzy     from '../assets/mascot/dizzy.png'
import imgThink     from '../assets/mascot/think.png'

const EXPR = {
  blink:  imgBlink,
  closed: imgClosed,
  peek:   imgPeek,
  angry:  imgAngry,
  dizzy:  imgDizzy,
  think:  imgThink,
}
function Mascot({ expression = 'default', passwordFocused = false }) {
  const wrapRef    = useRef(null)
  const blinkTimer = useRef(null)
  const [exprSrc,       setExprSrc]       = useState(null)
  const [showEyes,      setShowEyes]      = useState(true)
  const [eyeTransform,  setEyeTransform]  = useState('translate(0px,0px)')
  const eyeBase = passwordFocused ? imgThinkEyes : imgEyes

  useEffect(() => {
    if (expression === 'default') {
      setExprSrc(null)
      setShowEyes(true)
    } else {
      setExprSrc(EXPR[expression] || null)
      setShowEyes(false)
    }
  }, [expression])

  useEffect(() => {
    if (expression !== 'default') return
    const handleMove = (e) => {
      if (!wrapRef.current) return
      const rect = wrapRef.current.getBoundingClientRect()
      const cx   = rect.left + rect.width  * 0.5
      const cy   = rect.top  + rect.height * 0.40  // eyes sit at ~40% down
      const dx   = e.clientX - cx
      const dy   = e.clientY - cy
      const angle = Math.atan2(dy, dx)
      const dist  = Math.min(Math.sqrt(dx * dx + dy * dy), 220)
      const f     = dist / 220
      const rawX  = Math.cos(angle) * f * 12
      const clampX = rawX < 0 ? Math.max(rawX, -5) : rawX
      const moveY  = Math.sin(angle) * f * 9
      setEyeTransform(`translate(${clampX.toFixed(1)}px,${moveY.toFixed(1)}px)`)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [expression])

  const scheduleBlink = useCallback(() => {
    clearTimeout(blinkTimer.current)
    blinkTimer.current = setTimeout(async () => {
      if (expression !== 'default') { scheduleBlink(); return }

      setExprSrc(imgBlink)
      setShowEyes(false)
      await new Promise(r => setTimeout(r, 140))
      setExprSrc(null)
      setShowEyes(true)

      if (Math.random() < 0.25) {
        await new Promise(r => setTimeout(r, 80))
        setExprSrc(imgBlink)
        setShowEyes(false)
        await new Promise(r => setTimeout(r, 140))
        setExprSrc(null)
        setShowEyes(true)
      }
      scheduleBlink()
    }, 3000 + Math.random() * 3000)
  }, [expression])

  useEffect(() => {
    scheduleBlink()
    return () => clearTimeout(blinkTimer.current)
  }, [scheduleBlink])

  return (
    <div ref={wrapRef} style={mascotStyle.wrap}>
      <img
        src={imgBlank}
        alt="Mirror mascot"
        style={mascotStyle.layer}
        draggable={false}
      />
      {showEyes && (
        <img
          src={eyeBase}
          alt=""
          style={{
            ...mascotStyle.layer,
            transform: eyeTransform,
            transition: 'transform 0.05s linear',
          }}
          draggable={false}
        />
      )}
      {exprSrc && (
        <img
          src={exprSrc}
          alt=""
          style={mascotStyle.layer}
          draggable={false}
        />
      )}
    </div>
  )
}

const mascotStyle = {
  wrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    userSelect: 'none',
    pointerEvents: 'none',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'bottom center',
  },
}

export default Mascot