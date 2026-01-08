import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader, Building2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { createUserProfile, checkDuplicateLead, addLead } from '../../services/firestoreService';
import { geocodeAddress } from '../../utils/geocoding';

export default function DispensaryRegistration() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: ''
    });
    const [verifiedData, setVerifiedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { showNotification } = useNotification();

    useEffect(() => {
        const stored = sessionStorage.getItem('verified_license');
        if (!stored) {
            navigate('/dispensary/verify');
            return;
        }
        setVerifiedData(JSON.parse(stored));
    }, [navigate]);

    const handleSignup = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return showNotification('Passwords do not match', 'error');
        }

        if (!formData.address || formData.address.trim().length === 0) {
            return showNotification('Address is required', 'error');
        }

        setLoading(true);
        try {
            const { user } = await signup(formData.email, formData.password);

            const dispensaryName = verifiedData.dispensaryName || verifiedData.name;
            const licenseNumber = verifiedData.licenseNumber;

            // Step 1: Geocode the address for map pins
            let locationData = { lat: null, lng: null, address: formData.address };
            try {
                const coords = await geocodeAddress(formData.address);
                if (coords) {
                    locationData = coords;
                }
            } catch (geoError) {
                console.warn('Geocoding failed, continuing without coordinates:', geoError);
            }

            // Step 2: Check if a lead already exists for this dispensary
            const existingLead = await checkDuplicateLead(dispensaryName);
            let leadId = null;

            if (existingLead) {
                // Link to existing lead
                leadId = existingLead.id;
                showNotification(`Linked to existing lead: ${dispensaryName}`, 'success');
            } else {
                // Create a new lead for this dispensary
                const leadRef = await addLead({
                    dispensaryName: dispensaryName,
                    address: formData.address,
                    location: locationData,
                    licenseNumber: licenseNumber,
                    contactPerson: formData.name,
                    contacts: [{
                        name: formData.name,
                        role: 'Owner/Manager',
                        email: formData.email,
                        phone: ''
                    }],
                    status: 'Sold', // Self-registered dispensaries are considered converted
                    leadStatus: 'self_service_registered',
                    userId: 'self-service', // No specific rep assigned
                    repAssigned: 'Self-Service Registration',
                    createdAt: new Date().toISOString(),
                    selfRegistered: true,
                    registrationDate: new Date().toISOString()
                });
                leadId = leadRef.id;
                showNotification(`New lead created for ${dispensaryName}`, 'success');
            }

            // Step 3: Create user profile with lead linkage
            await createUserProfile(user.uid, {
                role: 'dispensary',
                displayName: formData.name,
                email: formData.email,
                dispensaryId: verifiedData.id,
                dispensaryName: dispensaryName,
                licenseNumber: licenseNumber,
                address: formData.address,
                location: locationData,
                leadId: leadId, // Link to lead
                createdAt: new Date().toISOString()
            });

            sessionStorage.removeItem('verified_license');
            showNotification('Account created successfully!', 'success');
            navigate('/dispensary');
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(error.message || 'Failed to create account', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!verifiedData) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h1>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-bold truncate max-w-[200px]">
                            {verifiedData.dispensaryName || verifiedData.name}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Work Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Dispensary Address</label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="123 Main St, New York, NY 10001"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-slate-400 ml-1 mt-1">This will be used for map pins and delivery tracking</p>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 mt-4">
                            <AlertCircle size={20} className="text-slate-400 shrink-0" />
                            <p className="text-xs text-slate-500 leading-relaxed">
                                By creating an account, you agree to our terms of service. Your account will have direct access to place orders for <b>{verifiedData.dispensaryName || verifiedData.name}</b>.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-2"
                        >
                            {loading ? <Loader className="animate-spin" /> : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
