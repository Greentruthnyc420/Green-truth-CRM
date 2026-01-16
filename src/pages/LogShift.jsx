import React, { useState } from 'react';
import { Camera, MapPin, Clock, DollarSign, UploadCloud, X } from 'lucide-react';
import { uploadTollReceipt } from '../services/storageService';
import { addCompletedActivation } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { sendAdminNotification, createActivationEmail } from '../services/adminNotifications';


export default function LogShift() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    // location removed
    const [loading, setLoading] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [odometerImage, setOdometerImage] = useState(null);
    const [odometerPreview, setOdometerPreview] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState({ title: '', body: '' });

    const [formData, setFormData] = useState({
        startTime: '',
        endTime: '',
        miles: '',
        tollAmount: '',
        dispensaryName: '',
        region: 'NYC',
        hasVehicle: true,
        brand: ''
    });

    const availableBrands = [
        '🍯 Honey King',
        'Bud Cracker Boulevard',
        'Canna Dots',
        'Space Poppers!',
        'Smoothie Bar',
        'Waferz NY',
        'Pines'
    ];

    // Register Voice Assistant - REMOVED


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReceipt(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleOdometerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setOdometerImage(file);
            setOdometerPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Mandatory Brand
        if (!formData.brand) {
            setModalMessage({
                title: 'Brand Required',
                body: 'Please select which brand you were doing the activation for. This is required for tracking purposes.'
            });
            setShowModal(true);
            return;
        }

        // Validation: Mandatory Odometer Photo if miles populated
        if (parseFloat(formData.miles) > 0 && !odometerImage) {
            setModalMessage({
                title: 'Trip Log Screenshot Required',
                body: 'To claim mileage reimbursement, you must upload a screenshot from your trip log app showing the distance traveled. This ensures accurate compensation.'
            });
            setShowModal(true);
            return;
        }

        // Validation: Mandatory Toll Receipt if toll amount populated
        if (parseFloat(formData.tollAmount) > 0 && !receipt) {
            setModalMessage({
                title: 'Toll Receipt Required',
                body: 'To claim toll expenses, you must upload a photo of your receipt. We cannot process reimbursements without proof of payment.'
            });
            setShowModal(true);
            return;
        }

        setLoading(true);

        try {
            let receiptUrl = null;
            if (receipt) {
                receiptUrl = await uploadTollReceipt(receipt, currentUser?.uid || 'anonymous');
            }

            let odometerUrl = null;
            if (odometerImage) {
                odometerUrl = await uploadTollReceipt(odometerImage, currentUser?.uid || 'anonymous');
            }

            const activationData = {
                userId: currentUser?.uid || 'demo-user',
                brand: formData.brand,
                brandName: formData.brand,
                dispensaryName: formData.dispensaryName,
                date: new Date(),
                startTime: formData.startTime,
                endTime: formData.endTime,
                milesTraveled: parseFloat(formData.miles) || 0,
                odometerImageUrl: odometerUrl,
                tollAmount: parseFloat(formData.tollAmount) || 0,
                tollReceiptImageUrl: receiptUrl,
                region: formData.region,
                hasVehicle: formData.hasVehicle,
                activationType: 'walk-in', // Unscheduled activation
                notes: `Walk-in activation | Miles: ${formData.miles || 0} | Tolls: $${formData.tollAmount || 0}`
            };

            await addCompletedActivation(activationData);

            // Send admin email notification
            try {
                const { html, text } = createActivationEmail({
                    dispensaryName: formData.dispensaryName,
                    activationType: 'Field Activation', // LogShift is for activations
                    date: new Date().toLocaleDateString(),
                    repName: currentUser?.displayName || currentUser?.email || 'Unknown Rep',
                    notes: `Brand: ${formData.brand} | Region: ${formData.region} | Miles: ${formData.miles || 0} | Tolls: $${formData.tollAmount || 0}`
                });

                await sendAdminNotification({
                    subject: `🎯 New Activation: ${formData.dispensaryName} (${formData.brand})`,
                    html,
                    text
                });
            } catch (emailErr) {
                console.warn('Email notification failed:', emailErr);
                // Don't block user experience if email fails
            }

            showNotification('Shift logged successfully!', 'success');
            navigate('/history');
        } catch (error) {
            console.error('Error logging shift:', error);
            showNotification('Failed to log shift: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                    <Clock size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Log Shift</h1>
                <p className="text-slate-500">Record your hours and travel expenses.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <MapPin size={20} className="text-brand-600" />
                        Location & Brand
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dispensary Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Store Name"
                            className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                            value={formData.dispensaryName}
                            onChange={(e) => setFormData({ ...formData, dispensaryName: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Region / Zone</label>
                        <select
                            value={formData.region}
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border bg-white"
                        >
                            <option value="NYC">Five Boroughs (NYC)</option>
                            <option value="LI">LI & Downstate/Westchester</option>
                            <option value="UPSTATE">Upstate NY</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Activation Brand <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-2">
                            {availableBrands.map(b => (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, brand: b })}
                                    className={`
                                        p-2 text-sm rounded-lg border text-left transition-all
                                        ${formData.brand === b
                                            ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium ring-1 ring-brand-500'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Clock size={20} className="text-brand-600" />
                        Time & Distance
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Transport Mode Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Transportation Method</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Personal Vehicle Option */}
                            <label className={`
                                flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${formData.hasVehicle
                                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                                    : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'}
                            `}>
                                <input
                                    type="radio"
                                    name="transportMethod"
                                    className="hidden"
                                    checked={formData.hasVehicle === true}
                                    onChange={() => setFormData({ ...formData, hasVehicle: true })}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hasVehicle ? 'border-brand-600' : 'border-slate-300'}`}>
                                            {formData.hasVehicle && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                                        </div>
                                        <span className="font-bold text-sm">Personal Vehicle</span>
                                    </div>
                                    <span className="text-xs opacity-80 block ml-7">$0.35/mile reimbursement</span>
                                </div>
                            </label>

                            {/* Public Transportation Option */}
                            <label className={`
                                flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${formData.hasVehicle === false
                                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                                    : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'}
                            `}>
                                <input
                                    type="radio"
                                    name="transportMethod"
                                    className="hidden"
                                    checked={formData.hasVehicle === false}
                                    onChange={() => setFormData({ ...formData, hasVehicle: false })}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!formData.hasVehicle ? 'border-brand-600' : 'border-slate-300'}`}>
                                            {!formData.hasVehicle && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                                        </div>
                                        <span className="font-bold text-sm">Public Transportation</span>
                                    </div>
                                    <span className="text-xs opacity-80 block ml-7">$0.20/mile reimbursement</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Miles Traveled</label>
                        <div className="relative mb-2">
                            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="number"
                                placeholder="420"
                                step="0.1"
                                min="0"
                                className="w-full pl-10 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none p-3 border"
                                value={formData.miles}
                                onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                            />
                        </div>

                        {!odometerPreview ? (
                            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-sm">
                                <Camera size={16} />
                                <span>Add Trip Log Screenshot</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleOdometerChange} />
                            </label>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-slate-200 mt-2">
                                <img src={odometerPreview} alt="Trip Log" className="w-full h-32 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setOdometerImage(null); setOdometerPreview(null); }}
                                    className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-slate-600 hover:text-red-600 shadow-sm"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <DollarSign size={20} className="text-brand-600" />
                        Expenses (Tolls)
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Toll Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                placeholder="420.00"
                                step="0.01"
                                min="0"
                                className="w-full pl-8 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 outline-none p-3 border"
                                value={formData.tollAmount}
                                onChange={(e) => setFormData({ ...formData, tollAmount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Toll Receipt</label>

                        {!previewUrl ? (
                            <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                                    <Camera size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-slate-700">Tap to upload receipt</p>
                                    <p className="text-xs text-slate-400">JPG, PNG up to 5MB</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200">
                                <img src={previewUrl} alt="Receipt preview" className="w-full h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setReceipt(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-slate-600 hover:text-red-600 shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? 'Submitting...' : 'Log Shift'}
                </button>
            </form>

            {/* Validation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 flex flex-col gap-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 w-12 h-12 rounded-full flex items-center justify-center">
                            <UploadCloud size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{modalMessage.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{modalMessage.body}</p>
                        </div>
                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
                        >
                            Got It, Uploading Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
