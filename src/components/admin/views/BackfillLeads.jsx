import React, { useState } from 'react';
import { backfillLeads } from '../../../services/backfillService';

export default function BackfillLeads() {
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);

    const runBackfill = async () => {
        setStatus('running');
        setLogs(['Starting backfill process...', 'Fetching leads...']);

        try {
            const result = await backfillLeads();
            setLogs(prev => [...prev, ...result.logs]);
            setStatus('finished');
        } catch (e) {
            console.error(e);
            setLogs(prev => [...prev, `CRITICAL ERROR: ${e.message}`]);
            setStatus('error');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Backfill Lead Coordinates</h1>
                        <p className="text-slate-500 mt-1">Re-geocode all existing leads using Google Maps API to ensure map pin accuracy.</p>
                    </div>
                    <button
                        onClick={runBackfill}
                        disabled={status === 'running'}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {status === 'running' ? 'Processing...' : 'Start Backfill'}
                    </button>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <div className="text-slate-500 italic text-center mt-32">Ready to start. Click the button above.</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.includes('Updated:') ? 'text-emerald-400' :
                                    log.includes('Failed') || log.includes('Error') ? 'text-red-400' :
                                        log.includes('Skipped:') ? 'text-yellow-400' :
                                            'text-slate-300'
                                }`}>
                                <span className="text-slate-600 mr-2">[{i + 1}]</span>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
