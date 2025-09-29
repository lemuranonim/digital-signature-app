// components/Dashboard.js
'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, Download, TrendingUp, Calendar, Clock, RefreshCw, DollarSign, Activity, BarChart3, Users, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalReceipts: 0,
    totalRevenue: 0,
    thisMonthDocs: 0,
    pendingInvoices: 0,
    paidInvoices: 0
  })
  
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load invoices statistics
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoiceError) throw invoiceError

      // Load receipts statistics
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false })

      if (receiptError) throw receiptError

      // Calculate statistics
      const totalInvoices = invoices?.length || 0
      const totalReceipts = receipts?.length || 0
      
      // Total revenue dari receipts (yang sudah dibayar)
      const totalRevenue = receipts?.reduce((sum, receipt) => sum + (receipt.amount_received || 0), 0) || 0
      
      // Dokumen bulan ini
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const thisMonthInvoices = invoices?.filter(inv => {
        const invDate = new Date(inv.created_at)
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear
      }).length || 0
      
      const thisMonthReceipts = receipts?.filter(rec => {
        const recDate = new Date(rec.created_at)
        return recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear
      }).length || 0
      
      const thisMonthDocs = thisMonthInvoices + thisMonthReceipts
      
      // Invoice status counts
      const pendingInvoices = invoices?.filter(inv => inv.status === 'issued').length || 0
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0

      setStats({
        totalInvoices,
        totalReceipts,
        totalRevenue,
        thisMonthDocs,
        pendingInvoices,
        paidInvoices
      })

      // Recent activity (gabungkan invoice dan receipt terbaru)
      const recentInvoices = (invoices || []).slice(0, 3).map(inv => ({
        type: 'invoice',
        title: `Invoice ${inv.invoice_number} dibuat`,
        subtitle: `Klien: ${inv.client_name}`,
        amount: inv.total_amount,
        time: inv.created_at,
        status: inv.status
      }))

      const recentReceiptsData = (receipts || []).slice(0, 3).map(rec => ({
        type: 'receipt',
        title: `Kwitansi ${rec.receipt_number} dibuat`,
        subtitle: `Pembayar: ${rec.payer_name}`,
        amount: rec.amount_received,
        time: rec.created_at,
        status: 'paid'
      }))

      // Gabung dan sort berdasarkan waktu
      const allActivity = [...recentInvoices, ...recentReceiptsData]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5)

      setRecentActivity(allActivity)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setTimeout(() => setRefreshing(false), 500) // Add slight delay for UX
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return `${diffInMinutes} menit yang lalu`
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} hari yang lalu`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-600 animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Memuat Dashboard</h3>
          <p className="text-gray-500">Menganalisis data bisnis Anda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Premium Styling */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 rounded-3xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4 space-x-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Business Dashboard</h2>
                  <p className="text-blue-100">Analisis performa bisnis Anda secara real-time</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl border border-white/30 transition-all duration-200 hover:bg-white/30 ${
                refreshing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-semibold">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="relative p-8 overflow-hidden transition-all duration-300 border bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50 rounded-3xl hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="mb-2 text-sm font-bold tracking-wider text-blue-600 uppercase">Total Invoice</p>
              <p className="mb-1 text-4xl font-bold text-blue-900">{stats.totalInvoices}</p>
              <div className="flex items-center space-x-4 text-xs">
                <span className="px-2 py-1 font-semibold text-blue-800 rounded-full bg-blue-200/60">
                  {stats.pendingInvoices} pending
                </span>
                <span className="px-2 py-1 font-semibold text-green-800 rounded-full bg-green-200/60">
                  {stats.paidInvoices} lunas
                </span>
              </div>
            </div>
            <div className="p-4 bg-blue-500/20 rounded-2xl">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="relative p-8 overflow-hidden transition-all duration-300 border bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200/50 rounded-3xl hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="mb-2 text-sm font-bold tracking-wider uppercase text-amber-600">Total Kwitansi</p>
              <p className="mb-1 text-4xl font-bold text-amber-900">{stats.totalReceipts}</p>
              <p className="text-xs font-medium text-amber-700">Semua pembayaran tercatat</p>
            </div>
            <div className="p-4 bg-amber-500/20 rounded-2xl">
              <Receipt className="w-10 h-10 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="relative p-8 overflow-hidden transition-all duration-300 border bg-gradient-to-br from-green-50 to-green-100 border-green-200/50 rounded-3xl hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-green-400/20 to-transparent blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="mb-2 text-sm font-bold tracking-wider text-green-600 uppercase">Total Pendapatan</p>
              <p className="mb-1 text-3xl font-bold text-green-900">
                {stats.totalRevenue > 0 ? formatCurrency(stats.totalRevenue) : 'Rp 0'}
              </p>
              <p className="text-xs font-medium text-green-700">Dari kwitansi tercatat</p>
            </div>
            <div className="p-4 bg-green-500/20 rounded-2xl">
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>

        <div className="relative p-8 overflow-hidden transition-all duration-300 border bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50 rounded-3xl hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="mb-2 text-sm font-bold tracking-wider text-purple-600 uppercase">Bulan Ini</p>
              <p className="mb-1 text-4xl font-bold text-purple-900">{stats.thisMonthDocs}</p>
              <p className="text-xs font-medium text-purple-700">Dokumen baru</p>
            </div>
            <div className="p-4 bg-purple-500/20 rounded-2xl">
              <Calendar className="w-10 h-10 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="relative p-8 overflow-hidden transition-all duration-300 border bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200/50 rounded-3xl hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400/20 to-transparent blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="mb-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">Rata-rata/Bulan</p>
              <p className="mb-1 text-4xl font-bold text-indigo-900">
                {Math.round((stats.totalInvoices + stats.totalReceipts) / Math.max(1, new Date().getMonth() + 1))}
              </p>
              <p className="text-xs font-medium text-indigo-700">Produktivitas bulanan</p>
            </div>
            <div className="p-4 bg-indigo-500/20 rounded-2xl">
              <Activity className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="relative p-8 overflow-hidden transition-all duration-300 border bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200/50 rounded-3xl hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-rose-400/20 to-transparent blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="mb-2 text-sm font-bold tracking-wider uppercase text-rose-600">Conversion Rate</p>
              <p className="mb-1 text-4xl font-bold text-rose-900">
                {stats.totalInvoices > 0 ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}%
              </p>
              <p className="text-xs font-medium text-rose-700">Invoice yang dibayar</p>
            </div>
            <div className="p-4 bg-rose-500/20 rounded-2xl">
              <TrendingUp className="w-10 h-10 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity with Premium Design */}
      <div className="overflow-hidden border shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              <p className="text-gray-600">Latest business transactions and updates</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {recentActivity.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-600">No Activity Yet</h4>
              <p className="mb-6 text-gray-500">Start creating invoices or receipts to see activity</p>
              <div className="flex justify-center space-x-4">
                <button className="px-6 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl hover:shadow-lg">
                  Create Invoice
                </button>
                <button className="px-6 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl hover:shadow-lg">
                  Create Receipt
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center p-6 space-x-4 transition-all duration-200 border border-gray-100 bg-gradient-to-r from-gray-50/80 to-white rounded-2xl hover:shadow-lg">
                  <div className={`p-3 rounded-2xl ${
                    activity.type === 'invoice' 
                      ? 'bg-blue-500/10 text-blue-600' 
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {activity.type === 'invoice' ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <Receipt className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-gray-900 truncate">{activity.title}</p>
                    <p className="text-gray-600 truncate">{activity.subtitle}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(activity.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTimeAgo(activity.time)}
                    </p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-full ${
                      activity.status === 'paid' 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-300' 
                        : activity.status === 'issued'
                        ? 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border border-blue-300'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                    }`}>
                      {activity.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {activity.status === 'paid' ? 'Lunas' : 
                       activity.status === 'issued' ? 'Terbit' : 
                       'Draft'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Premium Quick Actions */}
      <div className="overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-3xl">
        <div className="relative p-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center mb-6 space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                <p className="text-blue-100">Streamline your workflow with one-click actions</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button className="flex items-center p-6 space-x-4 transition-all duration-300 border group bg-white/15 backdrop-blur-sm border-white/20 rounded-2xl hover:bg-white/25 hover:scale-105">
                <div className="p-3 transition-colors duration-300 bg-blue-500/30 rounded-2xl group-hover:bg-blue-500/40">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-white">Create New Invoice</p>
                  <p className="text-blue-100">Generate professional invoice for client</p>
                </div>
              </button>
              
              <button className="flex items-center p-6 space-x-4 transition-all duration-300 border group bg-white/15 backdrop-blur-sm border-white/20 rounded-2xl hover:bg-white/25 hover:scale-105">
                <div className="p-3 transition-colors duration-300 bg-amber-500/30 rounded-2xl group-hover:bg-amber-500/40">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-white">Generate Receipt</p>
                  <p className="text-blue-100">Record incoming payment transaction</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}