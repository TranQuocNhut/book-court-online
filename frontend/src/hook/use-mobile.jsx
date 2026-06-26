import { useState, useEffect, useRef } from 'react'

/**
 * Hook để detect thiết bị mobile dựa trên kích thước màn hình với debounce
 * @param {number} breakpoint - Điểm breakpoint để xác định mobile (mặc định: 768px)
 * @param {number} delay - Thời gian debounce delay (mặc định: 150ms)
 * @returns {boolean} - true nếu là mobile, false nếu là desktop
 * 
 * @example
 * const isMobile = useMobile()
 * // hoặc với breakpoint tùy chỉnh
 * const isMobile = useMobile(640)
 * // hoặc với breakpoint và delay tùy chỉnh
 * const isMobile = useMobile(768, 200)
 */
export function useMobile(breakpoint = 768, delay = 150) {
  const [isMobile, setIsMobile] = useState(() => {
    // SSR-safe: kiểm tra window có tồn tại không
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint
    }
    return false
  })

  const timeoutRef = useRef(null)

  useEffect(() => {
    // Nếu không có window (SSR), không thực hiện gì
    if (typeof window === 'undefined') {
      return
    }

    const updateMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    const handleResize = () => {
      // Clear timeout trước đó nếu có
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set timeout mới với debounce delay
      timeoutRef.current = setTimeout(() => {
        updateMobile()
      }, delay)
    }

    // Set initial value ngay lập tức (không debounce lần đầu)
    updateMobile()

    // Listen to resize events
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      // Clear timeout khi cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [breakpoint, delay])

  return isMobile
}

export default useMobile


