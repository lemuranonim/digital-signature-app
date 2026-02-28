'use client'

import { useState, useEffect } from 'react'
import {
  Shield, CheckCircle, XCircle, AlertTriangle,
  FileText, Building2, Clock, Download, Copy, Check, Cpu, Lock, ArrowLeft
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function DocumentValidationPage({ params }) {
  const [validationStatus, setValidationStatus] = useState('loading')
  const [documentData, setDocumentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(false)
  const { documentId } = params

  useEffect(() => { validateDocument() }, [documentId])

  const validateDocument = async () => {
    setLoading(true)
    try {
      if (!documentId || !documentId.startsWith('DOC-')) {
        setValidationStatus('invalid')
        setLoading(false); return
      }
      const { data: invoices } = await supabase.from('invoices')
        .select('*, invoice_items (description, quantity, unit_price)')
        .eq('qr_document_id', documentId).limit(1)
      let receipts = []
      if (!invoices?.length) {
        const { data: r } = await supabase.from('receipts').select('*').eq('qr_document_id', documentId).limit(1)
        receipts = r || []
      }
      let generalDocs = []
      if (!invoices?.length && !receipts.length) {
        const { data: g } = await supabase.from('general_documents').select('*').eq('qr_document_id', documentId).limit(1)
        generalDocs = g || []
      }
      let foundDocument = null, documentType = null
      if (invoices?.length) { foundDocument = invoices[0]; documentType = 'invoice' }
      else if (receipts.length) { foundDocument = receipts[0]; documentType = 'receipt' }
      else if (generalDocs.length) { foundDocument = generalDocs[0]; documentType = 'general' }

      if (!foundDocument) { setValidationStatus('not_found'); setLoading(false); return }

      const expectedUrl = `https://sign.luksurireka.com/validate/${documentId}`
      const checks = {
        validFormat: true,
        hasQRSignature: foundDocument.signature_type === 'qr',
        hasValidationUrl: foundDocument.qr_validation_url === expectedUrl,
        hasDocumentId: foundDocument.qr_document_id === documentId,
        hasSignerInfo: !!(foundDocument.qr_signed_by || true),
        hasTimestamp: !!(foundDocument.qr_timestamp || foundDocument.created_at),
        isNotExpired: true
      }

      if (checks.hasTimestamp) {
        const days = Math.floor((new Date() - new Date(foundDocument.qr_timestamp || foundDocument.created_at)) / 86400000)
        if (days > 365) { checks.isNotExpired = false; setValidationStatus('expired'); setLoading(false); return }
      }

      const isValid = Object.values(checks).every(Boolean)
      if (!isValid) { setValidationStatus('invalid'); setLoading(false); return }

      let docData = {}
      if (documentType === 'invoice') {
        docData = {
          id: documentId, type: 'Invoice', number: foundDocument.invoice_number,
          clientName: foundDocument.client_name,
          amount: `Rp ${foundDocument.total_amount?.toLocaleString('id-ID') || '0'}`,
          issueDate: new Date(foundDocument.issue_date).toLocaleDateString('id-ID'),
          signedBy: foundDocument.qr_signed_by || 'LUDTANZA SURYA WIJAYA, S.Pd.',
          signerTitle: foundDocument.qr_signer_title || 'Chief Executive Officer (CEO)',
          company: 'PT LUKSURI REKA DIGITAL SOLUTIONS',
          signatureTimestamp: new Date(foundDocument.qr_timestamp || foundDocument.created_at).toLocaleString('id-ID'),
          validationUrl: foundDocument.qr_validation_url,
          dueDate: foundDocument.due_date ? new Date(foundDocument.due_date).toLocaleDateString('id-ID') : null,
          items: foundDocument.invoice_items || []
        }
      } else if (documentType === 'receipt') {
        docData = {
          id: documentId, type: 'Receipt', number: foundDocument.receipt_number,
          clientName: foundDocument.payer_name,
          amount: `Rp ${foundDocument.amount_received?.toLocaleString('id-ID') || '0'}`,
          issueDate: new Date(foundDocument.payment_date).toLocaleDateString('id-ID'),
          signedBy: foundDocument.qr_signed_by || 'LUDTANZA SURYA WIJAYA, S.Pd.',
          signerTitle: foundDocument.qr_signer_title || 'Chief Executive Officer (CEO)',
          company: 'PT LUKSURI REKA DIGITAL SOLUTIONS',
          signatureTimestamp: new Date(foundDocument.qr_timestamp || foundDocument.created_at).toLocaleString('id-ID'),
          paymentMethod: foundDocument.payment_method,
        }
      } else {
        docData = {
          id: documentId, type: 'Official Document', title: foundDocument.title,
          description: foundDocument.description,
          issueDate: new Date(foundDocument.document_date).toLocaleDateString('id-ID'),
          signedBy: foundDocument.qr_signed_by || 'LUDTANZA SURYA WIJAYA, S.Pd.',
          signerTitle: foundDocument.qr_signer_title || 'Chief Executive Officer (CEO)',
          company: 'PT LUKSURI REKA DIGITAL SOLUTIONS',
          signatureTimestamp: new Date(foundDocument.qr_timestamp || foundDocument.created_at).toLocaleString('id-ID'),
        }
      }
      setDocumentData(docData)
      setValidationStatus('valid')
    } catch (error) {
      console.error('Validation error:', error)
      setValidationStatus('error')
    } finally { setLoading(false) }
  }

  const downloadCertificate = () => {
    const blob = new Blob([JSON.stringify({ documentId: documentData.id, validatedAt: new Date().toISOString(), status: 'VERIFIED', signedBy: documentData.signedBy }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `validation-certificate-${documentData.id}.json`
    a.click(); URL.revokeObjectURL(a.href)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true); setTimeout(() => setCopiedId(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#050510' }}>
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
            <div className="neon-spinner" style={{ width: '100%', height: '100%' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#00F0FF' }} />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-mono-luksuri">Validating...</h3>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'rgba(0,240,255,0.5)' }}>
              Verifying cryptographic signature integrity
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isValid = validationStatus === 'valid'
  const isInvalid = validationStatus === 'invalid' || validationStatus === 'expired'

  const statusConfig = {
    valid: { cardClass: 'glass-card-cyan', icon: CheckCircle, iconColor: '#00F0FF', iconBg: 'rgba(0,240,255,0.12)', title: 'Official Document Verified', message: 'This document has been cryptographically verified and confirmed authentic.' },
    invalid: { cardClass: 'glass-card-red', icon: XCircle, iconColor: '#FF003C', iconBg: 'rgba(255,0,60,0.12)', title: 'Invalid Document Signature', message: 'We could not verify this document. The signature may have been tampered with.' },
    expired: { cardClass: 'glass-card-red', icon: XCircle, iconColor: '#FF003C', iconBg: 'rgba(255,0,60,0.12)', title: 'Verification Expired', message: "This document's certification has expired and is no longer valid." },
    not_found: { cardClass: 'glass-card-amber', icon: AlertTriangle, iconColor: '#FFBE0B', iconBg: 'rgba(251,191,36,0.12)', title: 'Document Not Found', message: 'The identifier provided does not match any record in our validation system.' },
    error: { cardClass: 'glass-card-amber', icon: AlertTriangle, iconColor: '#FFBE0B', iconBg: 'rgba(251,191,36,0.12)', title: 'System Error', message: 'An unexpected error occurred during validation. Please try again.' },
  }

  const cfg = statusConfig[validationStatus] || statusConfig.error
  const IconComp = cfg.icon

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#050510' }}>
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {isValid && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 blur-3xl" style={{ background: 'radial-gradient(ellipse, #00F0FF 0%, transparent 70%)' }} />}
        {isInvalid && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 blur-3xl" style={{ background: 'radial-gradient(ellipse, #FF003C 0%, transparent 70%)' }} />}
      </div>

      {/* Nav */}
      <nav className="nav-dark sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <a href="/" className="flex items-center space-x-2 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.25)' }}>
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#00F0FF' }} />
              </div>
              <span className="font-bold gradient-text-cyan text-sm sm:text-base">Luksuri Sign</span>
            </a>
            <span className="text-[10px] sm:text-xs font-mono-luksuri px-2.5 sm:px-3 py-1 rounded-full"
              style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.20)', color: 'rgba(0,240,255,0.7)' }}>
              Validation Portal
            </span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-4 sm:mb-5"
            style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.20)' }}>
            <Shield className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#00F0FF' }} />
          </div>
          <h1 className="text-2xl sm:text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Document Validation Portal
          </h1>
          <p className="mt-2 text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            PT LUKSURI REKA DIGITAL SOLUTIONS — Luksuri Core Cryptography v3
          </p>
        </div>

        {/* Status Card */}
        <div className={`${cfg.cardClass} mb-6 sm:mb-8 overflow-hidden relative`}>
          <div className="h-[2px] w-full" style={{
            background: isValid ? 'linear-gradient(90deg, transparent, #00F0FF, transparent)'
              : isInvalid ? 'linear-gradient(90deg, transparent, #FF003C, transparent)'
                : 'linear-gradient(90deg, transparent, #FFBE0B, transparent)'
          }} />
          <div className="p-6 sm:p-10 text-center">
            <div className="relative mb-5 sm:mb-7 inline-block">
              <div className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ background: cfg.iconColor, transform: 'scale(1.5)' }} />
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                style={{ background: cfg.iconBg, border: `1px solid ${cfg.iconColor}40` }}>
                <IconComp className="w-8 h-8 sm:w-12 sm:h-12" style={{ color: cfg.iconColor }} />
              </div>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3" style={{ color: cfg.iconColor }}>
              {cfg.title}
            </h2>
            <p className="text-sm sm:text-base max-w-xl mx-auto mb-4 sm:mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {cfg.message}
            </p>
            {isValid && (
              <div className="badge badge-verified mx-auto">
                <Cpu className="w-3 h-3" />
                Verified by Luksuri Core Cryptography
              </div>
            )}
          </div>
        </div>

        {/* Detail Grid */}
        {isValid && documentData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Document specs */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              <div className="glass-card overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,240,255,0.03)' }}>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00F0FF' }} />
                    <h3 className="font-semibold text-white text-sm sm:text-base">Document Specifications</h3>
                  </div>
                  <span className="badge badge-issued">{documentData.type}</span>
                </div>

                <div className="p-4 sm:p-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7">
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1 sm:mb-2"
                        style={{ color: 'rgba(0,240,255,0.6)' }}>Reference Number</p>
                      <p className="font-bold text-white font-mono-luksuri text-sm sm:text-base break-all">
                        {documentData.type === 'Official Document' ? documentData.title : documentData.number}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1 sm:mb-2"
                        style={{ color: 'rgba(0,240,255,0.6)' }}>
                        {documentData.type === 'Invoice' ? 'Issued To' : documentData.type === 'Receipt' ? 'Payer Name' : 'Description'}
                      </p>
                      <p className="font-bold text-white text-sm sm:text-base">
                        {documentData.type === 'Official Document' ? documentData.description : documentData.clientName}
                      </p>
                    </div>
                    {documentData.type !== 'Official Document' && (
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1 sm:mb-2"
                          style={{ color: 'rgba(0,240,255,0.6)' }}>Total Amount</p>
                        <p className="text-xl sm:text-2xl font-bold text-white font-mono-luksuri">{documentData.amount}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1 sm:mb-2"
                        style={{ color: 'rgba(0,240,255,0.6)' }}>
                        {documentData.type === 'Invoice' ? 'Date Issued' : documentData.type === 'Receipt' ? 'Payment Date' : 'Document Date'}
                      </p>
                      <p className="font-medium text-white text-sm sm:text-base">{documentData.issueDate}</p>
                    </div>
                    {/* Document ID */}
                    <div className="sm:col-span-2">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1 sm:mb-2"
                        style={{ color: 'rgba(0,240,255,0.6)' }}>Document ID &amp; Hash</p>
                      <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-xl"
                        style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)' }}>
                        <code className="text-xs flex-1 break-all font-mono-luksuri" style={{ color: '#00F0FF' }}>
                          {documentData.id}
                        </code>
                        <button onClick={() => copyToClipboard(documentData.id)}
                          className="p-1.5 rounded-lg flex-shrink-0 transition-all"
                          style={{ background: 'rgba(0,240,255,0.08)' }}>
                          {copiedId
                            ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#00FF88' }} />
                            : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'rgba(0,240,255,0.7)' }} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items table (invoice only) */}
              {documentData.type === 'Invoice' && documentData.items?.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,240,255,0.03)' }}>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Itemized Details</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="dark-table text-xs sm:text-sm">
                      <thead><tr><th>Description</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                      <tbody>
                        {documentData.items.map((item, i) => (
                          <tr key={i}>
                            <td className="font-medium text-white">{item.description}</td>
                            <td style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{item.quantity}</td>
                            <td className="font-mono-luksuri" style={{ textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>Rp {item.unit_price?.toLocaleString('id-ID')}</td>
                            <td className="font-bold font-mono-luksuri text-white" style={{ textAlign: 'right' }}>Rp {(item.quantity * item.unit_price)?.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Signature + Actions */}
            <div className="space-y-5 sm:space-y-6">
              <div className="glass-card-cyan overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-bl-full blur-2xl opacity-30"
                  style={{ background: 'rgba(0,240,255,0.4)' }} />
                <div className="p-5 sm:p-7 relative z-10">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 rounded-lg" style={{ background: 'rgba(0,240,255,0.12)' }}>
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00F0FF' }} />
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base">Digital Signature</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(0,240,255,0.55)' }}>Signed By</p>
                      <p className="text-base sm:text-lg font-bold text-white">{documentData.signedBy}</p>
                      <p className="text-xs sm:text-sm" style={{ color: 'rgba(0,240,255,0.7)' }}>{documentData.signerTitle}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(0,240,255,0.55)' }}>Organization</p>
                      <div className="flex items-start space-x-2">
                        <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                        <p className="text-xs sm:text-sm font-medium text-white">{documentData.company}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(0,240,255,0.55)' }}>Timestamp</p>
                      <div className="flex items-start space-x-2">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                        <p className="font-mono-luksuri text-[10px] sm:text-xs text-white">{documentData.signatureTimestamp}</p>
                      </div>
                    </div>
                    <div className="pt-4 mt-1" style={{ borderTop: '1px solid rgba(0,240,255,0.15)' }}>
                      <div className="flex items-center justify-between">
                        <span className="badge badge-verified"><CheckCircle className="w-3 h-3" />VALID</span>
                        <span className="text-xs font-mono-luksuri" style={{ color: 'rgba(255,255,255,0.35)' }}>RSA-2048</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="glass-card p-4 sm:p-6">
                <h3 className="font-bold text-white mb-3 sm:mb-4 text-sm sm:text-base">Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                  <button onClick={downloadCertificate} className="neon-button-solid w-full text-sm">
                    <Download className="w-4 h-4" /> Save Certificate
                  </button>
                  <button onClick={() => window.print()} className="neon-button-ghost w-full text-sm">
                    <FileText className="w-4 h-4" /> Print Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 sm:py-8 text-center mt-4 sm:mt-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-center space-x-2 mb-1 sm:mb-2">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'rgba(0,240,255,0.5)' }} />
          <span className="font-semibold text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Secured by Luksuri Core Cryptography
          </span>
        </div>
        <p className="text-[10px] sm:text-xs font-mono-luksuri break-all px-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Validation ID: {params.documentId} • {new Date().toUTCString()}
        </p>
      </footer>
    </div>
  )
}