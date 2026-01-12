import Papa from 'papaparse';

// Helper to download CSV
const downloadCSV = (csvString, filename) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// 1. Dutchie Export Format
export const exportToDutchie = (products, brandName) => {
    const data = products.map(p => ({
        'Product Name': p.name,
        'Quantity': p.quantity || p.caseSize || 1,
        'Batch ID': p.metrcTag || '',
        'External ID': p.riid || p.id,
        'Category': p.category || 'Flower',
        'Strain Type': p.strainType || 'Hybrid',
        'THC Content': p.thc || '',
        'Description': p.description || '',
        'Price': p.price,
        'Brand': brandName || p.brandName || ''
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, `dutchie_inventory_${Date.now()}.csv`);
};

// 2. Blaze Export Format
export const exportToBlaze = (products, brandName) => {
    const data = products.map(p => ({
        'Product Name': p.name,
        'Brand': brandName || p.brandName || '',
        'Category': p.category || 'Flower',
        'SKU': p.riid || p.id,
        'Quantity': p.quantity || p.caseSize || 1,
        'Wholesale Cost': p.price,
        'Metrc Tag': p.metrcTag || '',
        'Batch Number': p.batchNumber || p.metrcTag || '',
        'Active': 'Yes'
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, `blaze_inventory_${Date.now()}.csv`);
};

// 3. Cova Export Format
export const exportToCova = (products, brandName) => {
    const data = products.map(p => ({
        'Product Name': p.name,
        'SKU': p.riid || p.id,
        'Classification': p.category || 'Inhalable',
        'Batch Tracking': 'TRUE',
        'Batch Number': p.metrcTag || '',
        'Quantity': p.quantity || p.caseSize || 1,
        'Unit Cost': p.price,
        'Selling Price': '',
        'Supplier': brandName || p.brandName || ''
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, `cova_inventory_${Date.now()}.csv`);
};

// 4. BioTrack Export
export const exportToBioTrack = (products) => {
    const data = products.map(p => ({
        'Barcode': p.metrcTag || p.riid || '',
        'Inventory ID': p.riid || p.metrcTag || '',
        'Product Name': p.name,
        'Quantity': p.quantity || 1,
        'Usable Weight': '0',
        'External ID': p.riid || ''
    }));
    const csv = Papa.unparse(data);
    downloadCSV(csv, `biotrack_import_${Date.now()}.csv`);
};

// 5. LeafLogix Export
export const exportToLeafLogix = (products) => {
    const data = products.map(p => ({
        'SKU': p.riid || p.metrcTag || '',
        'Quantity': p.quantity || 1,
        'Cost': p.price,
        'Product Name': p.name
    }));
    const csv = Papa.unparse(data);
    downloadCSV(csv, `leaflogix_import_${Date.now()}.csv`);
};

// 6. Generic / Metrc Ready
export const exportMetrcReady = (products) => {
    const data = products.map(p => ({
        'Item Name': p.name,
        'Category': p.category,
        'Package Tag': p.metrcTag || '',
        'Quantity': p.quantity || p.caseSize || 1,
        'Unit of Measure': p.unit || 'Each',
        'Note': p.description
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, `metrc_ready_${Date.now()}.csv`);
};

// 7. Universal / Simple CSV Export
export const exportGeneric = (products, orderId) => {
    const data = products.map(p => ({
        'Product Name': p.name,
        'Brand': p.brandName || '',
        'Category': p.category || '',
        'Quantity': p.quantity || 1,
        'Unit Price': p.price || 0,
        'Total': (p.quantity || 1) * (p.price || 0),
        'SKU': p.riid || p.id || '',
        'Description': p.description || ''
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, `order_${orderId || 'export'}_${Date.now()}.csv`);
};
