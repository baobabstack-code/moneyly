import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * PDF GENERATOR UTILITY
 * 
 * Generates a professional loan application summary PDF.
 */

export async function generateLoanPDF(data: any) {
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
  
  doc.setFontSize(12);
  doc.text(`Reference: ${data.lastReference || 'LN-' + (Math.floor(Math.random() * 900000) + 100000)}`, pageWidth - 70, 25);

  let currentY = 50;

  // Add Selfie if available
  if (data.basicInfo.photoUrl) {
    try {
      // Small thumbnail at the top right
      doc.addImage(data.basicInfo.photoUrl, 'JPEG', pageWidth - 45, 45, 30, 30);
      doc.setDrawColor(0, 81, 213);
      doc.rect(pageWidth - 45, 45, 30, 30);
    } catch (e) {
      console.warn("Could not add selfie to PDF", e);
    }
  }

  // Sections
  const sections = [
    { title: 'Personal Information', rows: [
      ['Full Name', `${data.basicInfo.firstName} ${data.basicInfo.lastName}`],
      ['Date of Birth', data.basicInfo.dateOfBirth],
      ['Gender', data.basicInfo.gender],
      ['National ID', data.lookup.nationalId]
    ]},
    { title: 'Contact Details', rows: [
      ['Mobile Number', data.contactDetails.mobileNumber],
      ['Email Address', data.contactDetails.emailAddress],
      ['Physical Address', data.contactDetails.physicalAddress]
    ]},
    { title: 'Purchase Details', rows: [
      ['Product', data.purchaseDetails.productName],
      ['Retail Price', `$${data.purchaseDetails.retailPrice}`],
      ['Deposit', `$${data.purchaseDetails.depositAmount}`],
      ['Loan Amount', `$${(parseFloat(data.purchaseDetails.retailPrice) - parseFloat(data.purchaseDetails.depositAmount)).toFixed(2)}`],
      ['Store', data.selectedStoreName]
    ]},
    { title: 'Employment Details', rows: [
      ['Employer', data.employmentDetails.employerName],
      ['Status', data.employmentDetails.isCivilServant ? 'Civil Servant' : 'Private Sector'],
      ...(data.employmentDetails.isCivilServant ? [
        ['Ministry', data.employmentDetails.ministry],
        ['EC Number', data.employmentDetails.employerNo]
      ] : []),
      ['Employer Phone', data.employmentDetails.phoneNumber]
    ]},
    { title: 'Next of Kin', rows: [
      ['Name', data.nextOfKin.fullName],
      ['Relationship', data.nextOfKin.relationship],
      ['Phone', data.nextOfKin.mobileNumber],
      ['Address', data.nextOfKin.address]
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
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This is an automatically generated document. HTB Global (c) 2026.', 15, doc.internal.pageSize.getHeight() - 10);

  return doc.output('datauristring');
}
