import { useState, useEffect } from 'react'

/**
 * Hook để quản lý state với localStorage
 * Tự động sync với localStorage và xử lý SSR-safe
 * 
 * @param {string} key - Key trong localStorage
 * @param {any} initialValue - Giá trị ban đầu nếu chưa có trong localStorage
 * @returns {[any, Function]} - [storedValue, setValue]
 * 
 * @example
 * const [user, setUser] = useLocalStorage('user', null)
 * 
 * // Update value
 * setUser({ name: 'John', email: 'john@example.com' })
 * 
 * // Remove value
 * setUser(null)
 */
export function useLocalStorage(key, initialValue) {
  // State để lưu giá trị
  const [storedValue, setStoredValue] = useState(() => {
    // SSR-safe: kiểm tra window có tồn tại không
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      // Parse JSON nếu có, nếu không return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Hàm để update value và localStorage
  const setValue = (value) => {
    try {
      // Cho phép value là function để có functional update pattern
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Lưu vào state
      setStoredValue(valueToStore)
      
      // Lưu vào localStorage (nếu có window)
      if (typeof window !== 'undefined') {
        if (valueToStore === null || valueToStore === undefined) {
          // Xóa key nếu value là null hoặc undefined
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Sync với localStorage khi key thay đổi từ bên ngoài (optional)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error)
        }
      } else if (e.key === key && e.newValue === null) {
        // Nếu key bị xóa từ tab khác
        setStoredValue(initialValue)
      }
    }

    // Listen to storage events (khi localStorage thay đổi từ tab/window khác)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue]
}

export default useLocalStorage

