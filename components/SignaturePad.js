// components/SignaturePad.js
'use client'

import { useRef, useEffect, useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'

export default function SignaturePad({ onSignatureChange }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = 200
    
    // Set drawing style
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

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
      onSignatureChange(signatureData)
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onSignatureChange('')
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <div className="absolute top-2 left-2 text-sm text-gray-500 pointer-events-none">
          Tanda tangan di sini
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {hasSignature ? 'Tanda tangan tersimpan' : 'Belum ada tanda tangan'}
        </p>
        <button
          type="button"
          onClick={clearSignature}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  )
}

// utils/pdfGenerator.js
import jsPDF from 'jspdf'

export const generateInvoicePDF = async (invoiceData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Company header
  pdf.setFillColor(6, 79, 161) // Primary blue
  pdf.rect(0, 0, 210, 40, 'F')
  
  // Company name
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PT LUKSURI REKA', 20, 20)
  pdf.setFontSize(12)
  pdf.text('DIGITAL SOLUTIONS', 20, 28)
  
  // Invoice title
  pdf.setFontSize(18)
  pdf.text('INVOICE', 150, 25)
  
  // Reset text color
  pdf.setTextColor(0, 0, 0)
  
  // Company details
  pdf.setFontSize(10)
  pdf.text('Jl. Teknologi Digital No. 123', 20, 50)
  pdf.text('Jakarta Selatan 12345', 20, 55)
  pdf.text('Tel: +62 21 1234 5678', 20, 60)
  pdf.text('Email: info@luksurireka.com', 20, 65)
  
  // Invoice details
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Invoice: ${invoiceData.invoiceNumber}`, 150, 50)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Tanggal: ${new Date(invoiceData.issueDate).toLocaleDateString('id-ID')}`, 150, 55)
  pdf.text(`Jatuh Tempo: ${new Date(invoiceData.dueDate).toLocaleDateString('id-ID')}`, 150, 60)
  
  // Client details
  pdf.setFont('helvetica', 'bold')
  pdf.text('TAGIHAN KEPADA:', 20, 80)
  pdf.setFont('helvetica', 'normal')
  pdf.text(invoiceData.clientName, 20, 88)
  if (invoiceData.clientAddress) {
    const addressLines = pdf.splitTextToSize(invoiceData.clientAddress, 80)
    pdf.text(addressLines, 20, 95)
  }
  if (invoiceData.clientPhone) {
    pdf.text(`Tel: ${invoiceData.clientPhone}`, 20, 110)
  }
  if (invoiceData.clientEmail) {
    pdf.text(`Email: ${invoiceData.clientEmail}`, 20, 115)
  }
  
  // Items table header
  let yPosition = 130
  pdf.setFillColor(240, 240, 240)
  pdf.rect(20, yPosition, 170, 10, 'F')
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('Deskripsi', 25, yPosition + 7)
  pdf.text('Qty', 120, yPosition + 7)
  pdf.text('Harga Satuan', 140, yPosition + 7)
  pdf.text('Total', 175, yPosition + 7)
  
  // Items
  yPosition += 15
  pdf.setFont('helvetica', 'normal')
  
  invoiceData.items.forEach((item) => {
    const descLines = pdf.splitTextToSize(item.description, 90)
    pdf.text(descLines, 25, yPosition)
    pdf.text(item.quantity.toString(), 125, yPosition)
    pdf.text(`Rp ${item.unitPrice.toLocaleString('id-ID')}`, 145, yPosition)
    pdf.text(`Rp ${(item.quantity * item.unitPrice).toLocaleString('id-ID')}`, 175, yPosition)
    
    yPosition += Math.max(descLines.length * 5, 8)
  })
  
  // Totals
  yPosition += 10
  pdf.line(120, yPosition, 190, yPosition)
  yPosition += 8
  
  pdf.text('Subtotal:', 140, yPosition)
  pdf.text(`Rp ${invoiceData.subtotal.toLocaleString('id-ID')}`, 175, yPosition)
  yPosition += 6
  
  if (invoiceData.discountAmount > 0) {
    pdf.text('Diskon:', 140, yPosition)
    pdf.text(`-Rp ${invoiceData.discountAmount.toLocaleString('id-ID')}`, 175, yPosition)
    yPosition += 6
  }
  
  pdf.text(`Pajak (${invoiceData.taxRate || 11}%):`, 140, yPosition)
  pdf.text(`Rp ${invoiceData.taxAmount.toLocaleString('id-ID')}`, 175, yPosition)
  yPosition += 8
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('TOTAL:', 140, yPosition)
  pdf.text(`Rp ${invoiceData.total.toLocaleString('id-ID')}`, 175, yPosition)
  
  // Notes
  if (invoiceData.notes) {
    yPosition += 15
    pdf.setFont('helvetica', 'bold')
    pdf.text('Catatan:', 20, yPosition)
    yPosition += 5
    pdf.setFont('helvetica', 'normal')
    const notesLines = pdf.splitTextToSize(invoiceData.notes, 170)
    pdf.text(notesLines, 20, yPosition)
    yPosition += notesLines.length * 5
  }
  
  // Signature
  if (invoiceData.signature) {
    yPosition += 15
    pdf.text('Hormat kami,', 20, yPosition)
    
    // Add signature image
    try {
      pdf.addImage(invoiceData.signature, 'PNG', 20, yPosition + 5, 60, 30)
    } catch (error) {
      console.error('Error adding signature:', error)
    }
    
    yPosition += 40
    pdf.text('PT LUKSURI REKA DIGITAL SOLUTIONS', 20, yPosition)
  }
  
  // Footer
  pdf.setFontSize(8)
  pdf.setTextColor(128, 128, 128)
  pdf.text('Terima kasih atas kepercayaan Anda', 105, 280, { align: 'center' })
  
  // Save PDF
  pdf.save(`Invoice-${invoiceData.invoiceNumber}.pdf`)
}

export const generateReceiptPDF = async (receiptData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Company header
  pdf.setFillColor(245, 158, 11) // Luxury gold
  pdf.rect(0, 0, 210, 40, 'F')
  
  // Company name
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PT LUKSURI REKA', 20, 20)
  pdf.setFontSize(12)
  pdf.text('DIGITAL SOLUTIONS', 20, 28)
  
  // Receipt title
  pdf.setFontSize(20)
  pdf.text('KWITANSI', 150, 25)
  
  // Reset text color
  pdf.setTextColor(0, 0, 0)
  
  // Company details
  pdf.setFontSize(10)
  pdf.text('Jl. Teknologi Digital No. 123', 20, 50)
  pdf.text('Jakarta Selatan 12345', 20, 55)
  pdf.text('Tel: +62 21 1234 5678', 20, 60)
  pdf.text('Email: info@luksurireka.com', 20, 65)
  
  // Receipt details
  pdf.setFont('helvetica', 'bold')
  pdf.text(`No. Kwitansi: ${receiptData.receiptNumber}`, 20, 80)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Tanggal: ${new Date(receiptData.paymentDate).toLocaleDateString('id-ID')}`, 20, 88)
  
  if (receiptData.invoiceData) {
    pdf.text(`Ref. Invoice: ${receiptData.invoiceData.invoice_number}`, 20, 96)
  }
  
  // Main content box
  pdf.setLineWidth(0.5)
  pdf.rect(20, 110, 170, 80)
  
  // Receipt content
  let yPosition = 125
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text('Telah terima dari:', 25, yPosition)
  yPosition += 8
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.text(receiptData.payerName, 25, yPosition)
  
  yPosition += 15
  pdf.setFont('helvetica', 'bold')
  pdf.text('Sejumlah:', 25, yPosition)
  yPosition += 8
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')}`, 25, yPosition)
  
  yPosition += 10
  pdf.setFont('helvetica', 'bold')
  pdf.text('Terbilang:', 25, yPosition)
  yPosition += 8
  pdf.setFont('helvetica', 'normal')
  const terbilangLines = pdf.splitTextToSize(receiptData.amountWords, 160)
  pdf.text(terbilangLines, 25, yPosition)
  
  yPosition += terbilangLines.length * 5 + 5
  pdf.setFont('helvetica', 'bold')
  pdf.text('Untuk pembayaran:', 25, yPosition)
  yPosition += 8
  pdf.setFont('helvetica', 'normal')
  const descLines = pdf.splitTextToSize(receiptData.description, 160)
  pdf.text(descLines, 25, yPosition)
  
  // Payment method
  yPosition = 200
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Metode Pembayaran: ${receiptData.paymentMethod}`, 25, yPosition)
  
  // Signature area
  yPosition += 20
  pdf.text('Jakarta, ' + new Date(receiptData.paymentDate).toLocaleDateString('id-ID'), 120, yPosition)
  yPosition += 5
  pdf.text('Yang menerima,', 120, yPosition)
  
  // Add signature image
  if (receiptData.signature) {
    try {
      pdf.addImage(receiptData.signature, 'PNG', 120, yPosition + 5, 60, 30)
    } catch (error) {
      console.error('Error adding signature:', error)
    }
    yPosition += 35
  } else {
    yPosition += 30
  }
  
  pdf.text('PT LUKSURI REKA DIGITAL SOLUTIONS', 120, yPosition)
  
  // Decorative border
  pdf.setLineWidth(1)
  pdf.setDrawColor(245, 158, 11) // Luxury gold
  pdf.rect(15, 15, 180, 250)
  
  // Footer
  pdf.setFontSize(8)
  pdf.setTextColor(128, 128, 128)
  pdf.text('Kwitansi ini sah tanpa tanda tangan basah', 105, 280, { align: 'center' })
  
  // Save PDF
  pdf.save(`Kwitansi-${receiptData.receiptNumber}.pdf`)
}