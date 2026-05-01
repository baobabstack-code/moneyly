import autoTable from 'jspdf-autotable';
import { generateLoanPDF } from '../utils/pdf-generator';

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    addImage: jest.fn(),
    output: jest.fn(() => `data:application/pdf;base64,${'A'.repeat(1200)}`),
  }));
});

jest.mock('jspdf-autotable', () => jest.fn((doc) => {
  doc.lastAutoTable = { finalY: 80 };
}));

describe('generateLoanPDF', () => {
  it('includes richer employer details in the generated table data', async () => {
    const pdf = await generateLoanPDF({
      employmentDetails: {
        employerName: 'Employer Inc',
        isCivilServant: false,
        phoneNumber: '+263242123456',
        contactPerson: 'Mary Manager',
        emailAddress: 'hr@employer.test',
        physicalAddress: '789 Work Avenue, Harare',
      },
    });

    expect(pdf).toContain('data:application/pdf;base64,');
    expect(autoTable).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      body: expect.arrayContaining([
        ['Employer Phone', '+263242123456'],
        ['Employer Contact', 'Mary Manager'],
        ['Employer Email', 'hr@employer.test'],
        ['Employer Address', '789 Work Avenue, Harare'],
      ]),
    }));
  });
});
