import React, { useState, useEffect } from 'react';
import { Users, Car, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { getDrivers, getVehicles } from '../../../services/firestoreService';
import { AVAILABLE_BRANDS } from '../../../contexts/BrandAuthContext';

export default function AdminLogistics() {
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [brandFilter, setBrandFilter] = useState('all');

    useEffect(() => {
        fetchLogisticsData();
    }, [brandFilter]);

    async function fetchLogisticsData() {
        setLoading(true);
        try {
            // Pass null to get all, or brandId to filter
            const filterId = brandFilter === 'all' ? null : brandFilter;
            const [driversData, vehiclesData] = await Promise.all([
                getDrivers(filterId),
                getVehicles(filterId)
            ]);
            setDrivers(driversData);
            setVehicles(vehiclesData);
        } catch (err) {
            console.error("Error fetching logistics:", err);
        } finally {
            setLoading(false);
        }
    }

    // Helper to get brand name from ID
    const getBrandName = (id) => {
        const brand = Object.values(AVAILABLE_BRANDS).find(b => b.brandId === id);
        return brand ? brand.brandName : id;
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Car className="text-brand-600" />
                        Logistics Management (Admin)
                    </h1>
                    <p className="text-slate-500">Manage drivers and vehicles across all brands.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-brand-500"
                    >
                        <option value="all">All Brands</option>
                        {Object.values(AVAILABLE_BRANDS).map(b => (
                            <option key={b.brandId} value={b.brandId}>{b.brandName}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Drivers Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18} /> Drivers</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">License #</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="4" className="py-4 text-center text-slate-400">Loading...</td></tr>
                            ) : drivers.length === 0 ? (
                                <tr><td colSpan="4" className="py-4 text-center text-slate-400">No drivers found.</td></tr>
                            ) : (
                                drivers.map(driver => (
                                    <tr key={driver.id} className="hover:bg-slate-50">
                                        <td className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">{getBrandName(driver.brandId)}</td>
                                        <td className="py-4 px-6 font-medium text-slate-800">{driver.name}</td>
                                        <td className="py-4 px-6 text-slate-500">{driver.licenseNumber}</td>
                                        <td className="py-4 px-6 text-slate-500">{driver.employeeId}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vehicles Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><Car size={18} /> Vehicles</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Make & Model</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Color</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">License Plate</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Insurance Expiry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="py-4 text-center text-slate-400">Loading...</td></tr>
                            ) : vehicles.length === 0 ? (
                                <tr><td colSpan="5" className="py-4 text-center text-slate-400">No vehicles found.</td></tr>
                            ) : (
                                vehicles.map(vehicle => (
                                    <tr key={vehicle.id} className="hover:bg-slate-50">
                                        <td className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">{getBrandName(vehicle.brandId)}</td>
                                        <td className="py-4 px-6 font-medium text-slate-800">{vehicle.make} {vehicle.model}</td>
                                        <td className="py-4 px-6 text-slate-500">{vehicle.color}</td>
                                        <td className="py-4 px-6 text-slate-500">{vehicle.plate}</td>
                                        <td className="py-4 px-6 text-slate-500">{vehicle.insuranceExpiry}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
