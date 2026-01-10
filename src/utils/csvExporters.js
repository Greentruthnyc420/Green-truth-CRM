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
// Based on standard Dutchie inventory upload templates
export const exportToDutchie = (products, brandName) => {
    const data = products.map(p => ({
        'Product Name': p.name,
        'Category': p.category,
        'Strain Type': p.strainType || 'Hybrid',
        'THC Content': p.thc || '',
        'Description': p.description,
        'Price': p.price,
        'Quantity': p.inStock ? 100 : 0, // Placeholder quantity or derived
        'Batch ID': p.metrcTag || '', // Use Metrc Tag as Batch ID if avail
        'External ID': p.riid || p.id,
        'Brand': brandName || ''
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, `dutchie_inventory_${Date.now()}.csv`);
};

// 2. Blaze Export Format
export const exportToBlaze = (products, brandName) => {
    const data = products.map(p => ({
        'name': p.name,
        'brand': brandName || '',
        'type': p.category,
        'price': p.price,
        'sku': p.riid || p.id,
        'metrc_tag': p.metrcTag || '',
        'description': p.description,
        'thc': p.thc || '',
        'weight_per_unit': p.weight || '1g' // Assumption
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, `blaze_inventory_${Date.now()}.csv`);
};

// 3. Generic/Metrc Ready CSV
export const exportMetrcReady = (products) => {
    const data = products.map(p => ({
        'Item Name': p.name,
        'Category': p.category,
        'Unit of Measure': p.unit || 'Each',
        'Package Tag': p.metrcTag || '',
        'Quantity': p.caseSize || 1,
        'Note': p.description
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, `metrc_ready_${Date.now()}.csv`);
};
