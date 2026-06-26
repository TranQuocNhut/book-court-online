import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname, location.search, location.hash])

  return null
}

export default ScrollToTop


