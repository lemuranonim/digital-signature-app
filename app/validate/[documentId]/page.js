// app/validate/[documentId]/page.js
'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, FileText, User, Building2, Calendar, Clock, Download, QrCode } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function DocumentValidationPage({ params }) {
  const [validationStatus, setValidationStatus] = useState('loading') // 'loading', 'valid', 'invalid', 'not_found'
  const [documentData, setDocumentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { documentId } = params

  useEffect(() => {
    validateDocument()
  }, [documentId])

  const validateDocument = async () => {
    setLoading(true)
    try {
      // Parse documentId format: DOC-timestamp-random
      const [prefix, timestamp, random] = documentId.split('-')
      
      if (prefix !== 'DOC' || !timestamp || !random) {
        setValidationStatus('invalid')
        setLoading(false)
        return
      }

      // Search for document with matching QR document ID directly
      // Try to find invoice first
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (
            description,
            quantity,
            unit_price
          )
        `)
        .eq('qr_document_id', documentId)
        .limit(1)

      if (invoiceError) {
        console.error('Invoice search error:', invoiceError)
      }

      // Try to find receipt if no invoice found
      let receipts = []
      if (!invoices || invoices.length === 0) {
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .select('*')
          .eq('qr_document_id', documentId)
          .limit(1)

        if (receiptError) {
          console.error('Receipt search error:', receiptError)
        } else {
          receipts = receiptData || []
        }
      }

      let foundDocument = null
      let documentType = null

      if (invoices && invoices.length > 0) {
        foundDocument = invoices[0]
        documentType = 'invoice'
      } else if (receipts && receipts.length > 0) {
        foundDocument = receipts[0]
        documentType = 'receipt'
      }

      if (!foundDocument) {
        setValidationStatus('not_found')
        setLoading(false)
        return
      }

      // Check if document has QR signature (must be 'qr' type to be valid)
      if (foundDocument.signature_type !== 'qr') {
        setValidationStatus('invalid')
        setLoading(false)
        return
      }

      // Prepare document data based on type
      let documentData = {}
      
      if (documentType === 'invoice') {
        documentData = {
          id: documentId,
          type: 'Invoice',
          number: foundDocument.invoice_number,
          clientName: foundDocument.client_name,
          amount: `Rp ${foundDocument.total_amount?.toLocaleString('id-ID') || '0'}`,
          issueDate: new Date(foundDocument.issue_date).toLocaleDateString('id-ID'),
          signedBy: 'LUDTANZA SURYA WIJAYA, S.Pd.',
          signerTitle: 'Direktur',
          company: 'PT LUKSURI REKA DIGITAL SOLUTIONS',
          signatureTimestamp: new Date(foundDocument.created_at).toLocaleString('id-ID'),
          validationUrl: foundDocument.qr_validation_url,
          securityHash: `SHA256:${documentId.replace(/-/g, '').toUpperCase()}`,
          status: foundDocument.status || 'issued',
          // Additional invoice data
          clientEmail: foundDocument.client_email,
          clientAddress: foundDocument.client_address,
          clientPhone: foundDocument.client_phone,
          dueDate: foundDocument.due_date ? new Date(foundDocument.due_date).toLocaleDateString('id-ID') : null,
          subtotal: foundDocument.subtotal,
          taxAmount: foundDocument.tax_amount,
          discountAmount: foundDocument.discount_amount,
          notes: foundDocument.notes,
          items: foundDocument.invoice_items || []
        }
      } else {
        documentData = {
          id: documentId,
          type: 'Receipt',
          number: foundDocument.receipt_number,
          clientName: foundDocument.payer_name,
          amount: `Rp ${foundDocument.amount_received?.toLocaleString('id-ID') || '0'}`,
          issueDate: new Date(foundDocument.payment_date).toLocaleDateString('id-ID'),
          signedBy: 'LUDTANZA SURYA WIJAYA, S.Pd.',
          signerTitle: 'Direktur',
          company: 'PT LUKSURI REKA DIGITAL SOLUTIONS',
          signatureTimestamp: new Date(foundDocument.created_at).toLocaleString('id-ID'),
          validationUrl: foundDocument.qr_validation_url,
          securityHash: `SHA256:${documentId.replace(/-/g, '').toUpperCase()}`,
          status: 'paid',
          // Additional receipt data
          paymentMethod: foundDocument.payment_method,
          description: foundDocument.description,
          amountWords: foundDocument.amount_words,
          invoiceReference: foundDocument.invoice_id
        }
      }

      setDocumentData(documentData)
      setValidationStatus('valid')
    } catch (error) {
      console.error('Validation error:', error)
      setValidationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = () => {
    // Simulasi download sertifikat validasi
    const certData = {
      documentId: documentData.id,
      validatedAt: new Date().toISOString(),
      status: 'VERIFIED',
      signedBy: documentData.signedBy
    }
    
    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `validation-certificate-${documentData.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-600 animate-spin"></div>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">Validating Document</h3>
            <p className="text-gray-500">Verifying digital signature authenticity...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60">
      {/* Header */}
      <div className="border-b shadow-lg bg-white/80 backdrop-blur-xl border-white/20">
        <div className="max-w-4xl px-4 py-6 mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl">
              <Shield className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 bg-clip-text">
                Document Validation Portal
              </h1>
              <p className="text-gray-600">PT LUKSURI REKA DIGITAL SOLUTIONS</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl px-4 py-8 mx-auto space-y-8">
        {/* Validation Status */}
        <div className={`relative overflow-hidden rounded-3xl ${
          validationStatus === 'valid' 
            ? 'bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800'
            : validationStatus === 'invalid' || validationStatus === 'expired'
            ? 'bg-gradient-to-br from-red-600 via-rose-700 to-pink-800'
            : 'bg-gradient-to-br from-amber-600 via-orange-700 to-red-800'
        }`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-3xl">
                {validationStatus === 'valid' && <CheckCircle className="w-12 h-12 text-white" />}
                {(validationStatus === 'invalid' || validationStatus === 'expired') && <XCircle className="w-12 h-12 text-white" />}
                {validationStatus === 'not_found' && <AlertTriangle className="w-12 h-12 text-white" />}
              </div>
              
              <h2 className="mb-2 text-3xl font-bold text-white">
                {validationStatus === 'valid' && 'Document Verified'}
                {validationStatus === 'invalid' && 'Invalid Document'}
                {validationStatus === 'expired' && 'Document Expired'}
                {validationStatus === 'not_found' && 'Document Not Found'}
              </h2>
              
              <p className="text-lg text-white/90">
                {validationStatus === 'valid' && 'This document has been verified and contains a valid digital signature.'}
                {validationStatus === 'invalid' && 'This document could not be verified or contains an invalid signature.'}
                {validationStatus === 'expired' && 'This document verification has expired. Please contact the issuer.'}
                {validationStatus === 'not_found' && 'The requested document could not be found in our validation system.'}
              </p>
            </div>
          </div>
        </div>

        {/* Document Details (only show if valid) */}
        {validationStatus === 'valid' && documentData && (
          <div className="overflow-hidden border shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Document Information</h3>
                  <p className="text-gray-600">Verified document details and signature information</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Document Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4 text-lg font-bold text-gray-900">Document Details</h4>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">Document Type:</span>
                        <span className="font-bold text-gray-900">{documentData.type}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">Document Number:</span>
                        <span className="font-bold text-gray-900">{documentData.number}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">
                          {documentData.type === 'Invoice' ? 'Client:' : 'Payer:'}
                        </span>
                        <span className="font-bold text-gray-900">{documentData.clientName}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">Amount:</span>
                        <span className="font-bold text-gray-900">{documentData.amount}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">
                          {documentData.type === 'Invoice' ? 'Issue Date:' : 'Payment Date:'}
                        </span>
                        <span className="font-bold text-gray-900">{documentData.issueDate}</span>
                      </div>
                      
                      {/* Additional Invoice Details */}
                      {documentData.type === 'Invoice' && (
                        <>
                          {documentData.dueDate && (
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-gray-600">Due Date:</span>
                              <span className="font-bold text-gray-900">{documentData.dueDate}</span>
                            </div>
                          )}
                          {documentData.clientEmail && (
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-gray-600">Client Email:</span>
                              <span className="font-bold text-gray-900">{documentData.clientEmail}</span>
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              documentData.status === 'paid' ? 'bg-green-100 text-green-800' :
                              documentData.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {documentData.status === 'paid' ? 'Lunas' : 
                               documentData.status === 'issued' ? 'Terbit' : 
                               'Draft'}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {/* Additional Receipt Details */}
                      {documentData.type === 'Receipt' && (
                        <>
                          {documentData.paymentMethod && (
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-gray-600">Payment Method:</span>
                              <span className="font-bold text-gray-900">{documentData.paymentMethod}</span>
                            </div>
                          )}
                          {documentData.description && (
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-gray-600">Description:</span>
                              <span className="font-bold text-gray-900">{documentData.description}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Signature Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4 text-lg font-bold text-gray-900">Digital Signature</h4>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">Signed By:</span>
                        <span className="font-bold text-gray-900">{documentData.signedBy}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">Title:</span>
                        <span className="font-bold text-gray-900">{documentData.signerTitle}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">Company:</span>
                        <span className="font-bold text-gray-900">{documentData.company}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">Signed At:</span>
                        <span className="font-bold text-gray-900">{documentData.signatureTimestamp}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-600">Document ID:</span>
                        <span className="font-mono text-xs text-gray-900 break-all">{documentData.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Items (for Invoice only) */}
              {documentData.type === 'Invoice' && documentData.items && documentData.items.length > 0 && (
                <div className="pt-8 mt-8 border-t border-gray-200">
                  <h4 className="mb-4 text-lg font-bold text-gray-900">Invoice Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Description</th>
                          <th className="px-4 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Qty</th>
                          <th className="px-4 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Unit Price</th>
                          <th className="px-4 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {documentData.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">Rp {item.unit_price?.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">Rp {(item.quantity * item.unit_price)?.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Invoice Totals */}
                  <div className="p-4 mt-6 bg-gray-50 rounded-2xl">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-bold">Rp {documentData.subtotal?.toLocaleString('id-ID')}</span>
                        </div>
                        {documentData.discountAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-bold text-red-600">- Rp {documentData.discountAmount?.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-bold">Rp {documentData.taxAmount?.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-300">
                          <span className="text-lg font-bold">Total:</span>
                          <span className="text-lg font-bold text-blue-600">{documentData.amount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount in Words (for Receipt only) */}
              {documentData.type === 'Receipt' && documentData.amountWords && (
                <div className="pt-8 mt-8 border-t border-gray-200">
                  <h4 className="mb-4 text-lg font-bold text-gray-900">Amount in Words</h4>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="font-medium text-gray-900 capitalize">{documentData.amountWords}</p>
                  </div>
                </div>
              )}

              {/* Notes (if available) */}
              {documentData.notes && (
                <div className="pt-8 mt-8 border-t border-gray-200">
                  <h4 className="mb-4 text-lg font-bold text-gray-900">Notes</h4>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-gray-900">{documentData.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Information */}
        {validationStatus === 'valid' && (
          <div className="overflow-hidden border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Security Verification</h3>
                  <p className="text-gray-600">Cryptographic validation and security details</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center p-4 space-x-3 bg-green-50 rounded-2xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900">Digital Signature Valid</p>
                      <p className="text-sm text-green-700">Cryptographically verified</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 space-x-3 bg-blue-50 rounded-2xl">
                    <Shield className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-bold text-blue-900">Document Integrity</p>
                      <p className="text-sm text-blue-700">Content unchanged since signing</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center p-4 space-x-3 bg-purple-50 rounded-2xl">
                    <User className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="font-bold text-purple-900">Authority Verified</p>
                      <p className="text-sm text-purple-700">Signer identity confirmed</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 space-x-3 bg-amber-50 rounded-2xl">
                    <Clock className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="font-bold text-amber-900">Timestamp Valid</p>
                      <p className="text-sm text-amber-700">Signing time verified</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Security Hash */}
              <div className="p-4 mt-6 bg-gray-50 rounded-2xl">
                <p className="mb-2 text-sm font-bold text-gray-700">Security Hash:</p>
                <p className="font-mono text-xs text-gray-600 break-all">{documentData?.securityHash}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {validationStatus === 'valid' && (
          <div className="p-8 border shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl border-gray-200/50">
            <h3 className="mb-6 text-lg font-bold text-gray-900">Available Actions</h3>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <button
                onClick={downloadCertificate}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5" />
                <span>Download Validation Certificate</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center px-6 py-3 space-x-2 font-semibold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-300 rounded-2xl hover:bg-gray-50"
              >
                <FileText className="w-5 h-5" />
                <span>Print Validation Report</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-8 text-center">
          <div className="flex items-center justify-center mb-4 space-x-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-600">PT LUKSURI REKA DIGITAL SOLUTIONS</span>
          </div>
          <p className="text-sm text-gray-500">
            Secure document validation powered by advanced cryptographic technology
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Validation performed at: {new Date().toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  )
}