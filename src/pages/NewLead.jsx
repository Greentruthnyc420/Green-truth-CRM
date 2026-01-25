import React, { useState } from 'react';
import { Store, User, FileText, Calendar, DollarSign, Camera, X, Plus, Sparkles, Loader, Wand2, Search } from 'lucide-react';
import { addLead, checkDuplicateLead } from '../services/firestoreService';
import { uploadTollReceipt } from '../services/storageService'; // Reusing existing upload logic
import { geocodeAddress, findPlaceFromText } from '../services/geocodingService';
import { extractLicenseNumber } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { awardLeadPoints } from '../services/pointsService';
import { sendAdminNotification, createLeadEmail } from '../services/adminNotifications';
import { formatPhoneNumber } from '../utils/phoneUtils';


export default function NewLead() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [isActiveAccount, setIsActiveAccount] = useState(false); // Toggle: Lead vs Active Account

    // License Image State
    const [licenseImage, setLicenseImage] = useState(null);
    const [licensePreview, setLicensePreview] = useState(null);
    const [analyzingLicense, setAnalyzingLicense] = useState(false);
    const [lookingUpAddress, setLookingUpAddress] = useState(false);

    const [formData, setFormData] = useState({
        dispensaryName: '',
        contactPerson: '',
        licenseNumber: '',
        meetingDate: '',
        samplesRequested: [],
        priority: 'Normal', // Default priority
        // Structured address fields for better geocoding
        street: '',
        city: '',
        state: 'NY', // Default to NY
        zipCode: '',
        contacts: [
            { name: '', role: 'Manager', email: '', phone: '' }
        ]
    });

    const handleLicenseImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setLicenseImage(file);
            setLicensePreview(URL.createObjectURL(file));

            // Auto-Extract License Number
            setAnalyzingLicense(true);
            try {
                const extracted = await extractLicenseNumber(file);
                if (extracted) {
                    setFormData(prev => ({ ...prev, licenseNumber: extracted }));
                }
            } catch (err) {
                console.warn("Auto-extraction failed", err);
                // Fail silently, user can still type
            } finally {
                setAnalyzingLicense(false);
            }
        }
    };

    const availableBrands = [
        '🍯 Honey King',
        'Bud Cracker Boulevard',
        'Canna Dots',
        'Space Poppers!',
        'Smoothie Bar',
        'Waferz NY',
        'Pines',
        'JUSBUD!'
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

    // Contact Helpers
    const updateContact = (index, field, value) => {
        const newContacts = [...formData.contacts];
        // Format phone numbers as (XXX) XXX-XXXX
        const formattedValue = field === 'phone' ? formatPhoneNumber(value) : value;
        newContacts[index] = { ...newContacts[index], [field]: formattedValue };

        // Sync primary contact for backward compatibility
        const updates = { contacts: newContacts };
        if (index === 0) {
            if (field === 'name') updates.contactPerson = value;
            // Add other syncs if they exist in root form
        }
        setFormData({ ...formData, ...updates });
    };

    const addContact = () => {
        setFormData({
            ...formData,
            contacts: [...formData.contacts, { name: '', role: 'Manager', email: '', phone: '' }]
        });
    };

    const removeContact = (index) => {
        if (formData.contacts.length === 1) return; // Prevent deleting last contact
        const newContacts = formData.contacts.filter((_, i) => i !== index);
        setFormData({ ...formData, contacts: newContacts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // OCM License is now optional for Leads (will be enforced at Sale)
        // const hasLicenseText = formData.licenseNumber && formData.licenseNumber.trim().length > 0;
        // const hasLicenseImage = !!licenseImage;

        setLoading(true);
        try {
            // 1. Smart Traffic Control (Skip for Active Accounts - we're adding existing clients)
            // -------------------------------------------------------------
            if (!isActiveAccount) {
                const match = await checkDuplicateLead(formData.dispensaryName);

                if (match) {
                    const repName = match.repAssigned || 'Another Rep';
                    const isSold = match.status === 'Sold' || match.leadStatus === 'active';
                    const isMyLead = match.userId === currentUser?.uid;

                    const createdAt = match.createdAt ? (match.createdAt.toDate ? match.createdAt.toDate() : new Date(match.createdAt)) : new Date(0);
                    const now = new Date();
                    const daysOld = (now - createdAt) / (1000 * 60 * 60 * 24);

                    // Scenario A: Match Found (Status = 'Sold' or 'active')
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
            }
            // -------------------------------------------------------------

            // Geocoding Step
            // Geocoding Step - STRICT VALIDATION
            const fullAddress = [
                formData.street,
                formData.city,
                formData.state,
                formData.zipCode
            ].filter(Boolean).join(', ');

            let locationData = null;

            if (fullAddress.length > 5) {
                try {
                    console.log('Geocoding address:', fullAddress);
                    locationData = await geocodeAddress(fullAddress);

                    if (!locationData) {
                        alert("Address not found on Google Maps.\n\nPlease verify the street, city, and zip code.\nA valid map location is required to create a lead.");
                        setLoading(false);
                        return;
                    }
                } catch (geoError) {
                    console.error("Geocoding failed", geoError);
                    alert("Unable to verify address. Please check your internet connection and try again.");
                    setLoading(false);
                    return;
                }
            } else {
                // Address too short/empty
                alert("Address is incomplete. Please provide a full address to locate the dispensary on the map.");
                setLoading(false);
                return;
            }

            let licenseImageUrl = null;
            if (licenseImage) {
                licenseImageUrl = await uploadTollReceipt(licenseImage, currentUser?.uid || 'anonymous');
            }

            const leadRef = await addLead({
                ...formData,
                address: fullAddress, // Combined address for storage
                location: locationData, // Saved to DB ({ lat, lng, formattedAddress, placeId } or null)
                licenseImageUrl,
                userId: currentUser?.uid || 'test-user-123',
                // Add explicit Rep Name for Leaderboard/Smart Checks
                repAssigned: currentUser?.displayName || currentUser?.email || 'Unknown Rep',
                createdAt: new Date().toISOString(),
                status: isActiveAccount ? 'Sold' : 'New', // Legacy status
                leadStatus: isActiveAccount
                    ? 'active'
                    : (formData.samplesRequested && formData.samplesRequested.length > 0)
                        ? 'samples_requested'
                        : 'prospect'
            });

            // Award 1.000 Point
            try {
                await awardLeadPoints(currentUser?.uid || 'test-user-123', leadRef.id || 'unknown');
            } catch (pErr) {
                console.warn("Points awarding failed, but lead was saved.", pErr);
            }

            // Send admin email notification
            try {
                const primaryContact = formData.contacts && formData.contacts[0];
                const interestedBrands = (formData.samplesRequested || []).join(', ') || 'None';

                const { html, text } = createLeadEmail({
                    dispensaryName: formData.dispensaryName,
                    contactPerson: primaryContact?.name,
                    phone: primaryContact?.phone,
                    email: primaryContact?.email,
                    interestedBrands: interestedBrands,
                    repName: currentUser?.displayName || currentUser?.email || 'Unknown Rep'
                });

                await sendAdminNotification({
                    subject: `🎯 New Lead: ${formData.dispensaryName}`,
                    html,
                    text
                });
            } catch (emailErr) {
                console.warn('Email notification failed:', emailErr);
                // Don't block user experience if email fails
            }

            showNotification(
                isActiveAccount
                    ? 'Active account added successfully!'
                    : 'Lead added successfully! 45-Day Exclusivity Started.',
                'success'
            );
            navigate('/app');
        } catch (error) {
            console.error('Error adding lead:', error);
            showNotification('Failed to add lead: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-0">
            <div className="mb-8 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                    {isActiveAccount ? <Store size={32} /> : <User size={32} />}
                </div>
                <h1 className="text-2xl font-bold text-slate-800">
                    {isActiveAccount ? 'Add Active Account' : 'New Lead'}
                </h1>
                <p className="text-slate-500">
                    {isActiveAccount
                        ? 'Add an existing dispensary you already work with.'
                        : 'Record details for a new potential dispensary.'}
                </p>

                {/* Lead/Active Toggle */}
                <div className="mt-4 inline-flex bg-slate-100 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => setIsActiveAccount(false)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${!isActiveAccount
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        New Lead
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsActiveAccount(true)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${isActiveAccount
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Active Account
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="themed-card p-6 rounded-xl space-y-4">

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
                        {/* Google Places Address Lookup Button */}
                        {formData.dispensaryName && formData.dispensaryName.length > 3 && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!formData.dispensaryName) return;
                                    setLookingUpAddress(true);
                                    try {
                                        // Use Google Places Search
                                        const result = await findPlaceFromText(formData.dispensaryName);

                                        if (result) {
                                            // Parse the address components if possible, but formattedAddress is usually "Street, City, State Zip, Country"
                                            // Simplified parsing for now:
                                            const parts = result.formattedAddress.split(',').map(p => p.trim());

                                            // Heuristic parsing for US addresses:
                                            // Last part is Country (USA)
                                            // Second to last is "State Zip"
                                            // Third to last is City
                                            // Rest is Street

                                            // Let's rely on the user to double check, but pre-fill as best as we can.
                                            // Actually, findPlaceFromText returns formatted_address which is good.
                                            // We'll put the whole thing in street if we can't parse it easily, 
                                            // OR we can try to be smart.

                                            // Better approach: Just put the formatted address in street for now, 
                                            // OR split by comma.

                                            // Simple heuristic for "123 Main St, New York, NY 10001, USA"
                                            let street = result.formattedAddress;
                                            let city = '';
                                            let state = 'NY';
                                            let zip = '';

                                            // Basic parsing attempt
                                            const addrParts = result.formattedAddress.split(',');
                                            if (addrParts.length >= 3) {
                                                // Remove Country if "USA" or "United States"
                                                let lastPart = addrParts[addrParts.length - 1].trim();
                                                if (lastPart === 'USA' || lastPart === 'United States') {
                                                    addrParts.pop();
                                                }

                                                // Now last part should be "State Zip" (e.g. "NY 10001")
                                                const stateZip = addrParts.pop().trim();
                                                const stateZipParts = stateZip.split(' ');
                                                if (stateZipParts.length >= 2) {
                                                    zip = stateZipParts.pop();
                                                    state = stateZipParts.pop();
                                                }

                                                city = addrParts.pop().trim();
                                                street = addrParts.join(', ').trim();
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                street: street || result.formattedAddress,
                                                city: city || prev.city,
                                                state: state.length === 2 ? state : prev.state,
                                                zipCode: zip || prev.zipCode
                                            }));

                                            showNotification(`✅ Found: ${result.name}`, 'success');
                                        } else {
                                            showNotification('Place not found. Please enter address manually.', 'info');
                                        }
                                    } catch (err) {
                                        console.error('Address lookup error:', err);
                                        showNotification('Address lookup failed', 'error');
                                    } finally {
                                        setLookingUpAddress(false);
                                    }
                                }}
                                disabled={lookingUpAddress}
                                className="mt-2 flex items-center gap-2 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {lookingUpAddress ? (
                                    <><Loader size={12} className="animate-spin" /> Searching...</>
                                ) : (
                                    <><Search size={12} /> Find Address</>
                                )}
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📍</div>
                            <input
                                type="text"
                                required
                                placeholder="123 Main Street"
                                className="w-full pl-10 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.street || ''}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3">
                        <div className="col-span-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                            <input
                                type="text"
                                required
                                placeholder="New York"
                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                            <select
                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border bg-white"
                                value={formData.state || 'NY'}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            >
                                <option value="NY">NY</option>
                                <option value="NJ">NJ</option>
                                <option value="CT">CT</option>
                                <option value="PA">PA</option>
                                <option value="MA">MA</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                            <input
                                type="text"
                                required
                                placeholder="10001"
                                maxLength={10}
                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.zipCode || ''}
                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            />
                        </div>
                    </div>


                    {/* Dynamic Contacts Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-700">Points of Contact</label>
                            <button
                                type="button"
                                onClick={addContact}
                                className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Contact
                            </button>
                        </div>

                        {formData.contacts && formData.contacts.map((contact, index) => (
                            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100 relative group">
                                {formData.contacts.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeContact(index)}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                                <div className="space-y-3">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                required
                                                placeholder="Name"
                                                className="w-full pl-9 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-2 border text-sm"
                                                value={contact.name}
                                                onChange={(e) => updateContact(index, 'name', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Role */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                                            <select
                                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-2 border text-sm"
                                                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                value={contact.role}
                                                onChange={(e) => updateContact(index, 'role', e.target.value)}
                                            >
                                                <option value="Manager">Manager</option>
                                                <option value="Owner">Owner</option>
                                                <option value="Floor Manager">Floor Manager</option>
                                                <option value="Buying Manager">Buying Manager</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        {/* Email */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-2 border text-sm"
                                                value={contact.email}
                                                onChange={(e) => updateContact(index, 'email', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            placeholder="(555) 555-5555"
                                            className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-2 border text-sm"
                                            value={contact.phone}
                                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                        <div className="relative">
                            <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Optional until first sale"
                                className={`w-full pl-10 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border ${analyzingLicense ? 'bg-slate-50' : ''}`}
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                            {analyzingLicense && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse">
                                    <Sparkles size={14} />
                                    <span>Gemini Analyzing...</span>
                                </div>
                            )}
                        </div>

                        {!licensePreview ? (
                            <label className="relative flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-sm mt-2">
                                <Camera size={16} />
                                <span>Add License Photo</span>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleLicenseImageChange}
                                    onClick={(e) => (e.target.value = null)}
                                />
                            </label>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-slate-200 mt-2">
                                <img src={licensePreview} alt="License" className="w-full h-32 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setLicenseImage(null); setLicensePreview(null); }}
                                    className="absolute top-2 right-2 p-1 rounded-full text-slate-600 hover:text-red-600 shadow-sm"
                                    style={{ background: 'var(--bg-tertiary)' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
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

                <div className="space-y-6">
                    <div className="themed-card p-6 rounded-xl space-y-4 mb-4">
                        <h2 className="font-semibold text-slate-800">Lead Priority</h2>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {['Low', 'Normal', 'High'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`py-2 px-4 rounded-lg border font-medium transition-all ${formData.priority === p
                                        ? (p === 'High' ? 'bg-red-50 border-red-200 text-red-600' :
                                            p === 'Normal' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                                'bg-slate-50 border-slate-200 text-slate-600')
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="themed-card p-6 rounded-xl space-y-4">
                        <h2 className="font-semibold text-slate-800">Samples Requested</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableBrands.map(brand => (
                                <label
                                    key={brand}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${(formData.samplesRequested || []).includes(brand)
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-200 hover:bg-slate-50'
                                        }`}
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
                </div>
            </form >
        </div >
    );
}
