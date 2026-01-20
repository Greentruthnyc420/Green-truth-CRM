import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    getDrivers, addDriver, updateDriver, deleteDriver,
    getVehicles, addVehicle, updateVehicle, deleteVehicle
} from '../../services/firestoreService';
import { Users, Car, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

export default function BrandLogistics() {
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();

    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [driverModal, setDriverModal] = useState({ open: false, data: null }); // data null = new, data obj = edit
    const [vehicleModal, setVehicleModal] = useState({ open: false, data: null });

    useEffect(() => {
        async function fetchData() {
            if (!brandUser?.brandId) return;
            setLoading(true);
            try {
                const [dData, vData] = await Promise.all([
                    getDrivers(brandUser.brandId),
                    getVehicles(brandUser.brandId)
                ]);
                setDrivers(dData || []);
                setVehicles(vData || []);
            } catch (error) {
                console.error("Failed to load logistics data", error);
                showNotification("Failed to load data", "error");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [brandUser?.brandId]);

    const handleSaveDriver = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const driverData = {
            name: formData.get('name'),
            license: formData.get('license'),
            employeeId: formData.get('employeeId'),
            brandId: brandUser.brandId
        };

        try {
            if (driverModal.data) {
                await updateDriver(driverModal.data.id, driverData);
                showNotification("Driver updated", "success");
            } else {
                await addDriver(driverData);
                showNotification("Driver added", "success");
            }

            // Refresh
            const dData = await getDrivers(brandUser.brandId);
            setDrivers(dData);
            setDriverModal({ open: false, data: null });
        } catch (error) {
            console.error(error);
            showNotification("Failed to save driver", "error");
        }
    };

    const handleDeleteDriver = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteDriver(id);
            setDrivers(prev => prev.filter(d => d.id !== id));
            showNotification("Driver deleted", "success");
        } catch (error) {
            showNotification("Failed to delete", "error");
        }
    };

    const handleSaveVehicle = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const vehicleData = {
            make: formData.get('make'),
            model: formData.get('model'),
            color: formData.get('color'),
            plate: formData.get('plate'),
            insuranceExpiry: formData.get('insuranceExpiry'),
            brandId: brandUser.brandId
        };

        try {
            if (vehicleModal.data) {
                await updateVehicle(vehicleModal.data.id, vehicleData);
                showNotification("Vehicle updated", "success");
            } else {
                await addVehicle(vehicleData);
                showNotification("Vehicle added", "success");
            }

            // Refresh
            const vData = await getVehicles(brandUser.brandId);
            setVehicles(vData);
            setVehicleModal({ open: false, data: null });
        } catch (error) {
            console.error(error);
            showNotification("Failed to save vehicle", "error");
        }
    };

    const handleDeleteVehicle = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteVehicle(id);
            setVehicles(prev => prev.filter(v => v.id !== id));
            showNotification("Vehicle deleted", "success");
        } catch (error) {
            showNotification("Failed to delete", "error");
        }
    };


    if (loading) return <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Loading Logistics Data...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Car className="text-brand-600" />
                    Logistics Management
                </h1>
                <p className="text-slate-500">Manage your delivery fleet and drivers.</p>
            </header>

            {/* Drivers Section */}
            <div className="rounded-xl shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div className="px-6 py-4 flex justify-between items-center" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Users size={18} /> Drivers</h2>
                    <button
                        onClick={() => setDriverModal({ open: true, data: null })}
                        className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-full flex items-center gap-1 transition-colors"
                    >
                        <Plus size={14} /> Add Driver
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Name</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>License #</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Employee ID</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.length === 0 && (
                                <tr><td colSpan="4" className="py-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No drivers found. Add one to get started.</td></tr>
                            )}
                            {drivers.map(driver => (
                                <tr key={driver.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <td className="py-4 px-6 font-medium" style={{ color: 'var(--text-primary)' }}>{driver.name}</td>
                                    <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{driver.license}</td>
                                    <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{driver.employeeId}</td>
                                    <td className="py-4 px-6 text-center space-x-2">
                                        <button onClick={() => setDriverModal({ open: true, data: driver })} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-tertiary)' }}><Edit size={14} /></button>
                                        <button onClick={() => handleDeleteDriver(driver.id)} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-tertiary)' }}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vehicles Section */}
            <div className="rounded-xl shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div className="px-6 py-4 flex justify-between items-center" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Car size={18} /> Vehicles</h2>
                    <button
                        onClick={() => setVehicleModal({ open: true, data: null })}
                        className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-full flex items-center gap-1 transition-colors"
                    >
                        <Plus size={14} /> Add Vehicle
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Make & Model</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Color</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>License Plate</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Insurance</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.length === 0 && (
                                <tr><td colSpan="5" className="py-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No vehicles found. Add one to get started.</td></tr>
                            )}
                            {vehicles.map(vehicle => (
                                <tr key={vehicle.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <td className="py-4 px-6 font-medium" style={{ color: 'var(--text-primary)' }}>{vehicle.make} {vehicle.model}</td>
                                    <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{vehicle.color}</td>
                                    <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{vehicle.plate}</td>
                                    <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{vehicle.insuranceExpiry}</td>
                                    <td className="py-4 px-6 text-center space-x-2">
                                        <button onClick={() => setVehicleModal({ open: true, data: vehicle })} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-tertiary)' }}><Edit size={14} /></button>
                                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-tertiary)' }}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {driverModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="rounded-xl shadow-2xl w-full max-w-md p-6" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{driverModal.data ? 'Edit Driver' : 'Add New Driver'}</h3>
                            <button onClick={() => setDriverModal({ open: false, data: null })} style={{ color: 'var(--text-tertiary)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveDriver} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                                <input name="name" defaultValue={driverModal.data?.name} required className="w-full p-2 rounded-lg focus:border-brand-500 outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} placeholder="e.g. Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>License Number</label>
                                <input name="license" defaultValue={driverModal.data?.license} required className="w-full p-2 rounded-lg focus:border-brand-500 outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} placeholder="Drivers License #" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Employee ID</label>
                                <input name="employeeId" defaultValue={driverModal.data?.employeeId} className="w-full p-2 rounded-lg focus:border-brand-500 outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} placeholder="Optional" />
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors flex justify-center items-center gap-2">
                                <Save size={18} />
                                {driverModal.data ? 'Update Driver' : 'Save Driver'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {vehicleModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="rounded-xl shadow-2xl w-full max-w-md p-6" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{vehicleModal.data ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                            <button onClick={() => setVehicleModal({ open: false, data: null })} style={{ color: 'var(--text-tertiary)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveVehicle} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Make</label>
                                    <input name="make" defaultValue={vehicleModal.data?.make} required className="w-full p-2 rounded-lg focus:border-brand-500 outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} placeholder="Ford" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Model</label>
                                    <input name="model" defaultValue={vehicleModal.data?.model} required className="w-full p-2 rounded-lg focus:border-brand-500 outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} placeholder="Transit" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Color</label>
                                <input name="color" defaultValue={vehicleModal.data?.color} required className="w-full p-2 rounded-lg focus:border-brand-500 outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} placeholder="White" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>License Plate</label>
                                <input name="plate" defaultValue={vehicleModal.data?.plate} required className="w-full p-2 rounded-lg focus:border-brand-500 outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} placeholder="ABC-123" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Insurance Expiry</label>
                                <input type="date" name="insuranceExpiry" defaultValue={vehicleModal.data?.insuranceExpiry} required className="w-full p-2 rounded-lg focus:border-brand-500 outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors flex justify-center items-center gap-2">
                                <Save size={18} />
                                {vehicleModal.data ? 'Update Vehicle' : 'Save Vehicle'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
