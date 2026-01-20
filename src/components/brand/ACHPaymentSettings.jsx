import React, { useState, useEffect } from 'react';
import { Building2, Hash, User, Lock, CheckCircle, AlertCircle, Loader2, Save, Eye, EyeOff, CreditCard } from 'lucide-react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { supabase } from '../../services/supabaseClient';

/**
 * ACH Payment Settings - Allows brands to enter their banking info
 * for direct payments from dispensaries
 */
export default function ACHPaymentSettings() {
    const { brandUser } = useBrandAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showRouting, setShowRouting] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        bankName: '',
        accountHolderName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking', // checking or savings
        businessName: '',
        ein: '', // Employer Identification Number
        agreedToTerms: false
    });

    // Load existing ACH data
    useEffect(() => {
        loadACHSettings();
    }, [brandUser?.brandId]);

    const loadACHSettings = async () => {
        if (!brandUser?.brandId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('brand_ach_settings')
                .select('*')
                .eq('brand_id', brandUser.brandId)
                .single();

            if (data && !error) {
                setFormData({
                    bankName: data.bank_name || '',
                    accountHolderName: data.account_holder_name || '',
                    // Mask sensitive data that was saved
                    routingNumber: data.routing_number ? '•••••' + data.routing_number.slice(-4) : '',
                    accountNumber: data.account_number ? '•••••' + data.account_number.slice(-4) : '',
                    accountType: data.account_type || 'checking',
                    businessName: data.business_name || '',
                    ein: data.ein ? '••-•••' + data.ein.slice(-4) : '',
                    agreedToTerms: true
                });
            }
        } catch (err) {
            console.error('Failed to load ACH settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setSaved(false);
    };

    const validateForm = () => {
        if (!formData.bankName) return 'Bank name is required';
        if (!formData.accountHolderName) return 'Account holder name is required';
        if (!formData.routingNumber || formData.routingNumber.includes('•')) {
            if (!formData.routingNumber || formData.routingNumber.length < 9) {
                return 'Valid 9-digit routing number is required';
            }
        }
        if (!formData.accountNumber || formData.accountNumber.includes('•')) {
            if (!formData.accountNumber || formData.accountNumber.length < 4) {
                return 'Valid account number is required';
            }
        }
        if (!formData.businessName) return 'Business name is required';
        if (!formData.agreedToTerms) return 'You must agree to the terms';
        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!brandUser?.brandId) {
            setError('Brand not identified');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Build data object with snake_case for Supabase
            const dataToSave = {
                brand_id: brandUser.brandId,
                bank_name: formData.bankName,
                account_holder_name: formData.accountHolderName,
                account_type: formData.accountType,
                business_name: formData.businessName,
                updated_at: new Date().toISOString()
            };

            // Only update routing/account/ein if not masked
            if (!formData.routingNumber.includes('•')) {
                dataToSave.routing_number = formData.routingNumber;
            }
            if (!formData.accountNumber.includes('•')) {
                dataToSave.account_number = formData.accountNumber;
            }
            if (formData.ein && !formData.ein.includes('•')) {
                dataToSave.ein = formData.ein;
            }

            const { error: saveError } = await supabase
                .from('brand_ach_settings')
                .upsert(dataToSave, { onConflict: 'brand_id' });

            if (saveError) throw saveError;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save ACH settings:', err);
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard size={24} className="text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">ACH Payment Information</h3>
                    <p className="text-slate-400 text-sm">Receive payments directly from dispensaries</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                    <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-blue-300 text-sm font-medium mb-1">How it works</p>
                        <p className="text-blue-200/70 text-sm">
                            Due to cannabis regulations, dispensaries request orders through GreenTruth rather than placing them directly.
                            Once you fulfill an order, dispensaries can pay you directly via ACH transfer using the banking information you provide here.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
                {/* Business Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Business Legal Name *
                        </label>
                        <div className="relative">
                            <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="Business LLC"
                                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            EIN (Optional)
                        </label>
                        <div className="relative">
                            <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                name="ein"
                                value={formData.ein}
                                onChange={handleChange}
                                placeholder="XX-XXXXXXX"
                                maxLength={10}
                                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Info */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bank Name *
                    </label>
                    <div className="relative">
                        <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            placeholder="Chase, Wells Fargo, etc."
                            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Account Holder Name *
                    </label>
                    <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            name="accountHolderName"
                            value={formData.accountHolderName}
                            onChange={handleChange}
                            placeholder="Name as it appears on account"
                            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Routing Number *
                        </label>
                        <div className="relative">
                            <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type={showRouting ? 'text' : 'password'}
                                name="routingNumber"
                                value={formData.routingNumber}
                                onChange={handleChange}
                                placeholder="9 digits"
                                maxLength={9}
                                className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowRouting(!showRouting)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                {showRouting ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Account Number *
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type={showAccount ? 'text' : 'password'}
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                placeholder="Account number"
                                className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowAccount(!showAccount)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                {showAccount ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Type */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Account Type *
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="accountType"
                                value="checking"
                                checked={formData.accountType === 'checking'}
                                onChange={handleChange}
                                className="w-4 h-4 text-emerald-500 border-slate-600 focus:ring-emerald-500"
                            />
                            <span className="text-slate-300">Checking</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="accountType"
                                value="savings"
                                checked={formData.accountType === 'savings'}
                                onChange={handleChange}
                                className="w-4 h-4 text-emerald-500 border-slate-600 focus:ring-emerald-500"
                            />
                            <span className="text-slate-300">Savings</span>
                        </label>
                    </div>
                </div>

                {/* Terms */}
                <div className="bg-slate-700/30 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="agreedToTerms"
                            checked={formData.agreedToTerms}
                            onChange={handleChange}
                            className="w-5 h-5 mt-0.5 text-emerald-500 border-slate-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-slate-300 text-sm">
                            I confirm that I am authorized to provide banking information for this business
                            and agree to receive ACH deposits from dispensary partners through GreenTruth's platform.
                        </span>
                    </label>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle size={20} className="text-red-400" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || !formData.agreedToTerms}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${saved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {saving ? (
                        <><Loader2 size={20} className="animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><CheckCircle size={20} /> Saved Successfully!</>
                    ) : (
                        <><Save size={20} /> Save Banking Information</>
                    )}
                </button>
            </div>

            {/* Security Note */}
            <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Lock size={14} />
                    <span>Your banking information is encrypted and stored securely. Only dispensaries you approve can initiate payments.</span>
                </div>
            </div>
        </div>
    );
}
