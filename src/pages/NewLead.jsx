import React, { useState } from 'react';
import { Store, User, FileText, Calendar, DollarSign, Camera, X } from 'lucide-react';
import { addLead, checkDuplicateLead } from '../services/firestoreService';
import { uploadTollReceipt } from '../services/storageService'; // Reusing existing upload logic
import { geocodeAddress } from '../utils/geocoding';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


export default function NewLead() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [loading, setLoading] = useState(false);

    // License Image State
    const [licenseImage, setLicenseImage] = useState(null);
    const [licensePreview, setLicensePreview] = useState(null);

    const [formData, setFormData] = useState({
        dispensaryName: '',
        contactPerson: '',
        licenseNumber: '',
        meetingDate: '',
        samplesRequested: []
    });

    const handleLicenseImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLicenseImage(file);
            setLicensePreview(URL.createObjectURL(file));
        }
    };

    const availableBrands = [
        '🍯 Honey King',
        'Wanders New York',
        'Bud Cracker Boulevard',
        'Canna Dots',
        'Space Poppers!',
        'Smoothie Bar',
        'Waferz NY',
        'Pines'
    ];

    const handleBrandToggle = (brand) => {
        setFormData(prev => {
            const currentSamples = prev.samplesRequested || [];
            const samplesRequested = currentSamples.includes(brand)
                ? currentSamples.filter(b => b !== brand)
                : [...currentSamples, brand];
            return { ...prev, samplesRequested };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // mandatory OCM License check
        const hasLicenseText = formData.licenseNumber && formData.licenseNumber.trim().length > 0;
        const hasLicenseImage = !!licenseImage;

        if (!hasLicenseText && !hasLicenseImage) {
            alert("Mandatory: Please provide an OCM License Number OR upload a photo of the license.");
            return;
        }

        setLoading(true);
        try {
            // 1. Smart Traffic Control
            // -------------------------------------------------------------
            const match = await checkDuplicateLead(formData.dispensaryName);

            if (match) {
                const repName = match.repAssigned || 'Another Rep';
                const isSold = match.status === 'Sold';
                const isMyLead = match.userId === currentUser?.uid;

                const createdAt = match.createdAt ? (match.createdAt.toDate ? match.createdAt.toDate() : new Date(match.createdAt)) : new Date(0);
                const now = new Date();
                const daysOld = (now - createdAt) / (1000 * 60 * 60 * 24);

                // Scenario A: Match Found (Status = 'Sold')
                if (isSold) {
                    alert(`Stop! This store is already a Client (Sold by ${repName}).`);
                    setLoading(false);
                    return;
                }

                // Scenario B: Match Found (New & < 45 Days & Not Mine)
                if (daysOld < 45 && !isMyLead) {
                    alert(`This lead is currently assigned to ${repName}. You cannot access it yet.`);
                    setLoading(false);
                    return;
                }

                // Scenario C: Match Found (New & > 45 Days) -> Open Pool
                if (daysOld >= 45) {
                    alert("Good news! This lead is in the Open Pool. Redirecting you to close the sale...");
                    navigate('/log-sale', { state: { prefill: { dispensary: match.dispensaryName } } });
                    return;
                }

                // Scenario D: Match Found (New & < 45 Days & MINE)
                if (isMyLead) {
                    alert("You already have this lead! Redirecting you to log a sale.");
                    navigate('/log-sale', { state: { prefill: { dispensary: match.dispensaryName } } });
                    return;
                }
            }
            // -------------------------------------------------------------

            // Geocoding Step
            let locationData = { lat: null, lng: null, address: formData.address };
            try {
                if (formData.address) {
                    const coords = await geocodeAddress(formData.address);
                    if (coords) {
                        locationData = coords;
                    } else {
                        // Optional: Warn user but allow proceed? Or just save without coords.
                        console.warn("Could not geocode address");
                    }
                }
            } catch (geoError) {
                console.error("Geocoding failed", geoError);
            }

            let licenseImageUrl = null;
            if (licenseImage) {
                licenseImageUrl = await uploadTollReceipt(licenseImage, currentUser?.uid || 'anonymous');
            }

            await addLead({
                ...formData,
                location: locationData, // Saved to DB
                licenseImageUrl,
                userId: currentUser?.uid || 'test-user-123',
                // Add explicit Rep Name for Leaderboard/Smart Checks
                repAssigned: currentUser?.displayName || currentUser?.email || 'Unknown Rep',
                createdAt: new Date().toISOString(),
                status: 'New' // Explicitly set status
            });
            alert('Lead added successfully! 45-Day Exclusivity Started.');
            navigate('/');
        } catch (error) {
            console.error('Error adding lead:', error);
            alert('Failed to add lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                    <User size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">New Lead</h1>
                <p className="text-slate-500">Record details for a new potential dispensary.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dispensary Name</label>
                        <div className="relative">
                            <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                className="w-full pl-10 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.dispensaryName}
                                onChange={(e) => setFormData({ ...formData, dispensaryName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📍</div>
                            <input
                                type="text"
                                required
                                placeholder="123 Main St, New York, NY"
                                className="w-full pl-10 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.address || ''}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>


                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Point of Contact</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                placeholder="Name"
                                className="w-full pl-10 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border bg-white"
                                value={formData.contactRole || 'Manager'}
                                onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                            >
                                <option value="Owner">Owner</option>
                                <option value="Floor Manager">Floor Manager</option>
                                <option value="Buying Manager">Buying Manager</option>
                                <option value="Budtender">Budtender</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="(555) 555-5555"
                            className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                        <div className="relative">
                            <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Or upload photo below"
                                className="w-full pl-10 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </div>

                        {!licensePreview ? (
                            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-sm mt-2">
                                <Camera size={16} />
                                <span>Add License Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLicenseImageChange} />
                            </label>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-slate-200 mt-2">
                                <img src={licensePreview} alt="License" className="w-full h-32 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setLicenseImage(null); setLicensePreview(null); }}
                                    className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-slate-600 hover:text-red-600 shadow-sm"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Date</label>
                        <div className="relative">
                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                required
                                className="w-full pl-10 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 outline-none p-3 border"
                                value={formData.meetingDate}
                                onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                            />
                        </div>
                    </div>

                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="font-semibold text-slate-800">Samples Requested</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {availableBrands.map(brand => (
                            <label
                                key={brand}
                                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${(formData.samplesRequested || []).includes(brand)
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-200 hover:bg-slate-50'}
                `}
                            >
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                                    checked={(formData.samplesRequested || []).includes(brand)}
                                    onChange={() => handleBrandToggle(brand)}
                                />
                                <span className="font-medium text-sm">{brand}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Adding...' : 'Add Lead'}
                </button>
            </form>
        </div>
    );
}
