import jsPDF from 'jspdf'

// Premium color palette
const COLORS = {
  primary: [18, 27, 45],        // Dark navy blue
  secondary: [165, 138, 95],    // Luxury gold
  accent: [245, 245, 247],      // Light gray
  text: [45, 55, 72],           // Dark gray
  lightText: [107, 114, 128],   // Medium gray
  white: [255, 255, 255],
  border: [229, 231, 235]       // Light border
}

// Premium fonts helper
const setPremiumFont = (pdf, weight = 'normal', size = 10) => {
  pdf.setFont('helvetica', weight)
  pdf.setFontSize(size)
}

// Generate Real QR Code using external service
const generateRealQRCode = async (data, size = 200) => {
  try {
    const qrData = encodeURIComponent(data)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${qrData}&format=PNG&margin=10`
    return qrUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    return null
  }
}

// Generate QR Code Canvas (fallback method)
const generateQRCodeCanvas = (text, size = 200) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = size
  canvas.height = size
  
  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, size, size)
  
  // Black modules
  ctx.fillStyle = 'black'
  const cellSize = size / 25
  
  // Position markers
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if ((i === 0 || i === 6 || j === 0 || j === 6) || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
        ctx.fillRect((size - (i + 1) * cellSize), j * cellSize, cellSize, cellSize)
        ctx.fillRect(i * cellSize, (size - (j + 1) * cellSize), cellSize, cellSize)
      }
    }
  }
  
  // Data pattern
  for (let i = 8; i < 17; i++) {
    for (let j = 8; j < 17; j++) {
      if ((i + j + text.length) % 3 === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
      }
    }
  }
  
  return canvas.toDataURL('image/png')
}

// Add premium gradient header
const addGradientHeader = (pdf, height = 50) => {
  pdf.setFillColor(...COLORS.primary)
  pdf.rect(0, 0, 216, height, 'F')  // F4 width
  
  pdf.setFillColor(...COLORS.secondary)
  pdf.setGState(new pdf.GState({opacity: 0.1}))
  pdf.rect(0, height - 15, 216, 15, 'F')
  pdf.setGState(new pdf.GState({opacity: 1}))
}

// Add premium border design for F4
const addPremiumBorder = (pdf) => {
  pdf.setLineWidth(2)
  pdf.setDrawColor(...COLORS.secondary)
  pdf.rect(10, 10, 196, 310)  // F4 dimensions (216-20, 330-20)
  
  pdf.setLineWidth(0.5)
  pdf.setDrawColor(...COLORS.border)
  pdf.rect(15, 15, 186, 300)  // Inner border
}

// Create premium table for F4
const createPremiumTable = (pdf, headers, rows, startY, colWidths) => {
  let currentY = startY
  
  // Table header
  pdf.setFillColor(...COLORS.accent)
  pdf.rect(20, currentY, 176, 12, 'F')  // F4 table width
  
  // Header border
  pdf.setLineWidth(0.5)
  pdf.setDrawColor(...COLORS.border)
  pdf.line(20, currentY, 196, currentY)
  pdf.line(20, currentY + 12, 196, currentY + 12)
  
  // Header text
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'bold', 10)
  
  let xPos = 25
  headers.forEach((header, index) => {
    pdf.text(header, xPos, currentY + 8)
    xPos += colWidths[index] || 40
  })
  
  currentY += 15
  
  // Table rows
  setPremiumFont(pdf, 'normal', 9)
  rows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 1) {
      pdf.setFillColor(252, 252, 252)
      pdf.rect(20, currentY - 2, 176, 10, 'F')
    }
    
    xPos = 25
    row.forEach((cell, cellIndex) => {
      pdf.text(cell.toString(), xPos, currentY + 5)
      xPos += colWidths[cellIndex] || 40
    })
    
    currentY += 10
  })
  
  // Table bottom border
  pdf.setDrawColor(...COLORS.border)
  pdf.line(20, currentY, 196, currentY)
  
  return currentY + 5
}

export const generateInvoicePDF = async (invoiceData) => {
  // Create F4 PDF (216 x 330 mm)
  const pdf = new jsPDF('p', 'mm', [216, 330])
  
  addPremiumBorder(pdf)
  addGradientHeader(pdf, 55)
  
  // Company logo area
  pdf.setFillColor(...COLORS.white)
  pdf.setGState(new pdf.GState({opacity: 0.1}))
  pdf.circle(35, 30, 12, 'F')
  pdf.setGState(new pdf.GState({opacity: 1}))
  
  // Company name
  pdf.setTextColor(...COLORS.white)
  setPremiumFont(pdf, 'bold', 26)
  pdf.text('PT LUKSURI REKA', 55, 25)
  
  setPremiumFont(pdf, 'normal', 11)
  pdf.text('DIGITAL SOLUTIONS', 55, 33)
  
  setPremiumFont(pdf, 'normal', 8)
  pdf.setTextColor(200, 200, 200)
  pdf.text('Excellence in Digital Innovation', 55, 40)
  
  // Invoice title (adjusted for F4)
  pdf.setTextColor(...COLORS.secondary)
  setPremiumFont(pdf, 'bold', 22)
  pdf.text('INVOICE', 156, 30)
  
  pdf.setLineWidth(2)
  pdf.setDrawColor(...COLORS.secondary)
  pdf.line(156, 35, 191, 35)
  
  pdf.setTextColor(...COLORS.text)
  
  // Company details
  setPremiumFont(pdf, 'normal', 9)
  pdf.text('Kedungwilut No. 3 001/002, Desa Kedungwilut', 25, 70)
  pdf.text('Kecamatan Bandung, Tulungagung 66274', 25, 76)
  pdf.text('Jawa Timur, Indonesia', 25, 82)
  
  pdf.setTextColor(...COLORS.lightText)
  setPremiumFont(pdf, 'normal', 8)
  pdf.text('Telp.: +62 821 4370 6440', 25, 90)
  pdf.text('Email: luksurireka@gmail.com', 25, 95)
  
  // Invoice details (adjusted for F4)
  pdf.setFillColor(...COLORS.accent)
  pdf.roundedRect(146, 65, 45, 35, 3, 3, 'F')
  
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'bold', 9)
  pdf.text('Invoice Details', 148, 72)
  
  setPremiumFont(pdf, 'normal', 8)
  pdf.text(`No: ${invoiceData.invoiceNumber}`, 148, 78)
  pdf.text(`Issued: ${new Date(invoiceData.issueDate).toLocaleDateString('id-ID')}`, 148, 84)
  pdf.text(`Due: ${new Date(invoiceData.dueDate).toLocaleDateString('id-ID')}`, 148, 90)
  
  // Client section
  pdf.setTextColor(...COLORS.secondary)
  setPremiumFont(pdf, 'bold', 12)
  pdf.text('BILL TO', 25, 115)
  
  pdf.setLineWidth(1)
  pdf.setDrawColor(...COLORS.secondary)
  pdf.line(25, 118, 60, 118)
  
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'bold', 11)
  pdf.text(invoiceData.clientName, 25, 128)
  
  setPremiumFont(pdf, 'normal', 9)
  if (invoiceData.clientAddress) {
    const addressLines = pdf.splitTextToSize(invoiceData.clientAddress, 80)
    pdf.text(addressLines, 25, 135)
  }
  
  let clientInfoY = 145
  if (invoiceData.clientPhone) {
    pdf.setTextColor(...COLORS.lightText)
    setPremiumFont(pdf, 'normal', 8)
    pdf.text(`Telp.: ${invoiceData.clientPhone}`, 25, clientInfoY)
    clientInfoY += 6
  }
  if (invoiceData.clientEmail) {
    pdf.text(`Email: ${invoiceData.clientEmail}`, 25, clientInfoY)
  }
  
  // Items table
  const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Amount']
  const tableRows = invoiceData.items.map(item => [
    item.description,
    item.quantity,
    `Rp ${item.unitPrice.toLocaleString('id-ID')}`,
    `Rp ${(item.quantity * item.unitPrice).toLocaleString('id-ID')}`
  ])
  
  const colWidths = [90, 20, 30, 30]
  let currentY = createPremiumTable(pdf, tableHeaders, tableRows, 165, colWidths)
  
  // Totals section
  currentY += 10
  
  pdf.setFillColor(248, 250, 252)
  pdf.roundedRect(110, currentY - 5, 80, 40, 2, 2, 'F')
  
  setPremiumFont(pdf, 'normal', 9)
  pdf.setTextColor(...COLORS.text)
  
  pdf.text('Subtotal:', 115, currentY + 5)
  pdf.text(`Rp ${invoiceData.subtotal.toLocaleString('id-ID')}`, 165, currentY + 5, { align: 'right' })
  currentY += 8
  
  if (invoiceData.discountAmount > 0) {
    pdf.setTextColor(...COLORS.lightText)
    pdf.text('Discount:', 115, currentY)
    pdf.text(`-Rp ${invoiceData.discountAmount.toLocaleString('id-ID')}`, 165, currentY, { align: 'right' })
    currentY += 8
  }
  
  pdf.setTextColor(...COLORS.text)
  pdf.text(`Tax (${invoiceData.taxRate || 11}%):`, 115, currentY)
  pdf.text(`Rp ${invoiceData.taxAmount.toLocaleString('id-ID')}`, 165, currentY, { align: 'right' })
  currentY += 12
  
  pdf.setLineWidth(0.5)
  pdf.setDrawColor(...COLORS.secondary)
  pdf.line(115, currentY - 2, 185, currentY - 2)
  
  pdf.setTextColor(...COLORS.secondary)
  setPremiumFont(pdf, 'bold', 12)
  pdf.text('TOTAL:', 115, currentY + 5)
  pdf.text(`Rp ${invoiceData.total.toLocaleString('id-ID')}`, 185, currentY + 5, { align: 'right' })
  
  // Notes section
  if (invoiceData.notes) {
    currentY += 25
    pdf.setTextColor(...COLORS.secondary)
    setPremiumFont(pdf, 'bold', 10)
    pdf.text('Notes:', 25, currentY)
    
    currentY += 8
    pdf.setTextColor(...COLORS.text)
    setPremiumFont(pdf, 'normal', 9)
    const notesLines = pdf.splitTextToSize(invoiceData.notes, 160)
    pdf.text(notesLines, 25, currentY)
    currentY += notesLines.length * 5
  }
  
  // QR Signature Section - positioned lower
  if (invoiceData.signature) {
    currentY += 17  // Increased space before signature (was 20)
    
    const isQRSignature = (invoiceData.signatureType === 'qr') || 
                         (invoiceData.signatureMetadata && invoiceData.signatureMetadata.type === 'qr')
    
    if (isQRSignature) {
    //   // Premium QR Signature Box
    //   pdf.setFillColor(248, 250, 252)
    //   pdf.roundedRect(25, currentY, 166, 70, 8, 8, 'F')  // Height increased from 60 to 70
      
    //   // Elegant border
    //   pdf.setLineWidth(2)
    //   pdf.setDrawColor(...COLORS.secondary)
    //   pdf.roundedRect(25, currentY, 166, 70, 8, 8, 'D')  // Height increased from 60 to 70
      
      // Title - centered
    //   pdf.setTextColor(...COLORS.secondary)
    //   setPremiumFont(pdf, 'bold', 14)
    //   pdf.text('DIGITAL SIGNATURE VERIFICATION', 108, currentY + 13, { align: 'center' })
      
    //   // Decorative line
    //   pdf.setLineWidth(3)
    //   pdf.setDrawColor(...COLORS.secondary)
    //   pdf.line(65, currentY + 19, 151, currentY + 19)
      
      try {
        const documentId = invoiceData.signatureMetadata?.documentId || `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        const validationUrl = `https://luksurireka.com/validate/${documentId}`
        
        // Generate QR code
        const qrCodeUrl = await generateRealQRCode(validationUrl, 140)
        
        if (qrCodeUrl) {
          // QR Code with white background
          pdf.setFillColor(...COLORS.white)
          pdf.roundedRect(35, currentY + 25, 38, 38, 4, 4, 'F')
          
          // QR Code border
          pdf.setLineWidth(1)
          pdf.setDrawColor(200, 200, 200)
          pdf.roundedRect(35, currentY + 25, 38, 38, 4, 4, 'D')
          
          // Add QR image
          pdf.addImage(qrCodeUrl, 'PNG', 37, currentY + 27, 34, 34)
        } else {
          // Fallback QR
          const fallbackQR = generateQRCodeCanvas(validationUrl, 150)
          pdf.addImage(fallbackQR, 'PNG', 37, currentY + 27, 34, 34)
        }
        
        // QR Label
        setPremiumFont(pdf, 'bold', 8)
        pdf.setTextColor(...COLORS.lightText)
        pdf.text('SCAN TO VERIFY', 54, currentY + 67, { align: 'center' })
        
      } catch (error) {
        console.error('Error generating QR code:', error)
        
        // Fallback pattern
        pdf.setFillColor(...COLORS.white)
        pdf.roundedRect(35, currentY + 25, 38, 38, 4, 4, 'F')
        
        pdf.setFillColor(0, 0, 0)
        const cellSize = 2.5
        const startX = 37
        const startY = currentY + 27
        
        // Draw QR pattern
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const positions = [
              [startX + 3, startY + 3],
              [startX + 27, startY + 3], 
              [startX + 3, startY + 27]
            ]
            positions.forEach(([x, y]) => {
              pdf.rect(x + i * cellSize, y + j * cellSize, cellSize, cellSize, 'F')
            })
          }
        }
        
        // Data pattern
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            if ((i + j) % 3 === 0) {
              pdf.rect(startX + 12 + i * cellSize, startY + 12 + j * cellSize, cellSize, cellSize, 'F')
            }
          }
        }
        
        setPremiumFont(pdf, 'bold', 8)
        pdf.setTextColor(...COLORS.lightText)
        pdf.text('SCAN TO VERIFY', 54, currentY + 67, { align: 'center' })
      }
      
      // Signature Information
      pdf.setTextColor(...COLORS.text)
      setPremiumFont(pdf, 'bold', 11)
      pdf.text('Electronically Signed by:', 80, currentY + 30)
      
      const signerName = invoiceData.signatureMetadata?.signedBy || 'LUDTANZA SURYA WIJAYA, S.Pd.'
      const signerTitle = invoiceData.signatureMetadata?.signerTitle || 'Direktur'
      
      // Signer name highlighted
      setPremiumFont(pdf, 'bold', 13)
      pdf.setTextColor(...COLORS.secondary)
      pdf.text(signerName, 80, currentY + 40)
      
      // Title and company
      setPremiumFont(pdf, 'normal', 10)
      pdf.setTextColor(...COLORS.text)
      pdf.text(`${signerTitle}`, 80, currentY + 48)
      pdf.text('PT LUKSURI REKA DIGITAL SOLUTIONS', 80, currentY + 55)
      
      // Timestamp
      const signatureDate = invoiceData.signatureMetadata?.timestamp ? 
        new Date(invoiceData.signatureMetadata.timestamp) : new Date()
      
      setPremiumFont(pdf, 'italic', 8)
      pdf.setTextColor(...COLORS.lightText)
      pdf.text(`Digitally signed on: ${signatureDate.toLocaleString('id-ID')}`, 80, currentY + 62)
      
      // Document ID - moved further down
      if (invoiceData.signatureMetadata?.documentId) {
        setPremiumFont(pdf, 'normal', 7)
        pdf.text(`Doc ID: ${invoiceData.signatureMetadata.documentId}`, 185, currentY + 82, { align: 'right' })
      }
      
    } else {
      // Manual signature
      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(25, currentY, 166, 45, 5, 5, 'F')
      
      pdf.setLineWidth(1)
      pdf.setDrawColor(...COLORS.border)
      pdf.roundedRect(25, currentY, 166, 45, 5, 5, 'D')
      
      pdf.setTextColor(...COLORS.text)
      setPremiumFont(pdf, 'bold', 10)
      pdf.text('Authorized Signature:', 35, currentY + 15)
      
      try {
        pdf.addImage(invoiceData.signature, 'PNG', 35, currentY + 20, 50, 20)
      } catch (error) {
        console.error('Error adding manual signature:', error)
      }
      
      setPremiumFont(pdf, 'bold', 9)
      pdf.text('PT LUKSURI REKA DIGITAL SOLUTIONS', 110, currentY + 30)
    }
  }
  
  pdf.save(`Invoice-${invoiceData.invoiceNumber}.pdf`)
}

export const generateReceiptPDF = async (receiptData) => {
  // Create F4 PDF for receipt
  const pdf = new jsPDF('p', 'mm', [216, 330])
  
  addPremiumBorder(pdf)
  
  // Header with different color scheme
  pdf.setFillColor(...COLORS.secondary)
  pdf.rect(0, 0, 216, 60, 'F')
  
  // Pattern overlay
  pdf.setFillColor(...COLORS.white)
  pdf.setGState(new pdf.GState({opacity: 0.1}))
  for (let i = 0; i < 216; i += 20) {
    pdf.circle(i, 30, 8, 'F')
  }
  pdf.setGState(new pdf.GState({opacity: 1}))
  
  // Company logo area
  pdf.setFillColor(...COLORS.white)
  pdf.setGState(new pdf.GState({opacity: 0.2}))
  pdf.circle(35, 35, 15, 'F')
  pdf.setGState(new pdf.GState({opacity: 1}))
  
  // Company name
  pdf.setTextColor(...COLORS.white)
  setPremiumFont(pdf, 'bold', 28)
  pdf.text('PT LUKSURI REKA', 60, 28)
  
  setPremiumFont(pdf, 'normal', 12)
  pdf.text('DIGITAL SOLUTIONS', 60, 38)
  
  setPremiumFont(pdf, 'normal', 8)
  pdf.setTextColor(240, 240, 240)
  pdf.text('Premium Digital Services', 60, 45)
  
  // Receipt title
  pdf.setTextColor(...COLORS.white)
  setPremiumFont(pdf, 'bold', 24)
  pdf.text('RECEIPT', 151, 35)
  
  // Decorative elements
  pdf.setLineWidth(3)
  pdf.setDrawColor(...COLORS.white)
  pdf.line(151, 40, 186, 40)
  
  // Company details
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'normal', 9)
  pdf.text('Kedungwilut No. 3 001/002, Desa Kedungwilut', 25, 75)
  pdf.text('Kecamatan Bandung, Tulungagung 66274', 25, 81)
  
  pdf.setTextColor(...COLORS.lightText)
  setPremiumFont(pdf, 'normal', 8)
  pdf.text('Telp.: +62 821 4370 6440 | Email: luksurireka@gmail.com', 25, 89)
  
  // Receipt details
  pdf.setFillColor(...COLORS.accent)
  pdf.roundedRect(25, 100, 166, 25, 3, 3, 'F')
  
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'bold', 10)
  pdf.text(`Receipt No: ${receiptData.receiptNumber}`, 30, 110)
  pdf.text(`Date: ${new Date(receiptData.paymentDate).toLocaleDateString('id-ID')}`, 30, 118)
  
  if (receiptData.invoiceData) {
    pdf.text(`Reference Invoice: ${receiptData.invoiceData.invoice_number}`, 110, 110)
  }
  
  // Main content
  let yPos = 140
  
  pdf.setFillColor(...COLORS.white)
  pdf.setLineWidth(1)
  pdf.setDrawColor(...COLORS.border)
  pdf.roundedRect(25, yPos, 166, 80, 5, 5, 'FD')
  
  yPos += 15
  pdf.setTextColor(...COLORS.secondary)
  setPremiumFont(pdf, 'bold', 12)
  pdf.text('RECEIVED FROM', 35, yPos)
  
  yPos += 10
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'bold', 11)
  pdf.text(receiptData.payerName, 35, yPos)
  
  yPos += 15
  pdf.setTextColor(...COLORS.secondary)
  setPremiumFont(pdf, 'bold', 12)
  pdf.text('AMOUNT', 35, yPos)
  
  yPos += 8
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'bold', 14)
  pdf.text(`Rp ${receiptData.amountReceived.toLocaleString('id-ID')}`, 35, yPos)
  
  yPos += 12
  pdf.setTextColor(...COLORS.secondary)
  setPremiumFont(pdf, 'bold', 10)
  pdf.text('IN WORDS:', 35, yPos)
  
  yPos += 8
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'normal', 9)
  const terbilangLines = pdf.splitTextToSize(receiptData.amountWords, 140)
  pdf.text(terbilangLines, 35, yPos)
  
  yPos += terbilangLines.length * 5 + 8
  pdf.setTextColor(...COLORS.secondary)
  setPremiumFont(pdf, 'bold', 10)
  pdf.text('FOR PAYMENT OF:', 35, yPos)
  
  yPos += 8
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'normal', 9)
  const descLines = pdf.splitTextToSize(receiptData.description, 140)
  pdf.text(descLines, 35, yPos)
  
  // Payment method
  yPos = 235
  pdf.setFillColor(...COLORS.accent)
  pdf.roundedRect(25, yPos, 166, 15, 2, 2, 'F')
  
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'bold', 9)
  pdf.text(`Payment Method: ${receiptData.paymentMethod}`, 30, yPos + 8)
  
  // QR Signature for Receipt - moved lower
  yPos += 30  // Increased spacing to move QR box lower
  pdf.setTextColor(...COLORS.text)
  setPremiumFont(pdf, 'normal', 9)
  pdf.text(`Tulungagung, ${new Date(receiptData.paymentDate).toLocaleDateString('id-ID')}`, 25, yPos)
  
  if (receiptData.signature) {
    const isQRSignature = (receiptData.signatureType === 'qr') || 
                         (receiptData.signatureMetadata && receiptData.signatureMetadata.type === 'qr')
    
    if (isQRSignature) {
      yPos += 15  // Additional space before QR box
      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(25, yPos, 166, 40, 3, 3, 'F')
      
      pdf.setLineWidth(1)
      pdf.setDrawColor(...COLORS.secondary)
      pdf.roundedRect(25, yPos, 166, 40, 3, 3, 'D')
      
      pdf.setTextColor(...COLORS.secondary)
      setPremiumFont(pdf, 'bold', 11)
      pdf.text('DIGITAL AUTHORIZATION', 108, yPos + 10, { align: 'center' })
      
      pdf.setLineWidth(2)
      pdf.setDrawColor(...COLORS.secondary)
      pdf.line(65, yPos + 13, 151, yPos + 13)
      
      try {
        const documentId = receiptData.signatureMetadata?.documentId || `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        const validationUrl = `https://luksurireka.com/validate/${documentId}`
        
        const qrCodeUrl = await generateRealQRCode(validationUrl, 100)
        
        if (qrCodeUrl) {
          pdf.setFillColor(...COLORS.white)
          pdf.roundedRect(30, yPos + 17, 25, 25, 2, 2, 'F')
          
          pdf.setLineWidth(0.5)
          pdf.setDrawColor(200, 200, 200)
          pdf.roundedRect(30, yPos + 17, 25, 25, 2, 2, 'D')
          
          pdf.addImage(qrCodeUrl, 'PNG', 31, yPos + 18, 23, 23)
        } else {
          const fallbackQR = generateQRCodeCanvas(validationUrl, 100)
          pdf.addImage(fallbackQR, 'PNG', 31, yPos + 18, 23, 23)
        }
        
      } catch (error) {
        console.error('Error generating QR code for receipt:', error)
      }
      
      // Signature info
      const signerName = receiptData.signatureMetadata?.signedBy || 'LUDTANZA SURYA WIJAYA, S.Pd.'
      
      setPremiumFont(pdf, 'bold', 9)
      pdf.setTextColor(...COLORS.text)
      pdf.text(signerName, 62, yPos + 22)
      
      setPremiumFont(pdf, 'normal', 8)
      pdf.text('Direktur PT LUKSURI REKA DIGITAL SOLUTIONS', 62, yPos + 29)
      
      const signatureDate = receiptData.signatureMetadata?.timestamp ? 
        new Date(receiptData.signatureMetadata.timestamp) : new Date()
      
      setPremiumFont(pdf, 'italic', 7)
      pdf.setTextColor(...COLORS.lightText)
      pdf.text(`Signed: ${signatureDate.toLocaleString('id-ID')}`, 62, yPos + 35)
      
      if (receiptData.signatureMetadata?.documentId) {
        setPremiumFont(pdf, 'normal', 6)
        pdf.text(`ID: ${receiptData.signatureMetadata.documentId}`, 185, yPos + 38, { align: 'right' })
      }
      
    } else {
      // Manual signature
      yPos += 15  // Additional space for manual signature too
      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(25, yPos, 166, 35, 3, 3, 'F')
      
      setPremiumFont(pdf, 'bold', 9)
      pdf.text('Authorized by:', 35, yPos + 12)
      
      try {
        pdf.addImage(receiptData.signature, 'PNG', 35, yPos + 18, 50, 20)
      } catch (error) {
        console.error('Error adding signature:', error)
      }
      
      setPremiumFont(pdf, 'bold', 8)
      pdf.text('PT LUKSURI REKA DIGITAL SOLUTIONS', 110, yPos + 25)
    }
  } else {
    // Default signature area
    yPos += 15
    setPremiumFont(pdf, 'bold', 9)
    pdf.text('Authorized by:', 25, yPos)
    yPos += 25
    pdf.text('PT LUKSURI REKA DIGITAL SOLUTIONS', 25, yPos)
  }
  
  pdf.save(`Receipt-${receiptData.receiptNumber}.pdf`)
}