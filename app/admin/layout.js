'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
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
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#050510' }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-[#00F0FF] animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-[#00F0FF]">Loading Session...</h3>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    // Tambahkan flex dan flex-col agar footer selalu menempel di bawah
    <div className="relative min-h-screen flex flex-col" style={{ backgroundColor: '#050510' }}>

      {/* flex-grow akan mendorong footer ke bawah jika konten kosong */}
      <main className="w-full flex-grow">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-6 mt-auto border-t border-white/5">
        {/* pb-20 pada mobile mencegah teks tertutup oleh bottom navigation bar */}
        <div className="text-center px-4 pb-20 md:pb-0">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            &copy; 2026 Luksuri Reka Digital Solutions. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  )
}