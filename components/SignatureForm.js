'use client'

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { QrCode, Download, FileUp, Loader2, CheckCircle, FileText } from 'lucide-react'

export default function SignatureForm() {
    const [loading, setLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [generatedData, setGeneratedData] = useState(null)

    const [formData, setFormData] = useState({
        title: '',
        documentDate: new Date().toISOString().split('T')[0],
        description: '',
        signedBy: 'LUDTANZA SURYA WIJAYA, S.Pd.',
        signerTitle: 'Chief Executive Officer (CEO)'
    })

    const qrRef = useRef()

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleGenerateQR = async (e) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        try {
            const timestamp = Date.now()
            const random = Math.floor(Math.random() * 1000)
            const documentId = `DOC-GEN-${timestamp}-${random}`
            const validationUrl = `https://sign.luksurireka.com/validate/${documentId}`

            const { error } = await supabase
                .from('general_documents')
                .insert([
                    {
                        qr_document_id: documentId,
                        title: formData.title,
                        document_date: formData.documentDate,
                        description: formData.description,
                        qr_signed_by: formData.signedBy,
                        qr_signer_title: formData.signerTitle,
                        qr_validation_url: validationUrl,
                        status: 'issued'
                    }
                ])

            if (error) throw error

            setGeneratedData({
                documentId,
                validationUrl
            })
            setSuccess(true)
        } catch (error) {
            console.error('Error generating QR:', error)
            alert('Gagal membuat QR Code: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const downloadQRCode = () => {
        const canvas = qrRef.current.querySelector('canvas')
        const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `${generatedData.documentId}-QR.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
    }

    const handlePdfUploadAndStamp = async (e) => {
        const file = e.target.files[0]
        if (!file || file.type !== 'application/pdf') {
            alert('Mohon upload file PDF yang valid.')
            return
        }

        setPdfLoading(true)
        try {
            // 1. Ambil gambar QR dari Canvas
            const canvas = qrRef.current.querySelector('canvas')
            const qrImageBytes = await fetch(canvas.toDataURL('image/png')).then(res => res.arrayBuffer())

            // 2. Baca file PDF yang di-upload
            const pdfBytes = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(pdfBytes)

            // 3. Siapkan Font untuk Teks Redaksional
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

            // 4. Masukkan gambar QR
            const qrImage = await pdfDoc.embedPng(qrImageBytes)
            const qrDims = qrImage.scale(0.5) // Ukuran QR

            // 5. Ambil Halaman Terakhir (PENTING!)
            const pages = pdfDoc.getPages()
            const lastPage = pages[pages.length - 1] // Index halaman terakhir
            const { width, height } = lastPage.getSize()

            // 6. Kalkulasi Posisi
            const margin = 50
            const qrX = width - qrDims.width - margin
            const qrY = margin

            const textX = qrX - 220
            const textY = qrY + qrDims.height - 15

            // 7. Gambarkan (Draw) QR Code ke halaman
            lastPage.drawImage(qrImage, {
                x: qrX,
                y: qrY,
                width: qrDims.width,
                height: qrDims.height,
            })

            // 8. Tuliskan (Draw) Teks Redaksional
            const textColor = rgb(0.2, 0.2, 0.2)

            lastPage.drawText('Ditandatangani secara elektronik oleh:', {
                x: textX,
                y: textY,
                size: 9,
                font: helveticaFont,
                color: textColor,
            })

            lastPage.drawText(formData.signedBy, {
                x: textX,
                y: textY - 14,
                size: 11,
                font: helveticaBold,
                color: rgb(0, 0, 0),
            })

            lastPage.drawText(formData.signerTitle, {
                x: textX,
                y: textY - 26,
                size: 9,
                font: helveticaFont,
                color: textColor,
            })

            lastPage.drawText(`ID Validasi: ${generatedData.documentId}`, {
                x: textX,
                y: textY - 45,
                size: 8,
                font: helveticaFont,
                color: rgb(0.4, 0.4, 0.4),
            })

            // 9. Simpan dan Download PDF baru
            const pdfBytesModified = await pdfDoc.save()
            const blob = new Blob([pdfBytesModified], { type: 'application/pdf' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `${formData.title.replace(/\s+/g, '_')}_Signed.pdf`
            link.click()

        } catch (error) {
            console.error('Error stamping PDF:', error)
            alert('Gagal menempelkan QR ke PDF.')
        } finally {
            setPdfLoading(false)
            e.target.value = null
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-pink-600" />
                    Data Dokumen
                </h3>

                <form onSubmit={handleGenerateQR} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Judul Dokumen</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Contoh: Proposal Kerjasama"
                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Dokumen</label>
                        <input
                            type="date"
                            name="documentDate"
                            required
                            value={formData.documentDate}
                            onChange={handleInputChange}
                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi Singkat (Opsional)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all"
                            placeholder="Keterangan tambahan dokumen..."
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Ditandatangani Oleh</label>
                            <input
                                type="text"
                                name="signedBy"
                                value={formData.signedBy}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-pink-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan</label>
                            <input
                                type="text"
                                name="signerTitle"
                                value={formData.signerTitle}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-pink-500 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <QrCode className="w-6 h-6" />}
                        <span>{loading ? 'Memproses...' : 'Generate TTD Digital'}</span>
                    </button>
                </form>
            </div>

            <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

                {!generatedData ? (
                    <div className="text-center z-10">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                            <QrCode className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-slate-400 font-medium">Isi form di samping untuk<br />menghasilkan Tanda Tangan Digital</p>
                    </div>
                ) : (
                    <div className="z-10 w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm font-bold flex items-center mb-6 border border-emerald-500/30">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Tanda Tangan Berhasil Dibuat
                        </div>

                        <div className="p-4 bg-white rounded-2xl shadow-lg mb-6" ref={qrRef}>
                            <QRCodeCanvas
                                value={generatedData.validationUrl}
                                size={150}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>

                        <p className="font-mono text-sm text-slate-300 mb-8 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                            ID: {generatedData.documentId}
                        </p>

                        <div className="w-full space-y-3">
                            <button
                                onClick={downloadQRCode}
                                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all"
                            >
                                <Download className="w-5 h-5" />
                                <span>Download Hanya QR (PNG)</span>
                            </button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handlePdfUploadAndStamp}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    disabled={pdfLoading}
                                    title="Upload PDF untuk dibubuhkan QR"
                                />
                                <button
                                    disabled={pdfLoading}
                                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-70"
                                >
                                    {pdfLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                                    <span>{pdfLoading ? 'Memproses PDF...' : 'Upload PDF & Bubuhkan QR'}</span>
                                </button>
                            </div>
                            <p className="text-xs text-center text-slate-400 mt-2">
                                *Opsi Upload akan otomatis menempelkan QR & Teks Validasi di halaman paling akhir PDF
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}