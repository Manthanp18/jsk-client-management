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
