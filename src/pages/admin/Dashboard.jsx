import React, { useState, useEffect } from 'react';
import {
    DollarSign, Users, FileText, CheckCircle, ExternalLink, Loader,
    Download, AlertTriangle, RefreshCw, Award, BarChart, Calendar,
    Store, CircleDollarSign, Banknote, Shield
} from 'lucide-react';
import {
    getAllShifts, updateShiftStatus, getSales, getLeads,
    getUserProfile, updateSaleStatus, markRepAsPaid, seedBrands,
    getActivations
} from '../../services/firestoreService';
import { calculateTotalLifetimeBonuses, calculateReimbursement } from '../../services/compensationService';
import { syncLeadToHubSpot } from '../../services/hubspotService';
import { convertToCSV, downloadCSV } from '../../utils/csvHelper';
import { importOfficialDispensaries } from '../../services/dataSyncService';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { useNavigate } from 'react-router-dom';

// We can reuse some components if they are exported or duplicate minimal parts
// For now, I'll inline the StatCards for simplicity in this new file or create new ones
const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-600`}>
            <Icon size={64} />
        </div>
        <div>
            <p className="text-slate-500 font-medium mb-1 text-sm">{title}</p>
            <h3 className="text-3xl font-black text-slate-900">
                {typeof value === 'number' ? `$${value.toFixed(2)}` : value}
            </h3>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Icon size={14} />
            <span>{subtext}</span>
        </div>
    </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
      ${active
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
    >
        {icon}
        {label}
    </button>
);

const HOURLY_RATE = 20;

export default function Dashboard() {
    const { impersonateBrand } = useBrandAuth();
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('payroll');
    const [processing, setProcessing] = useState(false);

    // Data
    const [shifts, setShifts] = useState([]);
    const [allShifts, setAllShifts] = useState([]);
    const [sales, setSales] = useState([]);
    const [leads, setLeads] = useState([]);
    const [financials, setFinancials] = useState({});
    const [usersMap, setUsersMap] = useState({});
    const [selectedShiftIds, setSelectedShiftIds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch All Data
                const [shiftsData, salesData, leadsData, activationsData] = await Promise.all([
                    getAllShifts(),
                    getSales(),
                    getLeads(),
                    getActivations()
                ]);

                // Pending Shifts
                const pending = shiftsData.filter(s => s.status === 'pending');
                setShifts(pending);
                setAllShifts(shiftsData);
                setSales(salesData);
                setLeads(leadsData);

                // --- Financial Calculations (Simplified for Dashboard) ---
                const totalSales = salesData.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
                const salesRevenue = totalSales * 0.05; // 5%

                // Calculate Shift Costs
                let totalShiftWages = 0;
                let totalShiftRevenue = 0; // Assuming activation revenue logic
                shiftsData.forEach(s => {
                    totalShiftWages += (parseFloat(s.hoursWorked) || 0) * HOURLY_RATE;
                    // Adding reimbursement approximation
                    totalShiftWages += calculateReimbursement(parseFloat(s.milesTraveled), parseFloat(s.tollAmount), s.hasVehicle !== false);
                    // Mock Revenue per shift for now (or use real logic if available)
                    totalShiftRevenue += 400; // Placeholder average activation fee
                });

                const commissions = totalSales * 0.02; // 2%

                setFinancials({
                    salesRevenue,
                    commissions,
                    totalShiftWages,
                    totalShiftRevenue,
                    quarterlyNet: salesRevenue - commissions, // Pure 3% margin
                    shiftNet: totalShiftRevenue - totalShiftWages // Activation net
                });

                // User Map
                const map = {};
                const userIds = new Set([...shiftsData.map(s => s.userId), ...salesData.map(s => s.userId || s.repId)]);
                for (const uid of userIds) {
                    if (uid) {
                        const profile = await getUserProfile(uid);
                        map[uid] = profile ? `${profile.firstName} ${profile.lastName}` : uid;
                    }
                }
                setUsersMap(map);

            } catch (err) {
                console.error("Admin Dashboard Data Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleMarkAsPaid = async () => {
        if (!confirm(`Mark ${selectedShiftIds.length} shifts as PAID?`)) return;
        setProcessing(true);
        try {
            await Promise.all(selectedShiftIds.map(id => updateShiftStatus(id, 'paid')));
            setShifts(prev => prev.filter(s => !selectedShiftIds.includes(s.id)));
            setSelectedShiftIds([]);
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedShiftIds.length === shifts.length) setSelectedShiftIds([]);
        else setSelectedShiftIds(shifts.map(s => s.id));
    };

    const toggleShiftSelection = (id) => {
        setSelectedShiftIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const exportPayroll = () => {
        const data = shifts.map(s => ({
            Name: usersMap[s.userId],
            Date: s.date?.toDate ? s.date.toDate().toLocaleDateString() : s.date,
            Pay: ((s.hoursWorked * HOURLY_RATE) + (parseFloat(s.tollAmount) || 0)).toFixed(2)
        }));
        downloadCSV(convertToCSV(data), 'payroll_export.csv');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader size={40} className="animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Admin Overview</h1>
                <p className="text-slate-500">Welcome to your new command center.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Gross Sales Revenue"
                    value={financials.salesRevenue}
                    subtext="5% of Total Volume"
                    icon={DollarSign}
                    color="emerald"
                />
                <StatCard
                    title="Rep Commissions"
                    value={financials.commissions}
                    subtext="Pending Payouts"
                    icon={Users}
                    color="indigo"
                />
                <StatCard
                    title="Act. Net Profit"
                    value={financials.shiftNet}
                    subtext="Shift Fees - Wages"
                    icon={Banknote}
                    color="amber"
                />
                <StatCard
                    title="Pending Shifts"
                    value={shifts.length}
                    subtext="Need Approval"
                    icon={FileText}
                    color="rose"
                />
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-1 w-fit overflow-x-auto">
                <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={<DollarSign size={18} />} label="Payroll" />
                <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={<Users size={18} />} label="Leads" />
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px] p-6">

                {/* Payroll Tab */}
                {activeTab === 'payroll' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Shift Approvals</h2>
                            <div className="flex gap-3">
                                <button onClick={exportPayroll} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                                    <Download size={16} /> Export
                                </button>
                                <button onClick={handleMarkAsPaid} disabled={selectedShiftIds.length === 0 || processing} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50">
                                    {processing ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    Approve & Pay ({selectedShiftIds.length})
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th className="py-3 px-4 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={shifts.length > 0 && selectedShiftIds.length === shifts.length} /></th>
                                        <th className="py-3 px-4">Rep</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4 text-center">Hours</th>
                                        <th className="py-3 px-4 text-center">Miles</th>
                                        <th className="py-3 px-4 text-right">Tolls</th>
                                        <th className="py-3 px-4 text-right">Pay</th>
                                        <th className="py-3 px-4 text-center">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100">
                                    {shifts.map(shift => (
                                        <tr key={shift.id} className="hover:bg-slate-50">
                                            <td className="py-3 px-4"><input type="checkbox" checked={selectedShiftIds.includes(shift.id)} onChange={() => toggleShiftSelection(shift.id)} /></td>
                                            <td className="py-3 px-4 font-medium text-slate-900">{usersMap[shift.userId] || 'Unknown'}</td>
                                            <td className="py-3 px-4 text-slate-600">{new Date(shift.date?.toDate ? shift.date.toDate() : shift.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-center">{shift.hoursWorked}</td>
                                            <td className="py-3 px-4 text-center">{shift.milesTraveled}</td>
                                            <td className="py-3 px-4 text-right">${parseFloat(shift.tollAmount || 0).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-emerald-600">${((shift.hoursWorked * HOURLY_RATE) + parseFloat(shift.tollAmount || 0)).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-center">
                                                {shift.tollReceiptImageUrl && (
                                                    <a href={shift.tollReceiptImageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs">View</a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {shifts.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-slate-400">No pending shifts</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Leads Tab */}
                {activeTab === 'leads' && (
                    <>
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Leads</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th className="py-3 px-4">Dispensary</th>
                                        <th className="py-3 px-4">Contact</th>
                                        <th className="py-3 px-4">License</th>
                                        <th className="py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100">
                                    {leads.map(lead => (
                                        <tr key={lead.id} className="hover:bg-slate-50">
                                            <td className="py-3 px-4 font-medium text-slate-900">{lead.dispensaryName}</td>
                                            <td className="py-3 px-4 text-slate-600">{lead.contactPerson || '-'}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-slate-500">{lead.licenseNumber}</td>
                                            <td className="py-3 px-4">
                                                {lead.syncedToHubspot ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Synced</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
