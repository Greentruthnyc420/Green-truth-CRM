import React from 'react';
import { Shield, Lock, Mail, Eye, Database, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 py-6">
                <div className="max-w-4xl mx-auto px-6">
                    <Link to="/" className="flex items-center gap-3 text-emerald-400 hover:text-emerald-300 mb-4">
                        ← Back to GreenTruth CRM
                    </Link>
                    <div className="flex items-center gap-3">
                        <Shield className="w-10 h-10 text-emerald-400" />
                        <div>
                            <h1 className="text-3xl font-bold">Privacy Policy</h1>
                            <p className="text-slate-400">Last updated: January 21, 2026</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="space-y-12">
                    {/* Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-emerald-400 mb-4">Introduction</h2>
                        <p className="text-slate-300 leading-relaxed">
                            GreenTruth NYC ("we," "our," or "us") operates the GreenTruth CRM platform.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your
                            information when you use our customer relationship management application.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-bold text-emerald-400">Information We Collect</h2>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-6 space-y-4">
                            <div>
                                <h3 className="font-bold text-white mb-2">Personal Information</h3>
                                <ul className="list-disc list-inside text-slate-300 space-y-1">
                                    <li>Name and email address (for account creation)</li>
                                    <li>Business name and contact information</li>
                                    <li>Phone number (optional)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-2">Business Data</h3>
                                <ul className="list-disc list-inside text-slate-300 space-y-1">
                                    <li>Order and transaction records</li>
                                    <li>Activation scheduling data</li>
                                    <li>Invoice and payment information</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-2">Automatically Collected</h3>
                                <ul className="list-disc list-inside text-slate-300 space-y-1">
                                    <li>Device and browser information</li>
                                    <li>Usage analytics and interaction data</li>
                                    <li>IP address and location data</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* How We Use Information */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-bold text-emerald-400">How We Use Your Information</h2>
                        </div>
                        <ul className="text-slate-300 space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">•</span>
                                <span>Provide, operate, and maintain our CRM platform</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">•</span>
                                <span>Process transactions and send related notifications</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">•</span>
                                <span>Send activation reminders and order updates</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">•</span>
                                <span>Improve our services through analytics</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">•</span>
                                <span>Respond to inquiries and provide customer support</span>
                            </li>
                        </ul>
                    </section>

                    {/* Data Security */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-bold text-emerald-400">Data Security</h2>
                        </div>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800 rounded-lg p-4">
                                <h4 className="font-bold text-white mb-2">🔐 Encryption</h4>
                                <p className="text-slate-400 text-sm">All data transmitted via HTTPS/TLS encryption</p>
                            </div>
                            <div className="bg-slate-800 rounded-lg p-4">
                                <h4 className="font-bold text-white mb-2">🛡️ Access Control</h4>
                                <p className="text-slate-400 text-sm">Role-based permissions and authentication</p>
                            </div>
                            <div className="bg-slate-800 rounded-lg p-4">
                                <h4 className="font-bold text-white mb-2">☁️ Secure Storage</h4>
                                <p className="text-slate-400 text-sm">Data stored on Google Cloud and Supabase infrastructure</p>
                            </div>
                            <div className="bg-slate-800 rounded-lg p-4">
                                <h4 className="font-bold text-white mb-2">📋 Audit Logs</h4>
                                <p className="text-slate-400 text-sm">Activity monitoring and security event logging</p>
                            </div>
                        </div>
                    </section>

                    {/* Third-Party Services */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <UserCheck className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-bold text-emerald-400">Third-Party Services</h2>
                        </div>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            We use trusted third-party services to operate our platform:
                        </p>
                        <ul className="text-slate-300 space-y-2">
                            <li><strong>Google Firebase</strong> - Authentication and hosting</li>
                            <li><strong>Supabase</strong> - Database and backend services</li>
                            <li><strong>Resend</strong> - Transactional email delivery</li>
                        </ul>
                        <p className="text-slate-400 text-sm mt-4">
                            Each provider maintains their own privacy policies and security practices.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <h2 className="text-2xl font-bold text-emerald-400 mb-4">Your Rights</h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            You have the right to:
                        </p>
                        <ul className="text-slate-300 space-y-2">
                            <li>• Access your personal data</li>
                            <li>• Request correction of inaccurate data</li>
                            <li>• Request deletion of your account and data</li>
                            <li>• Opt-out of marketing communications</li>
                            <li>• Export your data in a portable format</li>
                        </ul>
                    </section>

                    {/* Contact */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-bold text-emerald-400">Contact Us</h2>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-6">
                            <p className="text-slate-300 mb-4">
                                If you have questions about this Privacy Policy or our data practices:
                            </p>
                            <p className="text-white font-medium">GreenTruth NYC</p>
                            <p className="text-emerald-400">sales@thegreentruthnyc.com</p>
                        </div>
                    </section>

                    {/* Updates */}
                    <section className="border-t border-slate-700 pt-8">
                        <p className="text-slate-400 text-sm">
                            We may update this Privacy Policy from time to time. We will notify you of any
                            changes by posting the new Privacy Policy on this page and updating the
                            "Last updated" date.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-800 border-t border-slate-700 py-6 mt-12">
                <div className="max-w-4xl mx-auto px-6 text-center text-slate-400">
                    © 2026 GreenTruth NYC. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
