# README.md

# Digital Signature App - PT LUKSURI REKA DIGITAL SOLUTIONS

Web aplikasi profesional untuk mengelola invoice dan kwitansi digital dengan fitur tanda tangan elektronik. Dibangun dengan Next.js 14, Tailwind CSS, dan Supabase PostgreSQL.

## ✨ Fitur Utama

### 🧾 Invoice Management
- Pembuatan invoice dengan detail lengkap
- Sistem penomoran otomatis (INV-YYYYMM-XXX)
- Multi-item dengan perhitungan otomatis
- Diskon dan pajak yang fleksibel
- Template PDF premium dan profesional
- Tanda tangan digital terintegrasi

### 🧾 E-Kwitansi (Digital Receipt)
- Pembuatan kwitansi digital
- Konversi angka ke terbilang otomatis
- Referensi ke invoice (opsional)
- Multiple payment methods
- Template PDF elegan dengan border dekoratif
- Tanda tangan digital

### 📱 Dashboard & Management
- Dashboard overview dengan statistik
- Daftar dokumen dengan filter canggih
- Search berdasarkan nomor/nama klien
- Filter berdasarkan jenis, status, dan tanggal
- Download ulang dokumen PDF
- Responsive design untuk semua device

### 🔏 Digital Signature
- Canvas-based signature pad
- Real-time signature preview
- High-quality signature integration ke PDF
- Clear/reset functionality

### 🎨 Design Premium
- Modern gradient design dengan tema luxury
- Warna brand: Primary Blue & Luxury Gold
- Animasi dan hover effects
- Professional typography dengan Inter font
- Consistent spacing dan layout

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS dengan custom components
- **Database**: Supabase PostgreSQL
- **PDF Generation**: jsPDF dengan custom templates
- **Signature**: HTML5 Canvas
- **Icons**: Lucide React
- **Deployment Ready**: Vercel/Netlify compatible

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd digital-signature-app
```

### 2. Install Dependencies
```bash
npm install
# atau
yarn install
```

### 3. Setup Supabase

#### A. Buat Project Supabase
1. Kunjungi [supabase.com](https://supabase.com)
2. Buat project baru
3. Catat URL dan anon key

#### B. Setup Database
Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_address TEXT,
  client_phone VARCHAR(50),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create receipts table
CREATE TABLE receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  payer_name VARCHAR(255) NOT NULL,
  amount_received DECIMAL(15,2) NOT NULL,
  amount_words TEXT NOT NULL,
  payment_method VARCHAR(50),
  payment_date DATE NOT NULL,
  description TEXT,
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_receipts_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_invoice ON receipts(invoice_id);
```

### 4. Environment Variables
Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Development Server
```bash
npm run dev
# atau
yarn dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📋 Usage Guide

### Membuat Invoice
1. Klik tab "Buat Invoice"
2. Isi informasi klien
3. Tentukan tanggal invoice dan jatuh tempo
4. Tambahkan item-item invoice
5. Set diskon dan pajak jika perlu
6. Tambahkan tanda tangan digital
7. Klik "Buat & Download Invoice"

### Membuat Kwitansi
1. Klik tab "Buat Kwitansi"
2. Isi nama pembayar dan jumlah
3. Pilih metode pembayaran
4. Opsional: pilih invoice referensi
5. Isi deskripsi pembayaran
6. Tambahkan tanda tangan digital
7. Klik "Buat & Download Kwitansi"

### Mengelola Dokumen
1. Klik tab "Dokumen"
2. Gunakan filter untuk mencari dokumen
3. Klik "Download" untuk unduh ulang PDF
4. Lihat statistik di bagian bawah

## 🎨 Customization

### Warna Brand
Edit `tailwind.config.js` untuk mengubah warna:

```javascript
colors: {
  primary: {
    // Blue shades
    50: '#f0f9ff',
    500: '#0ea5e9',
    600: '#0284c7',
    // ...
  },
  luxury: {
    // Gold shades  
    50: '#fefce8',
    500: '#f59e0b',
    600: '#d97706',
    // ...
  }
}
```

### Company Information
Edit informasi perusahaan di:
- `utils/pdfGenerator.js` - untuk template PDF
- `app/layout.js` - untuk navbar
- `app/page.js` - untuk header dashboard

### PDF Templates
Template PDF dapat dikustomisasi di `utils/pdfGenerator.js`:
- Header design dan warna
- Layout dan spacing
- Font styles
- Logo integration (tambahkan logo ke PDF)

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload dist folder ke Netlify
```

### Environment Variables untuk Production
Pastikan set environment variables di platform deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📊 Database Schema

### invoices
- `id`: UUID primary key
- `invoice_number`: Unique invoice number
- `client_*`: Client information
- `issue_date`, `due_date`: Important dates
- `subtotal`, `tax_amount`, `discount_amount`, `total_amount`: Calculations
- `status`: draft | issued | paid | overdue
- `signature_data`: Base64 signature image

### invoice_items
- `invoice_id`: Foreign key to invoices
- `description`, `quantity`, `unit_price`, `total`: Item details

### receipts
- `receipt_number`: Unique receipt number
- `invoice_id`: Optional reference to invoice
- `payer_name`, `amount_received`, `amount_words`: Payment details
- `payment_method`, `payment_date`: Payment info
- `signature_data`: Base64 signature image

## 🔒 Security Features

- Row Level Security (RLS) ready
- Input validation dan sanitization
- XSS protection dengan proper escaping
- Secure PDF generation
- Environment variables untuk sensitive data

## 🆘 Troubleshooting

### PDF Tidak Generate
- Pastikan jsPDF terinstall: `npm install jspdf`
- Check browser console untuk error
- Pastikan signature data valid

### Database Connection Error
- Verify Supabase URL dan key di `.env.local`
- Check network connection
- Verify database schema sudah dibuat

### Styling Issues
- Run `npm run dev` untuk hot reload
- Check Tailwind CSS purging
- Verify import statements

## 📞 Support

Untuk bantuan teknis atau customization lebih lanjut:
- Email: info@luksurireka.com
- Dokumentasi: [Supabase Docs](https://supabase.com/docs)
- Next.js: [Next.js Docs](https://nextjs.org/docs)

## 📄 License

© 2024 PT LUKSURI REKA DIGITAL SOLUTIONS. All rights reserved.

---

**Selamat menggunakan Digital Signature App! 🎉**