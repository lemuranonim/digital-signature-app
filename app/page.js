'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Search, ArrowRight, Lock, CheckCircle, Zap, Globe, Menu, X } from 'lucide-react'
import Image from 'next/image'

export default function LandingPage() {
    const [documentId, setDocumentId] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)
    const router = useRouter()

    const handleValidation = (e) => {
        e.preventDefault()
        if (documentId.trim()) router.push(`/validate/${documentId.trim()}`)
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden font-sans" style={{ backgroundColor: '#050510' }}>

            {/* Background Neon Orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #00F0FF 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 -left-40 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full opacity-15 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
            </div>

            {/* Navigation */}
            <nav className="nav-dark sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        {/* Logo */}
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-xl blur-sm opacity-40"
                                    style={{ background: 'rgba(0,240,255,0.3)' }} />
                                <Image src="/logo.png" alt="Logo PT LUKSURI REKA" width={40} height={40}
                                    className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-contain" />
                            </div>
                            <div>
                                <h1 className="text-base sm:text-xl font-bold gradient-text-cyan">LUKSURI REKA</h1>
                                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold hidden xs:block"
                                    style={{ color: 'rgba(0,240,255,0.5)' }}>Sign Planet</p>
                            </div>
                        </div>
                        {/* CTA */}
                        <a href="/login" className="neon-button text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-3">
                            <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Admin Portal</span>
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                    {/* Left */}
                    <div className="space-y-6 sm:space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase"
                            style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', color: '#00F0FF' }}>
                            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#00F0FF' }} />
                                <span className="relative inline-flex rounded-full h-full w-full" style={{ backgroundColor: '#00F0FF' }} />
                            </span>
                            Luksuri Core Cryptography — Online
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
                            Verify{' '}
                            <span className="gradient-text-cyan glow-text-cyan">Authenticity</span>
                            <br />in Seconds
                        </h1>

                        <p className="text-base sm:text-lg leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
                            Securely validate digital signatures and documents issued by PT Luksuri Reka Digital Solutions
                            using our advanced cryptographic verification system.
                        </p>

                        {/* Search form */}
                        <div className="glass-card-cyan p-1.5 sm:p-2 w-full">
                            <form onSubmit={handleValidation} className="relative flex items-center gap-1 sm:gap-2">
                                <Search className="absolute left-3 sm:left-4 w-4 h-4 flex-shrink-0"
                                    style={{ color: 'rgba(0,240,255,0.5)' }} />
                                <input
                                    type="text" value={documentId}
                                    onChange={(e) => setDocumentId(e.target.value)}
                                    placeholder="Enter Document ID (e.g. DOC-123...)"
                                    className="w-full pl-9 sm:pl-12 pr-2 py-3 bg-transparent border-none focus:ring-0 font-mono-luksuri text-xs sm:text-sm"
                                    style={{ color: '#fff', outline: 'none' }}
                                />
                                <button type="submit" disabled={!documentId}
                                    className="neon-button-solid shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 m-0.5">
                                    <span className="hidden sm:inline">Verify</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                        </div>

                        {/* Trust signals */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium"
                            style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {['RSA-2048 Encryption', 'Real-time Verification', 'Tamper-Evident Ledger'].map(t => (
                                <div key={t} className="flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00FF88' }} />
                                    <span>{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Terminal (hidden on mobile, shown md+) */}
                    <div className="relative hidden lg:block">
                        <div className="absolute inset-0 rounded-[2rem] blur-xl opacity-20"
                            style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.4) 0%, transparent 70%)' }} />
                        <div className="glass-card-cyan relative p-6 scanlines">
                            <div className="flex items-center space-x-2 mb-5 pb-4"
                                style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF003C' }} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFBE0B' }} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00FF88' }} />
                                <span className="ml-3 text-xs font-mono-luksuri" style={{ color: 'rgba(0,240,255,0.5)' }}>
                                    luksuri-verify — validation_engine.sh
                                </span>
                            </div>
                            <div className="space-y-3 font-mono-luksuri text-xs">
                                <p style={{ color: 'rgba(0,240,255,0.6)' }}>$ <span style={{ color: '#fff' }}>luksuri validate --id DOC-xxxxxxxx</span></p>
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>&gt; Connecting to Luksuri Core...</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>&gt; Fetching document record...</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>&gt; Verifying RSA-2048 signature...</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>&gt; Cross-referencing ledger hash...</p>
                                <div className="mt-4 p-3 rounded-lg"
                                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                                    <p className="font-bold" style={{ color: '#00FF88' }}>✓ SIGNATURE VALID</p>
                                    <p className="mt-1" style={{ color: 'rgba(0,255,136,0.7)' }}>Signed by: LUDTANZA SURYA WIJAYA, S.Pd.</p>
                                    <p style={{ color: 'rgba(0,255,136,0.5)' }}>Timestamp: {new Date().toUTCString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -left-8 glass-card p-3 sm:p-4 flex items-center space-x-3"
                            style={{ boxShadow: '0 0 20px rgba(0,240,255,0.15)' }}>
                            <div className="p-2 rounded-full" style={{ background: 'rgba(0,240,255,0.12)' }}>
                                <Shield className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00F0FF' }} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(0,240,255,0.6)' }}>Security Status</p>
                                <p className="text-sm font-bold text-white">Protected &amp; Active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Grid */}
            <section className="relative z-10 py-12 sm:py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 sm:mb-14">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Trusted Document Intelligence</h2>
                        <p className="text-base sm:text-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            Enterprise-grade security engineered for the Luksuri Multiverse
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {[
                            { Icon: Shield, title: 'Digital Signature', color: '#00F0FF', desc: 'Cryptographically secure, legally binding signatures protected by RSA-2048 asymmetric encryption.' },
                            { Icon: Zap, title: 'Instant Verification', color: '#00FF88', desc: 'Real-time document status checking via QR code scan or Document ID lookup — results in milliseconds.' },
                            { Icon: Globe, title: 'Immutable Ledger', color: '#7c3aed', desc: 'Every signature is immortalized on our distributed cryptographic ledger. Tamper-evident by design.' },
                        ].map(({ Icon, title, desc, color }, idx) => (
                            <div key={idx} className="glass-card p-6 sm:p-8">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
                                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">{title}</h3>
                                <p className="leading-relaxed text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-8 sm:py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.25)' }}>
                                <Shield className="w-3.5 h-3.5" style={{ color: '#00F0FF' }} />
                            </div>
                            <span className="font-bold text-white text-sm">PT LUKSURI REKA DIGITAL SOLUTIONS</span>
                        </div>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            © {new Date().getFullYear()} Luksuri Sign Planet. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
