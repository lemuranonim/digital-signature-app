// components/InvoiceForm.js
'use client'

import { useState } from 'react'
import { Plus, Trash2, FileText, Download } from 'lucide-react'
import SignaturePad from './SignaturePad'
import { generateInvoicePDF } from '../utils/pdfGenerator'
import { supabase } from '../lib/supabase'

export default function InvoiceForm() {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientPhone: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    taxRate: 11,
    discountAmount: 0
  })
  
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0 }
  ])
  
  const [signature, setSignature] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index, field, value) => {
    const updatedItems = [...items]
    updatedItems[index][field] = value
    setItems(updatedItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const calculateTax = () => {
    return (calculateSubtotal() - formData.discountAmount) * (formData.taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - formData.discountAmount + calculateTax()
  }

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${year}${month}-${random}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      const invoiceNumber = generateInvoiceNumber()
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const total = calculateTotal()
      
      // Save to database
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          client_address: formData.clientAddress,
          client_phone: formData.clientPhone,
          issue_date: formData.issueDate,
          due_date: formData.dueDate,
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_amount: formData.discountAmount,
          total_amount: total,
          notes: formData.notes,
          signature_data: signature,
          status: 'issued'
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Save invoice items
      const itemsToInsert = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Generate PDF
      const invoiceData = {
        ...formData,
        invoiceNumber,
        items,
        subtotal,
        taxAmount,
        total,
        signature
      }
      
      await generateInvoicePDF(invoiceData)
      
      // Reset form
      setFormData({
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        clientPhone: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        taxRate: 11,
        discountAmount: 0
      })
      setItems([{ description: '', quantity: 1, unitPrice: 0 }])
      setSignature('')
      
      alert('Invoice berhasil dibuat dan disimpan!')
      
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat membuat invoice')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="w-8 h-8 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Buat Invoice Baru</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Klien</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Klien *
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                className="luxury-input"
                placeholder="PT. Contoh Perusahaan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                className="luxury-input"
                placeholder="email@perusahaan.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat
              </label>
              <textarea
                value={formData.clientAddress}
                onChange={(e) => setFormData({...formData, clientAddress: e.target.value})}
                className="luxury-input"
                rows="3"
                placeholder="Alamat lengkap klien"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telepon
              </label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                className="luxury-input"
                placeholder="+62 812 3456 7890"
              />
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Invoice</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Invoice *
              </label>
              <input
                type="date"
                required
                value={formData.issueDate}
                onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Jatuh Tempo *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="luxury-input"
              />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Item Invoice</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-white rounded-lg border">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="luxury-input"
                    placeholder="Deskripsi layanan/produk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="luxury-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Satuan
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="luxury-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`Rp ${(item.quantity * item.unitPrice).toLocaleString('id-ID')}`}
                    className="luxury-input bg-gray-100"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className={`p-3 rounded-lg ${
                      items.length === 1 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Perhitungan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diskon (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={formData.discountAmount}
                onChange={(e) => setFormData({...formData, discountAmount: parseFloat(e.target.value) || 0})}
                className="luxury-input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pajak (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.taxRate}
                onChange={(e) => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})}
                className="luxury-input"
              />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border-2 border-primary-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Diskon:</span>
                <span className="font-medium text-red-600">- Rp {formData.discountAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pajak ({formData.taxRate}%):</span>
                <span className="font-medium">Rp {calculateTax().toLocaleString('id-ID')}</span>
              </div>
              <hr className="border-primary-200" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="luxury-input"
            rows="3"
            placeholder="Catatan tambahan untuk invoice..."
          />
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
                clientName: '',
                clientEmail: '',
                clientAddress: '',
                clientPhone: '',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: '',
                notes: '',
                taxRate: 11,
                discountAmount: 0
              })
              setItems([{ description: '', quantity: 1, unitPrice: 0 }])
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
            <span>{isGenerating ? 'Membuat Invoice...' : 'Buat & Download Invoice'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}