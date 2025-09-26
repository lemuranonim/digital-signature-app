// components/DocumentList.js
'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, Download, Eye, Search, Calendar, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateInvoicePDF, generateReceiptPDF } from '../utils/pdfGenerator'

export default function DocumentList() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      // Load invoices
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .order('created_at', { ascending: false })

      if (invoiceError) throw invoiceError

      // Load receipts
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select(`
          *,
          invoices (invoice_number, client_name)
        `)
        .order('created_at', { ascending: false })

      if (receiptError) throw receiptError

      // Combine and format documents
      const allDocuments = [
        ...(invoices || []).map(invoice => ({
          ...invoice,
          type: 'invoice',
          title: `Invoice ${invoice.invoice_number}`,
          client: invoice.client_name,
          amount: invoice.total_amount,
          date: invoice.issue_date,
          status: invoice.status
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
      alert('Terjadi kesalahan saat memuat dokumen')
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
    try {
      if (document.type === 'invoice') {
        // Get invoice items
        const { data: items } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', document.id)

        const invoiceData = {
          invoiceNumber: document.invoice_number,
          clientName: document.client_name,
          clientEmail: document.client_email,
          clientAddress: document.client_address,
          clientPhone: document.client_phone,
          issueDate: document.issue_date,
          dueDate: document.due_date,
          items: items || [],
          subtotal: document.subtotal,
          taxAmount: document.tax_amount,
          discountAmount: document.discount_amount,
          total: document.total_amount,
          notes: document.notes,
          signature: document.signature_data,
          taxRate: ((document.tax_amount / (document.subtotal - document.discount_amount)) * 100).toFixed(1)
        }

        await generateInvoicePDF(invoiceData)
      } else {
        // Get related invoice data if exists
        let invoiceData = null
        if (document.invoice_id) {
          const { data } = await supabase
            .from('invoices')
            .select('invoice_number, client_name')
            .eq('id', document.invoice_id)
            .single()
          invoiceData = data
        }

        const receiptData = {
          receiptNumber: document.receipt_number,
          payerName: document.payer_name,
          amountReceived: document.amount_received,
          amountWords: document.amount_words,
          paymentMethod: document.payment_method,
          paymentDate: document.payment_date,
          description: document.description,
          signature: document.signature_data,
          invoiceData
        }

        await generateReceiptPDF(receiptData)
      }
    } catch (error) {
      console.error('Error regenerating document:', error)
      alert('Terjadi kesalahan saat mengunduh dokumen')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'issued': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'issued': return 'Terbit'
      case 'paid': return 'Lunas'
      case 'overdue': return 'Terlambat'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Download className="w-8 h-8 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Daftar Dokumen</h2>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Dokumen
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="luxury-input pl-10"
                placeholder="Cari nomor atau nama klien..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Dokumen
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="luxury-input"
            >
              <option value="all">Semua Dokumen</option>
              <option value="invoice">Invoice</option>
              <option value="receipt">Kwitansi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="luxury-input"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="issued">Terbit</option>
              <option value="paid">Lunas</option>
              <option value="overdue">Terlambat</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulan
            </label>
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="luxury-input"
            />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada dokumen ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dokumen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klien/Pembayar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <tr key={`${document.type}-${document.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {document.type === 'invoice' ? (
                          <FileText className="w-5 h-5 text-primary-600 mr-3" />
                        ) : (
                          <Receipt className="w-5 h-5 text-luxury-600 mr-3" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {document.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {document.type === 'invoice' ? 'Invoice' : 'Kwitansi'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{document.client}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Rp {document.amount.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(document.date).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                        {getStatusText(document.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRegenerate(document)}
                        className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-primary-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Invoice</p>
              <p className="text-lg font-semibold text-gray-900">
                {documents.filter(d => d.type === 'invoice').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Receipt className="w-8 h-8 text-luxury-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Kwitansi</p>
              <p className="text-lg font-semibold text-gray-900">
                {documents.filter(d => d.type === 'receipt').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Bulan Ini</p>
              <p className="text-lg font-semibold text-gray-900">
                {documents.filter(d => {
                  const docDate = new Date(d.date)
                  const now = new Date()
                  return docDate.getMonth() === now.getMonth() && 
                         docDate.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Filter className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ditampilkan</p>
              <p className="text-lg font-semibold text-gray-900">
                {filteredDocuments.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}