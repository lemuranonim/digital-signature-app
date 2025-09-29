// app/login/page.js
'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { LogIn, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      // Redirect to dashboard on successful login
      router.push('/')
      router.refresh() // Refresh to trigger layout changes

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60">
      <div className="w-full max-w-md p-8 m-4 space-y-8 bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-3xl">
        
        {/* Header */}
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600">Digital Signature Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="admin@example.com"
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-center text-gray-500">
          © {new Date().getFullYear()} PT LUKSURI REKA DIGITAL SOLUTIONS
        </p>
      </div>
    </div>
  )
}