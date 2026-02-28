// app/admin/page.js
'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, PenTool, Plus, Download, BarChart3, QrCode, LogOut } from 'lucide-react'
import InvoiceForm from '../../components/InvoiceForm'
import ReceiptForm from '../../components/ReceiptForm'
import SignatureForm from '../../components/SignatureForm'
import DocumentList from '../../components/DocumentList'
import Dashboard from '../../components/Dashboard'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => { setIsLoaded(true) }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', Icon: BarChart3, color: '#00F0FF' },
    { id: 'invoice', label: 'Buat Invoice', shortLabel: 'Invoice', Icon: Plus, color: '#00F0FF' },
    { id: 'receipt', label: 'Buat Kwitansi', shortLabel: 'Kwitansi', Icon: Receipt, color: '#00FF88' },
    { id: 'signature', label: 'TTD Dokumen', shortLabel: 'TTD', Icon: QrCode, color: '#FF003C' },
    { id: 'documents', label: 'Kelola Dokumen', shortLabel: 'Dokumen', Icon: Download, color: '#a78bfa' },
  ]

  const activeTabConfig = tabs.find(t => t.id === activeTab)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050510' }}>
      <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* ── Sticky Nav ── */}
        <nav className="nav-dark sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-20 gap-2">

              {/* Logo */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl blur-sm opacity-40"
                    style={{ background: 'rgba(0,240,255,0.3)' }} />
                  <Image src="/logo.png" alt="Logo" width={36} height={36}
                    className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-xl object-contain" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-base sm:text-lg font-extrabold gradient-text-cyan">LUKSURI SIGN</h1>
                  <p className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: 'rgba(0,240,255,0.45)' }}>Admin Dashboard</p>
                </div>
              </div>

              {/* Desktop tab nav */}
              <div className="hidden md:flex items-center space-x-1 p-1.5 rounded-2xl flex-1 max-w-2xl mx-auto"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {tabs.map(({ id, label, Icon, color }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl font-semibold text-xs flex-1 justify-center transition-all"
                    style={activeTab === id
                      ? { background: `${color}15`, color, border: `1px solid ${color}35` }
                      : { color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden lg:inline truncate">{label}</span>
                  </button>
                ))}
              </div>

              {/* Logout */}
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all flex-shrink-0"
                style={{ borderColor: 'rgba(255,0,60,0.35)', color: 'rgba(255,100,100,0.8)', background: 'rgba(255,0,60,0.06)', border: '1px solid rgba(255,0,60,0.25)' }}>
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* ── Mobile Bottom Tab Bar ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
          style={{ background: 'rgba(5,5,16,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {tabs.map(({ id, shortLabel, Icon, color }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all"
              style={activeTab === id ? { color } : { color: 'rgba(255,255,255,0.4)' }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{shortLabel}</span>
            </button>
          ))}
        </div>

        {/* ── Page Content ── */}
        {/* Add bottom padding on mobile to avoid content going behind tab bar */}
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 md:pb-8">

          {/* Section header */}
          {activeTabConfig && (
            <div className="flex items-center space-x-3 sm:space-x-4 mb-5 sm:mb-8">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl"
                style={{ background: `${activeTabConfig.color}12`, border: `1px solid ${activeTabConfig.color}25` }}>
                <activeTabConfig.Icon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: activeTabConfig.color }} />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-white">{activeTabConfig.label}</h2>
              </div>
            </div>
          )}

          <div className={`transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'invoice' && <InvoiceForm />}
            {activeTab === 'receipt' && <ReceiptForm />}
            {activeTab === 'signature' && <SignatureForm />}
            {activeTab === 'documents' && <DocumentList />}
          </div>
        </div>
      </div>
    </div>
  )
}