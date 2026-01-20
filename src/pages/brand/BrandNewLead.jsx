import React, { useState, useEffect } from 'react';
import { Store, User, FileText, Calendar, Camera, X, Plus, Sparkles, Loader, ChevronDown, UserPlus } from 'lucide-react';
import { addLead, checkDuplicateLead, LEAD_STATUS } from '../../services/firestoreService';
import { uploadTollReceipt } from '../../services/storageService';
import { geocodeAddress } from '../../utils/geocoding';
import { extractLicenseNumber } from '../../services/geminiService';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { awardLeadPoints } from '../../services/pointsService';
import { getMondayIntegrationStatus, syncAccountToMonday } from '../../services/mondayService';

export default function BrandNewLead() {
    const navigate = useNavigate();
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [licenseImage, setLicenseImage] = useState(null);
    const [licensePreview, setLicensePreview] = useState(null);
    const [analyzingLicense, setAnalyzingLicense] = useState(false);
    const [mondayIntegration, setMondayIntegration] = useState({ connected: false, accountsBoardId: null });
    const [syncToMonday, setSyncToMonday] = useState(true);

    const [formData, setFormData] = useState({
        dispensaryName: '',
        address: '',
        licenseNumber: '',
        meetingDate: new Date().toISOString().split('T')[0],
        leadStatus: LEAD_STATUS.PROSPECT,
        contacts: [
            { name: '', role: 'Manager', email: '', phone: '' }
        ]
    });

    useEffect(() => {
        async function fetchMondayStatus() {
            if (brandUser?.brandId) {
                const status = await getMondayIntegrationStatus(brandUser.brandId);
                setMondayIntegration(status);
            }
        }
        fetchMondayStatus();
    }, [brandUser]);

    const categories = [
        { id: LEAD_STATUS.PROSPECT, label: 'Prospect', color: { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)' } },
        { id: LEAD_STATUS.SAMPLES_REQUESTED, label: 'Samples Requested', color: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)' } },
        { id: LEAD_STATUS.SAMPLES_DELIVERED, label: 'Received Samples', color: { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--info)' } },
        { id: LEAD_STATUS.ACTIVE, label: 'Active', color: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--success)' } }
    ];

    const handleLicenseImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setLicenseImage(file);
            setLicensePreview(URL.createObjectURL(file));
            setAnalyzingLicense(true);
            try {
                const extracted = await extractLicenseNumber(file);
                if (extracted) {
                    setFormData(prev => ({ ...prev, licenseNumber: extracted }));
                }
            } catch (err) {
                console.warn("Auto-extraction failed", err);
            } finally {
                setAnalyzingLicense(false);
            }
        }
    };

    const updateContact = (index, field, value) => {
        const newContacts = [...formData.contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setFormData({ ...formData, contacts: newContacts });
    };

    const addContact = () => {
        setFormData({
            ...formData,
            contacts: [...formData.contacts, { name: '', role: 'Manager', email: '', phone: '' }]
        });
    };

    const removeContact = (index) => {
        if (formData.contacts.length === 1) return;
        const newContacts = formData.contacts.filter((_, i) => i !== index);
        setFormData({ ...formData, contacts: newContacts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check for duplicates
            const match = await checkDuplicateLead(formData.dispensaryName);
            if (match && match.ownerBrandId === brandUser?.brandId) {
                alert("You already have this lead in your pipeline!");
                setLoading(false);
                return;
            }

            let locationData = { lat: null, lng: null, address: formData.address };
            if (formData.address) {
                try {
                    const coords = await geocodeAddress(formData.address);
                    if (coords) locationData = coords;
                } catch (err) {
                    console.error("Geocoding failed", err);
                }
            }

            let licenseImageUrl = null;
            if (licenseImage) {
                licenseImageUrl = await uploadTollReceipt(licenseImage, brandUser?.uid || 'anonymous');
            }

            const leadRef = await addLead({
                ...formData,
                location: locationData,
                licenseImageUrl,
                ownerBrandId: brandUser?.brandId,
                brandName: brandUser?.brandName,
                createdBy: 'brand',
                createdAt: new Date().toISOString(),
                samplesRequested: [brandUser?.brandName]
            });

            try {
                if (brandUser?.uid) {
                    await awardLeadPoints(brandUser.uid, leadRef.id || 'unknown');
                }
            } catch (pErr) {
                console.warn("Points awarding failed.", pErr);
            }

            // Sync to Monday.com if enabled
            if (syncToMonday && mondayIntegration.connected && mondayIntegration.accountsBoardId) {
                const leadDataForSync = { ...formData, id: leadRef.id };
                const syncResult = await syncAccountToMonday(brandUser.brandId, leadDataForSync, mondayIntegration.accountsBoardId);
                if (syncResult.success) {
                    showNotification('Lead synced to Monday.com successfully!', 'success');
                } else {
                    showNotification(`Failed to sync lead to Monday.com: ${syncResult.error}`, 'error');
                }
            }

            showNotification('Lead recorded and categorized successfully!', 'success');
            navigate('/brand');
        } catch (error) {
            console.error('Error adding brand lead:', error);
            showNotification('Failed to add lead.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent-primary)' }}>
                    <UserPlus size={32} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>New Brand Lead</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Add a new potential dispensary to your {brandUser?.brandName} pipeline.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-12">
                <div className="themed-card p-6 rounded-xl shadow-sm space-y-4">

                    {/* Status Categorization */}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Lead Category</label>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, leadStatus: cat.id })}
                                    className="flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-all"
                                    style={{
                                        background: formData.leadStatus === cat.id ? cat.color.bg : 'var(--bg-card)',
                                        color: formData.leadStatus === cat.id ? cat.color.text : 'var(--text-secondary)',
                                        border: formData.leadStatus === cat.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)'
                                    }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr style={{ borderColor: 'var(--border-primary)' }} />

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Dispensary Name</label>
                        <div className="relative">
                            <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                required
                                className="w-full pl-10 rounded-lg outline-none p-3"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)'
                                }}
                                value={formData.dispensaryName}
                                onChange={(e) => setFormData({ ...formData, dispensaryName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Address</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>📍</div>
                            <input
                                type="text"
                                required
                                placeholder="123 Main St, New York, NY"
                                className="w-full pl-10 rounded-lg outline-none p-3"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)'
                                }}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Contacts Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Points of Contact</label>
                            <button
                                type="button"
                                onClick={addContact}
                                className="text-sm font-medium flex items-center gap-1"
                                style={{ color: 'var(--accent-primary)' }}
                            >
                                <Plus size={16} /> Add Contact
                            </button>
                        </div>

                        {formData.contacts.map((contact, index) => (
                            <div key={index} className="p-4 rounded-lg relative" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                {formData.contacts.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeContact(index)}
                                        className="absolute top-2 right-2"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contact Name"
                                        className="w-full rounded-lg outline-none p-2 text-sm"
                                        style={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }}
                                        value={contact.name}
                                        onChange={(e) => updateContact(index, 'name', e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            className="w-full rounded-lg outline-none p-2 text-sm"
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--text-primary)'
                                            }}
                                            value={contact.role}
                                            onChange={(e) => updateContact(index, 'role', e.target.value)}
                                        >
                                            <option value="Manager">Manager</option>
                                            <option value="Owner">Owner</option>
                                            <option value="Floor Manager">Floor Manager</option>
                                            <option value="Buying Manager">Buying Manager</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            className="w-full rounded-lg outline-none p-2 text-sm"
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--text-primary)'
                                            }}
                                            value={contact.email}
                                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                                        />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        className="w-full rounded-lg outline-none p-2 text-sm"
                                        style={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }}
                                        value={contact.phone}
                                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Meeting Date</label>
                        <div className="relative">
                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                            <input
                                type="date"
                                required
                                className="w-full pl-10 rounded-lg outline-none p-3"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)'
                                }}
                                value={formData.meetingDate}
                                onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>OCM License (Optional)</label>
                        <div className="relative">
                            <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="License Number"
                                className="w-full pl-10 rounded-lg outline-none p-3"
                                style={{
                                    background: analyzingLicense ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)'
                                }}
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                            {analyzingLicense && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-medium animate-pulse" style={{ color: 'var(--accent-primary)' }}>
                                    <Sparkles size={14} />
                                    <span>Analyzing...</span>
                                </div>
                            )}
                        </div>
                        <label className="relative flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-sm mt-2"
                            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                            <Camera size={16} />
                            <span>{licenseImage ? 'Change Photo' : 'Upload License Photo'}</span>
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept="image/*"
                                capture="environment"
                                onChange={handleLicenseImageChange}
                                onClick={(e) => (e.target.value = null)}
                            />
                        </label>
                    </div>
                </div>

                {mondayIntegration.connected && mondayIntegration.accountsBoardId && (
                    <div className="themed-card p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="https://dapulse-res.cloudinary.com/image/upload/v1575480544/mondaycom/logos/monday_logo_color.png" alt="Monday.com Logo" className="h-6 w-auto object-contain" />
                                <label htmlFor="syncToMonday" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sync to Monday.com</label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSyncToMonday(!syncToMonday)}
                                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200"
                                style={{ background: syncToMonday ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
                                aria-pressed="false"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${syncToMonday ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                ></span>
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                    {loading ? <Loader className="animate-spin" /> : null}
                    {loading ? 'Processing...' : 'Record Categorized Lead'}
                </button>
            </form>
        </div>
    );
}
