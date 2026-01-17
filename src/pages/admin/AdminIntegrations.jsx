import React from 'react';
import { Plug, CheckCircle } from 'lucide-react';

export default function AdminIntegrations() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Plug size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Integrations</h1>
            <p className="text-slate-300">Platform-wide connection settings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HubSpot */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔶</span>
              <h3 className="font-bold text-slate-800 text-lg">HubSpot CRM</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              <CheckCircle size={12} /> Active
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Sync leads and dispensary contacts to HubSpot for sales pipeline management.
          </p>
          <div className="text-xs text-slate-400">
            Managed via the Legacy Dashboard → Leads tab
          </div>
        </div>

        {/* Google Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📅</span>
              <h3 className="font-bold text-slate-800 text-lg">Google Calendar</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              <CheckCircle size={12} /> Active
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Activation scheduling syncs with Google Calendar for rep assignments.
          </p>
          <div className="text-xs text-slate-400">
            Managed via Scheduling tab
          </div>
        </div>

        {/* Firebase */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <h3 className="font-bold text-slate-800 text-lg">Firebase</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              <CheckCircle size={12} /> Active
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Authentication and cloud functions for secure user management.
          </p>
          <div className="text-xs text-slate-400">
            Auto-configured
          </div>
        </div>

        {/* Supabase */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <h3 className="font-bold text-slate-800 text-lg">Supabase</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              <CheckCircle size={12} /> Active
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            PostgreSQL database for all business data - shifts, sales, activations.
          </p>
          <div className="text-xs text-slate-400">
            Auto-configured
          </div>
        </div>
      </div>

      {/* Hidden Monday Integration - kept for future use
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3>Monday.com Integration</h3>
        <p>Project management sync - currently disabled</p>
      </div>
      */}
    </div>
  );
}
