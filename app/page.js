'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Search, ArrowRight, Lock, CheckCircle, FileText } from 'lucide-react'
import Image from 'next/image'

export default function LandingPage() {
    const [documentId, setDocumentId] = useState('')
    const router = useRouter()

    const handleValidation = (e) => {
        e.preventDefault()
        if (documentId.trim()) {
            router.push(`/validate/${documentId.trim()}`)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/50 -z-10"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-md border-white/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-3">
                            <Image
                                src="/logo.png"
                                alt="Logo PT LUKSURI REKA"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-xl object-contain"
                            />
                            <div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-700">
                                    LUKSURI REKA
                                </h1>
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Digital Solutions</p>
                            </div>
                        </div>
                        <div>
                            <a
                                href="/login"
                                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Admin Login
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100/80 text-blue-800 text-sm font-semibold border border-blue-200">
                            <span className="flex h-2 w-2 relative mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Official Document Validation Portal
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            Verify <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Authenticity</span> in Seconds
                        </h1>

                        <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                            Securely validate digital signatures and documents issued by PT Luksuri Reka Digital Solutions using our advanced cryptographic verification system.
                        </p>

                        {/* Validation Form */}
                        <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 max-w-lg transform hover:scale-[1.01] transition-transform duration-300">
                            <form onSubmit={handleValidation} className="relative flex items-center">
                                <Search className="absolute left-4 w-6 h-6 text-gray-400" />
                                <input
                                    type="text"
                                    value={documentId}
                                    onChange={(e) => setDocumentId(e.target.value)}
                                    placeholder="Enter Document ID (e.g. DOC-123...)"
                                    className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 text-lg font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!documentId}
                                    className="m-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shrink-0"
                                >
                                    Verify
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center space-x-6 text-sm font-medium text-gray-500">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                256-bit Encryption
                            </div>
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                Real-time Verification
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visual */}
                    <div className="relative hidden lg:block">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-[3rem] transform rotate-3"></div>
                        <div className="relative bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-8 shadow-2xl">
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="w-16 h-16 bg-blue-100 rounded-lg animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="w-full h-4 bg-gray-100 rounded animate-pulse"></div>
                                        <div className="w-full h-4 bg-gray-100 rounded animate-pulse"></div>
                                        <div className="w-2/3 h-4 bg-gray-100 rounded animate-pulse"></div>
                                    </div>
                                    <div className="pt-4 border-t border-dashed border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <div className="w-24 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold">
                                                VERIFIED
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-purple-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <Shield className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Security Status</p>
                                    <p className="text-sm font-bold text-gray-900">Protected & Monitoried</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Grid */}
            <section className="bg-white/50 backdrop-blur-sm border-t border-white/50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted Document Management</h2>
                        <p className="text-lg text-gray-600">Enterprise-grade security features for your business documents</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: "Digital Signature",
                                desc: "Cryptographically secure signatures that are legally binding and tamper-evident."
                            },
                            {
                                icon: FileText,
                                title: "Instant Verification",
                                desc: "Real-time document status checking via QR code or Document ID."
                            },
                            {
                                icon: Lock,
                                title: "Bank-Grade Security",
                                desc: "256-bit encryption ensures your sensitive data remains protected at all times."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                                    <feature.icon className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 pb-12 pt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-gray-900 text-lg">PT LUKSURI REKA</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            © {new Date().getFullYear()} Digital Solutions. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
