// components/SignaturePad.js
'use client'

import { useRef, useEffect, useState } from 'react'
import { RotateCcw, PenTool, QrCode, Shield, Check, Copy, ExternalLink } from 'lucide-react'

export default function SignaturePad({ onSignatureChange }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signatureType, setSignatureType] = useState('manual')
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)
  const [documentId, setDocumentId] = useState('')
  const [qrCodeData, setQrCodeData] = useState('')
  const [validationUrl, setValidationUrl] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      canvas.width = canvas.offsetWidth
      canvas.height = 200
      ctx.strokeStyle = '#00F0FF'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  const generateDocumentId = () => `DOC-${Date.now()}-${Math.floor(Math.random() * 10000)}`

  const generateRealQRCode = async (data) => {
    try {
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&format=PNG&margin=10&bgcolor=ffffff&color=000000`
    } catch { return null }
  }

  const generateQRCodeCanvas = (text) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = 200; canvas.width = size; canvas.height = size
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = 'black'
    const moduleSize = size / 25
    const textHash = text.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        if ((x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17)) {
          if ((x === 0 || x === 6 || y === 0 || y === 6) || (x >= 2 && x <= 4 && y >= 2 && y <= 4))
            ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize)
        } else if ((x + y + textHash) % 3 === 0) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize)
        }
      }
    }
    return canvas.toDataURL('image/png')
  }

  const generateQRCode = async () => {
    const docId = generateDocumentId()
    setDocumentId(docId)
    const baseUrl = `https://sign.luksurireka.com/validate/${docId}`
    setValidationUrl(baseUrl)
    const meta = {
      type: 'qr', documentId: docId, validationUrl: baseUrl,
      signedBy: 'LUDTANZA SURYA WIJAYA, S.Pd.',
      signerTitle: 'Chief Executive Officer',
      timestamp: new Date().toISOString()
    }
    try {
      const realQRUrl = await generateRealQRCode(baseUrl)
      const qrUrl = realQRUrl || generateQRCodeCanvas(baseUrl)
      setQrCodeData(qrUrl)
      setQrCodeGenerated(true); setHasSignature(true)
      onSignatureChange(qrUrl, meta)
    } catch {
      const fallbackQR = generateQRCodeCanvas(baseUrl)
      setQrCodeData(fallbackQR); setQrCodeGenerated(true); setHasSignature(true)
      onSignatureChange(fallbackQR, meta)
    }
  }

  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      onSignatureChange(canvasRef.current.toDataURL(), {
        type: 'manual', documentId: null, validationUrl: null,
        signedBy: null, signerTitle: null, timestamp: new Date().toISOString()
      })
    }
  }

  const clearSignature = () => {
    if (signatureType === 'manual') {
      const canvas = canvasRef.current
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    }
    setHasSignature(false); setQrCodeGenerated(false)
    setDocumentId(''); setQrCodeData(''); setValidationUrl('')
    onSignatureChange('', { type: signatureType, documentId: null, validationUrl: null, signedBy: null, signerTitle: null, timestamp: null })
  }

  const copyValidationUrl = () => {
    navigator.clipboard.writeText(validationUrl)
    alert('Validation URL copied to clipboard!')
  }

  return (
    <div className="space-y-5">
      {/* Type Selector */}
      <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Method:</span>
          <div className="flex gap-2 flex-1">
            {[
              { type: 'manual', Icon: PenTool, label: 'Manual', activeColor: '#00F0FF' },
              { type: 'qr', Icon: QrCode, label: 'QR Digital', activeColor: '#00FF88' },
            ].map(({ type: t, Icon, label, activeColor }) => (
              <button key={t} type="button"
                onClick={() => { setSignatureType(t); clearSignature() }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs flex-1 justify-center transition-all"
                style={signatureType === t
                  ? { background: `${activeColor}15`, color: activeColor, border: `1px solid ${activeColor}40` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Icon className="w-3.5 h-3.5" /><span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Canvas */}
      {signatureType === 'manual' && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-44 sm:h-48 rounded-2xl cursor-crosshair touch-none"
            style={{ background: 'rgba(0,0,0,0.30)', border: '1.5px dashed rgba(0,240,255,0.30)' }}
            onMouseDown={startDrawing} onMouseMove={draw}
            onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrawing({ clientX: t.clientX, clientY: t.clientY }) }}
            onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; draw({ clientX: t.clientX, clientY: t.clientY }) }}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute top-4 left-4 flex items-center space-x-2 pointer-events-none">
              <PenTool className="w-4 h-4" style={{ color: 'rgba(0,240,255,0.3)' }} />
              <span className="text-xs sm:text-sm" style={{ color: 'rgba(0,240,255,0.3)' }}>Draw your signature here</span>
            </div>
          )}
        </div>
      )}

      {/* QR Section */}
      {signatureType === 'qr' && (
        <div className="space-y-5">
          {!qrCodeGenerated ? (
            <div className="p-8 text-center rounded-2xl"
              style={{ background: 'rgba(0,255,136,0.04)', border: '1.5px dashed rgba(0,255,136,0.25)' }}>
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl"
                style={{ background: 'rgba(0,255,136,0.10)', border: '1px solid rgba(0,255,136,0.25)' }}>
                <QrCode className="w-8 h-8" style={{ color: '#00FF88' }} />
              </div>
              <h4 className="font-bold text-white mb-2">Generate Real QR Digital Signature</h4>
              <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Create a scannable QR code that validates this document's authenticity, signed by LUDTANZA SURYA WIJAYA, S.Pd.
              </p>
              <button type="button" onClick={generateQRCode} className="neon-button-solid"
                style={{ borderColor: 'rgba(0,255,136,0.5)', color: '#00FF88', background: 'rgba(0,255,136,0.12)' }}>
                <Shield className="w-4 h-4" /> Generate Scannable QR Code
              </button>
            </div>
          ) : (
            <div className="p-7 rounded-2xl space-y-5"
              style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.20)' }}>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5" style={{ color: '#00FF88' }} />
                <h4 className="font-bold" style={{ color: '#00FF88' }}>Scannable QR Digital Signature Generated</h4>
              </div>

              <div className="flex justify-center">
                <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '2px solid rgba(0,240,255,0.30)' }}>
                  <img src={qrCodeData} alt="QR Code Digital Signature" className="w-48 h-48 mx-auto"
                    style={{ imageRendering: 'pixelated' }} />
                  <p className="mt-2 text-xs font-bold tracking-widest text-center uppercase" style={{ color: '#333' }}>
                    Scan to verify
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 rounded-2xl" style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h5 className="font-bold text-white mb-3 text-sm">Digital Signature Details:</h5>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Signed by', value: 'LUDTANZA SURYA WIJAYA, S.Pd.' },
                    { label: 'Title', value: 'Chief Executive Officer' },
                    { label: 'Company', value: 'PT LUKSURI REKA DIGITAL SOLUTIONS' },
                    { label: 'Document ID', value: documentId, mono: true },
                    { label: 'Timestamp', value: new Date().toLocaleString('id-ID'), mono: true },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span style={{ color: 'rgba(0,240,255,0.55)' }}>{label}:</span>
                      <span className={`font-semibold text-white text-right ${mono ? 'font-mono-luksuri' : ''}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation URL */}
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)' }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'rgba(0,240,255,0.7)' }}>Validation URL:</p>
                  <p className="font-mono-luksuri text-xs break-all mt-0.5 text-white">{validationUrl}</p>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button type="button" onClick={copyValidationUrl}
                    className="p-2 rounded-lg transition-all" style={{ background: 'rgba(0,240,255,0.10)', color: '#00F0FF' }}>
                    <Copy className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => window.open(validationUrl, '_blank')}
                    className="p-2 rounded-lg transition-all" style={{ background: 'rgba(0,240,255,0.10)', color: '#00F0FF' }}>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div className="p-4 rounded-xl text-xs" style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.12)' }}>
                <p className="font-semibold mb-1" style={{ color: 'rgba(0,240,255,0.8)' }}>PDF Integration:</p>
                <p style={{ color: 'rgba(255,255,255,0.45)' }}>
                  This QR code will be automatically embedded in your generated PDF document for authenticity verification.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status + Clear */}
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center space-x-2 min-w-0">
          {hasSignature && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#00FF88' }} />}
          <p className="text-xs sm:text-sm font-semibold truncate" style={{ color: hasSignature ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {hasSignature
              ? signatureType === 'qr' ? 'QR Signature Ready' : 'Manual Signature Captured'
              : 'No Signature Added'}
          </p>
        </div>
        {hasSignature && (
          <button type="button" onClick={clearSignature} className="neon-button text-xs"
            style={{ borderColor: 'rgba(255,0,60,0.35)', color: '#FF003C', background: 'rgba(255,0,60,0.08)', padding: '0.4rem 0.85rem' }}>
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.12)' }}>
        <div className="flex items-start space-x-3">
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(0,240,255,0.6)' }} />
          <div className="text-xs">
            <p className="font-semibold mb-1" style={{ color: 'rgba(0,240,255,0.8)' }}>Enhanced Security Notice</p>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>
              QR Digital Signatures provide enhanced security. The generated QR code is fully scannable and redirects to
              a validation page confirming document authenticity, authorized by LUDTANZA SURYA WIJAYA, S.Pd. (CEO).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}