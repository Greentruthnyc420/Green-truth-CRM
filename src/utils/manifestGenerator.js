import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export const generateManifestPDF = async (order, shipmentDetails) => {
  const doc = new jsPDF();

  // 1. Header
  doc.setFontSize(22);
  doc.text('Shipping Manifest', 105, 20, { align: 'center' });

  // 2. Shipper and Receiver Details
  doc.setFontSize(12);
  doc.text('Shipper (Processor):', 20, 40);
  doc.text(shipmentDetails.shipper.name, 20, 45);
  doc.text(shipmentDetails.shipper.address, 20, 50);
  doc.text(shipmentDetails.shipper.license, 20, 55);

  doc.text('Receiver (Dispensary):', 120, 40);
  doc.text(order.dispensary.name, 120, 45);
  doc.text(order.dispensary.address, 120, 50);
  doc.text(order.dispensary.license, 120, 55);

  // 3. Transport Details
  doc.text('Transport Details:', 20, 75);
  doc.text(`Driver Name: ${shipmentDetails.driver.name}`, 20, 80);
  doc.text(`Vehicle Plate: ${shipmentDetails.driver.vehiclePlate}`, 20, 85);
  doc.text(`Planned Route: ${shipmentDetails.route}`, 20, 90);

  // 4. Table of Items
  const tableColumn = ["Product Name", "Batch #", "Quantity", "Weight"];
  const tableRows = [];

  order.items.forEach(item => {
    const itemData = [
      item.name,
      item.batch,
      item.quantity,
      `${item.weight}g`
    ];
    tableRows.push(itemData);
  });

  doc.autoTable(tableColumn, tableRows, { startY: 100 });

  // 5. Signature Lines
  doc.text('Shipper Signature:', 20, doc.autoTable.previous.finalY + 20);
  doc.line(60, doc.autoTable.previous.finalY + 20, 120, doc.autoTable.previous.finalY + 20);

  doc.text('Driver Signature:', 20, doc.autoTable.previous.finalY + 40);
  doc.line(60, doc.autoTable.previous.finalY + 40, 120, doc.autoTable.previous.finalY + 40);

  doc.text('Receiver Signature:', 20, doc.autoTable.previous.finalY + 60);
  doc.line(60, doc.autoTable.previous.finalY + 60, 120, doc.autoTable.previous.finalY + 60);

  // 6. QR Code
  const qrCodeData = await QRCode.toDataURL('https://example.com/coa-folder');
  doc.addImage(qrCodeData, 'JPEG', 150, doc.autoTable.previous.finalY + 20, 40, 40);


  doc.save(`manifest_${order.id}.pdf`);
};
