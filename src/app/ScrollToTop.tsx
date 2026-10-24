import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Move focus and scroll to the top of a new page so keyboard and screen-reader users start at the content.
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])
  return null
}
