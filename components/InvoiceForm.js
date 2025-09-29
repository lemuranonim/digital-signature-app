// components/InvoiceForm.js
'use client'

import { useState } from 'react'
import { Plus, Trash2, FileText, Download, Calculator, User, Calendar, Receipt, PenTool, RotateCcw } from 'lucide-react'
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
  const [signatureMetadata, setSignatureMetadata] = useState({
    type: 'manual',
    documentId: null,
    validationUrl: null,
    signedBy: null,
    signerTitle: null,
    timestamp: null
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSignatureChange = (signatureData, metadata) => {
    console.log('Signature data received:', { signatureData: signatureData ? 'Present' : 'Empty', metadata })
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

  const resetForm = () => {
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
      const invoiceNumber = generateInvoiceNumber()
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const total = calculateTotal()
      
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

      console.log('Saving invoice with signature metadata:', signatureDataForDB)
      
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
          status: 'issued',
          ...signatureDataForDB
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('Invoice insertion error:', invoiceError)
        throw invoiceError
      }

      console.log('Invoice saved successfully:', invoice)

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

      if (itemsError) {
        console.error('Invoice items insertion error:', itemsError)
        throw itemsError
      }

      // Prepare data for PDF generation
      const invoiceData = {
        invoiceNumber,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress,
        clientPhone: formData.clientPhone,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        items: items,
        subtotal: subtotal,
        taxAmount: taxAmount,
        discountAmount: formData.discountAmount,
        total: total,
        notes: formData.notes,
        signature: signature,
        signatureType: signatureMetadata.type,
        signatureMetadata: signatureMetadata,
        taxRate: formData.taxRate
      }

      console.log('Generating PDF with complete signature data:', {
        hasSignature: !!signature,
        signatureType: signatureMetadata.type,
        signatureMetadata: signatureMetadata,
        signatureDataLength: signature ? signature.length : 0
      })
      
      // Generate PDF
      await generateInvoicePDF(invoiceData)
      
      // Reset form
      resetForm()
      
      alert('Invoice berhasil dibuat dan disimpan!')
      
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert(`Terjadi kesalahan saat membuat invoice: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Client Information</h3>
                <p className="text-gray-600">Enter your client's business details</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="PT. Client Company Name"
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="client@company.com"
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Business Address
                </label>
                <textarea
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({...formData, clientAddress: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  rows="3"
                  placeholder="Complete business address..."
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="+62 812 3456 7890"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
                <p className="text-gray-600">Configure invoice dates and terms</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Issue Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invoice Items</h3>
                  <p className="text-gray-600">Add products or services to invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
          
          <div className="p-8">
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="relative p-6 border border-gray-100 bg-gradient-to-r from-gray-50/80 to-white rounded-2xl">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
                    <div className="md:col-span-2">
                      <label className="block mb-3 text-sm font-bold text-gray-700">
                        Description
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-4 py-3 transition-all duration-200 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                        placeholder="Service or product description"
                      />
                    </div>
                    <div>
                      <label className="block mb-3 text-sm font-bold text-gray-700">
                        Quantity
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 transition-all duration-200 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                    <div>
                      <label className="block mb-3 text-sm font-bold text-gray-700">
                        Unit Price (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 transition-all duration-200 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block mb-3 text-sm font-bold text-gray-700">
                        Total
                      </label>
                      <div className="px-4 py-3 font-bold text-gray-900 bg-gray-100 border-2 border-gray-200 rounded-xl">
                        Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className={`p-3 rounded-xl transition-all duration-200 ${
                          items.length === 1 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-red-500 hover:bg-red-600 text-white hover:scale-105'
                        }`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calculations */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Invoice Calculations</h3>
                <p className="text-gray-600">Configure discounts and tax rates</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Discount Amount (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({...formData, discountAmount: parseFloat(e.target.value) || 0})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})}
                  className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />
              </div>
            </div>
            
            {/* Invoice Summary */}
            <div className="p-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl">
              <h4 className="mb-6 text-lg font-bold text-blue-900">Invoice Summary</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium text-blue-700">Subtotal:</span>
                  <span className="text-lg font-bold text-blue-900">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                </div>
                {formData.discountAmount > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="font-medium text-blue-700">Discount:</span>
                    <span className="text-lg font-bold text-red-600">- Rp {formData.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium text-blue-700">Tax ({formData.taxRate}%):</span>
                  <span className="text-lg font-bold text-blue-900">Rp {calculateTax().toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-4 mt-4 border-t-2 border-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-900">TOTAL:</span>
                    <span className="text-2xl font-bold text-blue-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Additional Notes</h3>
                <p className="text-gray-600">Add terms, conditions, or special instructions</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-5 py-4 transition-all duration-200 border-2 border-gray-200 bg-white/90 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              rows="4"
              placeholder="Payment terms, delivery conditions, or other important notes..."
            />
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
                <p className="text-gray-600">Add your electronic signature to the invoice</p>
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
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                <span>Creating Invoice...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Create & Download Invoice</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}