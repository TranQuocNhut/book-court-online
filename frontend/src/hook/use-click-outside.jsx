import { useEffect, useRef } from 'react'

/**
 * Hook để detect click bên ngoài element và gọi callback
 * @param {Function} callback - Hàm được gọi khi click outside
 * @param {boolean} enabled - Bật/tắt hook (mặc định: true)
 * @returns {React.RefObject} - Ref để gắn vào element cần theo dõi
 * 
 * @example
 * const ref = useClickOutside(() => setIsOpen(false))
 * <div ref={ref}>Content</div>
 * 
 * // Với enabled flag
 * const ref = useClickOutside(() => setIsOpen(false), isOpen)
 */
export function useClickOutside(callback, enabled = true) {
  const ref = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event) => {
      // Kiểm tra nếu click bên ngoài element
      if (ref.current && !ref.current.contains(event.target)) {
        callback(event)
      }
    }

    // Sử dụng mousedown thay vì click để tránh conflict với click events bên trong
    document.addEventListener('mousedown', handleClickOutside)
    // Cũng handle touch events cho mobile
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [callback, enabled])

  return ref
}

export default useClickOutside

