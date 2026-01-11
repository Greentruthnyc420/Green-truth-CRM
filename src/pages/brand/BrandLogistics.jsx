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


    if (loading) return <div className="p-8 text-center text-slate-500">Loading Logistics Data...</div>;

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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18} /> Drivers</h2>
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
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">License #</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee ID</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {drivers.length === 0 && (
                                <tr><td colSpan="4" className="py-4 text-center text-slate-500 text-sm">No drivers found. Add one to get started.</td></tr>
                            )}
                            {drivers.map(driver => (
                                <tr key={driver.id} className="hover:bg-slate-50">
                                    <td className="py-4 px-6 font-medium text-slate-800">{driver.name}</td>
                                    <td className="py-4 px-6 text-slate-500">{driver.license}</td>
                                    <td className="py-4 px-6 text-slate-500">{driver.employeeId}</td>
                                    <td className="py-4 px-6 text-center space-x-2">
                                        <button onClick={() => setDriverModal({ open: true, data: driver })} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"><Edit size={14} /></button>
                                        <button onClick={() => handleDeleteDriver(driver.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vehicles Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><Car size={18} /> Vehicles</h2>
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
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Make & Model</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Color</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">License Plate</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Insurance</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {vehicles.length === 0 && (
                                <tr><td colSpan="5" className="py-4 text-center text-slate-500 text-sm">No vehicles found. Add one to get started.</td></tr>
                            )}
                            {vehicles.map(vehicle => (
                                <tr key={vehicle.id} className="hover:bg-slate-50">
                                    <td className="py-4 px-6 font-medium text-slate-800">{vehicle.make} {vehicle.model}</td>
                                    <td className="py-4 px-6 text-slate-500">{vehicle.color}</td>
                                    <td className="py-4 px-6 text-slate-500">{vehicle.plate}</td>
                                    <td className="py-4 px-6 text-slate-500">{vehicle.insuranceExpiry}</td>
                                    <td className="py-4 px-6 text-center space-x-2">
                                        <button onClick={() => setVehicleModal({ open: true, data: vehicle })} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"><Edit size={14} /></button>
                                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"><Trash2 size={14} /></button>
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
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">{driverModal.data ? 'Edit Driver' : 'Add New Driver'}</h3>
                            <button onClick={() => setDriverModal({ open: false, data: null })} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveDriver} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input name="name" defaultValue={driverModal.data?.name} required className="w-full p-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none" placeholder="e.g. Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Number</label>
                                <input name="license" defaultValue={driverModal.data?.license} required className="w-full p-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none" placeholder="Drivers License #" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee ID</label>
                                <input name="employeeId" defaultValue={driverModal.data?.employeeId} className="w-full p-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none" placeholder="Optional" />
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
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">{vehicleModal.data ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                            <button onClick={() => setVehicleModal({ open: false, data: null })} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveVehicle} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Make</label>
                                    <input name="make" defaultValue={vehicleModal.data?.make} required className="w-full p-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none" placeholder="Ford" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model</label>
                                    <input name="model" defaultValue={vehicleModal.data?.model} required className="w-full p-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none" placeholder="Transit" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color</label>
                                <input name="color" defaultValue={vehicleModal.data?.color} required className="w-full p-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none" placeholder="White" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Plate</label>
                                <input name="plate" defaultValue={vehicleModal.data?.plate} required className="w-full p-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none" placeholder="ABC-123" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Insurance Expiry</label>
                                <input type="date" name="insuranceExpiry" defaultValue={vehicleModal.data?.insuranceExpiry} required className="w-full p-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none" />
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
