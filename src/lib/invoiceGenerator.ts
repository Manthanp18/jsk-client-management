import { jsPDF } from 'jspdf';

interface InvoiceData {
  clientName: string;
  weekStart: string;
  weekEnd: string;
  weeklyPnl: number;
  commissionPercentage: number;
  commissionAmount: number;
  tradingDays: number;
  vpsCharges?: number;
}

export function generateWeeklyInvoice(data: InvoiceData) {
  const doc = new jsPDF();

  // Set up colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const darkGray: [number, number, number] = [51, 51, 51];
  const lightGray: [number, number, number] = [128, 128, 128];

  // Title
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 220, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TRADING COMMISSION INVOICE', 105, 20, { align: 'center' });

  // Invoice details section
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const today = new Date();
  const invoiceNumber = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;

  doc.text(`Invoice #: ${invoiceNumber}`, 20, 50);
  doc.text(`Invoice Date: ${today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 20, 57);

  // Client Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, 75);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName, 20, 83);

  // Trading Period
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRADING PERIOD:', 20, 100);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const weekStartFormatted = new Date(data.weekStart).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short'
  });
  const weekEndFormatted = new Date(data.weekEnd).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short'
  });
  doc.text(`${weekStartFormatted} to ${weekEndFormatted}`, 20, 108);

  // Table Header
  const tableTop = 125;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, tableTop, 180, 10, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('DESCRIPTION', 20, tableTop + 7);
  doc.text('AMOUNT (USC)', 150, tableTop + 7);

  // Table Content
  let yPos = tableTop + 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Weekly PNL
  doc.text('Weekly Profit/Loss', 20, yPos);
  const pnlColor: [number, number, number] = data.weeklyPnl >= 0 ? [22, 163, 74] : [239, 68, 68];
  doc.setTextColor(pnlColor[0], pnlColor[1], pnlColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.weeklyPnl), 150, yPos);

  // Commission Rate
  yPos += 10;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Commission Rate (${data.commissionPercentage}% of profit)`, 20, yPos);
  doc.text('-', 150, yPos);

  // VPS Charges (if applicable)
  if (data.vpsCharges && data.vpsCharges > 0) {
    yPos += 10;
    doc.text('VPS Charges', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(data.vpsCharges), 150, yPos);
  }

  // Divider line
  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos, 195, yPos);

  // Total Commission (including VPS if applicable)
  yPos += 12;
  const totalAmount = data.commissionAmount + (data.vpsCharges || 0);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(15, yPos - 8, 180, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.vpsCharges && data.vpsCharges > 0 ? 'TOTAL AMOUNT DUE' : 'TOTAL COMMISSION DUE', 20, yPos);
  doc.text(formatCurrency(totalAmount), 150, yPos);

  // Commission Calculation Details
  yPos += 20;
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');

  if (data.weeklyPnl > 0) {
    let calcText = `Commission Calculation: ${formatCurrency(data.weeklyPnl)} x ${data.commissionPercentage}% = ${formatCurrency(data.commissionAmount)}`;
    if (data.vpsCharges && data.vpsCharges > 0) {
      calcText += ` + VPS Charges ${formatCurrency(data.vpsCharges)} = ${formatCurrency(totalAmount)}`;
    }
    doc.text(calcText, 20, yPos);
  } else {
    let calcText = 'No commission applicable as there was no profit this week.';
    if (data.vpsCharges && data.vpsCharges > 0) {
      calcText += ` VPS Charges: ${formatCurrency(data.vpsCharges)}`;
    }
    doc.text(calcText, 20, yPos);
  }

  // Save the PDF
  const fileName = `Invoice_${data.clientName.replace(/\s+/g, '_')}_${data.weekStart}_to_${data.weekEnd}.pdf`;
  doc.save(fileName);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ClientInvoiceData {
  clientName: string;
  weeklyPnl: number;
  commissionPercentage: number;
  commissionAmount: number;
  vpsCharges?: number;
}

interface MultiClientInvoiceData {
  clients: ClientInvoiceData[];
  weekStart: string;
  weekEnd: string;
  invoiceName?: string;
}

export function generateMultiClientInvoice(data: MultiClientInvoiceData) {
  const doc = new jsPDF();

  // Set up colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const darkGray: [number, number, number] = [51, 51, 51];
  const lightGray: [number, number, number] = [128, 128, 128];

  // Title
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 220, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSOLIDATED TRADING INVOICE', 105, 20, { align: 'center' });

  // Invoice details section
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const today = new Date();
  const invoiceNumber = `MULTI-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;

  doc.text(`Invoice #: ${invoiceNumber}`, 20, 50);
  doc.text(`Invoice Date: ${today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 20, 57);

  // Trading Period
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRADING PERIOD:', 20, 75);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const weekStartFormatted = new Date(data.weekStart).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short'
  });
  const weekEndFormatted = new Date(data.weekEnd).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short'
  });
  doc.text(`${weekStartFormatted} to ${weekEndFormatted}`, 20, 83);

  // Table Header
  const tableTop = 95;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, tableTop, 180, 10, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('CLIENT', 20, tableTop + 7);
  doc.text('PROFIT', 75, tableTop + 7);
  doc.text('COMM %', 105, tableTop + 7);
  doc.text('COMMISSION', 130, tableTop + 7);
  doc.text('VPS', 162, tableTop + 7);
  doc.text('TOTAL', 180, tableTop + 7, { align: 'right' });

  // Table Content - Client Rows
  let yPos = tableTop + 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  let grandTotalCommission = 0;
  let grandTotalVps = 0;

  data.clients.forEach((client, index) => {
    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(15, yPos - 5, 180, 10, 'F');
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    // Client Name (truncate if too long)
    const clientName = client.clientName.length > 15
      ? client.clientName.substring(0, 15) + '...'
      : client.clientName;
    doc.text(clientName, 20, yPos);

    // Profit with color
    const pnlColor: [number, number, number] = client.weeklyPnl >= 0 ? [22, 163, 74] : [239, 68, 68];
    doc.setTextColor(pnlColor[0], pnlColor[1], pnlColor[2]);
    doc.text(formatCurrency(client.weeklyPnl), 75, yPos);

    // Commission %
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`${client.commissionPercentage}%`, 105, yPos);

    // Commission Amount
    doc.text(formatCurrency(client.commissionAmount), 130, yPos);

    // VPS Charges
    const vps = client.vpsCharges || 0;
    doc.text(vps > 0 ? formatCurrency(vps) : '-', 162, yPos);

    // Total for this client
    const clientTotal = client.commissionAmount + vps;
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(clientTotal), 180, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    grandTotalCommission += client.commissionAmount;
    grandTotalVps += vps;

    yPos += 10;
  });

  // Subtotals section
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos, 195, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Subtotals:', 20, yPos);

  doc.setFont('helvetica', 'normal');
  doc.text(`Commission: ${formatCurrency(grandTotalCommission)}`, 75, yPos);
  if (grandTotalVps > 0) {
    doc.text(`VPS: ${formatCurrency(grandTotalVps)}`, 130, yPos);
  }

  // Grand Total
  yPos += 10;
  const grandTotal = grandTotalCommission + grandTotalVps;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(15, yPos - 6, 180, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL AMOUNT DUE', 20, yPos);
  doc.text(formatCurrency(grandTotal) + ' USC', 180, yPos, { align: 'right' });

  // Summary note
  yPos += 18;
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`This consolidated invoice covers ${data.clients.length} client(s) for the trading period.`, 20, yPos);

  // Save the PDF
  let fileName: string;

  // If custom invoice name is provided (for multiple clients), use it
  if (data.invoiceName && data.clients.length > 1) {
    const customName = data.invoiceName.replace(/\s+/g, '_');
    fileName = `Invoice_${customName}_${data.weekStart}_to_${data.weekEnd}.pdf`;
  } else if (data.clients.length === 1) {
    // Single client: Invoice_ClientName_Date.pdf
    const clientName = data.clients[0].clientName.replace(/\s+/g, '_');
    fileName = `Invoice_${clientName}_${data.weekStart}_to_${data.weekEnd}.pdf`;
  } else if (data.clients.length <= 3) {
    // Multiple clients (up to 3): Include all names
    const clientNames = data.clients
      .map(c => c.clientName.replace(/\s+/g, '_'))
      .join('_');
    fileName = `Invoice_${clientNames}_${data.weekStart}_to_${data.weekEnd}.pdf`;
  } else {
    // Many clients: Use "MultipleClients" with count
    fileName = `Invoice_${data.clients.length}Clients_${data.weekStart}_to_${data.weekEnd}.pdf`;
  }

  doc.save(fileName);
}
