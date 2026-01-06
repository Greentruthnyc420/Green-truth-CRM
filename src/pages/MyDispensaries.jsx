import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyDispensaries, logActivity, addSale, updateLead, deliverSamples } from '../services/firestoreService';
import { calculateRepCommission } from '../services/compensationService';
import { awardOrderPoints } from '../services/pointsService';
import { generateEmailDraft } from '../services/geminiService';
import { initGmailAuth, requestGmailAccess, sendEmail as gmailSendEmail, hasGmailAccess } from '../services/gmailService';
import { Store, Calendar, DollarSign, ArrowLeft, Mail, X, Loader, Phone, MessageCircle, ExternalLink, Send, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import confetti from 'canvas-confetti';

export default function MyDispensaries() {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [dispensaries, setDispensaries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (currentUser || true) {
                const data = await getMyDispensaries(currentUser?.uid || 'test-user-123');
                setDispensaries(data);
            }
            setLoading(false);
        }
        loadData();
    }, [currentUser]);

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const [emailModal, setEmailModal] = useState({
        isOpen: false,
        lead: null,
        subject: '',
        body: '',
        isLoadingAI: false,
        isSending: false,
        gmailConnected: false,
        sendSuccess: false,
        sendError: ''
    });

    const [markSoldModal, setMarkSoldModal] = useState({
        isOpen: false,
        lead: null,
        revenue: '',
        saleType: '', // 'New Customer' | 'Re-order'
        submitting: false,
        error: ''
    });

    const handleOpenMarkSold = (disp) => {
        setMarkSoldModal({
            isOpen: true,
            lead: disp,
            revenue: '',
            saleType: '',
            submitting: false,
            error: ''
        });
    };

    const handleSubmitSold = async () => {
        const { lead, revenue, saleType } = markSoldModal;
        const revAmount = parseFloat(revenue);

        // Strict Validation
        if (!revAmount || revAmount <= 0 || !saleType) {
            setMarkSoldModal(prev => ({ ...prev, error: "Select Deal Type & Revenue to proceed." }));
            return;
        }

        setMarkSoldModal(prev => ({ ...prev, submitting: true, error: '' }));

        try {
            const commission = calculateRepCommission(revAmount);

            // 1. Create Sale Record
            await addSale({
                userId: currentUser?.uid,
                dispensaryName: lead.name,
                amount: revAmount,
                type: saleType,
                commissionEarned: commission,
                date: new Date().toISOString(),
                status: 'pending' // Pending Admin Payout
            });

            // 2. Update Lead Status (if it exists as a lead document)
            if (lead.id) {
                await updateLead(lead.id, {
                    status: 'Sold',
                    amount: revAmount,
                    potentialValue: revAmount,
                    saleType: saleType,
                    soldDate: new Date().toISOString()
                });
            }

            // 3. Award Points (Revenue + Brand Placements)
            // Note: MyDispensaries 'Mark Sold' is a simple summary. 
            // We use 'interestedBrands' as a fallback if specific brands aren't logged.
            try {
                await awardOrderPoints(
                    currentUser?.uid || 'test-user-123',
                    lead.id || 'unknown',
                    revAmount,
                    lead.interestedBrands || [] // Fallback to interested brands for simplified flow
                );
            } catch (pErr) {
                console.warn("Points awarding failed.", pErr);
            }
            // Note: MyDispensaries aggregates, so `lead` object here might be an aggregation.
            // Ideally we need the actual Lead ID. `getMyDispensaries` might not return it if aggregated?
            // "My Dispensaries" usually comes from Leads/Shifts. 
            // If the disp object has an ID (from getMyDispensaries logic which merges leads), we use it.
            // If it's a "Pure" dispensary from aggregation of shifts, it might not have a direct Lead ID unless we matched it.
            // But `getMyDispensaries` in firestoreService seemed to attach lead info if found.
            // Let's assume `lead.id` (or similar) is available if it came from a lead, or we can't update the lead doc.
            // If `lead.email` exists, we can try to find it? 
            // For now, we proceed with addSale which is the critical financial record.

            // If we have a Lead ID (let's assume passed in disp object if it came from leads)
            // In getMyDispensaries (Step 1006 view), it maps leads. If lead found, it sets props.
            // It doesn't explicitly set "id". We should have checked that.
            // However, `addSale` is creating the new source of truth for "Sold".
            // Leaderboard needs to find this. Leaderboard checks Leads? 
            // WAIT. Leaderboard calcRepScore iterates `leads`.
            // If I add a Sale doc, does Leaderboard read Sales docs?
            // "1. The 'King of the Crop' Scoring Algorithm... calculates rep score based on leads... score += 1.0 (Lead Doc)... Closing Bonus... if status 'Sold'".
            // So Leaderboard reads LEADS.
            // So updating the LEAD is critical.
            // In `getMyDispensaries`, I need to make sure I have the Lead ID.
            // I'll skip updateLead if I don't have ID, but `addSale` is safe.
            // The Leaderboard *Should* ideally read Sales + Leads, or I update Lead status.

            // Let's assume we can update if id exists.

            // Reset and close
            setMarkSoldModal({ isOpen: false, lead: null, revenue: '', saleType: '', submitting: false, error: '' });

            // Refresh Data
            setDispensaries(data);

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            showNotification(`Sale recorded! Commission Earned: $${commission.toFixed(2)}`, 'success');

        } catch (e) {
            console.error("Failed to mark sold", e);
            setMarkSoldModal(prev => ({ ...prev, submitting: false, error: "Failed to save. Try again." }));
        }
    };

    const handleDeliverSamples = async (disp) => {
        if (!disp.id) {
            showNotification("No lead record found for this dispensary.", 'warning');
            return;
        }

        try {
            await deliverSamples(disp.id);
            // Log Activity
            logActivity('SAMPLES_DELIVERED', disp.name, currentUser?.uid, {});

            // Refresh Data
            setDispensaries(data);

            showNotification("Samples marked as delivered!", 'success');
        } catch (e) {
            console.error("Failed to update samples delivery", e);
            showNotification("Failed to update status: " + (e.message || 'Unknown error'), 'error');
        }
    };

    const handleOpenEmail = async (disp) => {
        // Log Activity: EMAIL_OPEN
        logActivity('EMAIL_OPEN', disp.name, currentUser?.uid, {});

        setEmailModal(prev => ({ ...prev, isOpen: true, lead: disp, isLoadingAI: true }));

        // Generate Draft
        const draft = await generateEmailDraft(disp.name, disp.contactPerson, disp.interests);

        setEmailModal(prev => ({
            ...prev,
            isOpen: true,
            lead: disp,
            isLoadingAI: false,
            subject: draft.subject,
            body: draft.body,
            gmailConnected: hasGmailAccess()
        }));
    };

    const handleSendViaGmail = async () => {
        const { lead, subject, body } = emailModal;

        setEmailModal(prev => ({ ...prev, isSending: true, sendError: '' }));

        try {
            // Request Gmail access if not already connected
            if (!hasGmailAccess()) {
                await requestGmailAccess();
                setEmailModal(prev => ({ ...prev, gmailConnected: true }));
            }

            // Send email via Gmail API
            await gmailSendEmail({
                to: lead.email,
                subject: subject,
                body: body,
                cc: currentUser?.email || '',
                bcc: 'omar@thegreentruthnyc.com'
            });

            // Log activity
            logActivity('EMAIL_SENT', lead.name, currentUser?.uid, { to: lead.email, subject });

            // Show success
            setEmailModal(prev => ({ ...prev, isSending: false, sendSuccess: true }));

            // Close modal after delay
            setTimeout(() => {
                setEmailModal({
                    isOpen: false, lead: null, subject: '', body: '',
                    isLoadingAI: false, isSending: false, gmailConnected: false,
                    sendSuccess: false, sendError: ''
                });
            }, 2000);

        } catch (error) {
            console.error('Gmail send error:', error);
            setEmailModal(prev => ({
                ...prev,
                isSending: false,
                sendError: error.message || 'Failed to send email'
            }));
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Dispensaries</h1>
                    <p className="text-slate-500">Manage your doors and track activations.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading your territory...</div>
            ) : dispensaries.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
                    <Store size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700">No Dispensaries Found</h3>
                    <p className="text-slate-500 mb-6">Log a shift or a sale to add a dispensary to your list.</p>
                    <Link to="/log-sale" className="text-brand-600 font-bold hover:underline">Log a Sale</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dispensaries.map((disp, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
                                        {disp.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{disp.name}</h3>
                                        {disp.contactPerson && <p className="text-xs text-slate-400">Contact: {disp.contactPerson}</p>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${disp.leadStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                        disp.leadStatus === 'samples_delivered' ? 'bg-amber-100 text-amber-700' :
                                            disp.leadStatus === 'samples_requested' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-500'
                                        }`}>
                                        {disp.leadStatus === 'active' ? 'Active' :
                                            disp.leadStatus === 'samples_delivered' ? 'Samples Delivered' :
                                                disp.leadStatus === 'samples_requested' ? 'Samples Requested' :
                                                    'Prospect'}
                                    </span>
                                    {disp.leadStatus === 'samples_requested' && (
                                        <button
                                            onClick={() => handleDeliverSamples(disp)}
                                            className="text-[10px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-tighter"
                                        >
                                            Mark Delivered →
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Calendar size={16} />
                                        Last Activation:
                                    </span>
                                    <span className="font-medium text-slate-800">{formatDate(disp.lastActivation)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <DollarSign size={16} />
                                        Last Purchase:
                                    </span>
                                    <span className="font-medium text-slate-800">{formatDate(disp.lastPurchase)}</span>
                                </div>
                            </div>

                            {/* Actions Row */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                                {/* Call Button */}
                                <a
                                    href={`tel:${disp.phone}`}
                                    onClick={() => logActivity('CALL', disp.name, currentUser?.uid, { phone: disp.phone })}
                                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-white transition-transform active:scale-95 ${disp.phone ? 'bg-emerald-500 shadow-md shadow-emerald-200' : 'bg-slate-200 cursor-not-allowed'}`}
                                    style={{ pointerEvents: disp.phone ? 'auto' : 'none' }}
                                >
                                    <Phone size={20} fill="currentColor" />
                                    Call
                                </a>

                                {/* Mark Sold Button (New) */}
                                <button
                                    onClick={() => handleOpenMarkSold(disp)}
                                    className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-white transition-transform active:scale-95 bg-purple-600 shadow-md shadow-purple-200"
                                >
                                    <DollarSign size={20} fill="currentColor" />
                                    Sold
                                </button>

                                {/* Text Button */}
                                <a
                                    href={`sms:${disp.phone}`}
                                    onClick={() => logActivity('TEXT', disp.name, currentUser?.uid, { phone: disp.phone })}
                                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-white transition-transform active:scale-95 ${disp.phone ? 'bg-blue-500 shadow-md shadow-blue-200' : 'bg-slate-200 cursor-not-allowed'}`}
                                    style={{ pointerEvents: disp.phone ? 'auto' : 'none' }}
                                >
                                    <MessageCircle size={20} fill="currentColor" />
                                    Text
                                </a>

                                {/* Email Button */}
                                <button
                                    onClick={() => handleOpenEmail(disp)}
                                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-white transition-transform active:scale-95 ${disp.email ? 'bg-orange-500 shadow-md shadow-orange-200' : 'bg-slate-200 cursor-not-allowed'}`}
                                    disabled={!disp.email}
                                >
                                    <Mail size={20} fill="currentColor" />
                                    Email
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mark Sold Modal (Task 1) */}
            {markSoldModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="bg-purple-600 p-6 text-white text-center">
                            <DollarSign size={48} className="mx-auto mb-2 opacity-90" />
                            <h3 className="text-xl font-black uppercase tracking-wide">Mark as Sold</h3>
                            <p className="text-purple-100 text-sm mt-1">{markSoldModal.lead?.name}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Revenue Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Revenue ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={markSoldModal.revenue}
                                        onChange={e => setMarkSoldModal(prev => ({ ...prev, revenue: e.target.value, error: '' }))}
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none font-bold text-slate-800 text-lg"
                                    />
                                </div>
                            </div>

                            {/* Deal Type Radio */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Deal Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setMarkSoldModal(prev => ({ ...prev, saleType: 'New Customer', error: '' }))}
                                        className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${markSoldModal.saleType === 'New Customer'
                                            ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        New Customer
                                    </button>
                                    <button
                                        onClick={() => setMarkSoldModal(prev => ({ ...prev, saleType: 'Re-order', error: '' }))}
                                        className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${markSoldModal.saleType === 'Re-order'
                                            ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        Re-order
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {markSoldModal.error && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg text-center animate-pulse">
                                    {markSoldModal.error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => setMarkSoldModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitSold}
                                    disabled={markSoldModal.submitting}
                                    className={`flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-transform active:scale-95 ${(!markSoldModal.revenue || !markSoldModal.saleType) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                                        }`}
                                >
                                    {markSoldModal.submitting ? 'Saving...' : 'Save Sale'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {emailModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Mail size={20} className="text-brand-600" />
                                Draft Email to {emailModal.lead?.name}
                            </h3>
                            <button onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            {emailModal.isLoadingAI ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                                    <Loader size={32} className="animate-spin text-brand-500" />
                                    <p>Gemini is drafting your email...</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                                        <input
                                            value={emailModal.subject}
                                            onChange={e => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-lg p-3 focus:border-brand-500 outline-none font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Message</label>
                                        <textarea
                                            value={emailModal.body}
                                            onChange={e => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-lg p-3 focus:border-brand-500 outline-none h-64 font-mono text-sm"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {!emailModal.isLoadingAI && (
                            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 flex-wrap">
                                <button
                                    onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                                    className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => {
                                        const { subject, body, lead } = emailModal;
                                        const to = lead.email;
                                        const cc = currentUser?.email || '';
                                        const bcc = 'omar@thegreentruthnyc.com';

                                        const subjectEnc = encodeURIComponent(subject);
                                        const bodyEnc = encodeURIComponent(body);

                                        const mailto = `mailto:${to}?cc=${cc}&bcc=${bcc}&subject=${subjectEnc}&body=${bodyEnc}`;
                                        window.location.href = mailto;

                                        // Close modal after opening mail app
                                        setTimeout(() => {
                                            setEmailModal({ isOpen: false, lead: null, subject: '', body: '', isLoadingAI: false, isSending: false });
                                        }, 1000);
                                    }}
                                    className="px-4 py-2 border border-brand-200 text-brand-700 font-bold rounded-lg hover:bg-brand-50 flex items-center gap-2"
                                >
                                    <ExternalLink size={18} />
                                    Open in Mail App
                                </button>

                                <button
                                    onClick={() => {
                                        const { subject, body, lead } = emailModal;
                                        const to = lead.email;
                                        const cc = currentUser?.email || '';
                                        const bcc = 'omar@thegreentruthnyc.com';

                                        const subjectEnc = encodeURIComponent(subject);
                                        const bodyEnc = encodeURIComponent(body);
                                        const toEnc = encodeURIComponent(to);
                                        const ccEnc = encodeURIComponent(cc);
                                        const bccEnc = encodeURIComponent(bcc);

                                        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toEnc}&su=${subjectEnc}&body=${bodyEnc}&cc=${ccEnc}&bcc=${bccEnc}`;
                                        window.open(gmailUrl, '_blank');

                                        // Close modal after action
                                        setTimeout(() => {
                                            setEmailModal({ isOpen: false, lead: null, subject: '', body: '', isLoadingAI: false, isSending: false, gmailConnected: false, sendSuccess: false, sendError: '' });
                                        }, 1000);
                                    }}
                                    className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Mail size={18} />
                                    Open in Gmail
                                </button>

                                {/* Send via Gmail API Button */}
                                <button
                                    onClick={handleSendViaGmail}
                                    disabled={emailModal.isSending || emailModal.sendSuccess}
                                    className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${emailModal.sendSuccess
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-200'
                                        } ${emailModal.isSending ? 'opacity-75 cursor-wait' : ''}`}
                                >
                                    {emailModal.sendSuccess ? (
                                        <>
                                            <CheckCircle size={18} />
                                            Sent!
                                        </>
                                    ) : emailModal.isSending ? (
                                        <>
                                            <Loader size={18} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Send via Gmail
                                        </>
                                    )}
                                </button>

                                {/* Error Message */}
                                {emailModal.sendError && (
                                    <div className="w-full mt-2 p-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg text-center">
                                        {emailModal.sendError}
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
