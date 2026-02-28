// components/ReceiptForm.js
'use client'

import { useState, useEffect } from 'react'
import { Receipt, Download, User, Calendar, FileText, PenTool, RotateCcw, DollarSign, CreditCard, CheckCircle2 } from 'lucide-react'
import SignaturePad from './SignaturePad'
import { generateReceiptPDF } from '../utils/pdfGenerator'
import { supabase } from '../lib/supabase'

export default function ReceiptForm() {
  const [formData, setFormData] = useState({
    payerName: '', amountReceived: 0, paymentMethod: 'Transfer Bank',
    paymentDate: new Date().toISOString().split('T')[0], description: '', invoiceId: ''
  })
  const [invoices, setInvoices] = useState([])
  const [signature, setSignature] = useState('')
  const [signatureMetadata, setSignatureMetadata] = useState({
    type: 'manual', documentId: null, validationUrl: null, signedBy: null, signerTitle: null, timestamp: null
  })
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => { loadInvoices() }, [])

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase.from('invoices')
        .select('id, invoice_number, client_name, total_amount').eq('status', 'issued')
        .order('created_at', { ascending: false })
      if (error) throw error
      setInvoices(data || [])
    } catch (error) { console.error('Error loading invoices:', error) }
  }

  const numberToWords = (num) => {
    const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan']
    const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh']
    const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas']
    if (num === 0) return 'nol'; if (num < 10) return ones[num]; if (num < 20) return teens[num - 10]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '')
    if (num < 1000) { const h = Math.floor(num / 100), r = num % 100; return (h === 1 ? 'seratus' : ones[h] + ' ratus') + (r !== 0 ? ' ' + numberToWords(r) : '') }
    if (num < 1000000) { const t = Math.floor(num / 1000), r = num % 1000; return (t === 1 ? 'seribu' : numberToWords(t) + ' ribu') + (r !== 0 ? ' ' + numberToWords(r) : '') }
    if (num < 1000000000) { const m = Math.floor(num / 1000000), r = num % 1000000; return numberToWords(m) + ' juta' + (r !== 0 ? ' ' + numberToWords(r) : '') }
    return 'Angka terlalu besar'
  }

  const generateReceiptNumber = () => {
    const d = new Date()
    return `KWT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  }

  const handleSignatureChange = (sig, meta) => {
    setSignature(sig)
    setSignatureMetadata(meta || { type: 'manual', documentId: null, validationUrl: null, signedBy: null, signerTitle: null, timestamp: null })
  }

  const resetForm = () => {
    setFormData({
      payerName: '', amountReceived: 0, paymentMethod: 'Transfer Bank',
      paymentDate: new Date().toISOString().split('T')[0], description: '', invoiceId: ''
    })
    setSignature('')
    setSignatureMetadata({ type: 'manual', documentId: null, validationUrl: null, signedBy: null, signerTitle: null, timestamp: null })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsGenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Pengguna tidak ditemukan.')
      const receiptNumber = generateReceiptNumber()
      const amountWords = numberToWords(formData.amountReceived) + ' rupiah'
      const sigDB = {
        signature_data: signature, signature_type: signatureMetadata.type,
        qr_document_id: signatureMetadata.documentId, qr_validation_url: signatureMetadata.validationUrl,
        qr_signed_by: signatureMetadata.signedBy, qr_signer_title: signatureMetadata.signerTitle,
        qr_timestamp: signatureMetadata.timestamp
      }
      const { error: receiptError } = await supabase.from('receipts').insert({
        receipt_number: receiptNumber, invoice_id: formData.invoiceId || null, payer_name: formData.payerName,
        amount_received: formData.amountReceived, amount_words: amountWords, payment_method: formData.paymentMethod,
        payment_date: formData.paymentDate, description: formData.description, user_id: user.id, ...sigDB
      }).select().single()
      if (receiptError) throw receiptError
      let invoiceData = null
      if (formData.invoiceId) { const { data } = await supabase.from('invoices').select('invoice_number,client_name').eq('id', formData.invoiceId).single(); invoiceData = data }
      await generateReceiptPDF({
        receiptNumber, payerName: formData.payerName, amountReceived: formData.amountReceived,
        amountWords, paymentMethod: formData.paymentMethod, paymentDate: formData.paymentDate,
        description: formData.description, signature, signatureType: signatureMetadata.type,
        signatureMetadata, invoiceData
      })
      resetForm()
      alert('Kwitansi berhasil diterbitkan dan disimpan!')
    } catch (error) {
      console.error('Error creating receipt:', error)
      alert(`Terjadi kesalahan: ${error.message}`)
    } finally { setIsGenerating(false) }
  }

  const SectionHeader = ({ Icon, title, sub, color = '#00FF88' }) => (
    <div className="px-7 py-5 flex items-center space-x-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="p-2.5 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card-cyan p-6 flex items-center space-x-4">
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.25)' }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: '#00FF88' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Official Receipt (Kwitansi)</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(0,255,136,0.6)' }}>Terbitkan bukti sah penerimaan pembayaran dari klien Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payer Info */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={User} title="Payer Details" sub="Siapa yang melakukan pembayaran ini?" color="#00F0FF" />
          <div className="p-7">
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>Received From *</label>
            <input type="text" required value={formData.payerName}
              onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
              className="neon-input" placeholder="Nama lengkap atau nama perusahaan pembayar" />
          </div>
        </div>

        {/* Payment Details */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={DollarSign} title="Payment Details" sub="Informasi jumlah dana dan metode pembayaran" color="#00FF88" />
          <div className="p-7 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,255,136,0.7)' }}>Amount (Rp) *</label>
              <input type="number" required min="0" value={formData.amountReceived}
                onChange={(e) => setFormData({ ...formData, amountReceived: parseFloat(e.target.value) || 0 })}
                className="neon-input" placeholder="0" />
            </div>
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,255,136,0.7)' }}>Method *</label>
              <select required value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="neon-select">
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Tunai">Tunai</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
                <option value="Kartu Debit">Kartu Debit</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Cek">Cek</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,255,136,0.7)' }}>Date *</label>
              <input type="date" required value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} className="neon-input" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={Receipt} title="Payment Purpose" sub="Jelaskan tujuan dari pembayaran ini" color="#a78bfa" />
          <div className="p-7">
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(167,139,250,0.7)' }}>Description (Keterangan) *</label>
            <textarea required value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="neon-input" rows="4" placeholder="Contoh: Pembayaran DP 50% untuk proyek pembuatan website..." />
          </div>
        </div>

        {/* Invoice Ref */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={FileText} title="Linked Invoice" sub="Tautkan dengan Invoice yang sudah ada (Opsional)" color="#00F0FF" />
          <div className="p-7">
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>Select Invoice</label>
            <select value={formData.invoiceId}
              onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })} className="neon-select">
              <option value="">-- Tidak ada referensi Invoice --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} - {inv.client_name} (Rp {inv.total_amount.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Terbilang */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={CreditCard} title="Amount in Words (Terbilang)" sub="Otomatis mengubah nominal angka menjadi huruf" color="#FFBE0B" />
          <div className="p-7">
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.20)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(251,191,36,0.7)' }}>Uang Sejumlah</p>
              <p className="text-lg font-bold text-white capitalize italic">
                &ldquo;{formData.amountReceived > 0
                  ? `${numberToWords(formData.amountReceived)} Rupiah`
                  : 'Nol Rupiah'}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={PenTool} title="Receiver's Signature" sub="Tambahkan tanda tangan elektronik sebagai bukti penerimaan yang sah" color="#FF003C" />
          <div className="p-7">
            <SignaturePad onSignatureChange={handleSignatureChange} />
            {signature && (
              <div className="p-4 mt-5 rounded-2xl" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.20)' }}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00FF88' }} />
                  <span className="text-sm font-semibold" style={{ color: '#00FF88' }}>
                    {signatureMetadata.type === 'qr' ? 'QR Digital Signature Ready' : 'Manual Signature Captured'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={resetForm} className="neon-button-ghost">
            <RotateCcw className="w-4 h-4" /> Reset Form
          </button>
          <button type="submit" disabled={isGenerating} className="neon-button-solid text-base font-bold px-8 py-4"
            style={{ borderColor: 'rgba(0,255,136,0.5)', color: '#00FF88', background: 'rgba(0,255,136,0.12)' }}>
            {isGenerating
              ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Menerbitkan Kwitansi...</span></>
              : <><Download className="w-5 h-5" /><span>Terbitkan &amp; Unduh Kwitansi</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}