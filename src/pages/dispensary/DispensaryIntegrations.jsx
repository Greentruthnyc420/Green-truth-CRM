import React, { useState } from 'react';
import { Download, Upload, Plug, CheckCircle2, ExternalLink, FileText, Settings } from 'lucide-react';

const SUPPORTED_POS = [
    {
        id: 'dutchie',
        name: 'Dutchie',
        logo: '🌿',
        description: 'Leading eCommerce platform for cannabis retailers',
        features: ['Order Sync', 'Inventory Management', 'CSV Export'],
        status: 'active'
    },
    {
        id: 'blaze',
        name: 'Blaze',
        logo: '🔥',
        description: 'All-in-one cannabis retail management system',
        features: ['POS Integration', 'Customer Management', 'CSV Import/Export'],
        status: 'active'
    },
    {
        id: 'cova',
        name: 'Cova',
        logo: '💚',
        description: 'Cannabis retail point-of-sale solution',
        features: ['Sales Tracking', 'Compliance', 'Batch Import'],
        status: 'active'
    },
    {
        id: 'biotrack',
        name: 'BioTrack THC',
        logo: '🧬',
        description: 'Seed-to-sale tracking and compliance software',
        features: ['Compliance Tracking', 'CSV Export', 'Metrc Integration'],
        status: 'active'
    },
    {
        id: 'leaflogix',
        name: 'LeafLogix',
        logo: '🍃',
        description: 'Cannabis compliance and business management',
        features: ['Inventory Sync', 'Compliance Reports', 'API Access'],
        status: 'active'
    },
    {
        id: 'metrc',
        name: 'Metrc',
        logo: '📊',
        description: 'State-mandated seed-to-sale tracking',
        features: ['State Compliance', 'Manifest Generation', 'Generic CSV'],
        status: 'active'
    }
];

export default function DispensaryIntegrations() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Plug size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Integrations</h1>
                        <p className="text-purple-100">Connect your POS and manage data exports</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'overview'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('export')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'export'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    CSV Export
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'import'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    CSV Import
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Supported POS Systems */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Supported POS Systems</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SUPPORTED_POS.map((pos) => (
                                <div
                                    key={pos.id}
                                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{pos.logo}</span>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{pos.name}</h3>
                                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                    <CheckCircle2 size={12} /> Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3">{pos.description}</p>
                                    <div className="space-y-1">
                                        {pos.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                                                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Start Guide */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-purple-600" />
                            Quick Start Guide
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Place Your Order</h3>
                                    <p className="text-sm text-slate-600">
                                        Browse products in the Marketplace and add items to your cart. Submit your order
                                        when ready.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Wait for Confirmation</h3>
                                    <p className="text-sm text-slate-600">
                                        Once the brand confirms your order, it will appear in your Dashboard under "Active
                                        Orders".
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Export to Your POS</h3>
                                    <p className="text-sm text-slate-600">
                                        Click the "Export CSV..." dropdown next to any confirmed order and select your POS
                                        system. The CSV will download automatically.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    4
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Import into Your System</h3>
                                    <p className="text-sm text-slate-600">
                                        Use your POS system's import functionality to load the CSV file. Refer to the
                                        "CSV Import" tab for system-specific instructions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'export' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Download size={20} className="text-purple-600" />
                            CSV Export Guide
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Export your confirmed orders as CSV files formatted for your specific POS system. Each export
                            format is tailored to match your system's import requirements.
                        </p>

                        <div className="space-y-4">
                            {SUPPORTED_POS.map((pos) => (
                                <div key={pos.id} className="border border-slate-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">{pos.logo}</span>
                                        <h3 className="font-bold text-slate-800">{pos.name}</h3>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                                        <p className="font-semibold text-slate-700">Export Format:</p>
                                        <ul className="list-disc list-inside text-slate-600 space-y-1">
                                            {pos.id === 'dutchie' && (
                                                <>
                                                    <li>SKU, Product Name, Price, Quantity, Category</li>
                                                    <li>Dutchie-compatible column headers</li>
                                                </>
                                            )}
                                            {pos.id === 'blaze' && (
                                                <>
                                                    <li>Item ID, Description, Unit Price, Qty, Total</li>
                                                    <li>Blaze POS standard format</li>
                                                </>
                                            )}
                                            {pos.id === 'cova' && (
                                                <>
                                                    <li>Product ID, Name, Price, Quantity, Category</li>
                                                    <li>Cova-compatible import structure</li>
                                                </>
                                            )}
                                            {pos.id === 'biotrack' && (
                                                <>
                                                    <li>Manifest ID, Item Name, Quantity, Unit, RFID Tag</li>
                                                    <li>BioTrack THC manifest format</li>
                                                </>
                                            )}
                                            {pos.id === 'leaflogix' && (
                                                <>
                                                    <li>Product SKU, Name, Qty, Batch, Package ID</li>
                                                    <li>LeafLogix inventory format</li>
                                                </>
                                            )}
                                            {pos.id === 'metrc' && (
                                                <>
                                                    <li>Package Tag, Product Name, Quantity, Unit of Measure</li>
                                                    <li>Metrc/Generic compliance format</li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'import' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Upload size={20} className="text-purple-600" />
                            CSV Import Instructions
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Follow these system-specific instructions to import your downloaded CSV files into your POS
                            system.
                        </p>

                        <div className="space-y-6">
                            {SUPPORTED_POS.map((pos) => (
                                <div key={pos.id} className="border border-slate-200 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">{pos.logo}</span>
                                        <h3 className="font-bold text-slate-800 text-lg">{pos.name}</h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        {pos.id === 'dutchie' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import Steps:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Log into your Dutchie admin panel</li>
                                                    <li>Navigate to <strong>Inventory → Import Products</strong></li>
                                                    <li>Upload the downloaded CSV file</li>
                                                    <li>Map columns if prompted (usually auto-detected)</li>
                                                    <li>Click "Import" to sync products to your store</li>
                                                </ol>
                                            </>
                                        )}
                                        {pos.id === 'blaze' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import Steps:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Access Blaze POS back office</li>
                                                    <li>Go to <strong>Products → Bulk Import</strong></li>
                                                    <li>Select "Import from CSV"</li>
                                                    <li>Upload the file and confirm field mapping</li>
                                                    <li>Review and complete import</li>
                                                </ol>
                                            </>
                                        )}
                                        {pos.id === 'cova' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import Steps:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Open Cova admin dashboard</li>
                                                    <li>Navigate to <strong>Inventory → Import</strong></li>
                                                    <li>Choose "Product Import" option</li>
                                                    <li>Upload CSV and verify column mapping</li>
                                                    <li>Complete import process</li>
                                                </ol>
                                            </>
                                        )}
                                        {pos.id === 'biotrack' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import Steps:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Log into BioTrack THC</li>
                                                    <li>Go to <strong>Manifests → Import Manifest</strong></li>
                                                    <li>Select the CSV file</li>
                                                    <li>Verify RFID tags and quantities</li>
                                                    <li>Submit to state tracking system</li>
                                                </ol>
                                            </>
                                        )}
                                        {pos.id === 'leaflogix' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import Steps:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Access LeafLogix dashboard</li>
                                                    <li>Navigate to <strong>Inventory → Bulk Actions</strong></li>
                                                    <li>Select "Import Inventory"</li>
                                                    <li>Upload CSV and map fields</li>
                                                    <li>Confirm and import inventory</li>
                                                </ol>
                                            </>
                                        )}
                                        {pos.id === 'metrc' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import Steps:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Log into your state Metrc portal</li>
                                                    <li>Go to <strong>Packages → Create from Template</strong></li>
                                                    <li>Upload the generic CSV format</li>
                                                    <li>Verify package tags match state requirements</li>
                                                    <li>Submit manifest for compliance tracking</li>
                                                </ol>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Support Notice */}
                        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <p className="text-sm text-purple-900">
                                <strong>Need Help?</strong> If you encounter issues importing CSV files, contact your POS
                                system's support team or reach out to Green Truth support for assistance.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
