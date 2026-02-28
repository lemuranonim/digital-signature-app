import './globals.css'
import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900']
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700']
})

export const metadata = {
  title: 'Luksuri Sign — Document Validation Portal',
  description: 'Official document validation and digital signature verification powered by Luksuri Core Cryptography.',
  keywords: 'invoice, receipt, digital signature, business management, electronic documents, luksuri reka',
  authors: [{ name: 'PT LUKSURI REKA DIGITAL SOLUTIONS' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#050510' },
    { media: '(prefers-color-scheme: dark)', color: '#050510' }
  ]
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} antialiased`} style={{ backgroundColor: '#050510' }}>
        {children}
      </body>
    </html>
  )
}