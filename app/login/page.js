// app/login/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { LogIn, Shield, Lock, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.replace('/admin')
    }
    check()
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/admin'); router.refresh()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen" style={{ backgroundColor: '#050510' }}>
      {/* Background glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #00F0FF 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      </div>

      {/* Back button */}
      <button onClick={() => router.push('/')}
        className="absolute top-6 left-6 neon-button text-sm z-10">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md m-4">
        <div className="glass-card-cyan p-8 space-y-7">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-2xl blur-lg opacity-40"
                style={{ background: 'rgba(0,240,255,0.3)' }} />
              <Image src="/logo.png" alt="Logo" width={64} height={64}
                className="relative mx-auto rounded-2xl object-contain" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white">Admin Portal</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(0,240,255,0.6)' }}>
                Luksuri Sign — Secure Management System
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>
                Email Address
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required className="neon-input" placeholder="admin@luksurireka.com" />
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>
                Password
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required className="neon-input" placeholder="••••••••" />
            </div>

            {error && (
              <div className="p-4 rounded-2xl text-sm" style={{ background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.25)', color: '#FF003C' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="neon-button-solid w-full py-4 font-bold text-lg">
              {loading
                ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Logging in...</span></>
                : <><LogIn className="w-5 h-5" /><span>Login</span></>}
            </button>
          </form>

          {/* Security notice */}
          <div className="flex items-center space-x-2 pt-2" style={{ borderTop: '1px solid rgba(0,240,255,0.12)' }}>
            <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0,240,255,0.4)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Protected by Luksuri Core Cryptography — Authorized access only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}