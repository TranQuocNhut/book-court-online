import React, { useState, useEffect } from 'react'

export default function TypeWriter({ 
  text, 
  speed = 50, 
  className = '',
  style = {},
  onComplete 
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let currentIndex = 0
    setDisplayedText('')
    setIsComplete(false)

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsComplete(true)
        if (onComplete) onComplete()
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return (
    <span className={className} style={style}>
      {displayedText}
      {!isComplete && <span className="typewriter-cursor" style={{ 
        animation: 'blink 1s infinite',
        opacity: 1 
      }}>|</span>}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  )
}

