import React, { useState } from 'react';
import { Download, Upload, Plug, CheckCircle2, FileText } from 'lucide-react';

const SUPPORTED_SYSTEMS = [
    {
        id: 'distru',
        name: 'Distru',
        logo: '📦',
        description: 'Cannabis wholesale and distribution ERP',
        features: ['Wholesale Orders', 'Inventory Tracking', 'Route Optimization'],
        status: 'active',
        type: 'erp'
    },
    {
        id: 'monday',
        name: 'Monday.com',
        logo: '📅',
        description: 'Work OS for order tracking and project management',
        features: ['Order Sync', 'Automated Workflows', 'Status Tracking'],
        status: 'active',
        type: 'pm'
    },
    {
        id: 'metrc',
        name: 'Metrc',
        logo: '📊',
        description: 'State-mandated seed-to-sale tracking',
        features: ['State Compliance', 'Manifest Generation', 'Package Tracking'],
        status: 'active',
        type: 'compliance'
    },
    {
        id: 'biotrack',
        name: 'BioTrack THC',
        logo: '🧬',
        description: 'Seed-to-sale tracking and compliance software',
        features: ['Manifest Creation', 'RFID Tags', 'Transfer Tracking'],
        status: 'active',
        type: 'compliance'
    },
    {
        id: 'leaflogix',
        name: 'LeafLogix',
        logo: '🍃',
        description: 'Cannabis compliance and business management',
        features: ['Inventory Management', 'Batch Tracking', 'Wholesale Orders'],
        status: 'active',
        type: 'compliance'
    },
    {
        id: 'generic',
        name: 'Generic CSV',
        logo: '📄',
        description: 'Universal spreadsheet format for manual processing',
        features: ['Custom Formatting', 'Excel Compatible', 'Easy Sharing'],
        status: 'active',
        type: 'generic'
    }
];

export default function BrandIntegrations() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Plug size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Integrations</h1>
                        <p className="text-orange-100">Connect your ERP and compliance systems</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'overview'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('export')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'export'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    CSV Export
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'import'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    CSV Import
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Supported Systems */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Supported Systems & Formats</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SUPPORTED_SYSTEMS.map((system) => (
                                <div
                                    key={system.id}
                                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{system.logo}</span>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{system.name}</h3>
                                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                    <CheckCircle2 size={12} /> Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3">{system.description}</p>
                                    <div className="space-y-1">
                                        {system.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                                                <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
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
                            <FileText size={20} className="text-amber-600" />
                            Quick Start Guide
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Receive Orders</h3>
                                    <p className="text-sm text-slate-600">
                                        Dispensaries place orders through the marketplace. You'll see incoming orders in
                                        your Orders/Fulfillment dashboard.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Import to Your ERP</h3>
                                    <p className="text-sm text-slate-600">
                                        If you use Distru, BioTrack, or another wholesale ERP, import incoming orders using
                                        the CSV Import feature to sync with your warehouse management system.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Fulfill & Generate Manifests</h3>
                                    <p className="text-sm text-slate-600">
                                        Use the fulfillment dashboard to assign drivers, export transfer manifests for
                                        Metrc/state compliance, and track deliveries.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    4
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Export Product Catalog</h3>
                                    <p className="text-sm text-slate-600">
                                        Keep your product catalog up to date by exporting it to CSV for sharing with
                                        partners or bulk updating your systems.
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
                            <Download size={20} className="text-amber-600" />
                            CSV Export Guide
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Export your product catalogs, order manifests, and inventory data as CSV files formatted for
                            various systems. The Fulfillment page allows you to export manifests upon order confirmation.
                        </p>

                        <div className="space-y-4">
                            {SUPPORTED_SYSTEMS.map((system) => (
                                <div key={system.id} className="border border-slate-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">{system.logo}</span>
                                        <h3 className="font-bold text-slate-800">{system.name}</h3>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                                        <p className="font-semibold text-slate-700">Export Format:</p>
                                        <ul className="list-disc list-inside text-slate-600 space-y-1">
                                            {system.id === 'monday' && (
                                                <>
                                                    <li>Item Name, Status, Date, Customer Columns</li>
                                                    <li>Compatible with Monday.com import wizard</li>
                                                </>
                                            )}
                                            {system.id === 'distru' && (
                                                <>
                                                    <li>Product SKU, Name, Wholesale Price, Quantity, Category</li>
                                                    <li>Distru ERP purchase order format</li>
                                                </>
                                            )}
                                            {system.id === 'metrc' && (
                                                <>
                                                    <li>Package Tag, Product Name, Quantity, Unit of Measure, Batch</li>
                                                    <li>Metrc/state compliance manifest format</li>
                                                </>
                                            )}
                                            {system.id === 'biotrack' && (
                                                <>
                                                    <li>Manifest ID, Product Name, Quantity, RFID Tag, Batch Number</li>
                                                    <li>BioTrack THC transfer manifest</li>
                                                </>
                                            )}
                                            {system.id === 'leaflogix' && (
                                                <>
                                                    <li>SKU, Product Name, Quantity, Package ID, Batch Number</li>
                                                    <li>LeafLogix wholesale order format</li>
                                                </>
                                            )}
                                            {system.id === 'generic' && (
                                                <>
                                                    <li>Customizable columns based on your needs</li>
                                                    <li>Standard CSV format for universal compatibility</li>
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
                            <Upload size={20} className="text-amber-600" />
                            CSV Import Instructions
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Import orders from your ERP/warehouse system into Green Truth for fulfillment. The Fulfillment
                            page supports smart header detection for multiple formats.
                        </p>

                        <div className="space-y-6">
                            {SUPPORTED_SYSTEMS.map((system) => (
                                <div key={system.id} className="border border-slate-200 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">{system.logo}</span>
                                        <h3 className="font-bold text-slate-800 text-lg">{system.name}</h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        {system.id === 'monday' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import to Green Truth:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Export board view to Excel/CSV</li>
                                                    <li>Go to Fulfillment dashboard</li>
                                                    <li>Upload CSV via Import Manifest</li>
                                                    <li>Map "Name" to Product and "Status" to Order Status</li>
                                                    <li>Syncs updates back to board if configured</li>
                                                </ol>
                                            </>
                                        )}
                                        {system.id === 'distru' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import to Green Truth:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Export purchase orders or inventory from Distru ERP</li>
                                                    <li>Access Brand Fulfillment dashboard</li>
                                                    <li>Click "Import Manifest"</li>
                                                    <li>Upload CSV - Distru headers auto-detected (SKU, Wholesaler, etc.)</li>
                                                    <li>Orders sync with fulfillment queue</li>
                                                </ol>
                                            </>
                                        )}
                                        {system.id === 'metrc' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import to Green Truth:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Download manifest from Metrc portal or generic system</li>
                                                    <li>Go to Fulfillment page in Green Truth</li>
                                                    <li>Upload CSV using Import Manifest</li>
                                                    <li>Metrc format detected (Package Tag, Qty, Unit of Measure, etc.)</li>
                                                    <li>Verify compliance tags before processing</li>
                                                </ol>
                                            </>
                                        )}
                                        {system.id === 'biotrack' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import to Green Truth:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Export transfer manifest from BioTrack THC</li>
                                                    <li>Go to Fulfillment → Import Manifest</li>
                                                    <li>Upload BioTrack CSV file</li>
                                                    <li>BioTrack headers auto-detected (Manifest, Source, RFID, etc.)</li>
                                                    <li>Review RFID tags and quantities before confirming</li>
                                                </ol>
                                            </>
                                        )}
                                        {system.id === 'leaflogix' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import to Green Truth:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Export wholesale orders from LeafLogix</li>
                                                    <li>Navigate to Brand Fulfillment page</li>
                                                    <li>Click Import Manifest and select file</li>
                                                    <li>LeafLogix format recognized automatically</li>
                                                    <li>Imported items ready for fulfillment</li>
                                                </ol>
                                            </>
                                        )}
                                        {system.id === 'generic' && (
                                            <>
                                                <p className="font-semibold text-slate-700">Import to Green Truth:</p>
                                                <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-2">
                                                    <li>Prepare your CSV with columns: Product Name, Quantity, (optional: SKU, Price, Tags)</li>
                                                    <li>Go to Fulfillment page</li>
                                                    <li>Upload using Import Manifest</li>
                                                    <li>System will attempt to detect columns automatically</li>
                                                    <li>Confirm mapping and import</li>
                                                </ol>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Support Notice */}
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm text-amber-900">
                                <strong>Need Help?</strong> The Fulfillment page includes smart header detection that
                                automatically identifies CSV formats from Metrc, Distru, BioTrack, and LeafLogix. For
                                custom formats, contact support for assistance.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
