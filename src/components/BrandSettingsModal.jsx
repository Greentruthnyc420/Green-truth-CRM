import React, { useState, useEffect } from 'react';
import { X, Settings, Save, Loader, Building2, CreditCard, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import { ViewGreenTruthPaymentModal } from './AdminSettingsModal';

export default function BrandSettingsModal({ isOpen, onClose, brandUser }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showPaymentInfo, setShowPaymentInfo] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        businessName: '',
        businessAddress: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        // ACH Information
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking', // checking or savings
        // Additional
        taxId: '',
        notes: ''
    });

    // Load existing settings
    useEffect(() => {
        if (isOpen && brandUser?.brandId) {
            loadSettings();
        }
    }, [isOpen, brandUser?.brandId]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('brand_settings')
                .select('*')
                .eq('brand_id', brandUser.brandId)
                .single();

            if (data) {
                setFormData({
                    businessName: data.business_name || '',
                    businessAddress: data.business_address || '',
                    contactName: data.contact_name || '',
                    contactPhone: data.contact_phone || '',
                    contactEmail: data.contact_email || '',
                    bankName: data.bank_name || '',
                    routingNumber: data.routing_number || '',
                    accountNumber: data.account_number || '',
                    accountType: data.account_type || 'checking',
                    taxId: data.tax_id || '',
                    notes: data.notes || ''
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
                .from('brand_settings')
                .upsert({
                    brand_id: brandUser.brandId,
                    brand_name: brandUser.brandName,
                    business_name: formData.businessName,
                    business_address: formData.businessAddress,
                    contact_name: formData.contactName,
                    contact_phone: formData.contactPhone,
                    contact_email: formData.contactEmail,
                    bank_name: formData.bankName,
                    routing_number: formData.routingNumber,
                    account_number: formData.accountNumber,
                    account_type: formData.accountType,
                    tax_id: formData.taxId,
                    notes: formData.notes,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'brand_id' });

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
                aria-labelledby="brand-settings-modal-title"
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
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Settings size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 id="brand-settings-modal-title" className="text-xl font-bold text-white">Account Settings</h2>
                                <p className="text-white/80 text-sm">{brandUser?.brandName}</p>
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
                                <Loader className="animate-spin text-amber-500" size={32} />
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
                                        <Building2 size={20} className="text-amber-500" />
                                        Business Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                                            <input
                                                type="text"
                                                value={formData.businessName}
                                                onChange={e => handleChange('businessName', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                                placeholder="Your Business LLC"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / EIN</label>
                                            <input
                                                type="text"
                                                value={formData.taxId}
                                                onChange={e => handleChange('taxId', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                                placeholder="XX-XXXXXXX"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Address</label>
                                            <input
                                                type="text"
                                                value={formData.businessAddress}
                                                onChange={e => handleChange('businessAddress', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                                placeholder="123 Business St, City, State 12345"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                                            <input
                                                type="text"
                                                value={formData.contactName}
                                                onChange={e => handleChange('contactName', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                                placeholder="John Smith"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.contactPhone}
                                                onChange={e => handleChange('contactPhone', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                                            <input
                                                type="email"
                                                value={formData.contactEmail}
                                                onChange={e => handleChange('contactEmail', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                                placeholder="contact@yourbrand.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ACH / Payment Information */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <CreditCard size={20} className="text-amber-500" />
                                        ACH Payment Information
                                    </h3>
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                                        <p className="text-sm text-amber-800">
                                            <strong>🔒 Secure:</strong> This information is encrypted and used only for payment processing from GreenTruth to your account.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={formData.bankName}
                                                onChange={e => handleChange('bankName', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                                placeholder="Chase, Bank of America, etc."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Routing Number</label>
                                            <input
                                                type="text"
                                                value={formData.routingNumber}
                                                onChange={e => handleChange('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all font-mono"
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
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all font-mono"
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
                                                        className="w-4 h-4 text-amber-500 focus:ring-amber-500"
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
                                                        className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                                                    />
                                                    <span className="text-slate-700">Savings</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="pt-4 border-t border-slate-100">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => handleChange('notes', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                                        placeholder="Any special instructions or notes..."
                                    />
                                </div>

                                {/* Pay GreenTruth Section */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                                                <DollarSign size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-emerald-800">Pay GreenTruth</p>
                                                <p className="text-sm text-emerald-600">View payment info & ACH details</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPaymentInfo(true)}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-sm"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
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

            {/* GreenTruth Payment Info Modal */}
            <ViewGreenTruthPaymentModal
                isOpen={showPaymentInfo}
                onClose={() => setShowPaymentInfo(false)}
            />
        </AnimatePresence>
    );
}
