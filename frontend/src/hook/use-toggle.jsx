import { useState, useCallback } from 'react'

/**
 * Hook để quản lý boolean state với các actions tiện lợi
 * 
 * @param {boolean} initialValue - Giá trị ban đầu (mặc định: false)
 * @returns {[boolean, Object]} - [value, { toggle, setTrue, setFalse, setValue }]
 * 
 * @example
 * const [isOpen, { toggle, setTrue, setFalse }] = useToggle()
 * 
 * // Sử dụng
 * <button onClick={toggle}>Toggle</button>
 * <button onClick={setTrue}>Open</button>
 * <button onClick={setFalse}>Close</button>
 * 
 * // Với initial value
 * const [showMenu, { toggle }] = useToggle(true)
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  const setTrue = useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = useCallback(() => {
    setValue(false)
  }, [])

  return [
    value,
    {
      toggle,
      setTrue,
      setFalse,
      setValue
    }
  ]
}

export default useToggle

