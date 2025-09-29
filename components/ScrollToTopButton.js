// components/ScrollToTopButton.js
'use client'

import { useState, useEffect } from 'react'

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button 
      onClick={scrollToTop}
      className="fixed z-50 p-4 text-white transition-all duration-300 shadow-lg bottom-8 right-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl hover:shadow-xl hover:-translate-y-1 group opacity-90 hover:opacity-100"
      aria-label="Scroll to top"
    >
      <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  )
}