import React, { useState, useEffect, useCallback } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Filter, CheckCircle, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 20;

export default function BrandSyncHistory() {
    const { brandUser } = useBrandAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState({ type: 'all', status: 'all' });
    const [boardIds, setBoardIds] = useState({});

    useEffect(() => {
        const fetchBoardIds = async () => {
            if (!brandUser?.brandId) return;
            const docRef = doc(db, 'brand_integrations', brandUser.brandId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBoardIds({
                    lead: data.leadsBoardId,
                    order: data.ordersBoardId,
                    invoice: data.invoicesBoardId,
                });
            }
        };
        fetchBoardIds();
    }, [brandUser]);

    const fetchLogs = useCallback(async (loadMore = false) => {
        if (!brandUser?.brandId) return;

        setLoading(true);
        try {
            let q = query(
                collection(db, 'brand_sync_logs'),
                where('brandId', '==', brandUser.brandId),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE)
            );

            if (filters.type !== 'all') {
                q = query(q, where('action', '==', filters.type));
            }
            if (filters.status !== 'all') {
                q = query(q, where('success', '==', (filters.status === 'success')));
            }

            if (loadMore && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setLogs(prev => loadMore ? [...prev, ...newLogs] : newLogs);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(newLogs.length === PAGE_SIZE);

        } catch (error) {
            console.error("Error fetching sync history:", error);
        } finally {
            setLoading(false);
        }
    }, [brandUser, filters, lastDoc]);

    useEffect(() => {
        if (brandUser?.brandId) {
            fetchLogs();
        }
    }, [brandUser, filters, fetchLogs]);

    const getBoardIdForLog = (log) => {
        const type = log.action.replace('sync', '').toLowerCase();
        return boardIds[type] || null;
    };

    return (
        <div className="max-w-5xl mx-auto">
             <div className="mb-8">
                <Link to="/brand/integrations" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 text-sm font-medium">
                    <ArrowLeft size={16} /> Back to Integrations
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Monday.com Sync History</h1>
                <p className="text-slate-500 mt-1">View the log of all sync attempts to Monday.com.</p>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <Filter size={20} className="text-slate-500" />
                <div>
                    <label className="text-sm font-bold text-slate-700 mr-2">Type:</label>
                    <select onChange={(e) => setFilters(f => ({...f, type: e.target.value}))} className="p-2 rounded-md border-slate-300">
                        <option value="all">All</option>
                        <option value="syncLead">Lead</option>
                        <option value="syncOrder">Order</option>
                        <option value="syncInvoice">Invoice</option>
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-bold text-slate-700 mr-2">Status:</label>
                    <select onChange={(e) => setFilters(f => ({...f, status: e.target.value}))} className="p-2 rounded-md border-slate-300">
                        <option value="all">All</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                    </select>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Item</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Type</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Timestamp</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Monday.com Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map(log => {
                                const boardId = getBoardIdForLog(log);
                                return (
                                    <tr key={log.id}>
                                        <td className="p-4">
                                            {log.success ? <CheckCircle className="text-emerald-500" /> : <AlertTriangle className="text-red-500" />}
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">{log.details.leadId || log.details.orderId || log.details.invoiceId}</td>
                                        <td className="p-4 text-slate-600">{log.action.replace('sync', '')}</td>
                                        <td className="p-4 text-slate-500 text-sm">{log.timestamp.toDate().toLocaleString()}</td>
                                        <td className="p-4">
                                            {log.details.mondayItemId && boardId && (
                                                <a href={`https://greentruth.monday.com/boards/${boardId}/pulses/${log.details.mondayItemId}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1">
                                                    View <LinkIcon size={12} />
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {loading && <div className="p-8 text-center">Loading...</div>}
                {!loading && logs.length === 0 && <div className="p-8 text-center text-slate-500">No logs found.</div>}

                {hasMore && !loading && (
                    <div className="p-4 border-t border-slate-100">
                        <button onClick={() => fetchLogs(true)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700">
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
