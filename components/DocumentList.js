// components/DocumentList.js
'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, Download, Search, Calendar, Filter, AlertCircle, TrendingUp, DollarSign } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateInvoicePDF, generateReceiptPDF } from '../utils/pdfGenerator'

export default function DocumentList() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [isDownloading, setIsDownloading] = useState(null)

  useEffect(() => { loadDocuments() }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, invoice_items(id, description, quantity, unit_price)')
        .order('created_at', { ascending: false })
      if (invoiceError) throw invoiceError

      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select('*, invoices(invoice_number, client_name)')
        .order('created_at', { ascending: false })
      if (receiptError) throw receiptError

      const allDocuments = [
        ...(invoices || []).map(inv => ({
          ...inv, type: 'invoice', title: `Invoice ${inv.invoice_number}`,
          client: inv.client_name, amount: inv.total_amount,
          date: inv.issue_date, status: inv.status || 'draft'
        })),
        ...(receipts || []).map(rec => ({
          ...rec, type: 'receipt', title: `Kwitansi ${rec.receipt_number}`,
          client: rec.payer_name, amount: rec.amount_received,
          date: rec.payment_date, status: 'paid'
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setDocuments(allDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
      alert(`Terjadi kesalahan saat memuat dokumen: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || doc.type === filterType
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus
    const matchesDate = !dateFilter || doc.date.includes(dateFilter)
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  const handleRegenerate = async (document) => {
    setIsDownloading(document.id)
    try {
      if (document.type === 'invoice') {
        if (!document.invoice_number || !document.client_name) throw new Error('Data invoice tidak lengkap')
        let invoiceItems = document.invoice_items || []
        if (invoiceItems.length === 0) invoiceItems = [{ description: 'Layanan Digital', quantity: 1, unit_price: document.total_amount || 0 }]
        await generateInvoicePDF({
          invoiceNumber: document.invoice_number, clientName: document.client_name,
          clientEmail: document.client_email || '', clientAddress: document.client_address || '',
          clientPhone: document.client_phone || '', clientTaxId: document.client_tax_id || '',
          issueDate: document.issue_date, dueDate: document.due_date,
          items: invoiceItems.map(i => ({ description: i.description || '', quantity: i.quantity || 1, unitPrice: i.unit_price || 0 })),
          subtotal: document.subtotal || 0, taxAmount: document.tax_amount || 0,
          discountAmount: document.discount_amount || 0, total: document.total_amount || 0,
          notes: document.notes || '', taxRate: 11, signature: document.signature_data || null,
          signatureType: document.signature_type || 'manual',
          signatureMetadata: {
            type: document.signature_type || 'manual', documentId: document.qr_document_id || null,
            validationUrl: document.qr_validation_url || null, signedBy: document.qr_signed_by || null,
            signerTitle: document.qr_signer_title || null, timestamp: document.qr_timestamp || null
          }
        })
      } else if (document.type === 'receipt') {
        if (!document.receipt_number || !document.payer_name) throw new Error('Data kwitansi tidak lengkap')
        let invoiceData = null
        if (document.invoice_id) {
          const { data, error } = await supabase.from('invoices').select('invoice_number, client_name').eq('id', document.invoice_id).single()
          if (!error && data) invoiceData = data
        }
        await generateReceiptPDF({
          receiptNumber: document.receipt_number, payerName: document.payer_name,
          payerAddress: document.payer_address || '', amountReceived: document.amount_received || 0,
          amountWords: document.amount_words || '', paymentMethod: document.payment_method || 'Transfer Bank',
          paymentDate: document.payment_date, description: document.description || '', invoiceData,
          signature: document.signature_data || null, signatureType: document.signature_type || 'manual',
          signatureMetadata: {
            type: document.signature_type || 'manual', documentId: document.qr_document_id || null,
            validationUrl: document.qr_validation_url || null, signedBy: document.qr_signed_by || null,
            signerTitle: document.qr_signer_title || null, timestamp: document.qr_timestamp || null
          }
        })
      }
      alert(`${document.type === 'invoice' ? 'Invoice' : 'Kwitansi'} berhasil diunduh!`)
    } catch (error) {
      console.error('Error regenerating document:', error)
      alert(`Terjadi kesalahan saat mengunduh dokumen: ${error.message || ''}`)
    } finally {
      setIsDownloading(null)
    }
  }

  const getBadgeClass = (status) => {
    switch (status) {
      case 'draft': return 'badge badge-draft'
      case 'issued': return 'badge badge-issued'
      case 'paid': return 'badge badge-paid'
      case 'overdue': return 'badge badge-overdue'
      default: return 'badge badge-draft'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'issued': return 'Terbit'
      case 'paid': return 'Lunas'
      case 'overdue': return 'Terlambat'
      default: return status || 'Draft'
    }
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Rp 0'
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return dateString }
  }

  const getTotalValue = () => filteredDocuments.reduce((sum, doc) => sum + (doc.amount || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="neon-spinner mx-auto" />
          <p className="font-semibold text-white">Memuat Dokumen</p>
          <p className="text-sm" style={{ color: 'rgba(0,240,255,0.5)' }}>Sedang mengambil data dari database...</p>
        </div>
      </div>
    )
  }

  const miniStats = [
    { label: 'Total Invoice', value: documents.filter(d => d.type === 'invoice').length, Icon: FileText, color: '#00F0FF' },
    { label: 'Total Kwitansi', value: documents.filter(d => d.type === 'receipt').length, Icon: Receipt, color: '#00FF88' },
    {
      label: 'Bulan Ini',
      value: documents.filter(d => {
        if (!d.date) return false
        try { const dd = new Date(d.date); const n = new Date(); return dd.getMonth() === n.getMonth() && dd.getFullYear() === n.getFullYear() } catch { return false }
      }).length,
      Icon: Calendar, color: '#FFBE0B'
    },
    { label: 'Ditampilkan', value: filteredDocuments.length, Icon: Filter, color: '#a78bfa' }
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
              <Download className="w-5 h-5 sm:w-8 sm:h-8" style={{ color: '#00F0FF' }} />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-white">Daftar Dokumen</h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'rgba(0,240,255,0.6)' }}>Kelola semua invoice dan kwitansi Anda</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Nilai</p>
            <p className="text-lg sm:text-2xl font-bold text-white font-mono-luksuri">{formatCurrency(getTotalValue())}</p>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        {miniStats.map(({ label, value, Icon, color }, idx) => (
          <div key={idx} className="glass-card p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-15"
              style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1" style={{ color: `${color}99` }}>{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                <Icon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 sm:p-7">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 sm:mb-5">Filter &amp; Pencarian</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>Cari Dokumen</label>
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'rgba(0,240,255,0.5)' }} />
              <input
                type="text" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neon-input pl-9 sm:pl-11 text-xs sm:text-sm"
                placeholder="Nomor atau nama klien..."
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>Jenis</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="neon-select text-xs sm:text-sm">
              <option value="all">Semua</option>
              <option value="invoice">Invoice</option>
              <option value="receipt">Kwitansi</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="neon-select text-xs sm:text-sm">
              <option value="all">Semua</option>
              <option value="draft">Draft</option>
              <option value="issued">Terbit</option>
              <option value="paid">Lunas</option>
              <option value="overdue">Terlambat</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>Bulan</label>
            <input type="month" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="neon-input text-xs sm:text-sm" />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-card overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-3xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <FileText className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Tidak Ada Dokumen</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>
              {documents.length === 0 ? 'Belum ada dokumen yang dibuat' : 'Tidak ada dokumen yang sesuai dengan filter'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-0">
            <table className="dark-table" style={{ minWidth: '640px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Dokumen</th>
                  <th style={{ minWidth: '130px' }}>Klien/Pembayar</th>
                  <th style={{ minWidth: '120px' }}>Jumlah</th>
                  <th style={{ minWidth: '100px' }}>Tanggal</th>
                  <th style={{ minWidth: '80px' }}>Status</th>
                  <th style={{ minWidth: '110px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={`${document.type}-${document.id}`}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl flex-shrink-0"
                          style={{
                            background: document.type === 'invoice' ? 'rgba(0,240,255,0.10)' : 'rgba(0,255,136,0.10)',
                            border: `1px solid ${document.type === 'invoice' ? 'rgba(0,240,255,0.25)' : 'rgba(0,255,136,0.25)'}`
                          }}>
                          {document.type === 'invoice'
                            ? <FileText className="w-4 h-4" style={{ color: '#00F0FF' }} />
                            : <Receipt className="w-4 h-4" style={{ color: '#00FF88' }} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{document.title}</p>
                          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {document.type === 'invoice' ? 'Invoice' : 'Kwitansi'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-white">{document.client || '-'}</p>
                    </td>
                    <td>
                      <p className="text-sm font-bold text-white font-mono-luksuri">{formatCurrency(document.amount)}</p>
                    </td>
                    <td>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{formatDate(document.date)}</p>
                    </td>
                    <td>
                      <span className={getBadgeClass(document.status)}>{getStatusText(document.status)}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleRegenerate(document)}
                        disabled={isDownloading === document.id}
                        className={isDownloading === document.id ? 'neon-button-ghost text-xs opacity-50 cursor-not-allowed' : 'neon-button text-xs'}
                      >
                        {isDownloading === document.id ? (
                          <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Processing...</span></>
                        ) : (
                          <><Download className="w-3 h-3" /><span>Download</span></>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dev debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.20)' }}>
          <div className="flex items-start space-x-3">
            <AlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5" style={{ color: '#FFBE0B' }} />
            <div className="text-sm" style={{ color: 'rgba(251,191,36,0.8)' }}>
              <p className="font-bold mb-1" style={{ color: '#FFBE0B' }}>Debug Info</p>
              <p>Total: <strong>{documents.length}</strong> | Invoices: <strong>{documents.filter(d => d.type === 'invoice').length}</strong> | Receipts: <strong>{documents.filter(d => d.type === 'receipt').length}</strong> | Filtered: <strong>{filteredDocuments.length}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}