// components/InvoiceForm.js
'use client'

import { useState } from 'react'
import { Plus, Trash2, FileText, Download, Calculator, User, Calendar, Receipt, PenTool, RotateCcw } from 'lucide-react'
import SignaturePad from './SignaturePad'
import { generateInvoicePDF } from '../utils/pdfGenerator'
import { supabase } from '../lib/supabase'

export default function InvoiceForm() {
  const [formData, setFormData] = useState({
    clientName: '', clientEmail: '', clientAddress: '', clientPhone: '',
    issueDate: new Date().toISOString().split('T')[0], dueDate: '',
    notes: '', taxRate: 11, discountAmount: 0
  })
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }])
  const [signature, setSignature] = useState('')
  const [signatureMetadata, setSignatureMetadata] = useState({
    type: 'manual', documentId: null, validationUrl: null,
    signedBy: null, signerTitle: null, timestamp: null
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSignatureChange = (sig, meta) => {
    setSignature(sig)
    setSignatureMetadata(meta || { type: 'manual', documentId: null, validationUrl: null, signedBy: null, signerTitle: null, timestamp: null })
  }

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)) }
  const updateItem = (i, field, value) => { const u = [...items]; u[i][field] = value; setItems(u) }

  const calculateSubtotal = () => items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0)
  const calculateTax = () => (calculateSubtotal() - formData.discountAmount) * (formData.taxRate / 100)
  const calculateTotal = () => calculateSubtotal() - formData.discountAmount + calculateTax()

  const generateInvoiceNumber = () => {
    const d = new Date()
    return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  }

  const resetForm = () => {
    setFormData({
      clientName: '', clientEmail: '', clientAddress: '', clientPhone: '',
      issueDate: new Date().toISOString().split('T')[0], dueDate: '', notes: '', taxRate: 11, discountAmount: 0
    })
    setItems([{ description: '', quantity: 1, unitPrice: 0 }])
    setSignature('')
    setSignatureMetadata({ type: 'manual', documentId: null, validationUrl: null, signedBy: null, signerTitle: null, timestamp: null })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsGenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Pengguna tidak ditemukan. Silakan login kembali.')
      const invoiceNumber = generateInvoiceNumber()
      const subtotal = calculateSubtotal(), taxAmount = calculateTax(), total = calculateTotal()
      const sigDB = {
        signature_data: signature, signature_type: signatureMetadata.type,
        qr_document_id: signatureMetadata.documentId, qr_validation_url: signatureMetadata.validationUrl,
        qr_signed_by: signatureMetadata.signedBy, qr_signer_title: signatureMetadata.signerTitle,
        qr_timestamp: signatureMetadata.timestamp
      }
      const { data: invoice, error: invoiceError } = await supabase.from('invoices').insert({
        invoice_number: invoiceNumber, client_name: formData.clientName, client_email: formData.clientEmail,
        client_address: formData.clientAddress, client_phone: formData.clientPhone,
        issue_date: formData.issueDate, due_date: formData.dueDate, subtotal, tax_amount: taxAmount,
        discount_amount: formData.discountAmount, total_amount: total, notes: formData.notes,
        status: 'issued', user_id: user.id, ...sigDB
      }).select().single()
      if (invoiceError) throw invoiceError
      const { error: itemsError } = await supabase.from('invoice_items').insert(
        items.map(it => ({ invoice_id: invoice.id, description: it.description, quantity: it.quantity, unit_price: it.unitPrice, total: it.quantity * it.unitPrice }))
      )
      if (itemsError) throw itemsError
      await generateInvoicePDF({
        invoiceNumber, clientName: formData.clientName, clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress, clientPhone: formData.clientPhone, issueDate: formData.issueDate,
        dueDate: formData.dueDate, items, subtotal, taxAmount, discountAmount: formData.discountAmount,
        total, notes: formData.notes, signature, signatureType: signatureMetadata.type,
        signatureMetadata, taxRate: formData.taxRate
      })
      resetForm()
      alert('Invoice berhasil dibuat dan disimpan!')
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert(`Terjadi kesalahan: ${error.message}`)
    } finally { setIsGenerating(false) }
  }

  // Section header helper
  const SectionHeader = ({ Icon, title, sub, color = '#00F0FF', action }) => (
    <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  )

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Client Info */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={User} title="Client Information" sub="Enter your client's business details" />
          <div className="p-7 grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              { label: 'Client Name *', field: 'clientName', type: 'text', required: true, placeholder: 'PT. Client Company Name' },
              { label: 'Email Address', field: 'clientEmail', type: 'email', placeholder: 'client@company.com' },
              { label: 'Phone Number', field: 'clientPhone', type: 'tel', placeholder: '+62 812 3456 7890' },
            ].map(({ label, field, type, required, placeholder }) => (
              <div key={field}>
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>{label}</label>
                <input type={type} required={required} value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  className="neon-input" placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.7)' }}>Business Address</label>
              <textarea value={formData.clientAddress} onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                className="neon-input" rows="3" placeholder="Complete business address..." />
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={Calendar} title="Invoice Details" sub="Configure invoice dates and terms" color="#00FF88" />
          <div className="p-7 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,255,136,0.7)' }}>Issue Date *</label>
              <input type="date" required value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="neon-input" />
            </div>
            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,255,136,0.7)' }}>Due Date *</label>
              <input type="date" required value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="neon-input" />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={Receipt} title="Invoice Items" sub="Add products or services to invoice" color="#a78bfa"
            action={
              <button type="button" onClick={addItem} className="neon-button text-sm"
                style={{ borderColor: 'rgba(167,139,250,0.4)', color: '#a78bfa', background: 'rgba(167,139,250,0.08)' }}>
                <Plus className="w-4 h-4" /> Add Item
              </button>
            } />
          <div className="p-7 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(167,139,250,0.7)' }}>Description</label>
                    <input type="text" required value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="neon-input" placeholder="Service or product description" />
                  </div>
                  <div>
                    <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(167,139,250,0.7)' }}>Qty</label>
                    <input type="number" required min="1" value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="neon-input" />
                  </div>
                  <div>
                    <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(167,139,250,0.7)' }}>Unit Price (Rp)</label>
                    <input type="number" required min="0" value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="neon-input" placeholder="0" />
                  </div>
                  <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
                    <div className="flex-1 neon-input font-bold font-mono-luksuri text-center text-sm"
                      style={{ color: '#00F0FF', borderColor: 'rgba(0,240,255,0.20)' }}>
                      Subtotal: Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                    </div>
                    <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1}
                      className="p-2.5 rounded-xl transition-all flex-shrink-0"
                      style={{
                        background: items.length === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,0,60,0.10)',
                        color: items.length === 1 ? 'rgba(255,255,255,0.2)' : '#FF003C',
                        border: `1px solid ${items.length === 1 ? 'rgba(255,255,255,0.06)' : 'rgba(255,0,60,0.25)'}`
                      }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={Calculator} title="Invoice Calculations" sub="Configure discounts and tax rates" color="#FFBE0B" />
          <div className="p-7">
            <div className="grid grid-cols-1 gap-5 mb-7 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(251,191,36,0.7)' }}>Discount Amount (Rp)</label>
                <input type="number" min="0" value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                  className="neon-input" placeholder="0" />
              </div>
              <div>
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(251,191,36,0.7)' }}>Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="neon-input" />
              </div>
            </div>
            {/* Summary */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.15)' }}>
              <h4 className="font-bold text-white mb-5">Invoice Summary</h4>
              <div className="space-y-3">
                {[
                  { label: 'Subtotal', value: `Rp ${calculateSubtotal().toLocaleString('id-ID')}` },
                  ...(formData.discountAmount > 0 ? [{ label: 'Discount', value: `- Rp ${formData.discountAmount.toLocaleString('id-ID')}`, red: true }] : []),
                  { label: `Tax (${formData.taxRate}%)`, value: `Rp ${calculateTax().toLocaleString('id-ID')}` },
                ].map(({ label, value, red }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'rgba(0,240,255,0.6)' }}>{label}:</span>
                    <span className="font-bold font-mono-luksuri" style={{ color: red ? '#FF003C' : '#fff' }}>{value}</span>
                  </div>
                ))}
                <div className="pt-4 mt-2 flex justify-between items-center" style={{ borderTop: '1px solid rgba(0,240,255,0.20)' }}>
                  <span className="text-lg font-bold text-white">TOTAL:</span>
                  <span className="text-2xl font-bold font-mono-luksuri" style={{ color: '#00F0FF' }}>
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={FileText} title="Additional Notes" sub="Add terms, conditions, or special instructions" color="#00F0FF" />
          <div className="p-7">
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="neon-input" rows="4" placeholder="Payment terms, delivery conditions, or other important notes..." />
          </div>
        </div>

        {/* Digital Signature */}
        <div className="glass-card overflow-hidden">
          <SectionHeader Icon={PenTool} title="Digital Signature" sub="Add your electronic signature to the invoice" color="#FF003C" />
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
                {signatureMetadata.type === 'qr' && signatureMetadata.documentId && (
                  <div className="mt-2 text-xs font-mono-luksuri" style={{ color: 'rgba(0,255,136,0.6)' }}>
                    <p>Document ID: {signatureMetadata.documentId}</p>
                    <p>Signed by: {signatureMetadata.signedBy}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={resetForm} className="neon-button-ghost">
            <RotateCcw className="w-4 h-4" /> Reset Form
          </button>
          <button type="submit" disabled={isGenerating} className="neon-button-solid text-base font-bold px-8 py-4">
            {isGenerating
              ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Creating Invoice...</span></>
              : <><Download className="w-5 h-5" /><span>Create &amp; Download Invoice</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}