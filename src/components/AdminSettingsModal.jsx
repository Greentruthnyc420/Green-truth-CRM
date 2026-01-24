import React, { useState, useEffect } from 'react';
import { X, Settings, Save, Loader, Building2, CreditCard, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';

// Admin modal for editing GreenTruth payment info
export function AdminSettingsModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form state for GreenTruth's payment info
    const [formData, setFormData] = useState({
        businessName: 'The Green Truth LLC',
        businessAddress: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        // ACH Information
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking',
        // PayPal only
        paypalEmail: '',
        // Notes
        paymentInstructions: ''
    });

    // Load existing settings
    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('company_settings')
                .select('*')
                .eq('company_id', 'greentruth')
                .single();

            if (data) {
                setFormData({
                    businessName: data.business_name || 'The Green Truth LLC',
                    businessAddress: data.business_address || '',
                    contactName: data.contact_name || '',
                    contactEmail: data.contact_email || '',
                    contactPhone: data.contact_phone || '',
                    bankName: data.bank_name || '',
                    routingNumber: data.routing_number || '',
                    accountNumber: data.account_number || '',
                    accountType: data.account_type || 'checking',
                    paypalEmail: data.paypal_email || '',
                    paymentInstructions: data.payment_instructions || ''
                });
            }
        } catch (err) {
            console.log('No existing settings found, using defaults');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const { error: upsertError } = await supabase
                .from('company_settings')
                .upsert({
                    company_id: 'greentruth',
                    business_name: formData.businessName,
                    business_address: formData.businessAddress,
                    contact_name: formData.contactName,
                    contact_email: formData.contactEmail,
                    contact_phone: formData.contactPhone,
                    bank_name: formData.bankName,
                    routing_number: formData.routingNumber,
                    account_number: formData.accountNumber,
                    account_type: formData.accountType,
                    paypal_email: formData.paypalEmail,
                    payment_instructions: formData.paymentInstructions,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'company_id' });

            if (upsertError) throw upsertError;

            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-settings-modal-title"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Settings size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 id="admin-settings-modal-title" className="text-xl font-bold text-white">GreenTruth Settings</h2>
                                <p className="text-white/80 text-sm">Payment info for brands</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
                            aria-label="Close modal"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader className="animate-spin text-emerald-500" size={32} />
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Success/Error Messages */}
                                {success && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
                                        <CheckCircle size={20} />
                                        <span className="font-medium">{success}</span>
                                    </div>
                                )}
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                                        <AlertCircle size={20} />
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                {/* Business Information */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Building2 size={20} className="text-emerald-500" />
                                        Business Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                                            <input
                                                type="text"
                                                value={formData.businessName}
                                                onChange={e => handleChange('businessName', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                                placeholder="The Green Truth LLC"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Address</label>
                                            <input
                                                type="text"
                                                value={formData.businessAddress}
                                                onChange={e => handleChange('businessAddress', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                                placeholder="123 Business St, City, State 12345"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                                            <input
                                                type="text"
                                                value={formData.contactName}
                                                onChange={e => handleChange('contactName', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                                placeholder="Your Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.contactPhone}
                                                onChange={e => handleChange('contactPhone', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                                            <input
                                                type="email"
                                                value={formData.contactEmail}
                                                onChange={e => handleChange('contactEmail', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                                placeholder="contact@greentruth.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ACH / Payment Information */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <CreditCard size={20} className="text-emerald-500" />
                                        ACH Payment Information
                                    </h3>
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                                        <p className="text-sm text-emerald-800">
                                            <strong>💳 For Brands:</strong> This info will be visible to brands so they can send payments to GreenTruth.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={formData.bankName}
                                                onChange={e => handleChange('bankName', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                                placeholder="Chase, Bank of America, etc."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Routing Number</label>
                                            <input
                                                type="text"
                                                value={formData.routingNumber}
                                                onChange={e => handleChange('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-mono"
                                                placeholder="9 digits"
                                                maxLength={9}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                                            <input
                                                type="text"
                                                value={formData.accountNumber}
                                                onChange={e => handleChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-mono"
                                                placeholder="Account number"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="accountType"
                                                        value="checking"
                                                        checked={formData.accountType === 'checking'}
                                                        onChange={e => handleChange('accountType', e.target.value)}
                                                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                    <span className="text-slate-700">Checking</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="accountType"
                                                        value="savings"
                                                        checked={formData.accountType === 'savings'}
                                                        onChange={e => handleChange('accountType', e.target.value)}
                                                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                    <span className="text-slate-700">Savings</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PayPal */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">PayPal</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">PayPal Email</label>
                                        <input
                                            type="email"
                                            value={formData.paypalEmail}
                                            onChange={e => handleChange('paypalEmail', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                            placeholder="paypal@greentruth.com"
                                        />
                                    </div>
                                </div>

                                {/* Payment Instructions */}
                                <div className="pt-4 border-t border-slate-100">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Instructions for Brands</label>
                                    <textarea
                                        value={formData.paymentInstructions}
                                        onChange={e => handleChange('paymentInstructions', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                                        placeholder="Please include your brand name and invoice number in the payment memo..."
                                    />
                                </div>

                                {/* Save Button */}
                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader className="animate-spin" size={18} />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Settings
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Read-only view modal for brands to see GreenTruth's payment info
export function ViewGreenTruthPaymentModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(true);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadPaymentInfo();
        }
    }, [isOpen]);

    const loadPaymentInfo = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('company_settings')
                .select('*')
                .eq('company_id', 'greentruth')
                .single();

            if (data) {
                setPaymentInfo(data);
            }
        } catch (err) {
            console.error('Error loading payment info:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    if (!isOpen) return null;

    const CopyButton = ({ value, field }) => (
        <button
            onClick={() => copyToClipboard(value, field)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Copy to clipboard"
        >
            {copiedField === field ? (
                <Check size={16} className="text-emerald-500" />
            ) : (
                <Copy size={16} className="text-slate-400" />
            )}
        </button>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-info-modal-title"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <CreditCard size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 id="payment-info-modal-title" className="text-xl font-bold text-white">Pay GreenTruth</h2>
                                <p className="text-white/80 text-sm">Payment information</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
                            aria-label="Close modal"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader className="animate-spin text-emerald-500" size={32} />
                            </div>
                        ) : paymentInfo ? (
                            <div className="space-y-6">
                                {/* Business Info */}
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Pay to:</h3>
                                    <p className="text-lg font-bold text-emerald-600">{paymentInfo.business_name || 'The Green Truth LLC'}</p>
                                    {paymentInfo.business_address && (
                                        <p className="text-sm text-slate-500 mt-1">{paymentInfo.business_address}</p>
                                    )}
                                </div>

                                {/* ACH Info */}
                                {paymentInfo.routing_number && (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <CreditCard size={18} />
                                            ACH / Bank Transfer
                                        </h4>
                                        <div className="space-y-2">
                                            {paymentInfo.bank_name && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-500">Bank:</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-mono font-medium">{paymentInfo.bank_name}</span>
                                                        <CopyButton value={paymentInfo.bank_name} field="bank" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-500">Routing:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono font-medium">{paymentInfo.routing_number}</span>
                                                    <CopyButton value={paymentInfo.routing_number} field="routing" />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-500">Account:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono font-medium">{paymentInfo.account_number}</span>
                                                    <CopyButton value={paymentInfo.account_number} field="account" />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-500">Type:</span>
                                                <span className="font-medium capitalize">{paymentInfo.account_type || 'Checking'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PayPal */}
                                {paymentInfo.paypal_email && (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <h4 className="font-bold text-blue-700 mb-3">PayPal</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-blue-600">Email:</span>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">{paymentInfo.paypal_email}</span>
                                                <CopyButton value={paymentInfo.paypal_email} field="paypal" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Instructions */}
                                {paymentInfo.payment_instructions && (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <h4 className="font-bold text-amber-700 mb-2">Payment Instructions</h4>
                                        <p className="text-sm text-amber-800">{paymentInfo.payment_instructions}</p>
                                    </div>
                                )}

                                {/* Contact */}
                                {(paymentInfo.contact_email || paymentInfo.contact_phone) && (
                                    <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
                                        Questions? Contact: {paymentInfo.contact_email || paymentInfo.contact_phone}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                                <p>Payment information not yet configured.</p>
                                <p className="text-sm mt-1">Please contact GreenTruth directly.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
