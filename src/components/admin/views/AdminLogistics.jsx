import React, { useState } from 'react';
import { Users, Car, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminLogistics() {
    const [drivers, setDrivers] = useState([
        { id: 1, name: 'John Doe', license: 'D1234567', employeeId: 'E76543' },
    ]);
    const [vehicles, setVehicles] = useState([
        { id: 1, make: 'Ford', model: 'Transit', color: 'White', plate: 'ABC-123', insuranceExpiry: '2024-12-31' },
    ]);

    // TODO: Implement full CRUD functionality

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Car className="text-brand-600" />
                    Logistics Management
                </h1>
                <p className="text-slate-500">Manage company drivers and vehicles.</p>
            </header>

            {/* Drivers Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18} /> Drivers</h2>
                    <button className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold py-1 px-3 rounded-full flex items-center gap-1">
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
                            {drivers.map(driver => (
                                <tr key={driver.id} className="hover:bg-slate-50">
                                    <td className="py-4 px-6 font-medium text-slate-800">{driver.name}</td>
                                    <td className="py-4 px-6 text-slate-500">{driver.license}</td>
                                    <td className="py-4 px-6 text-slate-500">{driver.employeeId}</td>
                                    <td className="py-4 px-6 text-center space-x-2">
                                        <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"><Edit size={14} /></button>
                                        <button className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"><Trash2 size={14} /></button>
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
                    <button className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold py-1 px-3 rounded-full flex items-center gap-1">
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
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Insurance Expiry</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {vehicles.map(vehicle => (
                                <tr key={vehicle.id} className="hover:bg-slate-50">
                                    <td className="py-4 px-6 font-medium text-slate-800">{vehicle.make} {vehicle.model}</td>
                                    <td className="py-4 px-6 text-slate-500">{vehicle.color}</td>
                                    <td className="py-4 px-6 text-slate-500">{vehicle.plate}</td>
                                    <td className="py-4 px-6 text-slate-500">{vehicle.insuranceExpiry}</td>
                                    <td className="py-4 px-6 text-center space-x-2">
                                        <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"><Edit size={14} /></button>
                                        <button className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
