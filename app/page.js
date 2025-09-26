// app/page.js
'use client'

import { useState } from 'react'
import { FileText, Receipt, Signature, Plus, Download } from 'lucide-react'
import InvoiceForm from '../components/InvoiceForm'
import ReceiptForm from '../components/ReceiptForm'
import DocumentList from '../components/DocumentList'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FileText },
    { id: 'invoice', label: 'Buat Invoice', icon: Plus },
    { id: 'receipt', label: 'Buat Kwitansi', icon: Receipt },
    { id: 'documents', label: 'Dokumen', icon: Download },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="premium-card p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Digital Signature System
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Kelola Invoice & Kwitansi Digital dengan Tanda Tangan Elektronik
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Signature className="w-6 h-6 text-primary-600" />
            <span className="text-lg font-semibold luxury-gradient bg-clip-text text-transparent">
              PT LUKSURI REKA DIGITAL SOLUTIONS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="premium-card p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'luxury-gradient text-white shadow-lg'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="premium-card p-8 min-h-[600px]">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'invoice' && <InvoiceForm />}
        {activeTab === 'receipt' && <ReceiptForm />}
        {activeTab === 'documents' && <DocumentList />}
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Total Invoice</p>
              <p className="text-2xl font-bold text-primary-900">24</p>
            </div>
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-luxury-50 to-luxury-100 p-6 rounded-xl border border-luxury-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-luxury-600 text-sm font-medium">Total Kwitansi</p>
              <p className="text-2xl font-bold text-luxury-900">18</p>
            </div>
            <Receipt className="w-8 h-8 text-luxury-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Pendapatan</p>
              <p className="text-2xl font-bold text-green-900">Rp 125,500,000</p>
            </div>
            <Download className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="w-5 h-5 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900">Invoice #INV-2024-001 dibuat</p>
              <p className="text-sm text-gray-500">2 jam yang lalu</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Receipt className="w-5 h-5 text-luxury-600" />
            <div>
              <p className="font-medium text-gray-900">Kwitansi #KWT-2024-001 ditandatangani</p>
              <p className="text-sm text-gray-500">5 jam yang lalu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}