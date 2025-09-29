// app/page.js (Clean Premium UI/UX Version)
'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, PenTool, Plus, Download, BarChart3, TrendingUp, Zap, Shield } from 'lucide-react'
import InvoiceForm from '../../components/InvoiceForm'
import ReceiptForm from '../../components/ReceiptForm'
import DocumentList from '../../components/DocumentList'
import Dashboard from '../../components/Dashboard'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh() // Refresh to trigger layout changes
  }

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      description: 'Overview & Analytics',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'invoice', 
      label: 'Buat Invoice', 
      icon: Plus, 
      description: 'Create New Invoice',
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'receipt', 
      label: 'Buat Kwitansi', 
      icon: Receipt, 
      description: 'Generate Receipt',
      color: 'from-amber-500 to-amber-600'
    },
    { 
      id: 'documents', 
      label: 'Kelola Dokumen', 
      icon: Download, 
      description: 'Manage All Documents',
      color: 'from-purple-500 to-purple-600'
    },
  ]

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate professional documents in seconds',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security for your data',
      gradient: 'from-green-400 to-blue-500'
    },
    {
      icon: PenTool,
      title: 'Digital Signature',
      description: 'Legally binding electronic signatures',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Business Growth',
      description: 'Streamline your invoice workflow',
      gradient: 'from-blue-400 to-indigo-500'
    }
  ]

  return (
    <div className={`space-y-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Hero Header Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-3xl"></div>
        <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
        <div className="absolute top-0 right-0 rounded-full w-96 h-96 bg-gradient-to-br from-white/10 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 rounded-full w-80 h-80 bg-gradient-to-tr from-yellow-400/20 to-transparent blur-3xl"></div>
        
        {/* Content */}
        <div className="relative p-12">
          {/* Tombol Logout di pojok kanan atas */}
          <button 
            onClick={handleLogout}
            className="absolute top-6 right-6 flex items-center px-4 py-2 space-x-2 text-sm font-semibold text-white transition-all duration-200 border bg-white/15 backdrop-blur-sm rounded-xl border-white/20 hover:bg-white/25"
          >
            <span>Logout</span>
          </button>
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Title */}
            <div className="mb-8">
              <div className="inline-flex items-center mb-6 space-x-3">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl">
                  <PenTool className="w-10 h-10 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
                    Digital Signature
                    <span className="block mt-1 text-2xl font-medium text-blue-100 md:text-3xl">
                      Management System
                    </span>
                  </h1>
                </div>
              </div>
              
              <p className="mb-8 text-xl leading-relaxed text-blue-100 md:text-2xl">
                Kelola Invoice & Kwitansi Digital dengan Teknologi 
                <span className="font-semibold text-white"> Tanda Tangan Elektronik</span>
              </p>
            </div>

            {/* Company Badge */}
            <div className="inline-flex items-center px-6 py-3 space-x-3 border bg-white/15 backdrop-blur-sm rounded-2xl border-white/20">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white">
                PT LUKSURI REKA DIGITAL SOLUTIONS
              </span>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-12 md:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="p-4 text-center transition-all duration-300 border bg-white/10 backdrop-blur-sm rounded-2xl border-white/20 hover:bg-white/20">
                    <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="mb-1 text-sm font-bold text-white">{feature.title}</h3>
                    <p className="text-xs text-blue-100">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Navigation Tabs */}
      <div className="p-2 border shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl border-white/30">
        <nav className="flex flex-col gap-3 md:flex-row">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex-1 flex items-center justify-center md:justify-start space-x-3 p-6 rounded-2xl font-semibold transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-xl scale-105`
                    : 'text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-gray-600 hover:to-gray-700 hover:scale-102'
                }`}
                style={{
                  transitionDelay: `${index * 50}ms`
                }}
              >
                {/* Background Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${tab.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isActive ? 'opacity-100' : ''}`}></div>
                
                {/* Content */}
                <div className="relative flex items-center space-x-3">
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 group-hover:bg-white/20'
                  }`}>
                    <Icon className={`w-6 h-6 transition-colors duration-300 ${
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-600 group-hover:text-white'
                    }`} />
                  </div>
                  <div className="hidden text-left md:block">
                    <div className="text-lg font-bold">{tab.label}</div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isActive 
                        ? 'text-white/80' 
                        : 'text-gray-500 group-hover:text-white/80'
                    }`}>
                      {tab.description}
                    </div>
                  </div>
                  <div className="md:hidden">
                    <div className="text-sm font-bold">{tab.label}</div>
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute w-8 h-1 transform -translate-x-1/2 bg-white rounded-full -bottom-1 left-1/2"></div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area with Premium Styling */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 min-h-[700px] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="#3b82f6" fill-opacity="0.1"><polygon points="50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40"/></g></svg>')}")`
            }}
          ></div>
        </div>
        
        {/* Content */}
        <div className="relative p-8 md:p-12">
          <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center mb-8 space-x-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-gray-600">Monitor your business document activities</p>
                  </div>
                </div>
                <Dashboard />
              </div>
            )}
            
            {activeTab === 'invoice' && (
              <div className="space-y-6">
                <div className="flex items-center mb-8 space-x-4">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Create New Invoice</h2>
                    <p className="text-gray-600">Generate professional invoices with digital signature</p>
                  </div>
                </div>
                <InvoiceForm />
              </div>
            )}
            
            {activeTab === 'receipt' && (
              <div className="space-y-6">
                <div className="flex items-center mb-8 space-x-4">
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl">
                    <Receipt className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Generate Receipt</h2>
                    <p className="text-gray-600">Create payment receipts with electronic validation</p>
                  </div>
                </div>
                <ReceiptForm />
              </div>
            )}
            
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center mb-8 space-x-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                    <Download className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Document Management</h2>
                    <p className="text-gray-600">Manage, download, and track all your documents</p>
                  </div>
                </div>
                <DocumentList />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}