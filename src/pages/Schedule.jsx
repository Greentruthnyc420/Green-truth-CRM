import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, ADMIN_EMAILS, SOCIAL_MANAGER_EMAILS, isSocialManager, hasCalendarAccess } from '../contexts/AuthContext';
import { getActivations, getAllBrandProfiles, updateActivation, getLeads, findDuplicateActivations, cleanupDuplicateActivations, getAllUsers } from '../services/firestoreService';
import CalendarView from '../components/CalendarView';
import { Calendar as CalendarIcon, MapPin, Clock, User, Tag, X, Plus, Trash2, AlertTriangle, Loader2, Download, Filter, Instagram, Phone, BarChart3, Map, Users, ChevronDown } from 'lucide-react';
import ActivationFormModal from '../components/ActivationFormModal';
import { useNotification } from '../contexts/NotificationContext';

const Schedule = () => {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterRep, setFilterRep] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState('all');
    const [brands, setBrands] = useState([]);
    const [reps, setReps] = useState([]);
    const [repProfiles, setRepProfiles] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [duplicateInfo, setDuplicateInfo] = useState(null);
    const [cleaningUp, setCleaningUp] = useState(false);
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'map'

    const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
    const isSocialMgr = currentUser?.email && isSocialManager(currentUser.email);
    const canViewAll = isAdmin || isSocialMgr;
    const canEdit = isAdmin; // Social managers are read-only

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [activationsData, brandsData, leadsData, usersData] = await Promise.all([
                getActivations(),
                getAllBrandProfiles(),
                getLeads(),
                canViewAll ? getAllUsers() : Promise.resolve([])
            ]);

            setBrands(brandsData);

            // Build rep profiles map for Instagram/phone lookup
            const repProfilesMap = {};
            const repList = [];
            usersData.forEach(u => {
                if (u.role === 'rep' || u.role === 'ambassador') {
                    repProfilesMap[u.id] = {
                        name: u.name || u.email?.split('@')[0],
                        instagramHandle: u.instagramHandle,
                        phone: u.phone,
                        email: u.email
                    };
                    repList.push({ id: u.id, name: u.name || u.email?.split('@')[0] });
                }
            });
            setRepProfiles(repProfilesMap);
            setReps(repList);

            const dispensaryMap = Object.fromEntries(leadsData.map(l => [l.id, l.dispensaryName || l.companyName]));
            const brandMap = Object.fromEntries(brandsData.map(b => [b.brandId || b.id, b.brandName || b.name]));

            // Filter activations based on access level
            let filteredActivations = activationsData;
            if (!canViewAll) {
                // Reps only see their own activations
                filteredActivations = activationsData.filter(a => a.repId === currentUser.uid);
            }

            // Transform for Calendar
            const calendarEvents = filteredActivations.map(a => {
                try {
                    const dateStr = a.date || (a.datePreferences?.[0]) || new Date().toISOString().split('T')[0];
                    const start = new Date(`${dateStr}T${a.startTime || '12:00'}:00`);
                    const end = new Date(`${dateStr}T${a.endTime || '16:00'}:00`);

                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        console.warn(`Invalid date/time for activation ${a.id}:`, a.date, a.startTime);
                        return null;
                    }

                    const brandName = brandMap[a.brandId] || 'Unknown Brand';
                    const storeName = dispensaryMap[a.dispensaryId] || 'Unknown Store';
                    const repProfile = repProfilesMap[a.repId] || {};

                    return {
                        id: a.id,
                        title: `${a.status === 'Requested' ? '❓' : ''} ${brandName} @ ${storeName}`,
                        start,
                        end,
                        resource: {
                            ...a,
                            status: a.status || 'Scheduled',
                            brandName,
                            storeName,
                            repName: a.repName || repProfile.name || 'Unassigned',
                            repInstagram: repProfile.instagramHandle,
                            repPhone: repProfile.phone,
                            repEmail: repProfile.email
                        },
                        style: a.status === 'Requested' ? { backgroundColor: '#fef3c7', borderColor: '#d97706', color: '#92400e' } : {}
                    };
                } catch (e) {
                    console.error("Error parsing activation date:", e);
                    return null;
                }
            }).filter(Boolean);

            setEvents(calendarEvents);

        } catch (error) {
            console.error("Failed to load schedule", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDate = async (activationId, confirmedDate) => {
        if (!confirm(`Confirm activation for ${confirmedDate}?`)) return;

        try {
            await updateActivation(activationId, {
                dateOfActivation: confirmedDate,
                status: 'Scheduled'
            });
            showNotification("Activation confirmed!", 'success');
            setSelectedEvent(null);
            loadData();
        } catch (error) {
            console.error("Failed to confirm activation:", error);
            showNotification("Error confirming activation", 'error');
        }
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    const handleScanDuplicates = async () => {
        setCleaningUp(true);
        try {
            const result = await findDuplicateActivations();
            setDuplicateInfo(result);
            if (result.totalDuplicates === 0) {
                showNotification('No duplicate activations found', 'success');
            }
        } catch (error) {
            console.error('Error scanning duplicates:', error);
            showNotification('Failed to scan for duplicates', 'error');
        } finally {
            setCleaningUp(false);
        }
    };

    const handleCleanupDuplicates = async () => {
        if (!duplicateInfo?.totalDuplicates) return;

        if (!window.confirm(`This will delete ${duplicateInfo.totalDuplicates} duplicate activations. This cannot be undone. Continue?`)) {
            return;
        }

        setCleaningUp(true);
        try {
            const result = await cleanupDuplicateActivations();
            showNotification(result.message, result.success ? 'success' : 'error');
            setDuplicateInfo(null);
            loadData();
        } catch (error) {
            console.error('Error cleaning up duplicates:', error);
            showNotification('Failed to clean up duplicates', 'error');
        } finally {
            setCleaningUp(false);
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        const csvRows = [
            ['Date', 'Brand', 'Store', 'Rep', 'Instagram', 'Phone', 'Start Time', 'End Time', 'Status']
        ];

        filteredEvents.forEach(e => {
            const r = e.resource;
            csvRows.push([
                e.start.toLocaleDateString(),
                r.brandName || '',
                r.storeName || '',
                r.repName || '',
                r.repInstagram ? `@${r.repInstagram}` : '',
                r.repPhone || '',
                r.startTime || '',
                r.endTime || '',
                r.status || ''
            ]);
        });

        const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activations_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Schedule exported to CSV', 'success');
    };

    // Apply filters
    const filteredEvents = useMemo(() => {
        let result = events;

        // Brand filter
        if (filterBrand !== 'all') {
            result = result.filter(e => e.resource.brandId === filterBrand);
        }

        // Rep filter
        if (filterRep !== 'all') {
            result = result.filter(e => e.resource.repId === filterRep);
        }

        // Date range filter
        if (filterDateRange !== 'all') {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);

            const next7Days = new Date(now);
            next7Days.setDate(now.getDate() + 7);

            switch (filterDateRange) {
                case 'thisWeek':
                    result = result.filter(e => e.start >= startOfWeek && e.start < endOfWeek);
                    break;
                case 'thisMonth':
                    result = result.filter(e => e.start >= startOfMonth && e.start <= endOfMonth);
                    break;
                case 'next7Days':
                    result = result.filter(e => e.start >= now && e.start <= next7Days);
                    break;
            }
        }

        return result;
    }, [events, filterBrand, filterRep, filterDateRange]);

    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const thisWeekEvents = events.filter(e => e.start >= startOfWeek && e.start < endOfWeek);
        const uniqueReps = new Set(events.map(e => e.resource.repId).filter(Boolean));
        const uniqueBrands = new Set(events.map(e => e.resource.brandId).filter(Boolean));

        return {
            thisWeek: thisWeekEvents.length,
            total: events.length,
            activeReps: uniqueReps.size,
            activeBrands: uniqueBrands.size
        };
    }, [events]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <CalendarIcon className="text-brand-600" />
                        {isSocialMgr ? 'Activation Calendar' : (canViewAll ? 'Master Schedule' : 'My Schedule')}
                    </h1>
                    <p className="text-slate-500">
                        {isSocialMgr
                            ? 'View activations and rep contact info for flyers & social media.'
                            : (canViewAll
                                ? 'View and manage all brand activations across the territory.'
                                : 'View your upcoming store visits and brand activations.')}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {!isSocialMgr && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            Schedule Activation
                        </button>
                    )}

                    {canViewAll && (
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards (Admins/Social Managers) */}
            {canViewAll && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<CalendarIcon size={20} />} label="This Week" value={stats.thisWeek} color="bg-blue-500" />
                    <StatCard icon={<BarChart3 size={20} />} label="Total Scheduled" value={stats.total} color="bg-emerald-500" />
                    <StatCard icon={<Users size={20} />} label="Active Reps" value={stats.activeReps} color="bg-purple-500" />
                    <StatCard icon={<Tag size={20} />} label="Brands" value={stats.activeBrands} color="bg-orange-500" />
                </div>
            )}

            {/* Filters */}
            {canViewAll && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <Filter size={18} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-600">Filters:</span>

                    <select
                        value={filterDateRange}
                        onChange={(e) => setFilterDateRange(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                        <option value="all">All Dates</option>
                        <option value="next7Days">Next 7 Days</option>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                    </select>

                    <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                        <option value="all">All Brands</option>
                        {brands.map(b => (
                            <option key={b.id} value={b.id}>{b.name || b.id}</option>
                        ))}
                    </select>

                    <select
                        value={filterRep}
                        onChange={(e) => setFilterRep(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                        <option value="all">All Reps</option>
                        {reps.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>

                    {(filterBrand !== 'all' || filterRep !== 'all' || filterDateRange !== 'all') && (
                        <button
                            onClick={() => { setFilterBrand('all'); setFilterRep('all'); setFilterDateRange('all'); }}
                            className="text-sm text-brand-600 hover:underline"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* Admin Tools */}
            {canEdit && (
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleScanDuplicates}
                        disabled={cleaningUp}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 font-medium rounded-lg hover:bg-amber-100 transition-colors"
                    >
                        {cleaningUp ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                        {cleaningUp ? 'Scanning...' : 'Scan Duplicates'}
                    </button>
                </div>
            )}

            {/* Duplicate Warning Banner */}
            {duplicateInfo && duplicateInfo.totalDuplicates > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <AlertTriangle size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-800">
                                Found {duplicateInfo.totalDuplicates} duplicate activations
                            </p>
                            <p className="text-sm text-amber-600">
                                {duplicateInfo.duplicateGroups} groups with multiple entries for the same brand/store/date
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDuplicateInfo(null)}
                            className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg transition-colors"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={handleCleanupDuplicates}
                            disabled={cleaningUp}
                            className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                        >
                            {cleaningUp ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            {cleaningUp ? 'Cleaning...' : 'Clean Up Duplicates'}
                        </button>
                    </div>
                </div>
            )}

            {/* Calendar */}
            {loading ? (
                <div className="h-96 flex items-center justify-center bg-white rounded-xl border border-slate-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <CalendarView
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    height="75vh"
                />
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="bg-brand-50 p-6 border-b border-brand-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Activation Details</h3>
                                <p className="text-brand-700 text-sm font-medium mt-1 uppercase tracking-wide">
                                    {selectedEvent.resource.status}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Status Banner */}
                            {(selectedEvent.resource.status === 'Requested' || selectedEvent.resource.status === 'Pending') && canEdit && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                                            <CalendarIcon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-amber-900">Activation Requested</h4>
                                            <p className="text-sm text-amber-700 mt-1">
                                                Requested by: <span className="font-semibold">{selectedEvent.resource.requestedBy || 'Dispensary/Brand'}</span>
                                            </p>

                                            {selectedEvent.resource.datePreferences && selectedEvent.resource.datePreferences.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-bold text-amber-800 uppercase mb-2">Preferred Dates:</p>
                                                    <div className="space-y-2">
                                                        {selectedEvent.resource.datePreferences.map((date, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-amber-100">
                                                                <span className="text-sm font-medium text-slate-700">
                                                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleConfirmDate(selectedEvent.id, date)}
                                                                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded transition-colors"
                                                                >
                                                                    Confirm This Date
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Brand</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <Tag size={16} className="text-brand-500" />
                                        {selectedEvent.resource.brandName}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Representative</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <User size={16} className="text-brand-500" />
                                        {selectedEvent.resource.repName || 'Unassigned'}
                                    </div>
                                </div>
                            </div>

                            {/* Rep Contact Info (for Social Managers/Admins) */}
                            {canViewAll && (selectedEvent.resource.repInstagram || selectedEvent.resource.repPhone) && (
                                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Rep Contact Info</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {selectedEvent.resource.repInstagram && (
                                            <a
                                                href={`https://instagram.com/${selectedEvent.resource.repInstagram}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-pink-200 hover:border-pink-400 transition-colors"
                                            >
                                                <Instagram size={18} className="text-pink-600" />
                                                <span className="font-medium text-slate-700">@{selectedEvent.resource.repInstagram}</span>
                                            </a>
                                        )}
                                        {selectedEvent.resource.repPhone && (
                                            <a
                                                href={`tel:${selectedEvent.resource.repPhone}`}
                                                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors"
                                            >
                                                <Phone size={18} className="text-purple-600" />
                                                <span className="font-medium text-slate-700">{selectedEvent.resource.repPhone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                                <div className="flex items-center gap-2 text-slate-800 font-medium">
                                    <MapPin size={16} className="text-brand-500" />
                                    {selectedEvent.resource.storeName}
                                </div>
                                {selectedEvent.resource.address && (
                                    <p className="text-sm text-slate-500 pl-6">{selectedEvent.resource.address}</p>
                                )}
                            </div>

                            {selectedEvent.resource.status !== 'Requested' && (
                                <div className="space-y-1 pt-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Time</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <Clock size={16} className="text-brand-500" />
                                        {formatTime(selectedEvent.resource.startTime)} - {formatTime(selectedEvent.resource.endTime)}
                                    </div>
                                    <p className="text-sm text-slate-500 pl-6">
                                        {selectedEvent.start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            )}

                            {selectedEvent.resource.notes && (
                                <div className="bg-slate-50 p-4 rounded-lg mt-4 text-sm text-slate-600 italic">
                                    "{selectedEvent.resource.notes}"
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between">
                            {canEdit && (
                                <button
                                    onClick={async () => {
                                        const activationId = selectedEvent?.id || selectedEvent?.resource?.id;
                                        if (!activationId) {
                                            showNotification('Error: Could not find activation ID', 'error');
                                            console.error('Delete failed: No activation ID found', { selectedEvent });
                                            return;
                                        }

                                        if (!window.confirm("Are you sure you want to delete this activation? This cannot be undone.")) {
                                            return;
                                        }

                                        try {
                                            const { deleteActivation } = await import('../services/firestoreService');
                                            await deleteActivation(activationId);
                                            showNotification('Activation deleted successfully', 'success');
                                            setSelectedEvent(null);
                                            loadData();
                                        } catch (error) {
                                            console.error('Delete failed:', error);
                                            showNotification(`Delete failed: ${error.message}`, 'error');
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors ml-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Activation Modal */}
            <ActivationFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
    <div className="themed-card rounded-xl p-4 flex items-center gap-4">
        <div className={`p-3 rounded-lg text-white ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
        </div>
    </div>
);

// Helper for 24h to 12h time
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes?.padStart(2, '0') || '00'} ${ampm}`;
};

export default Schedule;
