'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  Download,
  Share2,
  ArrowRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function DocumentValidationPage({ params }) {
  const [validationStatus, setValidationStatus] = useState('loading') // 'loading', 'valid', 'invalid', 'not_found', 'expired'
  const [documentData, setDocumentData] = useState(null)
  const [validationChecks, setValidationChecks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(false)

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
        setValidationChecks({
          validFormat: false,
          hasQRSignature: false,
          hasValidationUrl: false,
          hasDocumentId: false,
          hasSignerInfo: false,
          hasTimestamp: false,
          isNotExpired: false
        })
        setLoading(false)
        return
      }

      // Search for document with matching QR document ID
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
        setValidationChecks({
          validFormat: true,
          hasQRSignature: false,
          hasValidationUrl: false,
          hasDocumentId: false,
          hasSignerInfo: false,
          hasTimestamp: false,
          isNotExpired: false
        })
        setLoading(false)
        return
      }

      // Enhanced validation checks
      const expectedUrl = `https://sign.luksurireka.com/validate/${documentId}`

      const checks = {
        validFormat: true,
        hasQRSignature: foundDocument.signature_type === 'qr',
        hasValidationUrl: foundDocument.qr_validation_url === expectedUrl,
        hasDocumentId: foundDocument.qr_document_id === documentId,
        hasSignerInfo: !!(foundDocument.qr_signed_by || 'LUDTANZA SURYA WIJAYA, S.Pd.'),
        hasTimestamp: !!(foundDocument.qr_timestamp || foundDocument.created_at),
        isNotExpired: true // Will be checked below
      }

      // Check signature expiry (optional - set to 0 to disable expiry)
      const SIGNATURE_VALIDITY_DAYS = 365 // 1 year validity (set to 0 to disable)

      if (SIGNATURE_VALIDITY_DAYS > 0 && checks.hasTimestamp) {
        const signatureTimestamp = new Date(foundDocument.qr_timestamp || foundDocument.created_at)
        const now = new Date()
        const daysSinceSignature = Math.floor((now - signatureTimestamp) / (1000 * 60 * 60 * 24))

        checks.isNotExpired = daysSinceSignature <= SIGNATURE_VALIDITY_DAYS

        if (!checks.isNotExpired) {
          setValidationStatus('expired')
          setValidationChecks(checks)
          setLoading(false)
          return
        }
      }

      // Check if all validation criteria are met
      const isValid = Object.values(checks).every(check => check === true)

      setValidationChecks(checks)

      if (!isValid) {
        console.error('Validation failed:', checks)
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
          signedBy: foundDocument.qr_signed_by || 'LUDTANZA SURYA WIJAYA, S.Pd.',
          signerTitle: foundDocument.qr_signer_title || 'Chief Executive Officer (CEO)',
          company: 'PT LUKSURI REKA DIGITAL SOLUTIONS',
          signatureTimestamp: foundDocument.qr_timestamp
            ? new Date(foundDocument.qr_timestamp).toLocaleString('id-ID')
            : new Date(foundDocument.created_at).toLocaleString('id-ID'),
          validationUrl: foundDocument.qr_validation_url,
          securityHash: `SHA256:${documentId.replace(/-/g, '').toUpperCase()}`,
          status: foundDocument.status || 'issued',
          // Additional invoice data
          clientEmail: foundDocument.client_email,
          clientAddress: foundDocument.client_address,
          clientPhone: foundDocument.client_phone,
          clientTaxId: foundDocument.client_tax_id,
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
          signedBy: foundDocument.qr_signed_by || 'LUDTANZA SURYA WIJAYA, S.Pd.',
          signerTitle: foundDocument.qr_signer_title || 'Chief Executive Officer (CEO)',
          company: 'PT LUKSURI REKA DIGITAL SOLUTIONS',
          signatureTimestamp: foundDocument.qr_timestamp
            ? new Date(foundDocument.qr_timestamp).toLocaleString('id-ID')
            : new Date(foundDocument.created_at).toLocaleString('id-ID'),
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
      setValidationChecks({
        validFormat: false,
        hasQRSignature: false,
        hasValidationUrl: false,
        hasDocumentId: false,
        hasSignerInfo: false,
        hasTimestamp: false,
        isNotExpired: false
      })
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-indigo-600 animate-spin"></div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Validating...</h3>
            <p className="text-slate-500 text-sm">Verifying digital signature integrity</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">

      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">

        {/* Header Branding */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Document Validation Portal
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            PT LUKSURI REKA DIGITAL SOLUTIONS
          </p>
        </div>

        {/* Validation Status Card - Hero */}
        <div className="mb-10 transform transition-all hover:scale-[1.01] duration-300">
          <div className={`relative overflow-hidden rounded-3xl shadow-2xl border ${validationStatus === 'valid'
            ? 'bg-white border-emerald-100'
            : validationStatus === 'invalid' || validationStatus === 'expired'
              ? 'bg-white border-rose-100'
              : 'bg-white border-amber-100'
            }`}>

            {/* Status Indicator Banner */}
            <div className={`h-2 w-full ${validationStatus === 'valid' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
              validationStatus === 'invalid' || validationStatus === 'expired' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}></div>

            <div className="p-8 md:p-12 text-center relative">
              {/* Background Status Icon overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                {validationStatus === 'valid' && <CheckCircle className="w-96 h-96 text-emerald-900" />}
                {(validationStatus === 'invalid' || validationStatus === 'expired') && <XCircle className="w-96 h-96 text-rose-900" />}
                {validationStatus === 'not_found' && <AlertTriangle className="w-96 h-96 text-amber-900" />}
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ring-8 ${validationStatus === 'valid'
                  ? 'bg-emerald-50 text-emerald-600 ring-emerald-50'
                  : validationStatus === 'invalid' || validationStatus === 'expired'
                    ? 'bg-rose-50 text-rose-600 ring-rose-50'
                    : 'bg-amber-50 text-amber-600 ring-amber-50'
                  }`}>
                  {validationStatus === 'valid' ? <CheckCircle className="w-12 h-12" /> :
                    validationStatus === 'invalid' || validationStatus === 'expired' ? <XCircle className="w-12 h-12" /> :
                      <AlertTriangle className="w-12 h-12" />}
                </div>

                <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${validationStatus === 'valid' ? 'text-emerald-950' :
                  validationStatus === 'invalid' || validationStatus === 'expired' ? 'text-rose-950' :
                    'text-amber-950'
                  }`}>
                  {validationStatus === 'valid' && 'Official Document Verified'}
                  {validationStatus === 'invalid' && 'Invalid Document Signature'}
                  {validationStatus === 'expired' && 'Document Verification Expired'}
                  {validationStatus === 'not_found' && 'Document Not Found'}
                </h2>

                <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
                  {validationStatus === 'valid' && 'This document has been cryptographically verified and confirmed authentic by our secure digital ledger.'}
                  {validationStatus === 'invalid' && 'We could not verify the authenticity of this document. The signature may have been tampered with.'}
                  {validationStatus === 'expired' && 'This document\'s digital signature certification has expired and is no longer valid.'}
                  {validationStatus === 'not_found' && 'The unique identifier provided does not match any record in our validation system.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS GRID - Only Show if Valid */}
        {validationStatus === 'valid' && documentData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-fade-in-up">

            {/* Left Column: Document Info */}
            <div className="lg:col-span-2 space-y-8">

              {/* Main Info Card */}
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800">Document Specifications</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                    {documentData.type}
                  </span>
                </div>

                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                    {/* Data Groups */}
                    <div className="group">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reference Number</label>
                      <p className="text-lg font-bold text-slate-900">{documentData.number}</p>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {documentData.type === 'Invoice' ? 'Issued To' : 'Payer Name'}
                      </label>
                      <p className="text-lg font-bold text-slate-900">{documentData.clientName}</p>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Amount</label>
                      <p className="text-2xl font-bold text-slate-900 tracking-tight">{documentData.amount}</p>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {documentData.type === 'Invoice' ? 'Date Issued' : 'Payment Date'}
                      </label>
                      <p className="text-lg font-medium text-slate-700">{documentData.issueDate}</p>
                    </div>

                    {(documentData.dueDate || documentData.paymentMethod) && (
                      <div className="group">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          {documentData.type === 'Invoice' ? 'Due Date' : 'Payment Method'}
                        </label>
                        <p className="text-lg font-medium text-slate-700">
                          {documentData.type === 'Invoice' ? documentData.dueDate : documentData.paymentMethod}
                        </p>
                      </div>
                    )}

                    <div className="group md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Document ID & Hash</label>
                      <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <code className="text-xs text-slate-500 font-mono flex-1 break-all line-clamp-1">
                          {documentData.id}
                        </code>
                        <button
                          onClick={() => copyToClipboard(documentData.id)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Copy ID"
                        >
                          {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table (Invoice Only) - Cleaned Up */}
              {documentData.type === 'Invoice' && documentData.items && documentData.items.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Itemized Details</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Description</th>
                          <th className="px-6 py-4 font-semibold text-center">Qty</th>
                          <th className="px-6 py-4 font-semibold text-right">Price</th>
                          <th className="px-6 py-4 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {documentData.items.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{item.description}</td>
                            <td className="px-6 py-4 text-center text-slate-600">{item.quantity}</td>
                            <td className="px-6 py-4 text-right text-slate-600">Rp {item.unit_price?.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">Rp {(item.quantity * item.unit_price)?.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Signature & Security */}
            <div className="space-y-8">

              {/* Digital Signature Card */}
              <div className="bg-slate-900 text-white rounded-3xl shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-bl-full blur-2xl"></div>

                <div className="p-8 relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Shield className="w-6 h-6 text-indigo-300" />
                    </div>
                    <h3 className="text-lg font-bold">Digital Signature</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Signed By</p>
                      <p className="text-xl font-bold text-white">{documentData.signedBy}</p>
                      <p className="text-indigo-200 text-sm">{documentData.signerTitle}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Organization</p>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <p className="font-medium">{documentData.company}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Timestamp</p>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <p className="font-medium font-mono text-sm">{documentData.signatureTimestamp}</p>
                      </div>
                    </div>

                    <div className="pt-6 mt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-400 font-bold flex items-center bg-emerald-500/10 px-3 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" /> VALID
                        </span>
                        <span className="text-slate-500 text-xs">RSA-2048 Encryption</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={downloadCertificate}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Download className="w-5 h-5" />
                    <span>Save Certificate</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-all"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600 text-sm">Secured by Luksuri Reka Digital</span>
        </div>
        <p className="text-xs text-slate-400">
          Validation ID: {params.documentId} • Server Time: {new Date().toUTCString()}
        </p>
      </footer>
    </div>
  )
}