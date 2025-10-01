import jsPDF from 'jspdf'

const LOGO_BASE64 = 'data:image/png;base64,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'

// Color palette yang lebih simple
const COLORS = {
  primary: [0, 0, 0],           // Black
  secondary: [100, 100, 100],   // Gray
  lightGray: [240, 240, 240],   // Light background
  border: [220, 220, 220]       // Border
}

// Helper function untuk font
const setFont = (pdf, weight = 'normal', size = 10) => {
  pdf.setFont('helvetica', weight)
  pdf.setFontSize(size)
}

// Generate QR Code
const generateQRCode = async (data, size = 100) => {
  try {
    const qrData = encodeURIComponent(data)
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${qrData}&format=PNG&margin=10`
  } catch (error) {
    console.error('Error generating QR code:', error)
    return null
  }
}

// Add QR signature section
const addQRSignature = async (pdf, signatureData, yPos) => {
  if (!signatureData || !signatureData.signature) return yPos
  
  const isQRSignature = (signatureData.signatureType === 'qr') || 
                       (signatureData.signatureMetadata && signatureData.signatureMetadata.type === 'qr')
  
  if (isQRSignature) {
    try {
      const documentId = signatureData.signatureMetadata?.documentId || `DOC-${Date.now()}`
      const validationUrl = `https://digital-signature-app-theta.vercel.app/validate/${documentId}`
      
      // Generate QR code
      const qrCodeUrl = await generateQRCode(validationUrl, 100)
      
      if (qrCodeUrl) {
        // QR Code image
        pdf.addImage(qrCodeUrl, 'PNG', 20, yPos, 25, 25)
        
        // QR label
        setFont(pdf, 'normal', 7)
        pdf.setTextColor(...COLORS.secondary)
        pdf.text('Scan to verify', 32.5, yPos + 28, { align: 'center' })
        
        // Signature details - next to QR
        const signerName = signatureData.signatureMetadata?.signedBy || 'LUDTANZA SURYA WIJAYA, S.Pd.'
        const signerTitle = signatureData.signatureMetadata?.signerTitle || 'Direktur'
        
        setFont(pdf, 'normal', 8)
        pdf.setTextColor(...COLORS.primary)
        pdf.text('Digitally signed by:', 50, yPos + 5)
        
        setFont(pdf, 'bold', 9)
        pdf.text(signerName, 50, yPos + 11)
        
        setFont(pdf, 'normal', 8)
        pdf.text(signerTitle, 50, yPos + 16)
        
        // Timestamp
        const signatureDate = signatureData.signatureMetadata?.timestamp ? 
          new Date(signatureData.signatureMetadata.timestamp) : new Date()
        
        setFont(pdf, 'normal', 7)
        pdf.setTextColor(...COLORS.secondary)
        pdf.text(`Signed: ${signatureDate.toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, yPos + 21)
      }
    } catch (error) {
      console.error('Error adding QR signature:', error)
    }
  }
  
  return yPos + 30
}

export const generateInvoicePDF = async (invoiceData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  let yPos = 20

  // Header - Simple (di kiri)
  setFont(pdf, 'bold', 24)
  pdf.setTextColor(...COLORS.primary)
  pdf.text('Invoice', 20, yPos + 10)

  // Add Logo (top right, sejajar dengan Invoice)
  try {
    pdf.addImage(LOGO_BASE64, 'PNG', 160, yPos, 30, 30)
  } catch (error) {
    console.error('Error adding logo:', error)
  }
  
  yPos += 40
  
  // Invoice details - kanan atas
  setFont(pdf, 'normal', 10)
  pdf.text(`Invoice number  ${invoiceData.invoiceNumber}`, 20, yPos)
  yPos += 6
  pdf.text(`Date of issue     ${new Date(invoiceData.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPos)
  yPos += 6
  pdf.text(`Date due            ${new Date(invoiceData.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPos)
  
  yPos += 15
  
  // Company info
  setFont(pdf, 'bold', 11)
  pdf.text('PT LUKSURI REKA DIGITAL SOLUTIONS', 20, yPos)
  yPos += 6
  
  setFont(pdf, 'normal', 9)
  pdf.text('Kedungwilut No. 3 001/002', 20, yPos)
  yPos += 5
  pdf.text('Kec. Bandung, Tulungagung, Jawa Timur, 66274', 20, yPos)
  yPos += 5
  pdf.text('Indonesia', 20, yPos)
  yPos += 5
  pdf.text('luksurireka@gmail.com', 20, yPos)
  
  // Client info - kanan
  const clientY = yPos - 30
  setFont(pdf, 'bold', 11)
  pdf.text('Bill to', 110, clientY)
  
  setFont(pdf, 'normal', 9)
  let clientYPos = clientY + 6
  pdf.text(invoiceData.clientName, 110, clientYPos)
  clientYPos += 5
  
  if (invoiceData.clientAddress) {
    const addressLines = pdf.splitTextToSize(invoiceData.clientAddress, 80)
    addressLines.forEach(line => {
      pdf.text(line, 110, clientYPos)
      clientYPos += 5
    })
  }
  
  if (invoiceData.clientEmail) {
    pdf.text(invoiceData.clientEmail, 110, clientYPos)
    clientYPos += 5
  }
  
  if (invoiceData.clientTaxId) {
    pdf.text(`ID NPWP ${invoiceData.clientTaxId}`, 110, clientYPos)
  }
  
  yPos += 25
  
  // Amount due - highlighted
  pdf.setFillColor(...COLORS.lightGray)
  pdf.rect(20, yPos, 170, 12, 'F')
  
  setFont(pdf, 'bold', 14)
  pdf.setTextColor(...COLORS.primary)
  pdf.text(`Rp ${invoiceData.total.toLocaleString('id-ID')} IDR`, 25, yPos + 8)
  
  yPos += 20
  
  // Table header
  pdf.setDrawColor(...COLORS.border)
  pdf.line(20, yPos, 190, yPos)
  yPos += 8
  
  setFont(pdf, 'bold', 9)
  pdf.text('Description', 20, yPos)
  pdf.text('Qty', 130, yPos, { align: 'right' })
  pdf.text('Unit price', 155, yPos, { align: 'right' })
  pdf.text('Amount', 185, yPos, { align: 'right' })
  
  yPos += 8
  
  // Items
  setFont(pdf, 'normal', 9)
  invoiceData.items.forEach(item => {
    pdf.text(item.description, 20, yPos)
    pdf.text(item.quantity.toString(), 130, yPos, { align: 'right' })
    pdf.text(`Rp ${item.unitPrice.toLocaleString('id-ID')}`, 155, yPos, { align: 'right' })
    pdf.text(`Rp ${(item.quantity * item.unitPrice).toLocaleString('id-ID')}`, 185, yPos, { align: 'right' })
    yPos += 6
  })
  
  yPos += 5
  pdf.line(20, yPos, 190, yPos)
  yPos += 8
  
  // Totals
  pdf.text('Subtotal', 130, yPos)
  pdf.text(`Rp ${invoiceData.subtotal.toLocaleString('id-ID')}`, 185, yPos, { align: 'right' })
  yPos += 6
  
  if (invoiceData.discountAmount > 0) {
    pdf.text('Discount', 130, yPos)
    pdf.text(`-Rp ${invoiceData.discountAmount.toLocaleString('id-ID')}`, 185, yPos, { align: 'right' })
    yPos += 6
  }
  
  pdf.text(`Tax (${invoiceData.taxRate || 11}%)`, 130, yPos)
  pdf.text(`Rp ${invoiceData.taxAmount.toLocaleString('id-ID')}`, 185, yPos, { align: 'right' })
  yPos += 6
  
  setFont(pdf, 'bold', 10)
  pdf.text('Amount due', 130, yPos)
  pdf.text(`Rp ${invoiceData.total.toLocaleString('id-ID')} IDR`, 185, yPos, { align: 'right' })
  
  yPos += 10
  pdf.line(20, yPos, 190, yPos)
  
  // Notes if any
  if (invoiceData.notes) {
    yPos += 10
    setFont(pdf, 'bold', 9)
    pdf.setTextColor(...COLORS.primary)
    pdf.text('Notes:', 20, yPos)
    
    yPos += 6
    setFont(pdf, 'normal', 8)
    const notesLines = pdf.splitTextToSize(invoiceData.notes, 170)
    notesLines.forEach(line => {
      pdf.text(line, 20, yPos)
      yPos += 5
    })
  }

  // Move to bottom for signature
  yPos = 255 // Fixed position near bottom

  // Payment details - kanan bawah
  const paymentYPos = yPos + 5
  setFont(pdf, 'bold', 10)
  pdf.setTextColor(...COLORS.primary)
  pdf.text('Payment Method', 110, paymentYPos)
  
  setFont(pdf, 'bold', 9)
  pdf.text('Bank Central Asia (BCA)', 110, paymentYPos + 6)
  
  setFont(pdf, 'normal', 8)
  pdf.setTextColor(...COLORS.secondary)
  pdf.text('Account Name:', 110, paymentYPos + 12)
  pdf.text('LUKSURI REKA DIGITAL SOLUTIONS', 140, paymentYPos + 12)
  
  pdf.text('Account Number:', 110, paymentYPos + 17)
  pdf.text('6005081266', 140, paymentYPos + 17)
  
  pdf.text('Branch:', 110, paymentYPos + 22)
  pdf.text('Tulungagung', 140, paymentYPos + 22)

  // QR Signature
  await addQRSignature(pdf, invoiceData, yPos)
  
  // Footer
  yPos = 290
  setFont(pdf, 'normal', 8)
  pdf.setTextColor(...COLORS.secondary)
  pdf.text('To learn more about or to discuss your invoice, please visit luksurireka.com/help', 20, yPos)
  
  pdf.save(`Invoice-${invoiceData.invoiceNumber}.pdf`)
}

export const generateReceiptPDF = async (receiptData) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  let yPos = 20
  
  // Header
  setFont(pdf, 'bold', 24)
  pdf.setTextColor(...COLORS.primary)
  pdf.text('Receipt', 20, yPos)
  
  yPos += 15
  
  // Receipt details
  setFont(pdf, 'normal', 10)
  pdf.text(`Invoice number  ${receiptData.receiptNumber}`, 20, yPos)
  yPos += 6
  pdf.text(`Date paid          ${new Date(receiptData.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPos)
  
  yPos += 15
  
  // Company info
  setFont(pdf, 'bold', 11)
  pdf.text('PT LUKSURI REKA DIGITAL SOLUTIONS', 20, yPos)
  yPos += 6
  
  setFont(pdf, 'normal', 9)
  pdf.text('Kedungwilut No. 3 001/002', 20, yPos)
  yPos += 5
  pdf.text('Kec. Bandung, Tulungagung, Jawa Timur, 66274', 20, yPos)
  yPos += 5
  pdf.text('Indonesia', 20, yPos)
  yPos += 5
  pdf.text('luksurireka@gmail.com', 20, yPos)
  
  // Bill to
  const clientY = yPos - 30
  setFont(pdf, 'bold', 11)
  pdf.text('Bill to', 110, clientY)
  
  setFont(pdf, 'normal', 9)
  let clientYPos = clientY + 6
  pdf.text(receiptData.payerName, 110, clientYPos)
  clientYPos += 5
  
  if (receiptData.payerAddress) {
    const addressLines = pdf.splitTextToSize(receiptData.payerAddress, 80)
    addressLines.forEach(line => {
      pdf.text(line, 110, clientYPos)
      clientYPos += 5
    })
  }
  
  yPos += 25
  
  // Amount paid - highlighted
  pdf.setFillColor(...COLORS.lightGray)
  pdf.rect(20, yPos, 170, 12, 'F')
  
  setFont(pdf, 'bold', 14)
  pdf.setTextColor(...COLORS.primary)
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')} paid on ${new Date(receiptData.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 25, yPos + 8)
  
  yPos += 20
  
  // Table
  pdf.setDrawColor(...COLORS.border)
  pdf.line(20, yPos, 190, yPos)
  yPos += 8
  
  setFont(pdf, 'bold', 9)
  pdf.text('Description', 20, yPos)
  pdf.text('Qty', 130, yPos, { align: 'right' })
  pdf.text('Unit price', 155, yPos, { align: 'right' })
  pdf.text('Amount', 185, yPos, { align: 'right' })
  
  yPos += 8
  setFont(pdf, 'normal', 9)
  pdf.text(receiptData.description, 20, yPos)
  pdf.text('1', 130, yPos, { align: 'right' })
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')}`, 155, yPos, { align: 'right' })
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')}`, 185, yPos, { align: 'right' })
  
  yPos += 8
  pdf.line(20, yPos, 190, yPos)
  yPos += 8
  
  // Totals
  pdf.text('Subtotal', 130, yPos)
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')}`, 185, yPos, { align: 'right' })
  yPos += 6
  
  pdf.text('Total', 130, yPos)
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')}`, 185, yPos, { align: 'right' })
  yPos += 6
  
  setFont(pdf, 'bold', 10)
  pdf.text('Amount paid', 130, yPos)
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')}`, 185, yPos, { align: 'right' })
  
  yPos += 10
  pdf.line(20, yPos, 190, yPos)
  
  // Payment history
  yPos += 15
  setFont(pdf, 'bold', 14)
  pdf.text('Payment history', 20, yPos)
  
  yPos += 10
  pdf.setDrawColor(...COLORS.border)
  pdf.line(20, yPos, 190, yPos)
  yPos += 8
  
  setFont(pdf, 'bold', 9)
  pdf.text('Payment method', 20, yPos)
  pdf.text('Date', 80, yPos)
  pdf.text('Amount paid', 130, yPos)
  pdf.text('Receipt number', 160, yPos)
  
  yPos += 8
  setFont(pdf, 'normal', 9)
  pdf.text(receiptData.paymentMethod, 20, yPos)
  pdf.text(new Date(receiptData.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 80, yPos)
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')}`, 130, yPos)
  pdf.text(receiptData.receiptNumber, 160, yPos)
  
  // Move to bottom for signature
  yPos = 250
  
  // QR Signature
  await addQRSignature(pdf, receiptData, yPos)
  
  // Footer
  yPos = 285
  setFont(pdf, 'normal', 8)
  pdf.setTextColor(...COLORS.secondary)
  pdf.text('To learn more about or to discuss your invoice, please visit luksurireka.com/help', 20, yPos)
  
  pdf.save(`Receipt-${receiptData.receiptNumber}.pdf`)
}