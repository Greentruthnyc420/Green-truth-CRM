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
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Car style={{ color: 'var(--accent-primary)' }} />
                        Logistics Management (Admin)
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage drivers and vehicles across all brands.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="text-sm rounded-lg px-3 py-2 outline-none"
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value="all">All Brands</option>
                        {Object.values(AVAILABLE_BRANDS).map(b => (
                            <option key={b.brandId} value={b.brandId}>{b.brandName}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Drivers Section */}
            <div className="themed-card rounded-xl shadow-sm">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Users size={18} /> Drivers</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Brand</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Name</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>License #</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Employee ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                            {loading ? (
                                <tr><td colSpan="4" className="py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>Loading...</td></tr>
                            ) : drivers.length === 0 ? (
                                <tr><td colSpan="4" className="py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>No drivers found.</td></tr>
                            ) : (
                                drivers.map(driver => (
                                    <tr key={driver.id} className="transition-colors" style={{ ':hover': { background: 'var(--bg-tertiary)' } }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td className="py-4 px-6 text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>{getBrandName(driver.brandId)}</td>
                                        <td className="py-4 px-6 font-medium" style={{ color: 'var(--text-primary)' }}>{driver.name}</td>
                                        <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{driver.licenseNumber}</td>
                                        <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{driver.employeeId}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vehicles Section */}
            <div className="themed-card rounded-xl shadow-sm">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Car size={18} /> Vehicles</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Brand</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Make & Model</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Color</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>License Plate</th>
                                <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Insurance Expiry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                            {loading ? (
                                <tr><td colSpan="5" className="py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>Loading...</td></tr>
                            ) : vehicles.length === 0 ? (
                                <tr><td colSpan="5" className="py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>No vehicles found.</td></tr>
                            ) : (
                                vehicles.map(vehicle => (
                                    <tr key={vehicle.id} className="transition-colors"
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td className="py-4 px-6 text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>{getBrandName(vehicle.brandId)}</td>
                                        <td className="py-4 px-6 font-medium" style={{ color: 'var(--text-primary)' }}>{vehicle.make} {vehicle.model}</td>
                                        <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{vehicle.color}</td>
                                        <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{vehicle.plate}</td>
                                        <td className="py-4 px-6" style={{ color: 'var(--text-secondary)' }}>{vehicle.insuranceExpiry}</td>
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
