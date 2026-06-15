import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * PDF GENERATOR UTILITY
 * 
 * Generates a professional spending plan summary PDF.
 */

type PlanPdfData = {
  purchaseDetails?: {
    productName?: string;
    plannedCost?: string;
    savedAmount?: string;
    tenureMonths?: string;
  };
  lastReference?: string;
  fileUrl?: string | null;
  customerName?: string;
  currency?: string;
};

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

export async function generatePlanPDF(data: PlanPdfData) {
  // Validate input data
  if (!data) {
    throw new Error('No data provided to PDF generator');
  }

  console.log('PDF Generation - Input data:', data);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42); // Slate 900 (Primary)
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Moneyly', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Personal Money Manager - Spending Plan Summary', 15, 30);
  
  // Reference number
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ref: ${data.lastReference || 'PLN-' + (Math.floor(Math.random() * 900000) + 100000)}`, pageWidth - 15, 25, { align: 'right' });

  let currentY = 55;

  const plannedCostVal = parseFloat(data.purchaseDetails?.plannedCost || '0') || 0;
  const savedAmountVal = parseFloat(data.purchaseDetails?.savedAmount || '0') || 0;
  const cashNeededVal = Math.max(0, plannedCostVal - savedAmountVal);
  const tenureMonthsVal = parseInt(data.purchaseDetails?.tenureMonths || '12') || 12;
  const monthlyCommitVal = tenureMonthsVal > 0 ? cashNeededVal / tenureMonthsVal : 0;

  const currencySymbol = (() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$' };
    return map[data.currency || 'USD'] || '$';
  })();

  // Sections
  const sections = [
    { title: 'User Details', rows: [
      ['Customer Name', data.customerName || 'N/A'],
    ]},
    { title: 'Spending Plan Details', rows: [
      ['Planned Item', data.purchaseDetails?.productName || 'N/A'],
      ['Planned Cost', `${currencySymbol}${plannedCostVal.toFixed(2)}`],
      ['Saved Amount', `${currencySymbol}${savedAmountVal.toFixed(2)}`],
      ['Cash Needed', `${currencySymbol}${cashNeededVal.toFixed(2)}`],
      ['Plan Length', `${tenureMonthsVal} months`],
      ['Estimated Monthly Commitment', `${currencySymbol}${monthlyCommitVal.toFixed(2)}`],
    ]},
    { title: 'Supporting Documents', rows: [
      ['Receipt / Invoice', data.fileUrl ? 'Attached' : 'None'],
    ]}
  ];

  sections.forEach((section) => {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 15, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Field', 'Value']],
      body: section.rows,
      theme: 'striped',
      headStyles: { fillColor: [0, 81, 213] }, // Secondary Blue
      margin: { left: 15, right: 15 }
    });
    
    currentY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY
      ? (doc as JsPdfWithAutoTable).lastAutoTable!.finalY + 15
      : currentY + 30;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This is an automatically generated document. Moneyly (c) 2026.', 15, doc.internal.pageSize.getHeight() - 10);

  const pdfDataUri = doc.output('datauristring');

  // Validate PDF has content
  if (!pdfDataUri || pdfDataUri.length < 1000) {
    console.error('PDF generation failed - PDF is too small or empty');
    throw new Error('Generated PDF appears to be empty or corrupted');
  }

  console.log('PDF generated successfully, size:', pdfDataUri.length);

  return pdfDataUri;
}

export interface StatementPdfData {
  transactions: Array<{
    date: string;
    note?: string | null;
    category_name?: string | null;
    type: 'expense' | 'income' | 'savings';
    amount: number;
  }>;
  startingBalance: number;
  currency: string;
  customerName?: string;
}

export async function generateStatementPDF(data: StatementPdfData) {
  if (!data) {
    throw new Error('No data provided to PDF generator');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Moneyly', 15, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Personal Money Manager - Financial Statement', 15, 28);
  
  // Date of Generation
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 23, { align: 'right' });

  // Calculate Inflows and Outflows
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = data.transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
  const endingBalance = data.startingBalance + totalIncome - totalExpense;

  const currencySymbol = (() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$' };
    return map[data.currency || 'USD'] || '$';
  })();

  const formatVal = (v: number) => `${v < 0 ? '-' : ''}${currencySymbol}${Math.abs(v).toFixed(2)}`;

  let currentY = 55;

  // Render Metadata block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Statement Summary', 15, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    body: [
      ['Customer Name', data.customerName || 'N/A'],
      ['Starting Balance', formatVal(data.startingBalance)],
      ['Total Income (Inflow)', formatVal(totalIncome)],
      ['Total Expenses (Outflow)', formatVal(totalExpense)],
      ['Total Savings Vault Transferred', formatVal(totalSavings)],
      ['Ending Net Worth Balance', formatVal(endingBalance)],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    margin: { left: 15, right: 15 }
  });

  currentY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY
    ? (doc as JsPdfWithAutoTable).lastAutoTable!.finalY + 15
    : currentY + 45;

  // Transaction Ledger Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction History (Ledger)', 15, currentY);

  const ledgerRows = data.transactions.map((t) => [
    new Date(t.date).toLocaleDateString(),
    t.note || t.category_name || 'Uncategorized',
    t.type.toUpperCase(),
    t.type === 'income' ? `+${formatVal(t.amount)}` : t.type === 'expense' ? `-${formatVal(t.amount)}` : formatVal(t.amount)
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Date', 'Description', 'Type', 'Amount']],
    body: ledgerRows.length > 0 ? ledgerRows : [['-', 'No transactions logged', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 9 }, // Slate 900 header
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 15, right: 15 }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This statement is generated for user reference. Moneyly (c) 2026.', 15, doc.internal.pageSize.getHeight() - 10);

  const pdfDataUri = doc.output('datauristring');
  return pdfDataUri;
}

