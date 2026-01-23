// PDF Report Generation Service
// Uses jsPDF for generating PDF reports

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BRAND_COLOR = [16, 185, 129]; // #10b981
const DARK_COLOR = [30, 41, 59]; // #1e293b
const LIGHT_COLOR = [100, 116, 139]; // #64748b

/**
 * Generate Sales Report PDF
 */
export function generateSalesReport(data, options = {}) {
    const doc = new jsPDF();
    const { title = 'Sales Report', dateRange = '', repName = '' } = options;

    // Header
    doc.setFillColor(...DARK_COLOR);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('GreenTruth NYC', 20, 20);

    doc.setFontSize(14);
    doc.text(title, 20, 32);

    // Meta info
    doc.setTextColor(...LIGHT_COLOR);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 20);
    if (dateRange) doc.text(dateRange, 150, 28);
    if (repName) doc.text(`Rep: ${repName}`, 150, 36);

    // Summary stats
    const stats = calculateStats(data);
    doc.setTextColor(...DARK_COLOR);
    doc.setFontSize(12);

    const statsY = 55;
    doc.setFillColor(240, 253, 244);
    doc.rect(15, statsY - 5, 180, 25, 'F');

    doc.text(`Total Sales: ${stats.count}`, 25, statsY + 5);
    doc.text(`Revenue: $${stats.revenue.toLocaleString()}`, 85, statsY + 5);
    doc.text(`Avg Order: $${stats.avgOrder.toFixed(2)}`, 145, statsY + 5);

    // Sales table
    const tableData = data.map(sale => [
        sale.date || 'N/A',
        sale.dispensaryName || 'Unknown',
        sale.brandName || 'Multiple',
        `$${parseFloat(sale.totalAmount || sale.amount || 0).toFixed(2)}`,
        sale.status || 'completed'
    ]);

    doc.autoTable({
        startY: statsY + 30,
        head: [['Date', 'Dispensary', 'Brand', 'Amount', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: BRAND_COLOR,
            textColor: [255, 255, 255]
        },
        styles: { fontSize: 9 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...LIGHT_COLOR);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('GreenTruth NYC - Confidential', 20, 290);
    }

    return doc;
}

/**
 * Generate Invoice PDF
 */
export function generateInvoicePDF(invoice) {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(...DARK_COLOR);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text('INVOICE', 20, 25);

    doc.setFontSize(12);
    doc.text(`#${invoice.invoiceNumber || 'N/A'}`, 20, 38);
    doc.text(`Date: ${invoice.date || new Date().toLocaleDateString()}`, 150, 25);
    doc.text(`Due: ${invoice.dueDate || 'Upon Receipt'}`, 150, 35);

    // Bill To
    doc.setTextColor(...DARK_COLOR);
    doc.setFontSize(11);
    doc.text('Bill To:', 20, 60);
    doc.setFontSize(10);
    doc.text(invoice.billTo || 'N/A', 20, 68);
    if (invoice.billToAddress) doc.text(invoice.billToAddress, 20, 75);

    // From
    doc.text('From:', 120, 60);
    doc.text('GreenTruth NYC', 120, 68);
    doc.text('sales@thegreentruth.net', 120, 75);

    // Line items
    const items = invoice.items || [];
    const tableData = items.map(item => [
        item.description || item.name || 'Item',
        item.quantity || 1,
        `$${parseFloat(item.price || 0).toFixed(2)}`,
        `$${((item.quantity || 1) * (item.price || 0)).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 95,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: BRAND_COLOR,
            textColor: [255, 255, 255]
        }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);

    const subtotal = items.reduce((sum, i) => sum + (i.quantity || 1) * (i.price || 0), 0);
    const tax = invoice.tax || 0;
    const total = subtotal + tax;

    doc.text(`Subtotal:`, 130, finalY);
    doc.text(`$${subtotal.toFixed(2)}`, 175, finalY, { align: 'right' });

    if (tax > 0) {
        doc.text(`Tax:`, 130, finalY + 8);
        doc.text(`$${tax.toFixed(2)}`, 175, finalY + 8, { align: 'right' });
    }

    doc.setFontSize(14);
    doc.setTextColor(...BRAND_COLOR);
    doc.text(`Total: $${total.toFixed(2)}`, 175, finalY + 20, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT_COLOR);
    doc.text('Thank you for your business!', 105, 270, { align: 'center' });
    doc.text('GreenTruth NYC', 105, 280, { align: 'center' });

    return doc;
}

/**
 * Generate Activation Summary PDF
 */
export function generateActivationReport(activations, options = {}) {
    const doc = new jsPDF();
    const { title = 'Activation Report', repName = '' } = options;

    // Header
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(title, 20, 22);

    doc.setFontSize(10);
    if (repName) doc.text(`Rep: ${repName}`, 150, 15);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 25);

    // Table
    const tableData = activations.map(act => [
        act.date || 'TBD',
        act.dispensaryName || 'Unknown',
        act.timeSlot || 'TBD',
        act.brandName || 'Multiple',
        act.status || 'scheduled'
    ]);

    doc.autoTable({
        startY: 45,
        head: [['Date', 'Dispensary', 'Time', 'Brand', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: DARK_COLOR,
            textColor: [255, 255, 255]
        }
    });

    return doc;
}

/**
 * Download PDF with given filename
 */
export function downloadPDF(doc, filename) {
    doc.save(filename);
}

/**
 * Get PDF as blob (for email attachments, etc.)
 */
export function getPDFBlob(doc) {
    return doc.output('blob');
}

// Helper function
function calculateStats(sales) {
    const count = sales.length;
    const revenue = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount || s.amount || 0), 0);
    const avgOrder = count > 0 ? revenue / count : 0;
    return { count, revenue, avgOrder };
}
