'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ScrollToTopButton from '../../components/ScrollToTopButton'

export default function AdminLayout({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login')
    }
  }, [session, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-600 animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Loading Session...</h3>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60"></div>
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#3b82f6" fill-opacity="0.03"><circle cx="30" cy="30" r="2"/></g></g></svg>')}")`
          }}></div>
        </div>
      </div>

      {/* Premium Navigation */}
      <nav className="sticky top-0 z-50 border-b shadow-lg bg-white/80 backdrop-blur-xl border-white/20">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo PT LUKSURI REKA DIGITAL SOLUTIONS"
                  width={48}
                  height={48}
                  className="rounded-xl"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 bg-clip-text">
                  LUKSURI REKA
                </h1>
                <p className="text-xs text-gray-600 mt-0.5 font-semibold tracking-wide uppercase">
                  Digital Solutions
                </p>
              </div>
            </div>

            {/* Center Navigation (Desktop) */}
            <div className="items-center hidden space-x-8 md:flex">
              <div className="flex items-center space-x-6">
                <span className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-full bg-white/60 backdrop-blur-sm border-white/40">
                  Digital Signature System
                </span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="items-center hidden px-4 py-2 space-x-2 border rounded-full sm:flex bg-green-100/80 backdrop-blur-sm border-green-200/60">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-green-800">System Active</span>
              </div>
              
              {/* Mobile Menu Button */}
              <button className="p-2 transition-all duration-200 border md:hidden rounded-xl bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content with Enhanced Spacing */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="space-y-8">
          {children}
        </div>
      </main>
      
      {/* Premium Footer */}
      <footer className="mt-20 border-t bg-white/80 backdrop-blur-xl border-white/20">
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">PT LUKSURI REKA</h3>
                  <p className="text-xs font-medium text-gray-600">DIGITAL SOLUTIONS</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                Solusi digital terdepan untuk manajemen dokumen bisnis dengan teknologi tanda tangan elektronik.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">Kontak</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Kedungwilut, Tulungagung, Jawa Timur</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span>+62 821 4370 6440</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span>luksurireka@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">Features</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Digital Invoice Creation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Electronic Receipt Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Digital Signature Technology</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Premium PDF Generation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="pt-8 mt-8 border-t border-gray-200/60">
            <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
              <div className="text-sm text-gray-500">
                © 2025 PT LUKSURI REKA DIGITAL SOLUTIONS. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <a href="#" className="transition-colors duration-200 hover:text-blue-600">Privacy Policy</a>
                <a href="#" className="transition-colors duration-200 hover:text-blue-600">Terms of Service</a>
                <a href="#" className="transition-colors duration-200 hover:text-blue-600">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Elements for Premium Feel */}
      <div className="fixed w-32 h-32 rounded-full top-1/4 left-4 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl -z-10 animate-pulse"></div>
      <div 
        className="fixed w-40 h-40 rounded-full bottom-1/4 right-4 bg-gradient-to-br from-purple-400/20 to-blue-400/20 blur-3xl -z-10 animate-pulse"
        style={{ animationDelay: '2s' }}
      ></div>
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  )
}