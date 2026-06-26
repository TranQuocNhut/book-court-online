import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook để tạo countdown timer
 * 
 * @param {number} initialCount - Giá trị countdown ban đầu (mặc định: 0)
 * @param {Function} onComplete - Callback khi countdown về 0 (optional)
 * @returns {Object} - { count, start, reset, isRunning }
 * 
 * @example
 * const { count, start, reset } = useCountdown(60, () => console.log('Done!'))
 * 
 * // Start countdown
 * start(60) // Bắt đầu từ 60 giây
 * 
 * // Reset countdown
 * reset()
 */
export function useCountdown(initialCount = 0, onComplete) {
  const [count, setCount] = useState(initialCount)
  const intervalRef = useRef(null)

  const start = useCallback((newCount) => {
    // Clear interval hiện tại nếu có
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set giá trị mới
    setCount(newCount !== undefined ? newCount : initialCount)

    // Bắt đầu countdown
    intervalRef.current = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          // Clear interval khi về 0
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          // Gọi callback nếu có
          if (onComplete) {
            onComplete()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [initialCount, onComplete])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCount(initialCount)
  }, [initialCount])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    count,
    start,
    reset,
    stop,
    isRunning: intervalRef.current !== null && count > 0
  }
}

export default useCountdown

