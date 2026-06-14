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
    storeName?: string;
  };
  selectedStoreName?: string;
  lastReference?: string;
  fileUrl?: string | null;
  customerName?: string;
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

  // Sections
  const sections = [
    { title: 'User Details', rows: [
      ['Customer Name', data.customerName || 'N/A'],
    ]},
    { title: 'Source Details', rows: [
      ['Source / Store', data.purchaseDetails?.storeName || data.selectedStoreName || 'N/A'],
    ]},
    { title: 'Spending Plan Details', rows: [
      ['Planned Item', data.purchaseDetails?.productName || 'N/A'],
      ['Planned Cost', `$${plannedCostVal.toFixed(2)}`],
      ['Saved Amount', `$${savedAmountVal.toFixed(2)}`],
      ['Cash Needed', `$${cashNeededVal.toFixed(2)}`],
      ['Plan Length', `${tenureMonthsVal} months`],
      ['Estimated Monthly Commitment', `$${monthlyCommitVal.toFixed(2)}`],
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
