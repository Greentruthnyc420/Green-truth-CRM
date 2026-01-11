import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getSales, updateSale, getDrivers, getVehicles, decrementBrandInventory } from '../../services/firestoreService';
import { Truck, CheckCircle, Clock, Package, FileText, ChevronRight, X, User, Navigation } from 'lucide-react';
import { generateManifestPDF } from '../../utils/manifestGenerator';
import { useNotification } from '../../contexts/NotificationContext';

export default function BrandFulfillment() {
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();

    // Selected brand for fulfillment (defaults to current brand)
    const [selectedBrandId, setSelectedBrandId] = React.useState(null);
    const [selectedBrandName, setSelectedBrandName] = React.useState('');

    // Initialize selected brand when brandUser loads
    React.useEffect(() => {
        if (brandUser?.brandId && !selectedBrandId) {
            setSelectedBrandId(brandUser.brandId);
            setSelectedBrandName(brandUser.brandName);
        }
    }, [brandUser, selectedBrandId]);

    const [orders, setOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [fulfillModal, setFulfillModal] = useState({ open: false, orderId: null });
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [routeInfo, setRouteInfo] = useState('');

    useEffect(() => {
        async function fetchData() {
            if (!selectedBrandId) return;
            setLoading(true);
            try {
                // Fetch Orders
                const allSales = await getSales();
                const brandOrders = allSales.filter(sale =>
                    sale.items?.some(item => item.brandId === selectedBrandId) &&
                    ['accepted', 'fulfilled'].includes(sale.status)
                ).map(sale => ({
                    ...sale,
                    items: sale.items.filter(item => item.brandId === selectedBrandId)
                }));
                setOrders(brandOrders);

                // Fetch Logistics
                const [dData, vData] = await Promise.all([
                    getDrivers(selectedBrandId),
                    getVehicles(selectedBrandId)
                ]);
                setDrivers(dData || []);
                setVehicles(vData || []);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [selectedBrandId]);

    const handleOpenModal = (orderId) => {
        setFulfillModal({ open: true, orderId });
        // Reset selections
        setSelectedDriver('');
        setSelectedVehicle('');
        setRouteInfo('');
    };

    const handleConfirmFulfillment = async () => {
        if (!selectedDriver || !selectedVehicle) {
            showNotification("Please select a driver and vehicle", "error");
            return;
        }

        try {
            const order = orders.find(o => o.id === fulfillModal.orderId);
            const driver = drivers.find(d => d.id === selectedDriver);
            const vehicle = vehicles.find(v => v.id === selectedVehicle);

            const shipmentDetails = {
                driver: {
                    id: driver.id,
                    name: driver.name,
                    license: driver.license,
                    vehiclePlate: vehicle.plate,
                    vehicleModel: vehicle.model
                },
                shipper: {
                    name: brandUser.brandName,
                    address: "Main Facility", // Placeholder - eventually from Profile
                    license: "P-000-000" // Placeholder
                },
                route: routeInfo || 'Standard Delivery'
            };

            // 1. Update Order in DB
            await updateSale(order.id, {
                status: 'fulfilled',
                shipmentDetails: shipmentDetails,
                fulfilledAt: new Date().toISOString()
            });

            // 2. Decrement Inventory
            const inventoryUpdateSuccess = await decrementBrandInventory(brandUser.brandId, order.items);
            if (!inventoryUpdateSuccess) {
                showNotification('Order Fulfilled, but Inventory Sync Failed', 'warning');
            }

            // 3. Generate Manifest (Auto-download)
            await generateManifestPDF(order, shipmentDetails);

            showNotification("Order Fulfilled & Manifest Generated!", "success");

            // 4. Update Local State
            setOrders(prev => prev.map(o =>
                o.id === order.id
                    ? { ...o, status: 'fulfilled', shipmentDetails }
                    : o
            ));

            setFulfillModal({ open: false, orderId: null });

        } catch (error) {
            console.error(error);
            showNotification("Fulfillment failed", "error");
        }
    };

    // Columns
    const pendingOrders = orders.filter(o => o.status === 'accepted');
    const fulfilledOrders = orders.filter(o => o.status === 'fulfilled');

    // --- CSV IMPORT logic (Universal: Metrc, Distru, BioTrack, LeafLogix) ---
    const handleImportManifest = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedItems = results.data;
                let matchCount = 0;

                // Helper to normalize keys to lowercase for easier matching
                const normalizeRow = (row) => {
                    const newRow = {};
                    Object.keys(row).forEach(key => {
                        newRow[key.toLowerCase().trim()] = row[key];
                    });
                    return newRow;
                };

                const newOrders = [...orders];

                newOrders.forEach(order => {
                    if (order.status !== 'accepted') return; // Only pending orders

                    order.items.forEach(item => {
                        const match = importedItems.find(rawRow => {
                            const row = normalizeRow(rawRow);

                            // 1. Name Mapping
                            // Metrc: 'item name', 'product name'
                            // Distru: 'product name', 'item'
                            // BioTrack: 'product', 'name'
                            const importedName = (row['item name'] || row['product name'] || row['product'] || row['item'] || row['name'] || '').toLowerCase();

                            // 2. Quantity Mapping
                            // Metrc: 'quantity', 'qty'
                            // Distru: 'qty'
                            const importedQty = parseFloat(row['quantity'] || row['qty'] || row['amount'] || 0);

                            // 3. Match Logic: Name fuzzy match
                            return importedName && (importedName.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(importedName));
                        });

                        if (match) {
                            const row = normalizeRow(match);

                            // 4. Tag Extraction
                            // Metrc: 'package label', 'metrc tag', 'tag'
                            // Distru: 'lot number', 'batch'
                            // BioTrack: 'barcode', 'inventory id'
                            const tag = row['package label'] || row['metrc tag'] || row['tag']
                                || row['barcode'] || row['inventory id']
                                || row['lot number'] || row['batch'] || row['sku'];

                            if (tag) {
                                item.metrcTag = tag; // Unified field for tracking
                                item.batchNumber = tag;
                                matchCount++;
                            }
                        }
                    });
                });

                if (matchCount > 0) {
                    setOrders(newOrders);
                    showNotification(`Success! Matched ${matchCount} items (Metrc/Distru/BioTrack detected).`, 'success');
                } else {
                    showNotification("No matching items found. Check CSV headers.", "info");
                }
            },
            error: (err) => {
                console.error("CSV Parse Error:", err);
                showNotification("Failed to parse CSV file", "error");
            }
        });
    };

    const handleExportManifestCSV = (order) => {
        // Create CSV Content
        // Headers: OrderID, Dispensary, Driver, Vehicle, Route, Item, Qty, Batch
        const rows = [];
        order.items.forEach(item => {
            rows.push({
                OrderID: order.id,
                Dispensary: order.dispensaryName || order.dispensary,
                Driver: order.shipmentDetails?.driver?.name || '',
                Vehicle: order.shipmentDetails?.driver?.vehiclePlate || '',
                Route: order.shipmentDetails?.route || '',
                Item: item.name,
                Quantity: item.quantity,
                SKU: item.id,
                MetrcTag: item.metrcTag || '' // Ideally Batch info here
            });
        });

        // Convert to CSV
        const headers = Object.keys(rows[0]).join(',');
        const csvContent = rows.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `manifest_export_${order.id}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Fulfillment Dashboard...</div>;

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <header className="px-6 py-4 bg-white border-b border-slate-100 shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-brand-600" />
                        Fulfillment Engine
                    </h1>
                    <p className="text-slate-500">Allocate batches, assign drivers, and generate manifests.</p>
                </div>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 cursor-pointer transition-colors border border-slate-200">
                        <FileText size={18} />
                        Import Metrc Manifest
                        <input type="file" accept=".csv" className="hidden" onChange={handleImportManifest} />
                    </label>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto bg-slate-50 p-6 flex gap-6">

                {/* Column 1: Ready for Allocation / Transport */}
                <div className="w-96 flex flex-col gap-4">
                    <div className="flex items-center gap-2 font-bold text-slate-700 pb-2 border-b-2 border-amber-400">
                        <Clock className="text-amber-500" />
                        Pending Fulfillment ({pendingOrders.length})
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {pendingOrders.map(order => (
                            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-800">{order.dispensaryName || order.dispensary}</span>
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Pending</span>
                                </div>
                                <div className="space-y-1 mb-4">
                                    {order.items.slice(0, 3).map((item, i) => (
                                        <div key={i} className="text-sm text-slate-600 flex justify-between">
                                            <span>{item.quantity}x {item.name}</span>
                                        </div>
                                    ))}
                                    {order.items.length > 3 && <p className="text-xs text-slate-400">+{order.items.length - 3} more items</p>}
                                </div>
                                <button
                                    onClick={() => handleOpenModal(order.id)}
                                    className="w-full py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Truck size={16} /> Fulfill & Ship
                                </button>
                            </div>
                        ))}
                        {pendingOrders.length === 0 && (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No pending orders</div>
                        )}
                    </div>
                </div>

                {/* Column 2: In Transit / Fulfilled */}
                <div className="w-96 flex flex-col gap-4">
                    <div className="flex items-center gap-2 font-bold text-slate-700 pb-2 border-b-2 border-emerald-400">
                        <CheckCircle className="text-emerald-500" />
                        Fulfilled & In Transit ({fulfilledOrders.length})
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {fulfilledOrders.map(order => (
                            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 functionality-grayscale">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-800">{order.dispensaryName || order.dispensary}</span>
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Shipped</span>
                                </div>
                                {/* Shipment Details Summary */}
                                {order.shipmentDetails && (
                                    <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 mb-3 border border-slate-100">
                                        <p className="flex items-center gap-2 text-slate-600"><User size={12} /> {order.shipmentDetails.driver?.name}</p>
                                        <p className="flex items-center gap-2 text-slate-600"><Truck size={12} /> {order.shipmentDetails.driver?.vehiclePlate}</p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => generateManifestPDF(order, order.shipmentDetails)}
                                        className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <FileText size={14} /> Manifest PDF
                                    </button>
                                    <button
                                        onClick={() => handleExportManifestCSV(order)}
                                        className="py-2 px-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                                        title="Export CSV for Metrc"
                                    >
                                        <Truck size={14} /> CSV
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Allocation & Assignment Modal */}
            {fulfillModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Truck className="text-brand-600" /> Confirm Shipment
                            </h3>
                            <button onClick={() => setFulfillModal({ open: false, orderId: null })}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Driver Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Assign Driver</label>
                                <select
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 outline-none bg-white"
                                    value={selectedDriver}
                                    onChange={(e) => setSelectedDriver(e.target.value)}
                                >
                                    <option value="">Select a driver...</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.license})</option>)}
                                </select>
                            </div>

                            {/* Vehicle Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Assign Vehicle</label>
                                <select
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 outline-none bg-white"
                                    value={selectedVehicle}
                                    onChange={(e) => setSelectedVehicle(e.target.value)}
                                >
                                    <option value="">Select a vehicle...</option>
                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plate})</option>)}
                                </select>
                            </div>

                            {/* Route Info */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Route / Notes</label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 outline-none bg-white"
                                    placeholder="e.g. Stop 1 of 3, Deliver to back door..."
                                    value={routeInfo}
                                    onChange={(e) => setRouteInfo(e.target.value)}
                                    rows="2"
                                />
                            </div>

                            <div className="bg-amber-50 p-4 rounded-lg flex gap-3 text-amber-800 text-sm">
                                <FileText className="shrink-0 mt-0.5" size={16} />
                                <p>Confirming this shipment will automatically generate the <strong>Transport Manifest (PDF)</strong> and mark the order as Fulfilled.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button onClick={() => setFulfillModal({ open: false, orderId: null })} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button
                                    onClick={handleConfirmFulfillment}
                                    className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={18} /> Confirm & Print Manifest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
