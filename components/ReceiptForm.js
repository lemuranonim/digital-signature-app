// components/ReceiptForm.js
'use client'

import { useState, useEffect } from 'react'
import { Receipt, Download } from 'lucide-react'
import SignaturePad from './SignaturePad'
import { generateReceiptPDF } from '../utils/pdfGenerator'
import { supabase } from '../lib/supabase'

export default function ReceiptForm() {
  const [formData, setFormData] = useState({
    payerName: '',
    amountReceived: 0,
    paymentMethod: 'Transfer Bank',
    paymentDate: new Date().toISOString().split('T')[0],
    description: '',
    invoiceId: ''
  })
  
  const [invoices, setInvoices] = useState([])
  const [signature, setSignature] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_name, total_amount')
        .eq('status', 'issued')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error loading invoices:', error)
    }
  }

  const numberToWords = (num) => {
    const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
    const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];

    if (num === 0) return 'nol';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) {
      const hundreds = Math.floor(num / 100);
      const remainder = num % 100;
      return (hundreds === 1 ? 'seratus' : ones[hundreds] + ' ratus') + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
    }
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      return (thousands === 1 ? 'seribu' : numberToWords(thousands) + ' ribu') + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
    }
    if (num < 1000000000) {
      const millions = Math.floor(num / 1000000);
      const remainder = num % 1000000;
      return numberToWords(millions) + ' juta' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
    }
    
    return 'Angka terlalu besar';
  }

  const generateReceiptNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `KWT-${year}${month}-${random}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      const receiptNumber = generateReceiptNumber()
      const amountWords = numberToWords(formData.amountReceived) + ' rupiah'
      
      // Save to database
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          receipt_number: receiptNumber,
          invoice_id: formData.invoiceId || null,
          payer_name: formData.payerName,
          amount_received: formData.amountReceived,
          amount_words: amountWords,
          payment_method: formData.paymentMethod,
          payment_date: formData.paymentDate,
          description: formData.description,
          signature_data: signature
        })
        .select()
        .single()

      if (receiptError) throw receiptError

      // Get invoice details if selected
      let invoiceData = null
      if (formData.invoiceId) {
        const { data } = await supabase
          .from('invoices')
          .select('invoice_number, client_name')
          .eq('id', formData.invoiceId)
          .single()
        invoiceData = data
      }

      // Generate PDF
      const receiptData = {
        ...formData,
        receiptNumber,
        amountWords,
        signature,
        invoiceData
      }
      
      await generateReceiptPDF(receiptData)
      
      // Reset form
      setFormData({
        payerName: '',
        amountReceived: 0,
        paymentMethod: 'Transfer Bank',
        paymentDate: new Date().toISOString().split('T')[0],
        description: '',
        invoiceId: ''
      })
      setSignature('')
      
      alert('Kwitansi berhasil dibuat dan disimpan!')
      
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat membuat kwitansi')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Receipt className="w-8 h-8 text-luxury-600" />
        <h2 className="text-2xl font-bold text-gray-900">Buat Kwitansi Baru</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Information */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pembayaran</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pembayar *
              </label>
              <input
                type="text"
                required
                value={formData.payerName}
                onChange={(e) => setFormData({...formData, payerName: e.target.value})}
                className="luxury-input"
                placeholder="Nama lengkap pembayar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah yang Diterima *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.amountReceived}
                onChange={(e) => setFormData({...formData, amountReceived: parseFloat(e.target.value) || 0})}
                className="luxury-input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran *
              </label>
              <select
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                className="luxury-input"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Tunai">Tunai</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
                <option value="Kartu Debit">Kartu Debit</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Cek">Cek</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                className="luxury-input"
              />
            </div>
          </div>
        </div>

        {/* Invoice Reference */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referensi Invoice (Opsional)</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Invoice
              </label>
              <select
                value={formData.invoiceId}
                onChange={(e) => setFormData({...formData, invoiceId: e.target.value})}
                className="luxury-input"
              >
                <option value="">-- Pilih Invoice (Opsional) --</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - {invoice.client_name} (Rp {invoice.total_amount.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Keterangan</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Pembayaran *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="luxury-input"
              rows="3"
              placeholder="Deskripsi untuk apa pembayaran ini..."
            />
          </div>
        </div>

        {/* Amount in Words Preview */}
        <div className="bg-gradient-to-r from-luxury-50 to-primary-50 p-6 rounded-xl border border-luxury-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Terbilang</h3>
          <div className="p-4 bg-white rounded-lg border-2 border-luxury-200">
            <p className="text-lg font-medium text-gray-900 capitalize">
              {formData.amountReceived > 0 
                ? `${numberToWords(formData.amountReceived)} rupiah`
                : 'Masukkan jumlah pembayaran'
              }
            </p>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tanda Tangan Digital</h3>
          <SignaturePad onSignatureChange={setSignature} />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                payerName: '',
                amountReceived: 0,
                paymentMethod: 'Transfer Bank',
                paymentDate: new Date().toISOString().split('T')[0],
                description: '',
                invoiceId: ''
              })
              setSignature('')
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isGenerating}
            className={`luxury-button flex items-center space-x-2 ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Download className="w-5 h-5" />
            <span>{isGenerating ? 'Membuat Kwitansi...' : 'Buat & Download Kwitansi'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}