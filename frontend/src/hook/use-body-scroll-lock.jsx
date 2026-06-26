import { useEffect } from 'react'

/**
 * Hook để lock/unlock body scroll (ngăn scroll khi modal/dialog mở)
 * 
 * @param {boolean} locked - Lock scroll khi true
 * 
 * @example
 * useBodyScrollLock(isModalOpen)
 */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (locked) {
      // Lưu giá trị overflow hiện tại
      const originalOverflow = document.body.style.overflow
      // Lưu giá trị padding-right để tránh layout shift khi scrollbar biến mất
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = ''
      }
    }
  }, [locked])
}

export default useBodyScrollLock

