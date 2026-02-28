'use client'

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { QrCode, Download, FileUp, Loader2, CheckCircle, FileText } from 'lucide-react'

export default function SignatureForm() {
    const [loading, setLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [generatedData, setGeneratedData] = useState(null)

    const [formData, setFormData] = useState({
        title: '',
        documentDate: new Date().toISOString().split('T')[0],
        description: '',
        signedBy: 'LUDTANZA SURYA WIJAYA, S.Pd.',
        signerTitle: 'Chief Executive Officer (CEO)'
    })

    const qrRef = useRef()

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

    const handleGenerateQR = async (e) => {
        e.preventDefault(); setLoading(true)
        try {
            const documentId = `DOC-GEN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            const validationUrl = `https://sign.luksurireka.com/validate/${documentId}`
            const { error } = await supabase.from('general_documents').insert([{
                qr_document_id: documentId, title: formData.title,
                document_date: formData.documentDate, description: formData.description,
                qr_signed_by: formData.signedBy, qr_signer_title: formData.signerTitle,
                qr_validation_url: validationUrl, status: 'issued'
            }])
            if (error) throw error
            setGeneratedData({ documentId, validationUrl })
        } catch (error) {
            console.error('Error generating QR:', error)
            alert('Gagal membuat QR Code: ' + error.message)
        } finally { setLoading(false) }
    }

    const downloadQRCode = () => {
        const canvas = qrRef.current.querySelector('canvas')
        const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `${generatedData.documentId}-QR.png`
        document.body.appendChild(link); link.click(); document.body.removeChild(link)
    }

    const handlePdfUploadAndStamp = async (e) => {
        const file = e.target.files[0]
        if (!file || file.type !== 'application/pdf') { alert('Mohon upload file PDF yang valid.'); return }
        setPdfLoading(true)
        try {
            const canvas = qrRef.current.querySelector('canvas')
            const qrImageBytes = await fetch(canvas.toDataURL('image/png')).then(r => r.arrayBuffer())
            const pdfDoc = await PDFDocument.load(await file.arrayBuffer())
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
            const qrImage = await pdfDoc.embedPng(qrImageBytes)
            const qrDims = qrImage.scale(0.5)
            const lastPage = pdfDoc.getPages()[pdfDoc.getPages().length - 1]
            const { width, height } = lastPage.getSize()
            const margin = 50, qrX = width - qrDims.width - margin, qrY = margin
            const textX = qrX - 220, textY = qrY + qrDims.height - 15
            lastPage.drawImage(qrImage, { x: qrX, y: qrY, width: qrDims.width, height: qrDims.height })
            const textColor = rgb(0.2, 0.2, 0.2)
            lastPage.drawText('Ditandatangani secara elektronik oleh:', { x: textX, y: textY, size: 9, font: helveticaFont, color: textColor })
            lastPage.drawText(formData.signedBy, { x: textX, y: textY - 14, size: 11, font: helveticaBold, color: rgb(0, 0, 0) })
            lastPage.drawText(formData.signerTitle, { x: textX, y: textY - 26, size: 9, font: helveticaFont, color: textColor })
            lastPage.drawText(`ID Validasi: ${generatedData.documentId}`, { x: textX, y: textY - 45, size: 8, font: helveticaFont, color: rgb(0.4, 0.4, 0.4) })
            const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `${formData.title.replace(/\s+/g, '_')}_Signed.pdf`
            link.click()
        } catch (error) { console.error('Error stamping PDF:', error); alert('Gagal menempelkan QR ke PDF.') }
        finally { setPdfLoading(false); e.target.value = null }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Form */}
            <div className="glass-card p-7">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background: 'rgba(255,0,60,0.12)', border: '1px solid rgba(255,0,60,0.25)' }}>
                        <FileText className="w-5 h-5" style={{ color: '#FF003C' }} />
                    </div>
                    Data Dokumen
                </h3>

                <form onSubmit={handleGenerateQR} className="space-y-5">
                    {[
                        { name: 'title', label: 'Judul Dokumen', type: 'text', required: true, placeholder: 'Contoh: Proposal Kerjasama' },
                        { name: 'documentDate', label: 'Tanggal Dokumen', type: 'date', required: true },
                    ].map(({ name, label, type, required, placeholder }) => (
                        <div key={name}>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,240,255,0.7)' }}>{label}</label>
                            <input type={type} name={name} required={required} value={formData[name]}
                                onChange={handleInputChange} placeholder={placeholder} className="neon-input" />
                        </div>
                    ))}

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,240,255,0.7)' }}>Deskripsi Singkat (Opsional)</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange}
                            rows="3" className="neon-input" placeholder="Keterangan tambahan dokumen..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,240,255,0.7)' }}>Ditandatangani Oleh</label>
                            <input type="text" name="signedBy" value={formData.signedBy} onChange={handleInputChange} className="neon-input" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,240,255,0.7)' }}>Jabatan</label>
                            <input type="text" name="signerTitle" value={formData.signerTitle} onChange={handleInputChange} className="neon-input" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="neon-button-solid w-full mt-4 text-base font-bold py-4"
                        style={{ borderColor: 'rgba(255,0,60,0.5)', color: '#FF003C', background: 'rgba(255,0,60,0.10)' }}>
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Memproses...</span></>
                            : <><QrCode className="w-5 h-5" /><span>Generate TTD Digital</span></>}
                    </button>
                </form>
            </div>

            {/* Right: QR Preview */}
            <div className="glass-card relative overflow-hidden flex flex-col items-center justify-center min-h-[420px] p-7">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15"
                    style={{ background: 'radial-gradient(circle, #FF003C 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10"
                    style={{ background: 'radial-gradient(circle, #00F0FF 0%, transparent 70%)' }} />

                {!generatedData ? (
                    <div className="text-center z-10">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <QrCode className="w-9 h-9" style={{ color: 'rgba(255,255,255,0.2)' }} />
                        </div>
                        <p className="font-semibold text-white mb-2">QR Preview</p>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Isi form di samping untuk<br />menghasilkan Tanda Tangan Digital
                        </p>
                    </div>
                ) : (
                    <div className="z-10 w-full flex flex-col items-center">
                        <div className="badge badge-paid mb-6">
                            <CheckCircle className="w-3 h-3" />
                            Tanda Tangan Berhasil Dibuat
                        </div>

                        {/* QR Code */}
                        <div className="p-4 rounded-2xl mb-5"
                            style={{ background: '#fff', border: '2px solid rgba(0,240,255,0.30)' }}
                            ref={qrRef}>
                            <QRCodeCanvas value={generatedData.validationUrl} size={150} level="H" includeMargin={true} />
                        </div>

                        <p className="text-xs font-mono-luksuri mb-6 px-4 py-2 rounded-lg text-center"
                            style={{ color: 'rgba(0,240,255,0.7)', background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)' }}>
                            ID: {generatedData.documentId}
                        </p>

                        <div className="w-full space-y-3">
                            <button onClick={downloadQRCode} className="neon-button-ghost w-full">
                                <Download className="w-4 h-4" /> Download QR (PNG)
                            </button>

                            <div className="relative">
                                <input type="file" accept="application/pdf" onChange={handlePdfUploadAndStamp}
                                    disabled={pdfLoading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                                <button disabled={pdfLoading} className="neon-button-solid w-full"
                                    style={{ pointerEvents: 'none' }}>
                                    {pdfLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Memproses PDF...</span></>
                                        : <><FileUp className="w-4 h-4" /><span>Upload PDF &amp; Bubuhkan QR</span></>}
                                </button>
                            </div>

                            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                *Upload akan otomatis menempelkan QR &amp; Teks Validasi di halaman terakhir PDF
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}