import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../services/supabaseClient';
import {
    User, Calendar, Phone, MapPin, CreditCard, FileText,
    ChevronRight, ChevronLeft, Check, Loader, AlertCircle,
    Briefcase, DollarSign, TrendingUp, Award, Sparkles, Shield
} from 'lucide-react';

const STEPS = [
    { id: 'welcome', title: 'Welcome', icon: Sparkles },
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'contact', title: 'Contact', icon: Phone },
    { id: 'payment', title: 'Payment', icon: CreditCard },
    { id: 'legal', title: 'Tax Info', icon: FileText },
];

export default function ContractorOnboarding() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        // Personal Info
        legalFirstName: '',
        legalLastName: '',
        dateOfBirth: '',

        // Contact
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',

        // Payment
        paymentMethod: 'check', // 'check' or 'direct_deposit'
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking',

        // Legal/Tax
        ssnLastFour: '',
        w9Acknowledged: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when field changes
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateStep = () => {
        const newErrors = {};

        // Step 0 = Welcome (no validation needed)

        if (currentStep === 1) { // Personal Info
            if (!formData.legalFirstName.trim()) newErrors.legalFirstName = 'Required';
            if (!formData.legalLastName.trim()) newErrors.legalLastName = 'Required';
            if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required';
            else {
                const age = Math.floor((Date.now() - new Date(formData.dateOfBirth)) / 31557600000);
                if (age < 18) newErrors.dateOfBirth = 'Must be 18 or older';
            }
        }

        if (currentStep === 2) { // Contact
            if (!formData.phone.trim()) newErrors.phone = 'Required';
            if (!formData.street.trim()) newErrors.street = 'Required';
            if (!formData.city.trim()) newErrors.city = 'Required';
            if (!formData.state.trim()) newErrors.state = 'Required';
            if (!formData.zip.trim()) newErrors.zip = 'Required';
        }

        if (currentStep === 3) { // Payment
            if (formData.paymentMethod === 'direct_deposit') {
                if (!formData.bankName.trim()) newErrors.bankName = 'Required';
                if (!formData.routingNumber.trim()) newErrors.routingNumber = 'Required';
                if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Required';
            }
        }

        if (currentStep === 4) { // Legal
            if (!formData.ssnLastFour || formData.ssnLastFour.length !== 4) {
                newErrors.ssnLastFour = 'Enter last 4 digits';
            }
            if (!formData.w9Acknowledged) {
                newErrors.w9Acknowledged = 'You must acknowledge the W-9 requirement';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    legal_first_name: formData.legalFirstName,
                    legal_last_name: formData.legalLastName,
                    date_of_birth: formData.dateOfBirth,
                    phone: formData.phone,
                    mailing_address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.zip
                    },
                    payment_method: formData.paymentMethod,
                    bank_info: formData.paymentMethod === 'direct_deposit' ? {
                        bankName: formData.bankName,
                        routingLast4: formData.routingNumber.slice(-4),
                        accountLast4: formData.accountNumber.slice(-4),
                        accountType: formData.accountType
                    } : null,
                    ssn_last_four: formData.ssnLastFour,
                    w9_acknowledged: formData.w9Acknowledged,
                    onboarding_complete: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.uid);

            if (error) throw error;

            showNotification('Onboarding complete! Welcome aboard.', 'success');
            navigate('/compensation-guide'); // Show compensation portal first
        } catch (error) {
            console.error('Onboarding error:', error);
            showNotification('Failed to save information. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Welcome - Independent Contractor Overview
                return (
                    <div className="space-y-6">
                        {/* Welcome Header */}
                        <div className="text-center pb-4 border-b border-slate-200">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Briefcase className="text-white" size={32} />
                            </div>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Welcome to the Team!
                            </h3>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Before we begin, please review your contractor agreement
                            </p>
                        </div>

                        {/* Independent Contractor Notice */}
                        <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
                            <div className="flex items-start gap-4">
                                <div className="bg-amber-500 text-white p-2 rounded-lg shrink-0">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-900 mb-1">Independent Contractor Status</h4>
                                    <p className="text-sm text-amber-800">
                                        As a Cannabis Consultant with GreenTruth, you are an <strong>independent contractor (1099)</strong>,
                                        not an employee. This means:
                                    </p>
                                    <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc pl-4">
                                        <li>You set your own schedule and availability</li>
                                        <li>You're responsible for your own taxes (we'll send a 1099 if you earn $600+)</li>
                                        <li>No benefits, but higher earning potential through commissions</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Compensation Highlights */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={18} className="text-emerald-500" />
                                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Hourly Pay</span>
                                </div>
                                <p className="text-2xl font-black text-emerald-500">$20-30<span className="text-sm font-normal">/hr</span></p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Based on active accounts</p>
                            </div>
                            <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={18} className="text-purple-500" />
                                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Commission</span>
                                </div>
                                <p className="text-2xl font-black text-purple-500">2%<span className="text-sm font-normal"> of sales</span></p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Paid quarterly</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Award size={18} className="text-blue-500" />
                                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Milestone Bonuses</span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Earn <strong className="text-emerald-600">$100-$1,000+</strong> bonuses for every 10 accounts you bring on.
                                Full details available in the Compensation Guide after setup.
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                            <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-700">
                                After completing this setup, you'll see the <strong>Compensation Guide</strong> with
                                full details on pay structure, then a quick tour of the platform.
                            </p>
                        </div>
                    </div>
                );

            case 1: // Personal Info
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    Legal First Name *
                                </label>
                                <input
                                    type="text"
                                    name="legalFirstName"
                                    value={formData.legalFirstName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.legalFirstName ? 'border-red-500' : 'border-slate-200'}`}
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    placeholder="As it appears on W-9"
                                />
                                {errors.legalFirstName && <p className="text-red-500 text-xs mt-1">{errors.legalFirstName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    Legal Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="legalLastName"
                                    value={formData.legalLastName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.legalLastName ? 'border-red-500' : 'border-slate-200'}`}
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    placeholder="As it appears on W-9"
                                />
                                {errors.legalLastName && <p className="text-red-500 text-xs mt-1">{errors.legalLastName}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                Date of Birth *
                            </label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.dateOfBirth ? 'border-red-500' : 'border-slate-200'}`}
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                        </div>
                    </div>
                );

            case 2: // Contact
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                placeholder="(555) 123-4567"
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                Street Address *
                            </label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.street ? 'border-red-500' : 'border-slate-200'}`}
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                placeholder="123 Main St, Apt 4"
                            />
                            {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500' : 'border-slate-200'}`}
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>State *</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.state ? 'border-red-500' : 'border-slate-200'}`}
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    placeholder="NY"
                                />
                                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>ZIP *</label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    maxLength={10}
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.zip ? 'border-red-500' : 'border-slate-200'}`}
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                                {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                            </div>
                        </div>
                    </div>
                );

            case 3: // Payment
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Payment Method *
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'check' }))}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.paymentMethod === 'check' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">📬</div>
                                        <div className="font-bold" style={{ color: formData.paymentMethod === 'check' ? '#10b981' : 'var(--text-primary)' }}>Paper Check</div>
                                        <div className="text-xs text-slate-500">Mailed to your address</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'direct_deposit' }))}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.paymentMethod === 'direct_deposit' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">🏦</div>
                                        <div className="font-bold" style={{ color: formData.paymentMethod === 'direct_deposit' ? '#10b981' : 'var(--text-primary)' }}>Direct Deposit</div>
                                        <div className="text-xs text-slate-500">Faster payments</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {formData.paymentMethod === 'direct_deposit' && (
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Bank Name *</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-xl border ${errors.bankName ? 'border-red-500' : 'border-slate-200'}`}
                                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    />
                                    {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Routing Number *</label>
                                        <input
                                            type="text"
                                            name="routingNumber"
                                            value={formData.routingNumber}
                                            onChange={handleChange}
                                            maxLength={9}
                                            className={`w-full px-4 py-3 rounded-xl border ${errors.routingNumber ? 'border-red-500' : 'border-slate-200'}`}
                                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                        />
                                        {errors.routingNumber && <p className="text-red-500 text-xs mt-1">{errors.routingNumber}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Account Number *</label>
                                        <input
                                            type="text"
                                            name="accountNumber"
                                            value={formData.accountNumber}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 rounded-xl border ${errors.accountNumber ? 'border-red-500' : 'border-slate-200'}`}
                                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                        />
                                        {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Account Type</label>
                                    <select
                                        name="accountType"
                                        value={formData.accountType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200"
                                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="checking">Checking</option>
                                        <option value="savings">Savings</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 4: // Legal/Tax
                return (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-bold text-amber-800">1099 Contractor Notice</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        As an independent contractor, you are responsible for your own taxes.
                                        We will issue a 1099-NEC form at year end if you earn over $600.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                Last 4 Digits of SSN *
                            </label>
                            <input
                                type="text"
                                name="ssnLastFour"
                                value={formData.ssnLastFour}
                                onChange={handleChange}
                                maxLength={4}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.ssnLastFour ? 'border-red-500' : 'border-slate-200'}`}
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                placeholder="XXXX"
                            />
                            {errors.ssnLastFour && <p className="text-red-500 text-xs mt-1">{errors.ssnLastFour}</p>}
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                For verification only. Full SSN collected via secure W-9 form.
                            </p>
                        </div>

                        <div className="pt-4">
                            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.w9Acknowledged ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'} ${errors.w9Acknowledged ? 'border-red-500' : ''}`}>
                                <input
                                    type="checkbox"
                                    name="w9Acknowledged"
                                    checked={formData.w9Acknowledged}
                                    onChange={handleChange}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>W-9 Acknowledgment</p>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        I understand that I will need to complete and sign a W-9 form before receiving payment.
                                        GreenTruth will provide this form via email.
                                    </p>
                                </div>
                            </label>
                            {errors.w9Acknowledged && <p className="text-red-500 text-xs mt-1">{errors.w9Acknowledged}</p>}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                        Welcome to <span style={{ color: 'var(--accent-primary)' }}>GreenTruth</span>
                    </h1>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                        Let's get you set up as a contractor
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${idx < currentStep
                                    ? 'bg-emerald-500 text-white'
                                    : idx === currentStep
                                        ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {idx < currentStep ? <Check size={20} /> : <step.icon size={18} />}
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`w-12 h-1 mx-2 rounded ${idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="themed-card p-6 rounded-2xl shadow-xl">
                    <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                        {STEPS[currentStep].title}
                    </h2>

                    {renderStepContent()}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${currentStep === 0
                                ? 'opacity-50 cursor-not-allowed text-slate-400'
                                : 'hover:bg-slate-100 text-slate-600'
                                }`}
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        {currentStep < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
                                Complete Setup
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
