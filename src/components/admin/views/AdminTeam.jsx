import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    getAllUsers, getAllActivations, getSales, getUserActivations, markWagesPaidWithHistory,
    getRepPaymentHistory, blockUser, unblockUser, reassignUserLeads, getLeadCountForUser,
    getLeads, upgradeTrialUser,
    // Role management functions
    addUserRole, updateUserRole, removeUserRole, getUserRoles, updateUserProfile, fireUserWithTransfer,
    // Brand management functions
    getAdminBrands, saveAdminBrand, deleteAdminBrand
} from '../../../services/firestoreService';
import {
    Users, Trophy, TrendingUp, Clock, Award, CheckCircle, AlertTriangle, PowerOff,
    Briefcase, Store, DollarSign, Wallet, Loader2, Ban, RefreshCw, UserX, UserCheck,
    Mail, Sparkles, Plus, Shield, ShieldCheck, Crown, Instagram, UserPlus, Trash2,
    ToggleLeft, ToggleRight, ChevronRight, X, Key, Copy, Upload, Image, Phone, Edit2,
    FileText, Building2
} from 'lucide-react';
import { db, storage } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getCurrentPayPeriod, calculateHourlyRate, calculateReimbursement } from '../../../services/compensationService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth, SUPER_ADMIN_EMAILS } from '../../../contexts/AuthContext';
import { AVAILABLE_BRANDS } from '../../../contexts/BrandAuthContext';

export default function AdminTeam() {
    const { currentUser, isSuperAdminUser } = useAuth();
    const { showNotification } = useNotification();
    const [cannabisConsultants, setCannabisConsultants] = useState([]);
    const [brandPartners, setBrandPartners] = useState([]);
    const [dispensaryPartners, setDispensaryPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingRep, setPayingRep] = useState(null); // Track which rep is being paid
    const [blockingRep, setBlockingRep] = useState(null); // Track which rep is being blocked/unblocked
    const [showReassignModal, setShowReassignModal] = useState(null); // Store rep to reassign leads from
    const [reassignTarget, setReassignTarget] = useState(''); // Store target rep ID
    const [showUpgradeModal, setShowUpgradeModal] = useState(null); // Store user to upgrade email
    const [upgradeEmail, setUpgradeEmail] = useState(''); // New email for upgrade
    const [upgradingUser, setUpgradingUser] = useState(null); // Track upgrading state
    const payPeriod = getCurrentPayPeriod();

    // ============ ROLE MANAGEMENT STATE ============
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [newRoleEmail, setNewRoleEmail] = useState('');
    const [newRoleType, setNewRoleType] = useState('rep');
    const [savingRole, setSavingRole] = useState(false);
    const [changingRole, setChangingRole] = useState(null); // Track which user's role is being changed

    // ============ BRAND MANAGEMENT STATE ============
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [showBrandDetail, setShowBrandDetail] = useState(false);
    const [brandStats, setBrandStats] = useState({});
    const [newBrand, setNewBrand] = useState({
        name: '', status: 'active', commissionRate: 5,
        contractStart: new Date().toISOString().split('T')[0],
        contacts: [], loginEmail: '', tempPassword: '', logo: ''
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Trial email pattern: [name].thegreentruthnyc@gmail.com
    const TRIAL_EMAIL_PATTERN = /^[a-zA-Z0-9]+\.thegreentruthnyc@gmail\.com$/i;
    const isTrialEmail = (email) => email && TRIAL_EMAIL_PATTERN.test(email);

    useEffect(() => {
        async function loadTeamData() {
            setLoading(true);
            try {
                // Fetch all data for computation
                const [users, shifts, sales, integrationsSnapshot] = await Promise.all([
                    getAllUsers(),
                    getAllActivations(),
                    getSales(),
                    getDocs(collection(db, 'brand_integrations'))
                ]);

                const integrationsData = {};
                integrationsSnapshot.forEach(doc => {
                    integrationsData[doc.id] = doc.data();
                });

                // FALLBACK: If users table is empty, extract team members from activations/sales
                let effectiveUsers = users;
                if (!users || users.length === 0) {
                    console.log('Users table empty - extracting team from activations/sales data');
                    const extractedUsers = new Map();

                    // Extract from activations (reps who have done shifts)
                    shifts.forEach(shift => {
                        const repId = shift.repId || shift.userId || shift.rep_id;
                        const repName = shift.repName || shift.rep_name || 'Unknown Rep';
                        if (repId && !extractedUsers.has(repId)) {
                            extractedUsers.set(repId, {
                                id: repId,
                                email: repId.includes('@') ? repId : `${repId}@greentruth.local`,
                                name: repName,
                                role: 'rep',
                                profileInfo: { firstName: repName.split(' ')[0], lastName: repName.split(' ').slice(1).join(' ') }
                            });
                        }
                    });

                    // Extract from sales (reps who have logged sales)
                    sales.forEach(sale => {
                        const repId = sale.userId || sale.repId || sale.rep_id;
                        if (repId && !extractedUsers.has(repId)) {
                            extractedUsers.set(repId, {
                                id: repId,
                                email: repId.includes('@') ? repId : `${repId}@greentruth.local`,
                                name: sale.repName || 'Sales Rep',
                                role: 'rep',
                                profileInfo: { firstName: 'Sales', lastName: 'Rep' }
                            });
                        }
                    });

                    // Add demo admin user (Omar)
                    extractedUsers.set('admin-dev', {
                        id: 'admin-dev',
                        email: 'omar@thegreentruthnyc.com',
                        name: 'Omar Elsayed',
                        role: 'admin', // Admin won't show in rep section but good to have
                        profileInfo: { firstName: 'Omar', lastName: 'Elsayed' }
                    });

                    effectiveUsers = Array.from(extractedUsers.values());
                    console.log('Extracted', effectiveUsers.length, 'users from activity data');
                }

                // --- 3-Way Split Logic ---
                // 1. Cannabis Consultants: Include all rep-type roles
                const CONSULTANT_ROLES = ['rep', 'admin', 'super_admin', 'cannabis_consultant_social', 'cannabis_consultant'];
                console.log('[AdminTeam] effectiveUsers before filter:', effectiveUsers.length, effectiveUsers.map(u => ({ id: u.id, name: u.name, role: u.role })));
                const consultants = effectiveUsers.filter(u => CONSULTANT_ROLES.includes(u.role));
                console.log('[AdminTeam] Filtered consultants:', consultants.length);

                // 2. Brand Partners: Fetch from admin_brands table in Supabase
                let brands = await getAdminBrands();
                if (!brands || brands.length === 0) {
                    // Use AVAILABLE_BRANDS as fallback
                    console.log('[AdminTeam] No brands in database, using AVAILABLE_BRANDS fallback');
                    brands = Object.entries(AVAILABLE_BRANDS).map(([id, brand]) => ({
                        id,
                        name: brand.brandName,
                        status: 'active',
                        commissionRate: 5,
                        logo: brand.logo,
                        isProcessor: brand.isProcessor || false
                    }));
                }

                // 3. Dispensary Partners: Fetch from leads table where status is 'active'
                // These are dispensaries that are actively doing business with us
                const allLeads = await getLeads();
                const dispensaries = allLeads.filter(l => l.leadStatus === 'active');


                // Calculate stats for consultants ONLY
                const consultantStats = consultants.map(user => {
                    const userShifts = shifts.filter(s => (s.userId === user.id) || (s.repId === user.id) || (s.rep_id === user.id));
                    const userSales = sales.filter(s => (s.userId === user.id) || (s.repId === user.id));

                    const totalHours = userShifts.reduce((sum, s) => sum + (parseFloat(s.hoursWorked) || parseFloat(s.total_hours) || 0), 0);
                    const totalSalesAmount = userSales.reduce((sum, s) => sum + (parseFloat(s.amount) || parseFloat(s.totalAmount) || 0), 0);
                    const totalCommission = userSales.reduce((sum, s) => sum + (parseFloat(s.commissionEarned) || ((parseFloat(s.amount) || 0) * 0.02)), 0);
                    const integration = integrationsData[user.id];

                    // Calculate pending wages from activations/shifts
                    // Pending = status is NOT 'rep_paid'
                    const pendingActivations = userShifts.filter(s => s.status !== 'rep_paid');
                    const hourlyRate = calculateHourlyRate(0); // Use base rate for now, could fetch actual count later

                    let pendingWages = 0;
                    pendingActivations.forEach(a => {
                        const hours = parseFloat(a.hoursWorked) || 0;
                        pendingWages += hours * hourlyRate;
                        pendingWages += calculateReimbursement(
                            parseFloat(a.milesTraveled),
                            parseFloat(a.tollAmount),
                            a.hasVehicle
                        );
                    });

                    return {
                        ...user,
                        totalHours,
                        totalSalesAmount,
                        totalCommission,
                        saleCount: userSales.length,
                        shiftCount: userShifts.length,
                        pendingWages,
                        pendingActivations: pendingActivations.map(a => ({ id: a.id })),
                        isBlocked: user.isBlocked || false,
                        integration: {
                            connected: !!integration?.mondayApiToken,
                            lastSyncTimestamp: integration?.lastSync?.timestamp?.toDate(),
                            hasErrors: integration?.lastSync ? !integration.lastSync.success : false,
                        }
                    };
                });

                const sortedConsultants = consultantStats.sort((a, b) => b.totalSalesAmount - a.totalSalesAmount);

                setCannabisConsultants(sortedConsultants);
                setBrandPartners(brands);
                setDispensaryPartners(dispensaries);

                // Calculate brand stats
                const stats = {};
                brands.forEach(brand => {
                    const brandActivations = shifts.filter(a => {
                        const activationBrandId = (a.brandId || a.brand_id || '').toLowerCase();
                        const activationBrandName = (a.brandName || a.brand_name || a.brand || '').toLowerCase();
                        const thisBrandId = brand.id.toLowerCase();
                        const thisBrandName = brand.name.toLowerCase().replace(/[^a-z]/g, '');
                        return activationBrandId === thisBrandId || activationBrandName.includes(thisBrandName);
                    });
                    const brandSales = sales.filter(s => {
                        const saleBrandId = (s.brandId || s.brand_id || '').toLowerCase();
                        const saleBrandName = (s.brandName || s.brand_name || '').toLowerCase();
                        const thisBrandId = brand.id.toLowerCase();
                        const thisBrandName = brand.name.toLowerCase().replace(/[^a-z]/g, '');
                        return saleBrandId === thisBrandId || saleBrandName.includes(thisBrandName);
                    });
                    const activationRevenue = brandActivations.reduce((acc, a) => acc + (parseFloat(a.activationFee) || 0), 0);
                    const salesRevenue = brandSales.reduce((acc, s) => acc + ((parseFloat(s.totalAmount) || 0) * 0.05), 0);
                    stats[brand.id] = { activations: brandActivations.length, activationRevenue, salesRevenue, totalRevenue: activationRevenue + salesRevenue };
                });
                setBrandStats(stats);

            } catch (error) {
                console.error("Failed to load team data", error);
            } finally {
                setLoading(false);
            }
        }
        loadTeamData();
    }, []);

    // ============ ROLE MANAGEMENT HELPERS ============
    const formatRoleName = (role) => {
        const names = {
            super_admin: 'Super Admin', admin: 'Admin', social_manager: 'Social Manager',
            cannabis_consultant_social: 'Consultant (Social)', cannabis_consultant: 'Cannabis Consultant',
            rep: 'Cannabis Consultant', driver: 'Driver', user: 'User'
        };
        return names[role] || role;
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'super_admin': return <Crown size={14} className="text-amber-500" />;
            case 'admin': return <ShieldCheck size={14} className="text-indigo-500" />;
            case 'social_manager': return <Instagram size={14} className="text-pink-500" />;
            case 'cannabis_consultant_social': return <Instagram size={14} className="text-emerald-500" />;
            case 'rep': case 'cannabis_consultant': return <UserPlus size={14} className="text-emerald-500" />;
            case 'driver': return <UserPlus size={14} className="text-blue-500" />;
            default: return <Shield size={14} className="text-slate-400" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'super_admin': return 'bg-amber-100 text-amber-800';
            case 'admin': return 'bg-indigo-100 text-indigo-800';
            case 'social_manager': return 'bg-pink-100 text-pink-800';
            case 'cannabis_consultant_social': case 'cannabis_consultant': case 'rep': return 'bg-emerald-100 text-emerald-800';
            case 'driver': return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRoleEmail.trim() || !newRoleEmail.includes('@')) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        setSavingRole(true);
        try {
            const success = await addUserRole(newRoleEmail.trim(), newRoleType, currentUser.email);
            if (success) {
                showNotification(`Added ${newRoleEmail} as ${formatRoleName(newRoleType)}`, 'success');
                setNewRoleEmail('');
                setShowAddRoleModal(false);
                // Refresh team data
                window.location.reload();
            } else {
                showNotification('Failed to add role', 'error');
            }
        } catch (error) {
            showNotification('Error adding role: ' + error.message, 'error');
        } finally {
            setSavingRole(false);
        }
    };

    const handleChangeRole = async (member, newRole) => {
        if (SUPER_ADMIN_EMAILS.includes(member.email?.toLowerCase())) {
            showNotification('Cannot change super admin role', 'error');
            return;
        }
        setChangingRole(member.id);
        try {
            const adminRoles = ['super_admin', 'admin', 'social_manager'];
            if (adminRoles.includes(newRole)) {
                await addUserRole(member.email, newRole, currentUser.email);
            } else {
                await removeUserRole(member.email);
            }
            if (member.id) {
                await updateUserProfile(member.id, { role: newRole });
            }
            showNotification(`Role updated to ${formatRoleName(newRole)}`, 'success');
            setCannabisConsultants(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
        } catch (error) {
            showNotification('Error updating role: ' + error.message, 'error');
        } finally {
            setChangingRole(null);
        }
    };

    const handleFireUser = async (member) => {
        if (SUPER_ADMIN_EMAILS.includes(member.email?.toLowerCase())) {
            showNotification('Cannot fire the super admin', 'error');
            return;
        }
        const confirmMsg = `⚠️ FIRE ${member.email}?\n\nThis will transfer their leads/activations to you and delete their account.\n\nThis action cannot be undone.`;
        if (!window.confirm(confirmMsg)) return;
        const confirmText = prompt('To confirm, type: FIRE');
        if (confirmText?.toUpperCase() !== 'FIRE') {
            showNotification('Deletion cancelled', 'info');
            return;
        }
        try {
            const result = await fireUserWithTransfer(member.id, currentUser.uid, currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin');
            showNotification(`${member.email} has been fired. ${result.stats.leads} leads transferred.`, 'success');
            setCannabisConsultants(prev => prev.filter(m => m.id !== member.id));
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    };

    // ============ BRAND MANAGEMENT HELPERS ============
    const generateTempPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
        return password;
    };

    const handleAddBrand = async () => {
        if (!newBrand.name.trim()) {
            showNotification('Brand name is required', 'error');
            return;
        }
        const brand = {
            ...newBrand,
            id: newBrand.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            contacts: newBrand.loginEmail ? [{ name: 'Primary Contact', email: newBrand.loginEmail, phone: '', role: 'Primary' }] : [],
            tempPassword: newBrand.tempPassword || generateTempPassword(),
            inviteSent: false
        };
        try {
            await saveAdminBrand(brand);
            setBrandPartners(prev => [...prev, brand]);
            setShowAddBrandModal(false);
            setNewBrand({ name: '', status: 'active', commissionRate: 5, contractStart: new Date().toISOString().split('T')[0], contacts: [], loginEmail: '', tempPassword: '', logo: '' });
            showNotification('Brand added successfully', 'success');
        } catch (error) {
            showNotification('Error adding brand: ' + error.message, 'error');
        }
    };

    const handleLogoUpload = async (file, brandId = null) => {
        if (!file) return null;
        setUploading(true);
        try {
            const fileName = `brand-logos/${brandId || 'new'}-${Date.now()}-${file.name}`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            showNotification('Logo uploaded successfully', 'success');
            return url;
        } catch (error) {
            showNotification('Failed to upload logo', 'error');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSendInvite = async (brand) => {
        const credentials = `Brand Portal Login\n\nURL: ${window.location.origin}/brand/login\nEmail: ${brand.loginEmail}\nTemporary Password: ${brand.tempPassword}\n\nPlease change your password after first login.`;
        try {
            await navigator.clipboard.writeText(credentials);
            const updated = brandPartners.map(b => b.id === brand.id ? { ...b, inviteSent: true } : b);
            setBrandPartners(updated);
            if (selectedBrand?.id === brand.id) setSelectedBrand({ ...selectedBrand, inviteSent: true });
            showNotification('Credentials copied to clipboard!', 'success');
        } catch (err) {
            showNotification('Failed to copy credentials', 'error');
        }
    };

    const handleToggleBrandStatus = (brandId) => {
        const updated = brandPartners.map(b => b.id === brandId ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b);
        setBrandPartners(updated);
        if (selectedBrand?.id === brandId) setSelectedBrand({ ...selectedBrand, status: selectedBrand.status === 'active' ? 'inactive' : 'active' });
    };

    const handleRemoveBrand = async (brandId) => {
        if (!window.confirm('Are you sure you want to remove this brand partnership?')) return;
        try {
            await deleteAdminBrand(brandId);
            setBrandPartners(prev => prev.filter(b => b.id !== brandId));
            setSelectedBrand(null);
            setShowBrandDetail(false);
            showNotification('Brand removed', 'success');
        } catch (error) {
            showNotification('Error removing brand', 'error');
        }
    };

    const topPerformer = cannabisConsultants[0];

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Users className="text-brand-600" />
                    Team & Partners
                </h1>
                <p style={{ color: 'var(--text-tertiary)' }}>Manage ambassadors, brand partners, and dispensary clients.</p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <>
                    {/* --- SECTION 1: SALES AMBASSADORS --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <TrendingUp className="text-teal-500" />
                            Cannabis Consultants
                        </h2>

                        {topPerformer && topPerformer.totalSalesAmount > 0 && (
                            <div className="bg-gradient-to-r from-brand-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                        <Trophy size={40} className="text-yellow-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-brand-100 font-bold uppercase tracking-wider text-xs mb-1">Top Performer</h3>
                                        <p className="text-3xl font-bold">{topPerformer.profileInfo?.firstName || topPerformer.name || topPerformer.email}</p>
                                        <p className="text-brand-100 mt-1 flex items-center gap-2">
                                            <Award size={16} />
                                            ${topPerformer.totalSalesAmount.toLocaleString()} Total Sales
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            </div>
                        )}

                        <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Team Roster</h3>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{cannabisConsultants.length} Active</span>
                                </div>
                                {isSuperAdminUser && isSuperAdminUser() && (
                                    <button
                                        onClick={() => setShowAddRoleModal(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        <UserPlus size={14} />
                                        Add Team Member
                                    </button>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Consultant</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Role</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Sales</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Hours</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Pending Wages</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cannabisConsultants.map((member, idx) => (
                                            <tr key={member.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isTrialEmail(member.email) ? 'bg-amber-100 text-amber-600' : ''}`} style={!isTrialEmail(member.email) ? { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : {}}>
                                                            {isTrialEmail(member.email) ? <Sparkles size={14} /> : (member.email?.[0] || 'U').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                                {/* Priority: profileInfo > name (if not a UID/Code) > email username */}
                                                                {(() => {
                                                                    const hasProfileName = member.profileInfo?.firstName;
                                                                    if (hasProfileName) {
                                                                        return `${member.profileInfo.firstName} ${member.profileInfo.lastName || ''}`.trim();
                                                                    }

                                                                    // Check if name is valid (not an ID, not null)
                                                                    // Filter out: UIDs (20+ alphanumeric), and UUIDs
                                                                    const nameIsCode = !member.name ||
                                                                        /^[a-zA-Z0-9]{20,}$/.test(member.name) ||
                                                                        /^[0-9a-f-]{30,}$/i.test(member.name) ||
                                                                        member.name === member.id;

                                                                    if (member.name && !nameIsCode) {
                                                                        return member.name;
                                                                    }

                                                                    // Fallback to formatted email
                                                                    if (member.email) {
                                                                        return member.email.split('@')[0]
                                                                            .replace(/[._]/g, ' ')
                                                                            .split(' ')
                                                                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                                                            .join(' ');
                                                                    }

                                                                    return 'Unknown User';
                                                                })()}
                                                                {isTrialEmail(member.email) && (
                                                                    <span className="text-[9px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Trial</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{member.email || 'No Email'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* ROLE COLUMN */}
                                                <td className="py-4 px-6">
                                                    {isSuperAdminUser && isSuperAdminUser() && !SUPER_ADMIN_EMAILS.includes(member.email?.toLowerCase()) ? (
                                                        <select
                                                            value={member.role || 'rep'}
                                                            onChange={(e) => handleChangeRole(member, e.target.value)}
                                                            disabled={changingRole === member.id}
                                                            className={`px-2 py-1 text-xs rounded-lg border font-medium ${getRoleColor(member.role)} border-current focus:ring-1 focus:ring-indigo-500 outline-none bg-transparent cursor-pointer disabled:opacity-50`}
                                                        >
                                                            <option value="admin">Admin</option>
                                                            <option value="social_manager">Social Manager</option>
                                                            <option value="rep">Cannabis Consultant</option>
                                                            <option value="driver">Driver</option>
                                                            <option value="user">User</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                                                            {getRoleIcon(member.role)}
                                                            {formatRoleName(member.role)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {member.integration.connected ? (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle size={16} className="text-emerald-500" />
                                                            <span className="text-xs font-bold text-emerald-600">Active</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-300">
                                                            <PowerOff size={16} />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    ${member.totalSalesAmount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-right" style={{ color: 'var(--text-secondary)' }}>
                                                    {member.totalHours.toFixed(1)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={`font-bold ${member.pendingWages > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                        ${(member.pendingWages || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                                        {member.pendingWages > 0 && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (!window.confirm(`Pay ${member.profileInfo?.firstName || member.name || 'this rep'} $${member.pendingWages?.toFixed(2)} for ${member.pendingActivations?.length || 0} activations?\n\nPeriod: ${payPeriod.label}`)) return;
                                                                    setPayingRep(member.id);
                                                                    try {
                                                                        await markWagesPaidWithHistory(
                                                                            member.id,
                                                                            member.profileInfo?.firstName || member.name || 'Unknown',
                                                                            member.pendingActivations?.map(a => a.id) || [],
                                                                            member.pendingWages,
                                                                            payPeriod.label,
                                                                            currentUser?.uid
                                                                        );
                                                                        showNotification(`Paid $${member.pendingWages?.toFixed(2)} to ${member.profileInfo?.firstName || 'rep'}`, 'success');
                                                                        setCannabisConsultants(prev => prev.map(m =>
                                                                            m.id === member.id
                                                                                ? { ...m, pendingWages: 0, pendingActivations: [] }
                                                                                : m
                                                                        ));
                                                                    } catch (error) {
                                                                        console.error('Payment failed:', error);
                                                                        showNotification('Payment failed: ' + error.message, 'error');
                                                                    } finally {
                                                                        setPayingRep(null);
                                                                    }
                                                                }}
                                                                disabled={payingRep === member.id}
                                                                className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50"
                                                            >
                                                                {payingRep === member.id ? <Loader2 size={12} className="animate-spin" /> : <Wallet size={12} />}
                                                                Pay
                                                            </button>
                                                        )}

                                                        {/* Block/Unblock Button */}
                                                        <button
                                                            onClick={async () => {
                                                                const action = member.isBlocked ? 'unblock' : 'block';
                                                                if (!window.confirm(`Are you sure you want to ${action} ${member.profileInfo?.firstName || member.name || 'this user'}?${!member.isBlocked ? '\n\nThis will prevent them from logging in.' : ''}`)) return;
                                                                setBlockingRep(member.id);
                                                                try {
                                                                    const success = member.isBlocked
                                                                        ? await unblockUser(member.id)
                                                                        : await blockUser(member.id);
                                                                    if (success) {
                                                                        showNotification(`${member.profileInfo?.firstName || 'User'} has been ${action}ed`, 'success');
                                                                        setCannabisConsultants(prev => prev.map(m =>
                                                                            m.id === member.id
                                                                                ? { ...m, isBlocked: !member.isBlocked }
                                                                                : m
                                                                        ));
                                                                    } else {
                                                                        showNotification(`Failed to ${action} user`, 'error');
                                                                    }
                                                                } catch (error) {
                                                                    showNotification(`Error: ${error.message}`, 'error');
                                                                } finally {
                                                                    setBlockingRep(null);
                                                                }
                                                            }}
                                                            disabled={blockingRep === member.id}
                                                            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50 ${member.isBlocked
                                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                : 'bg-red-50 text-red-500 hover:bg-red-100'
                                                                }`}
                                                            title={member.isBlocked ? 'Unblock User' : 'Block User'}
                                                        >
                                                            {blockingRep === member.id ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : member.isBlocked ? (
                                                                <UserCheck size={12} />
                                                            ) : (
                                                                <UserX size={12} />
                                                            )}
                                                        </button>

                                                        {/* Reassign Leads Button */}
                                                        <button
                                                            onClick={() => setShowReassignModal(member)}
                                                            className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1.5 rounded-lg font-bold transition-colors"
                                                            title="Reassign Leads"
                                                        >
                                                            <RefreshCw size={12} />
                                                        </button>

                                                        {/* Upgrade Email Button - Only for trial users */}
                                                        {isTrialEmail(member.email) && (
                                                            <button
                                                                onClick={() => {
                                                                    setShowUpgradeModal(member);
                                                                    // Pre-fill with suggested email based on their name
                                                                    const firstName = member.profileInfo?.firstName || member.email?.split('.')[0] || '';
                                                                    setUpgradeEmail(`${firstName.toLowerCase()}@thegreentruthnyc.com`);
                                                                }}
                                                                className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 px-2 py-1.5 rounded-lg font-bold transition-colors"
                                                                title="Upgrade to Business Email"
                                                            >
                                                                <Mail size={12} />
                                                            </button>
                                                        )}

                                                        {/* Fire User Button - Super Admin Only */}
                                                        {isSuperAdminUser && isSuperAdminUser() && !SUPER_ADMIN_EMAILS.includes(member.email?.toLowerCase()) && (
                                                            <button
                                                                onClick={() => handleFireUser(member)}
                                                                className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1.5 rounded-lg font-bold transition-colors border border-red-200"
                                                                title="Fire User (Permanent)"
                                                            >
                                                                <Trash2 size={12} />
                                                                Fire
                                                            </button>
                                                        )}

                                                        <Link to={`/admin/team/${member.id}`} className="text-xs text-brand-600 hover:text-brand-800 font-bold hover:underline">View</Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {cannabisConsultants.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No team members yet.</p>}
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 2: BRAND PARTNERS (ENHANCED) --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Briefcase className="text-indigo-500" />
                            Brand Partners
                        </h2>
                        <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Partner Brands</h3>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{brandPartners.length} Partners</span>
                                </div>
                                <button
                                    onClick={() => setShowAddBrandModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    <Plus size={14} />
                                    Add Brand
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Brand</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Activations</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Revenue</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brandPartners.map(partner => {
                                            const stats = brandStats[partner.id] || { activations: 0, totalRevenue: 0 };
                                            return (
                                                <tr key={partner.id} className="transition-colors hover:bg-slate-50" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            {partner.logo ? (
                                                                <img src={partner.logo} alt={partner.name} className="w-10 h-10 object-contain rounded-lg border border-slate-200" />
                                                            ) : (
                                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                                    {(partner.name?.[0] || 'B').toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{partner.name || 'Brand Partner'}</p>
                                                                {partner.loginEmail && (
                                                                    <p className="text-xs text-slate-400">{partner.loginEmail}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${partner.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${partner.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                            {partner.status === 'active' ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {stats.activations}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-medium text-emerald-600">
                                                        ${stats.totalRevenue?.toFixed(2) || '0.00'}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleToggleBrandStatus(partner.id)}
                                                                className={`p-1.5 rounded-lg transition-colors ${partner.status === 'active' ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                                                title={partner.status === 'active' ? 'Deactivate' : 'Activate'}
                                                            >
                                                                {partner.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                            </button>
                                                            {partner.loginEmail && (
                                                                <button
                                                                    onClick={() => handleSendInvite(partner)}
                                                                    className={`p-1.5 rounded-lg transition-colors ${partner.inviteSent ? 'text-slate-400' : 'text-purple-600 hover:bg-purple-50'}`}
                                                                    title={partner.inviteSent ? 'Invite Sent' : 'Copy & Send Invite'}
                                                                >
                                                                    <Copy size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleRemoveBrand(partner.id)}
                                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                                                title="Remove Brand"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedBrand(partner); setShowBrandDetail(true); }}
                                                                className="text-xs px-2 py-1 rounded-lg font-bold transition-colors bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                                            >
                                                                Details
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {brandPartners.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No brand partners found. Click "Add Brand" to add one.</p>}
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 3: DISPENSARY PARTNERS (NEW) --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Store className="text-purple-500" />
                            Dispensary Clients
                        </h2>
                        <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Registered Dispensaries</h3>
                                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{dispensaryPartners.length} Clients</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Dispensary</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Location</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dispensaryPartners.map(partner => (
                                            <tr key={partner.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                            {(partner.dispensaryName?.[0] || 'D').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{partner.dispensaryName || partner.name || 'Unnamed Dispensary'}</p>
                                                            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{partner.licenseNumber || 'No License'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {partner.address || 'Unknown Location'}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link to={`/admin/dispensary/${partner.id}`} className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-bold transition-colors">View Details</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {dispensaryPartners.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No dispensary clients registered yet.</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Reassign Leads Modal */}
            {showReassignModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Reassign Leads</h3>
                        <p className="text-slate-600 text-sm mb-6">
                            Transfer all leads from <span className="font-bold text-slate-800">{showReassignModal.profileInfo?.firstName || showReassignModal.name || 'this rep'}</span> to another team member.
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Target Team Member</label>
                            <select
                                value={reassignTarget}
                                onChange={(e) => setReassignTarget(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                            >
                                <option value="">Choose a team member...</option>
                                {cannabisConsultants
                                    .filter(m => m.id !== showReassignModal.id && m.role === 'rep')
                                    .map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.profileInfo?.firstName || m.name || m.email}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowReassignModal(null);
                                    setReassignTarget('');
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!reassignTarget) {
                                        showNotification('Please select a target ambassador', 'error');
                                        return;
                                    }
                                    try {
                                        const result = await reassignUserLeads(showReassignModal.id, reassignTarget);
                                        if (result.success) {
                                            showNotification(`Reassigned ${result.count} leads successfully`, 'success');
                                            setShowReassignModal(null);
                                            setReassignTarget('');
                                        } else {
                                            showNotification('Failed to reassign leads', 'error');
                                        }
                                    } catch (error) {
                                        showNotification(`Error: ${error.message}`, 'error');
                                    }
                                }}
                                disabled={!reassignTarget}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Reassign Leads
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade Email Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-amber-100 p-2 rounded-full">
                                <Sparkles size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Upgrade Trial User</h3>
                                <p className="text-slate-500 text-sm">Convert to permanent business email</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Current Email</p>
                            <p className="text-slate-700 font-medium">{showUpgradeModal.email}</p>
                            <p className="text-slate-600 text-sm mt-2">
                                <span className="font-bold">{showUpgradeModal.profileInfo?.firstName || 'User'}</span> has been using a trial account.
                                Upgrade to an official @thegreentruthnyc.com email.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">New Business Email</label>
                            <input
                                type="email"
                                value={upgradeEmail}
                                onChange={(e) => setUpgradeEmail(e.target.value)}
                                placeholder="name@thegreentruthnyc.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                            <p className="text-xs text-slate-400 mt-2">
                                Note: The user will need to update their Firebase login separately or use the new email to log in.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowUpgradeModal(null);
                                    setUpgradeEmail('');
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!upgradeEmail || !upgradeEmail.includes('@thegreentruthnyc.com')) {
                                        showNotification('Please enter a valid @thegreentruthnyc.com email', 'error');
                                        return;
                                    }
                                    setUpgradingUser(showUpgradeModal.id);
                                    try {
                                        await upgradeTrialUser(showUpgradeModal.id, upgradeEmail);
                                        showNotification(`Upgraded ${showUpgradeModal.profileInfo?.firstName || 'user'} to ${upgradeEmail}`, 'success');
                                        // Update local state to reflect the change
                                        setCannabisConsultants(prev => prev.map(m =>
                                            m.id === showUpgradeModal.id
                                                ? { ...m, email: upgradeEmail }
                                                : m
                                        ));
                                        setShowUpgradeModal(null);
                                        setUpgradeEmail('');
                                    } catch (error) {
                                        showNotification(`Error: ${error.message}`, 'error');
                                    } finally {
                                        setUpgradingUser(null);
                                    }
                                }}
                                disabled={upgradingUser === showUpgradeModal.id || !upgradeEmail}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {upgradingUser === showUpgradeModal.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Mail size={16} />
                                )}
                                Upgrade Email
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ ADD ROLE MODAL ============ */}
            {showAddRoleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <UserPlus className="text-indigo-600" size={24} />
                                Add Team Member
                            </h2>
                            <button onClick={() => setShowAddRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    value={newRoleEmail}
                                    onChange={(e) => setNewRoleEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="team@thegreentruthnyc.com"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">The user will receive admin access after they create an account.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={newRoleType}
                                    onChange={(e) => setNewRoleType(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="admin">Admin - Full access</option>
                                    <option value="social_manager">Social Manager - Content & social</option>
                                    <option value="rep">Cannabis Consultant - Sales only</option>
                                    <option value="driver">Driver - Deliveries only</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddRoleModal(false)}
                                    className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingRole}
                                    className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {savingRole ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ ADD BRAND MODAL ============ */}
            {showAddBrandModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Building2 className="text-indigo-600" size={24} />
                                Add New Brand
                            </h2>
                            <button onClick={() => setShowAddBrandModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name *</label>
                                <input
                                    type="text"
                                    value={newBrand.name}
                                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter brand name"
                                />
                            </div>
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Brand Logo</label>
                                <div className="flex items-center gap-4">
                                    {newBrand.logo ? (
                                        <img src={newBrand.logo} alt="Logo" className="w-14 h-14 object-contain rounded-lg border" />
                                    ) : (
                                        <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <Image size={20} className="text-slate-400" />
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const url = await handleLogoUpload(file);
                                            if (url) setNewBrand({ ...newBrand, logo: url });
                                        }
                                    }} accept="image/*" className="hidden" />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm disabled:opacity-50"
                                    >
                                        <Upload size={14} />
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contract Start</label>
                                    <input
                                        type="date"
                                        value={newBrand.contractStart}
                                        onChange={(e) => setNewBrand({ ...newBrand, contractStart: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Commission %</label>
                                    <input
                                        type="number"
                                        value={newBrand.commissionRate}
                                        onChange={(e) => setNewBrand({ ...newBrand, commissionRate: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        min="0" max="100"
                                    />
                                </div>
                            </div>
                            {/* Brand Portal Access */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Key size={14} /> Brand Portal Access
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Login Email</label>
                                        <input
                                            type="email"
                                            value={newBrand.loginEmail}
                                            onChange={(e) => setNewBrand({ ...newBrand, loginEmail: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                            placeholder="brand@company.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Temp Password</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newBrand.tempPassword}
                                                onChange={(e) => setNewBrand({ ...newBrand, tempPassword: e.target.value })}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                                                placeholder="Auto-generated"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setNewBrand({ ...newBrand, tempPassword: generateTempPassword() })}
                                                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddBrandModal(false)}
                                    className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddBrand}
                                    className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add Brand
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ BRAND DETAIL DRAWER ============ */}
            {showBrandDetail && selectedBrand && (
                <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
                    <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {selectedBrand.logo && <img src={selectedBrand.logo} alt="" className="w-8 h-8 object-contain rounded" />}
                                {selectedBrand.name}
                            </h2>
                            <button onClick={() => setShowBrandDetail(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedBrand.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {selectedBrand.status === 'active' ? '✓ Active Partner' : 'Inactive'}
                                </span>
                                <button
                                    onClick={() => handleRemoveBrand(selectedBrand.id)}
                                    className="px-3 py-1 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                    Remove
                                </button>
                            </div>
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-slate-400 text-xs">Activations</p>
                                    <p className="text-2xl font-bold text-slate-800">{brandStats[selectedBrand.id]?.activations || 0}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4">
                                    <p className="text-emerald-600 text-xs">Revenue</p>
                                    <p className="text-2xl font-bold text-emerald-700">${brandStats[selectedBrand.id]?.totalRevenue?.toFixed(2) || '0.00'}</p>
                                </div>
                            </div>
                            {/* Contract Details */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <FileText size={16} /> Contract Details
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-400">Start Date</p>
                                        <p className="font-medium">{selectedBrand.contractStart || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Commission</p>
                                        <p className="font-bold text-indigo-600">{selectedBrand.commissionRate || 5}%</p>
                                    </div>
                                </div>
                            </div>
                            {/* Portal Access */}
                            {selectedBrand.loginEmail && (
                                <div className="bg-purple-50 rounded-xl p-4">
                                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <Key size={16} /> Portal Access
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="font-mono">{selectedBrand.loginEmail}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Password:</span><span className="font-mono">{selectedBrand.tempPassword || 'Not set'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Invite:</span><span className={selectedBrand.inviteSent ? 'text-emerald-600' : 'text-amber-600'}>{selectedBrand.inviteSent ? '✓ Sent' : 'Pending'}</span></div>
                                    </div>
                                    <button
                                        onClick={() => handleSendInvite(selectedBrand)}
                                        className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                    >
                                        <Copy size={14} />
                                        {selectedBrand.inviteSent ? 'Copy Again' : 'Copy & Send Invite'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
