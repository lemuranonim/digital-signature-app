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

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      // Load invoices with items
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (
            id,
            description,
            quantity,
            unit_price
          )
        `)
        .order('created_at', { ascending: false })

      if (invoiceError) {
        console.error('Invoice loading error:', invoiceError)
        throw invoiceError
      }

      // Load receipts with invoice reference
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select(`
          *,
          invoices (
            invoice_number,
            client_name
          )
        `)
        .order('created_at', { ascending: false })

      if (receiptError) {
        console.error('Receipt loading error:', receiptError)
        throw receiptError
      }

      // Combine and format documents
      const allDocuments = [
        ...(invoices || []).map(invoice => ({
          ...invoice,
          type: 'invoice',
          title: `Invoice ${invoice.invoice_number}`,
          client: invoice.client_name,
          amount: invoice.total_amount,
          date: invoice.issue_date,
          status: invoice.status || 'draft'
        })),
        ...(receipts || []).map(receipt => ({
          ...receipt,
          type: 'receipt',
          title: `Kwitansi ${receipt.receipt_number}`,
          client: receipt.payer_name,
          amount: receipt.amount_received,
          date: receipt.payment_date,
          status: 'paid'
        }))
      ]

      // Sort by creation date
      allDocuments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
      console.log('Regenerating document:', document)

      if (document.type === 'invoice') {
        // Validate required fields
        if (!document.invoice_number || !document.client_name) {
          throw new Error('Data invoice tidak lengkap')
        }

        // Ensure we have items, if not create a placeholder
        let invoiceItems = document.invoice_items || []
        if (invoiceItems.length === 0) {
          invoiceItems = [{
            description: 'Layanan Digital',
            quantity: 1,
            unit_price: document.total_amount || 0
          }]
        }

        // Prepare invoice data with proper field mapping
        const invoiceData = {
          invoiceNumber: document.invoice_number,
          clientName: document.client_name,
          clientEmail: document.client_email || '',
          clientAddress: document.client_address || '',
          clientPhone: document.client_phone || '',
          clientTaxId: document.client_tax_id || '',
          issueDate: document.issue_date,
          dueDate: document.due_date,
          items: invoiceItems.map(item => ({
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || 0
          })),
          subtotal: document.subtotal || 0,
          taxAmount: document.tax_amount || 0,
          discountAmount: document.discount_amount || 0,
          total: document.total_amount || 0,
          notes: document.notes || '',
          taxRate: 11,

          signature: document.signature_data || null,
          signatureType: document.signature_type || 'manual',
          signatureMetadata: {
            type: document.signature_type || 'manual',
            documentId: document.qr_document_id || null,
            validationUrl: document.qr_validation_url || null,
            signedBy: document.qr_signed_by || null,
            signerTitle: document.qr_signer_title || null,
            timestamp: document.qr_timestamp || null
          }
        }

        console.log('Invoice data prepared:', invoiceData)
        await generateInvoicePDF(invoiceData)

      } else if (document.type === 'receipt') {
        // Validate required fields
        if (!document.receipt_number || !document.payer_name) {
          throw new Error('Data kwitansi tidak lengkap')
        }

        // Get related invoice data if exists
        let invoiceData = null
        if (document.invoice_id) {
          const { data, error } = await supabase
            .from('invoices')
            .select('invoice_number, client_name')
            .eq('id', document.invoice_id)
            .single()
          
          if (!error && data) {
            invoiceData = data
          }
        }

        // Prepare receipt data with proper field mapping
        const receiptData = {
          receiptNumber: document.receipt_number,
          payerName: document.payer_name,
          payerAddress: document.payer_address || '',
          amountReceived: document.amount_received || 0,
          amountWords: document.amount_words || '',
          paymentMethod: document.payment_method || 'Transfer Bank',
          paymentDate: document.payment_date,
          description: document.description || '',
          invoiceData: invoiceData,

          signature: document.signature_data || null,
          signatureType: document.signature_type || 'manual',
          signatureMetadata: {
            type: document.signature_type || 'manual',
            documentId: document.qr_document_id || null,
            validationUrl: document.qr_validation_url || null,
            signedBy: document.qr_signed_by || null,
            signerTitle: document.qr_signer_title || null,
            timestamp: document.qr_timestamp || null
          }
        }

        console.log('Receipt data prepared:', receiptData)
        await generateReceiptPDF(receiptData)
      }

      // Show success message
      const successMsg = `${document.type === 'invoice' ? 'Invoice' : 'Kwitansi'} berhasil diunduh!`
      alert(successMsg)

    } catch (error) {
      console.error('Error regenerating document:', error)
      
      // Show detailed error message
      let errorMsg = 'Terjadi kesalahan saat mengunduh dokumen'
      if (error.message) {
        errorMsg += `: ${error.message}`
      }
      alert(errorMsg)
    } finally {
      setIsDownloading(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
      case 'issued': return 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-900 border-blue-300'
      case 'paid': return 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-900 border-green-300'
      case 'overdue': return 'bg-gradient-to-r from-red-100 to-rose-200 text-red-900 border-red-300'
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
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
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return dateString
    }
  }

  const getTotalValue = () => {
    return filteredDocuments.reduce((sum, doc) => sum + (doc.amount || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-600 animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Memuat Dokumen</h3>
          <p className="text-gray-500">Sedang mengambil data dari database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-3xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4 space-x-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Daftar Dokumen</h2>
                  <p className="text-blue-100">Kelola semua invoice dan kwitansi Anda</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-100">Total Nilai</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(getTotalValue())}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase">Total Invoice</p>
              <p className="text-3xl font-bold text-blue-900">
                {documents.filter(d => d.type === 'invoice').length}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="p-6 border bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide uppercase text-amber-600">Total Kwitansi</p>
              <p className="text-3xl font-bold text-amber-900">
                {documents.filter(d => d.type === 'receipt').length}
              </p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Receipt className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="p-6 border border-green-200 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-green-600 uppercase">Bulan Ini</p>
              <p className="text-3xl font-bold text-green-900">
                {documents.filter(d => {
                  if (!d.date) return false
                  try {
                    const docDate = new Date(d.date)
                    const now = new Date()
                    return docDate.getMonth() === now.getMonth() && 
                           docDate.getFullYear() === now.getFullYear()
                  } catch {
                    return false
                  }
                }).length}
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="p-6 border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-purple-600 uppercase">Ditampilkan</p>
              <p className="text-3xl font-bold text-purple-900">
                {filteredDocuments.length}
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Filter className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-8 border shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl border-gray-200/50">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="relative">
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              Cari Dokumen
            </label>
            <div className="relative">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3 pl-12 pr-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="Cari nomor atau nama klien..."
              />
            </div>
          </div>
          
          <div>
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              Jenis Dokumen
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">Semua Dokumen</option>
              <option value="invoice">Invoice</option>
              <option value="receipt">Kwitansi</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="issued">Terbit</option>
              <option value="paid">Lunas</option>
              <option value="overdue">Terlambat</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              Bulan
            </label>
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="overflow-hidden border shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
        {filteredDocuments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-600">Tidak Ada Dokumen</h3>
            <p className="text-gray-500">
              {documents.length === 0 ? 'Belum ada dokumen yang dibuat' : 'Tidak ada dokumen yang sesuai dengan filter'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-8 py-6 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Dokumen
                  </th>
                  <th className="px-8 py-6 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Klien/Pembayar
                  </th>
                  <th className="px-8 py-6 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Jumlah
                  </th>
                  <th className="px-8 py-6 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Tanggal
                  </th>
                  <th className="px-8 py-6 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-8 py-6 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocuments.map((document, index) => (
                  <tr key={`${document.type}-${document.id}`} className="transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-2xl ${
                          document.type === 'invoice' 
                            ? 'bg-blue-500/10 text-blue-600' 
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {document.type === 'invoice' ? (
                            <FileText className="w-6 h-6" />
                          ) : (
                            <Receipt className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {document.title}
                          </div>
                          <div className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            {document.type === 'invoice' ? 'Invoice' : 'Kwitansi'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-gray-900">{document.client || '-'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(document.amount)}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-gray-600">
                        {formatDate(document.date)}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-4 py-2 text-xs font-bold rounded-full border ${getStatusColor(document.status)}`}>
                        {getStatusText(document.status)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button
                        onClick={() => handleRegenerate(document)}
                        disabled={isDownloading === document.id}
                        className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          isDownloading === document.id
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                      >
                        {isDownloading === document.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 rounded-full border-t-transparent animate-spin"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </>
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

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-6 border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="flex-shrink-0 w-6 h-6 mt-1 text-yellow-600" />
            <div>
              <h4 className="mb-2 text-sm font-bold text-yellow-800">Debug Information</h4>
              <div className="space-y-1 text-sm text-yellow-700">
                <p>Total documents loaded: <span className="font-semibold">{documents.length}</span></p>
                <p>Invoices: <span className="font-semibold">{documents.filter(d => d.type === 'invoice').length}</span> | 
                   Receipts: <span className="font-semibold">{documents.filter(d => d.type === 'receipt').length}</span></p>
                <p>Filtered results: <span className="font-semibold">{filteredDocuments.length}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}