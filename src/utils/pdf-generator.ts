import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * PDF GENERATOR UTILITY
 * 
 * Generates a professional loan application summary PDF.
 */

type LoanPdfData = {
  lookup?: { nationalId?: string };
  basicInfo?: { firstName?: string; lastName?: string; dateOfBirth?: string; gender?: string; photoUrl?: string };
  contactDetails?: { mobileNumber?: string; emailAddress?: string; physicalAddress?: string };
  purchaseDetails?: { productName?: string; retailPrice?: string; depositAmount?: string; tenureMonths?: string };
  employmentDetails?: {
    employerName?: string;
    isCivilServant?: boolean | null;
    ministry?: string;
    employerNo?: string;
    phoneNumber?: string;
    contactPerson?: string;
    emailAddress?: string;
    physicalAddress?: string;
  };
  nextOfKin?: { fullName?: string; relationship?: string; mobileNumber?: string; address?: string };
  documentUploads?: { idCopyUrl?: string; payslipUrl?: string };
  selectedStoreName?: string;
  lastReference?: string;
};

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

export async function generateLoanPDF(data: LoanPdfData) {
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
  doc.text('HTB GLOBAL', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Institutional Lending Platform - Application Summary', 15, 30);
  
  // Photo thumbnail — right side of header, fully within the 40px band
  if (data.basicInfo?.photoUrl) {
    try {
      const imgSize = 30;
      const imgX = pageWidth - imgSize - 8;
      const imgY = 5;
      doc.addImage(data.basicInfo.photoUrl, 'JPEG', imgX, imgY, imgSize, imgSize);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.rect(imgX, imgY, imgSize, imgSize);
    } catch (e) {
      console.warn("Could not add photo to PDF", e);
    }
  }

  // Reference number — left of the photo
  const imgReserve = 48; // space reserved for photo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ref: ${data.lastReference || 'LN-' + (Math.floor(Math.random() * 900000) + 100000)}`, pageWidth - imgReserve - 50, 25, { align: 'right' });

  let currentY = 50;

  // Sections
  const sections = [
    { title: 'Personal Information', rows: [
      ['Full Name', `${data.basicInfo?.firstName || 'N/A'} ${data.basicInfo?.lastName || 'N/A'}`.trim() || 'N/A'],
      ['Date of Birth', data.basicInfo?.dateOfBirth || 'N/A'],
      ['Gender', data.basicInfo?.gender || 'N/A'],
      ['National ID', data.lookup?.nationalId || 'N/A']
    ]},
    { title: 'Contact Details', rows: [
      ['Mobile Number', data.contactDetails?.mobileNumber || 'N/A'],
      ['Email Address', data.contactDetails?.emailAddress || 'N/A'],
      ['Physical Address', data.contactDetails?.physicalAddress || 'N/A']
    ]},
    { title: 'Purchase Details', rows: [
      ['Product', data.purchaseDetails?.productName || 'N/A'],
      ['Retail Price', data.purchaseDetails?.retailPrice ? `$${data.purchaseDetails.retailPrice}` : 'N/A'],
      ['Deposit', data.purchaseDetails?.depositAmount ? `$${data.purchaseDetails.depositAmount}` : 'N/A'],
      ['Loan Amount', (data.purchaseDetails?.retailPrice && data.purchaseDetails?.depositAmount) ? `$${(parseFloat(data.purchaseDetails.retailPrice) - parseFloat(data.purchaseDetails.depositAmount)).toFixed(2)}` : 'N/A'],
      ['Tenure (months)', data.purchaseDetails?.tenureMonths || 'N/A'],
      ...(data.purchaseDetails?.tenureMonths && data.purchaseDetails?.retailPrice && data.purchaseDetails?.depositAmount && parseFloat(data.purchaseDetails.retailPrice) > parseFloat(data.purchaseDetails.depositAmount) ? [
        ['Monthly Installment', `$${((parseFloat(data.purchaseDetails.retailPrice) - parseFloat(data.purchaseDetails.depositAmount)) / parseFloat(data.purchaseDetails.tenureMonths)).toFixed(2)}`]
      ] : []),
      ['Store', data.selectedStoreName || 'N/A']
    ]},
    { title: 'Employment Details', rows: [
      ['Employer', data.employmentDetails?.employerName || 'N/A'],
      ['Status', data.employmentDetails?.isCivilServant === true ? 'Civil Servant' : data.employmentDetails?.isCivilServant === false ? 'Private Sector' : 'N/A'],
      ...(data.employmentDetails?.isCivilServant === true ? [
        ['Ministry', data.employmentDetails?.ministry || 'N/A'],
        ['EC Number', data.employmentDetails?.employerNo || 'N/A']
      ] : []),
      ['Employer Phone', data.employmentDetails?.phoneNumber || 'N/A'],
      ['Employer Contact', data.employmentDetails?.contactPerson || 'N/A'],
      ['Employer Email', data.employmentDetails?.emailAddress || 'N/A'],
      ['Employer Address', data.employmentDetails?.physicalAddress || 'N/A']
    ]},
    { title: 'Next of Kin', rows: [
      ['Name', data.nextOfKin?.fullName || 'N/A'],
      ['Relationship', data.nextOfKin?.relationship || 'N/A'],
      ['Phone', data.nextOfKin?.mobileNumber || 'N/A'],
      ['Address', data.nextOfKin?.address || 'N/A']
    ]},
    { title: 'Documents Provided', rows: [
      ['National ID Copy', data.documentUploads?.idCopyUrl ? '✅ Uploaded' : '❌ Missing'],
      ['Latest Payslip', data.documentUploads?.payslipUrl ? '✅ Uploaded' : '❌ Missing']
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
  doc.text('This is an automatically generated document. HTB Global (c) 2026.', 15, doc.internal.pageSize.getHeight() - 10);

  const pdfDataUri = doc.output('datauristring');

  // Validate PDF has content
  if (!pdfDataUri || pdfDataUri.length < 1000) {
    console.error('PDF generation failed - PDF is too small or empty');
    throw new Error('Generated PDF appears to be empty or corrupted');
  }

  console.log('PDF generated successfully, size:', pdfDataUri.length);

  return pdfDataUri;
}
