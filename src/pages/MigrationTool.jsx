import React, { useState } from 'react';
import { migrateDataToSupabase } from '../services/migrationService';
import { Database, Play, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MigrationTool() {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, running, done, error

    const runMigration = async () => {
        setStatus('running');
        setLogs(['Starting...']);
        try {
            await migrateDataToSupabase((msg) => {
                setLogs(prev => [...prev, msg]);
            });
            setStatus('done');
        } catch (e) {
            setLogs(prev => [...prev, `Error: ${e.message}`]);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Database className="text-emerald-400" />
                        <div>
                            <h1 className="text-xl font-bold">Data Migration Tool</h1>
                            <p className="text-xs text-slate-400">Firestore (NoSQL) ➔ Supabase (SQL)</p>
                        </div>
                    </div>
                    {status === 'done' && <CheckCircle className="text-emerald-400" />}
                    {status === 'error' && <AlertTriangle className="text-red-400" />}
                </div>

                <div className="p-8 text-center">
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        This tool will read all Users, Leads, and Sales from Firebase and insert them into your new Supabase SQL tables.
                    </p>

                    <button
                        onClick={runMigration}
                        disabled={status === 'running'}
                        className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-all ${status === 'running'
                            ? 'bg-slate-100 text-slate-400 cursor-wait'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 shadow-lg shadow-emerald-200'
                            }`}
                    >
                        {status === 'running' ? (
                            <>Processing...</>
                        ) : (
                            <> <Play fill="currentColor" /> Start Migration </>
                        )}
                    </button>
                </div>

                <div className="bg-slate-950 p-6 font-mono text-xs text-green-400 h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                        <span className="text-slate-700">// Logs will appear here...</span>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1 border-b border-slate-800/50 pb-1">
                                <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
