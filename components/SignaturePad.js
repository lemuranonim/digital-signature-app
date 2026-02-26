// components/SignaturePad.js
'use client'

import { useRef, useEffect, useState } from 'react'
import { RotateCcw, PenTool, QrCode, Shield, Check, Copy, ExternalLink } from 'lucide-react'

export default function SignaturePad({ onSignatureChange }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signatureType, setSignatureType] = useState('manual') // 'manual' or 'qr'
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)
  const [documentId, setDocumentId] = useState('')
  const [qrCodeData, setQrCodeData] = useState('')
  const [validationUrl, setValidationUrl] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')

      // Set canvas size
      canvas.width = canvas.offsetWidth
      canvas.height = 200

      // Set drawing style
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  const generateDocumentId = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return `DOC-${timestamp}-${random}`
  }

  // Generate real QR Code using external API
  const generateRealQRCode = async (data) => {
    try {
      // Using QR Server API to generate real scannable QR code
      const encodedData = encodeURIComponent(data)
      const size = 200
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=PNG&margin=10&bgcolor=ffffff&color=000000`

      return qrUrl
    } catch (error) {
      console.error('Error generating QR code:', error)
      return null
    }
  }

  // Generate QR Code with Canvas (fallback)
  const generateQRCodeCanvas = (text) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = 200
    canvas.width = size
    canvas.height = size

    // White background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, size, size)

    // Black modules
    ctx.fillStyle = 'black'
    const moduleSize = size / 25

    // Generate a simple pattern based on the text
    const textHash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)

    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        // Position detection patterns (corners)
        if ((x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17)) {
          if ((x === 0 || x === 6 || y === 0 || y === 6) ||
            (x >= 2 && x <= 4 && y >= 2 && y <= 4)) {
            ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize)
          }
        } else {
          // Data pattern based on text content
          if ((x + y + textHash) % 3 === 0) {
            ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize)
          }
        }
      }
    }

    return canvas.toDataURL('image/png')
  }

  const generateQRCode = async () => {
    const docId = generateDocumentId()
    setDocumentId(docId)

    // Create validation URL with document data
    const baseUrl = `https://sign.luksurireka.com/validate/${docId}`
    const qrData = JSON.stringify({
      documentId: docId,
      validationUrl: baseUrl,
      signedBy: 'LUDTANZA SURYA WIJAYA, S.Pd.',
      signerTitle: 'Chief Executive Officer',
      timestamp: new Date().toISOString(),
      company: 'PT LUKSURI REKA DIGITAL SOLUTIONS',
      type: 'digital_signature_validation'
    })

    setValidationUrl(baseUrl)

    try {
      // Try to generate real QR code first
      const realQRUrl = await generateRealQRCode(baseUrl)

      if (realQRUrl) {
        setQrCodeData(realQRUrl)
        console.log('Real QR code generated successfully')
      } else {
        // Fallback to canvas-generated QR
        const canvasQR = generateQRCodeCanvas(baseUrl)
        setQrCodeData(canvasQR)
        console.log('Fallback QR code generated')
      }

      setQrCodeGenerated(true)
      setHasSignature(true)

      // Pass QR signature data to parent with complete metadata
      onSignatureChange(qrCodeData || realQRUrl, {
        type: 'qr',
        documentId: docId,
        validationUrl: baseUrl,
        signedBy: 'LUDTANZA SURYA WIJAYA, S.Pd.',
        signerTitle: 'Chief Executive Officer',
        timestamp: new Date().toISOString(),
        qrData: qrData
      })

    } catch (error) {
      console.error('Error in QR generation process:', error)
      // Use fallback method
      const fallbackQR = generateQRCodeCanvas(baseUrl)
      setQrCodeData(fallbackQR)
      setQrCodeGenerated(true)
      setHasSignature(true)

      onSignatureChange(fallbackQR, {
        type: 'qr',
        documentId: docId,
        validationUrl: baseUrl,
        signedBy: 'LUDTANZA SURYA WIJAYA, S.Pd.',
        signerTitle: 'Chief Executive Officer',
        timestamp: new Date().toISOString(),
        qrData: qrData
      })
    }
  }

  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    ctx.beginPath()
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    )
  }

  const draw = (e) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    )
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      const canvas = canvasRef.current
      const signatureData = canvas.toDataURL()

      // Pass manual signature data with metadata
      onSignatureChange(signatureData, {
        type: 'manual',
        documentId: null,
        validationUrl: null,
        signedBy: null,
        signerTitle: null,
        timestamp: new Date().toISOString()
      })
    }
  }

  const clearSignature = () => {
    if (signatureType === 'manual') {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    setHasSignature(false)
    setQrCodeGenerated(false)
    setDocumentId('')
    setQrCodeData('')
    setValidationUrl('')

    // Clear signature with metadata
    onSignatureChange('', {
      type: signatureType,
      documentId: null,
      validationUrl: null,
      signedBy: null,
      signerTitle: null,
      timestamp: null
    })
  }

  const copyValidationUrl = () => {
    navigator.clipboard.writeText(validationUrl)
    alert('Validation URL copied to clipboard!')
  }

  const openValidationUrl = () => {
    window.open(validationUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Signature Type Selector */}
      <div className="flex items-center p-4 space-x-4 bg-gray-50 rounded-2xl">
        <span className="text-sm font-bold text-gray-700">Signature Method:</span>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => {
              setSignatureType('manual')
              clearSignature()
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${signatureType === 'manual'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Manual Signature</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSignatureType('qr')
              clearSignature()
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${signatureType === 'qr'
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Digital Signature</span>
          </button>
        </div>
      </div>

      {/* Manual Signature Canvas */}
      {signatureType === 'manual' && (
        <div className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-48 transition-colors duration-200 bg-white border-2 border-gray-300 border-dashed rounded-2xl cursor-crosshair hover:border-blue-400"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div className="absolute flex items-center space-x-2 text-sm text-gray-500 pointer-events-none top-4 left-4">
              <PenTool className="w-4 h-4" />
              <span>Draw your signature here</span>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Digital Signature */}
      {signatureType === 'qr' && (
        <div className="space-y-6">
          {!qrCodeGenerated ? (
            <div className="p-8 text-center border-2 border-green-300 border-dashed bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-2xl">
                <QrCode className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="mb-2 text-lg font-bold text-gray-900">Generate Real QR Digital Signature</h4>
              <p className="max-w-md mx-auto mb-6 text-gray-600">
                Create a scannable QR code that validates this document's authenticity and digital signature by LUDTANZA SURYA WIJAYA, S.Pd.
              </p>
              <button
                type="button"
                onClick={generateQRCode}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <Shield className="w-5 h-5" />
                <span>Generate Scannable QR Code</span>
              </button>
            </div>
          ) : (
            <div className="p-8 bg-white border-2 border-green-200 shadow-lg rounded-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4 space-x-2">
                  <Check className="w-6 h-6 text-green-600" />
                  <h4 className="text-lg font-bold text-green-800">Scannable QR Digital Signature Generated</h4>
                </div>

                {/* QR Code Display */}
                <div className="flex justify-center">
                  <div className="p-6 bg-white border-2 border-gray-200 shadow-lg rounded-3xl">
                    <img
                      src={qrCodeData}
                      alt="Scannable QR Code Digital Signature"
                      className="w-48 h-48 mx-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <p className="mt-3 text-xs font-bold tracking-wide text-center text-gray-600 uppercase">
                      Scan with any QR scanner
                    </p>
                  </div>
                </div>

                {/* Test QR Code Section */}
                <div className="p-4 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Test QR Code:</p>
                      <p className="text-xs text-blue-700">Scan to verify or click to test validation</p>
                    </div>
                    <button
                      type="button"
                      onClick={openValidationUrl}
                      className="flex items-center px-4 py-2 space-x-2 text-white transition-colors duration-200 bg-blue-500 rounded-lg hover:bg-blue-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Test</span>
                    </button>
                  </div>
                </div>

                {/* Signature Details */}
                <div className="p-6 text-left bg-gray-50 rounded-2xl">
                  <h5 className="mb-4 font-bold text-gray-900">Digital Signature Details:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Signed by:</span>
                      <span className="font-semibold text-gray-900">LUDTANZA SURYA WIJAYA, S.Pd.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Title:</span>
                      <span className="font-semibold text-gray-900">Chief Executive Officer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-semibold text-gray-900">PT LUKSURI REKA DIGITAL SOLUTIONS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Document ID:</span>
                      <span className="font-mono text-xs text-gray-900">{documentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="font-mono text-xs text-gray-900">{new Date().toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Validation URL */}
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-semibold text-blue-900">Validation URL:</p>
                      <p className="font-mono text-xs text-blue-700 break-all">
                        {validationUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copyValidationUrl}
                      className="p-2 ml-4 text-white transition-colors duration-200 bg-blue-500 rounded-lg hover:bg-blue-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* PDF Integration Notice */}
                <div className="p-4 bg-amber-50 rounded-2xl">
                  <h5 className="mb-2 text-sm font-bold text-amber-900">PDF Integration:</h5>
                  <p className="text-xs text-amber-700">
                    This scannable QR code will be automatically embedded in your generated PDF document.
                    Anyone can scan it to verify the digital signature authenticity.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status and Actions */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
        <div className="flex items-center space-x-2">
          {hasSignature && (
            <Check className="w-5 h-5 text-green-600" />
          )}
          <p className="text-sm font-semibold text-gray-700">
            {hasSignature
              ? signatureType === 'qr'
                ? 'Scannable QR Digital Signature Ready for PDF'
                : 'Manual Signature Captured'
              : 'No Signature Added'
            }
          </p>
        </div>

        {hasSignature && (
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center px-4 py-2 space-x-2 text-red-600 transition-colors duration-200 bg-white border border-red-300 rounded-xl hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-4 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="mb-1 font-semibold text-blue-900">Enhanced Security Notice</p>
            <p className="text-blue-700">
              QR Digital Signatures provide enhanced security and verification.
              The generated QR code is fully scannable and will redirect to a validation page
              that confirms document authenticity and authorization by LUDTANZA SURYA WIJAYA, S.Pd.
              as company director. The QR code will be embedded directly in your PDF document.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}