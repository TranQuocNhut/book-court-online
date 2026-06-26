import { useEffect } from 'react'

/**
 * Hook để handle Escape key press
 * 
 * @param {Function} callback - Hàm được gọi khi nhấn Escape
 * @param {boolean} enabled - Bật/tắt hook (mặc định: true)
 * 
 * @example
 * useEscapeKey(() => setIsOpen(false), isOpen)
 */
export function useEscapeKey(callback, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        callback(e)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [callback, enabled])
}

export default useEscapeKey

