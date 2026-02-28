// components/Dashboard.js
'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, Download, TrendingUp, Calendar, Clock, RefreshCw, DollarSign, Activity, BarChart3, Users, CheckCircle, Plus, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalInvoices: 0, totalReceipts: 0, totalRevenue: 0,
    thisMonthDocs: 0, pendingInvoices: 0, paidInvoices: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadDashboardData() }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices').select('*').order('created_at', { ascending: false })
      if (invoiceError) throw invoiceError

      const { data: receipts, error: receiptError } = await supabase
        .from('receipts').select('*').order('created_at', { ascending: false })
      if (receiptError) throw receiptError

      const totalInvoices = invoices?.length || 0
      const totalReceipts = receipts?.length || 0
      const totalRevenue = receipts?.reduce((s, r) => s + (r.amount_received || 0), 0) || 0
      const cm = new Date().getMonth(), cy = new Date().getFullYear()

      const thisMonthDocs =
        ((invoices?.filter(i => { const d = new Date(i.created_at); return d.getMonth() === cm && d.getFullYear() === cy }).length) || 0) +
        ((receipts?.filter(r => { const d = new Date(r.created_at); return d.getMonth() === cm && d.getFullYear() === cy }).length) || 0)

      const pendingInvoices = invoices?.filter(i => i.status === 'issued').length || 0
      const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0

      setStats({ totalInvoices, totalReceipts, totalRevenue, thisMonthDocs, pendingInvoices, paidInvoices })

      const allActivity = [
        ...(invoices || []).slice(0, 3).map(inv => ({
          type: 'invoice', title: `Invoice ${inv.invoice_number}`,
          subtitle: `Klien: ${inv.client_name}`, amount: inv.total_amount,
          time: inv.created_at, status: inv.status
        })),
        ...(receipts || []).slice(0, 3).map(rec => ({
          type: 'receipt', title: `Kwitansi ${rec.receipt_number}`,
          subtitle: `Pembayar: ${rec.payer_name}`, amount: rec.amount_received,
          time: rec.created_at, status: 'paid'
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)

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
    setTimeout(() => setRefreshing(false), 500)
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount)

  const formatTimeAgo = (dateString) => {
    const diffH = Math.floor((new Date() - new Date(dateString)) / 3600000)
    if (diffH < 1) return `${Math.floor((new Date() - new Date(dateString)) / 60000)} menit yang lalu`
    if (diffH < 24) return `${diffH} jam yang lalu`
    return `${Math.floor(diffH / 24)} hari yang lalu`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="neon-spinner mx-auto" />
          <p className="font-semibold text-white">Memuat Dashboard</p>
          <p className="text-sm" style={{ color: 'rgba(0,240,255,0.5)' }}>Menganalisis data bisnis Anda...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Invoice', value: stats.totalInvoices,
      sub: <><span className="badge badge-issued mr-1">{stats.pendingInvoices} pending</span><span className="badge badge-paid">{stats.paidInvoices} lunas</span></>,
      Icon: FileText, color: '#00F0FF'
    },
    {
      label: 'Total Kwitansi', value: stats.totalReceipts,
      sub: 'Semua pembayaran tercatat',
      Icon: Receipt, color: '#00FF88'
    },
    {
      label: 'Total Pendapatan', value: stats.totalRevenue > 0 ? formatCurrency(stats.totalRevenue) : 'Rp 0',
      sub: 'Dari kwitansi tercatat',
      Icon: DollarSign, color: '#7c3aed', large: true
    },
    {
      label: 'Bulan Ini', value: stats.thisMonthDocs,
      sub: 'Dokumen baru',
      Icon: Calendar, color: '#FFBE0B'
    },
    {
      label: 'Rata-rata/Bulan',
      value: Math.round((stats.totalInvoices + stats.totalReceipts) / Math.max(1, new Date().getMonth() + 1)),
      sub: 'Produktivitas bulanan',
      Icon: Activity, color: '#00F0FF'
    },
    {
      label: 'Conversion Rate',
      value: `${stats.totalInvoices > 0 ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}%`,
      sub: 'Invoice yang dibayar',
      Icon: TrendingUp, color: '#00FF88'
    },
  ]

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="glass-card relative overflow-hidden p-5 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #00F0FF 0%, transparent 70%)' }} />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 sm:p-3 rounded-2xl flex-shrink-0" style={{ background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.25)' }}>
              <BarChart3 className="w-5 h-5 sm:w-8 sm:h-8" style={{ color: '#00F0FF' }} />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-white">Business Dashboard</h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'rgba(0,240,255,0.6)' }}>
                Analisis performa bisnis real-time
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`neon-button shrink-0 text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-3 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3">
        {statCards.map(({ label, value, sub, Icon, color, large }, idx) => (
          <div key={idx} className="glass-card p-4 sm:p-7 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-15"
              style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
            <div className="relative flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1.5"
                  style={{ color: `${color}99` }}>{label}</p>
                <p className={`font-bold text-white mb-2 ${large ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>{value}</p>
                {typeof sub === 'string'
                  ? <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                  : <div className="flex flex-wrap gap-1">{sub}</div>
                }
              </div>
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl ml-2 sm:ml-4 flex-shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="w-5 h-5 sm:w-8 sm:h-8" style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.25)' }}>
              <Activity className="w-5 h-5" style={{ color: '#00F0FF' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Latest business transactions and updates</p>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-8">
          {recentActivity.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-5 rounded-3xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <FileText className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.2)' }} />
              </div>
              <h4 className="font-semibold text-white mb-2">No Activity Yet</h4>
              <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Start creating invoices or receipts to see activity
              </p>
              <div className="flex justify-center gap-3">
                <button className="neon-button-solid text-sm">Create Invoice</button>
                <button className="neon-button text-sm">Create Receipt</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, idx) => (
                <div key={idx} className="p-3 sm:p-5 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl flex-shrink-0"
                      style={{
                        background: a.type === 'invoice' ? 'rgba(0,240,255,0.10)' : 'rgba(0,255,136,0.10)',
                        border: `1px solid ${a.type === 'invoice' ? 'rgba(0,240,255,0.25)' : 'rgba(0,255,136,0.25)'}`
                      }}>
                      {a.type === 'invoice'
                        ? <FileText className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00F0FF' }} />
                        : <Receipt className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00FF88' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate text-sm">{a.title}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{a.subtitle}</p>
                    </div>
                    <span className={`badge flex-shrink-0 ${a.status === 'paid' ? 'badge-paid' : a.status === 'issued' ? 'badge-issued' : 'badge-draft'}`}>
                      {a.status === 'paid' ? 'Lunas' : a.status === 'issued' ? 'Terbit' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pl-11">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{formatTimeAgo(a.time)}</p>
                    <p className="font-bold text-white font-mono-luksuri text-xs sm:text-sm">{formatCurrency(a.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card relative overflow-hidden p-4 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.30)' }}>
              <Zap className="w-5 h-5" style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <h3 className="font-bold text-white">Quick Actions</h3>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Streamline your workflow with one-click actions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { label: 'Create New Invoice', sub: 'Generate professional invoice for client', Icon: Plus, color: '#00F0FF' },
              { label: 'Generate Receipt', sub: 'Record incoming payment transaction', Icon: Receipt, color: '#00FF88' }
            ].map(({ label, sub, Icon, color }, i) => (
              <button key={i} className="flex items-center p-5 space-x-4 rounded-2xl text-left group transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${color}40`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                <div className="p-3 rounded-2xl transition-all"
                  style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div>
                  <p className="font-bold text-white">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}