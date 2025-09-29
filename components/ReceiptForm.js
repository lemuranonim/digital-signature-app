// components/ReceiptForm.js
'use client'

import { useState, useEffect } from 'react'
import { Receipt, Download, User, Calendar, FileText, PenTool, RotateCcw, DollarSign, CreditCard } from 'lucide-react'
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
  const [signatureMetadata, setSignatureMetadata] = useState({
    type: 'manual',
    documentId: null,
    validationUrl: null,
    signedBy: null,
    signerTitle: null,
    timestamp: null
  })
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

  const handleSignatureChange = (signatureData, metadata) => {
    console.log('Receipt signature data received:', { signatureData: signatureData ? 'Present' : 'Empty', metadata })
    setSignature(signatureData)
    setSignatureMetadata(metadata || {
      type: 'manual',
      documentId: null,
      validationUrl: null,
      signedBy: null,
      signerTitle: null,
      timestamp: null
    })
  }

  const resetForm = () => {
    setFormData({
      payerName: '',
      amountReceived: 0,
      paymentMethod: 'Transfer Bank',
      paymentDate: new Date().toISOString().split('T')[0],
      description: '',
      invoiceId: ''
    })
    setSignature('')
    setSignatureMetadata({
      type: 'manual',
      documentId: null,
      validationUrl: null,
      signedBy: null,
      signerTitle: null,
      timestamp: null
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Pengguna tidak ditemukan. Silakan login kembali.")

      const receiptNumber = generateReceiptNumber()
      const amountWords = numberToWords(formData.amountReceived) + ' rupiah'
      
      // Prepare signature metadata for database
      const signatureDataForDB = {
        signature_data: signature,
        signature_type: signatureMetadata.type,
        qr_document_id: signatureMetadata.documentId,
        qr_validation_url: signatureMetadata.validationUrl,
        qr_signed_by: signatureMetadata.signedBy,
        qr_signer_title: signatureMetadata.signerTitle,
        qr_timestamp: signatureMetadata.timestamp
      }

      console.log('Saving receipt with signature metadata:', signatureDataForDB)
      
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
          user_id: user.id,
          ...signatureDataForDB
        })
        .select()
        .single()

      if (receiptError) {
        console.error('Receipt insertion error:', receiptError)
        throw receiptError
      }

      console.log('Receipt saved successfully:', receipt)

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

      // Prepare data for PDF generation
      const receiptData = {
        receiptNumber,
        payerName: formData.payerName,
        amountReceived: formData.amountReceived,
        amountWords: amountWords,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        description: formData.description,
        signature: signature,
        signatureType: signatureMetadata.type,
        signatureMetadata: signatureMetadata,
        invoiceData: invoiceData
      }

      console.log('Generating receipt PDF with data:', {
        ...receiptData,
        signature: signature ? 'Present' : 'Empty',
        signatureMetadata
      })
      
      // Generate PDF
      await generateReceiptPDF(receiptData)
      
      // Reset form
      resetForm()
      
      alert('Kwitansi berhasil dibuat dan disimpan!')
      
    } catch (error) {
      console.error('Error creating receipt:', error)
      alert(`Terjadi kesalahan saat membuat kwitansi: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Payment Information */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Information</h3>
                <p className="text-gray-600">Enter payment details and payer information</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Payer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.payerName}
                  onChange={(e) => setFormData({...formData, payerName: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Full name of payer"
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Amount Received *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.amountReceived}
                  onChange={(e) => setFormData({...formData, amountReceived: parseFloat(e.target.value) || 0})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Payment Method *
                </label>
                <select
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Reference */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Invoice Reference (Optional)</h3>
                <p className="text-gray-600">Link this receipt to an existing invoice</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div>
              <label className="block mb-3 text-sm font-bold text-gray-700">
                Select Invoice
              </label>
              <select
                value={formData.invoiceId}
                onChange={(e) => setFormData({...formData, invoiceId: e.target.value})}
                className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
              >
                <option value="">-- Select Invoice (Optional) --</option>
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
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Description</h3>
                <p className="text-gray-600">Describe what this payment is for</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div>
              <label className="block mb-3 text-sm font-bold text-gray-700">
                Payment Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                rows="4"
                placeholder="Describe what this payment is for..."
              />
            </div>
          </div>
        </div>

        {/* Amount in Words Preview */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Amount in Words</h3>
                <p className="text-gray-600">Automatic conversion to Indonesian words</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="p-8 border-2 bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl border-amber-200">
              <h4 className="mb-4 text-lg font-bold text-amber-900">Terbilang</h4>
              <div className="p-6 bg-white border rounded-2xl border-amber-200">
                <p className="text-xl font-bold text-gray-900 capitalize">
                  {formData.amountReceived > 0 
                    ? `${numberToWords(formData.amountReceived)} rupiah`
                    : 'Masukkan jumlah pembayaran'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Digital Signature</h3>
                <p className="text-gray-600">Add your electronic signature to the receipt</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <SignaturePad onSignatureChange={handleSignatureChange} />
            
            {/* Signature Preview */}
            {signature && (
              <div className="p-4 mt-6 bg-green-50 rounded-2xl">
                <div className="flex items-center mb-2 space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-green-800">
                    {signatureMetadata.type === 'qr' ? 'QR Digital Signature Ready' : 'Manual Signature Captured'}
                  </span>
                </div>
                {signatureMetadata.type === 'qr' && signatureMetadata.documentId && (
                  <div className="mt-2 text-xs text-green-700">
                    <p>Document ID: {signatureMetadata.documentId}</p>
                    <p>Signed by: {signatureMetadata.signedBy}</p>
                    <p>This QR signature will be embedded in the generated PDF</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col justify-end space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center justify-center px-8 py-4 space-x-2 font-semibold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-gray-400"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset Form</span>
          </button>
          
          <button
            type="submit"
            disabled={isGenerating}
            className={`flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
              isGenerating 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-700 hover:to-orange-800 hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                <span>Creating Receipt...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Create & Download Receipt</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}