import autoTable from 'jspdf-autotable';
import { generatePlanPDF } from '../utils/pdf-generator';

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

describe('generatePlanPDF', () => {
  it('includes spending plan details in the generated table data', async () => {
    const pdf = await generatePlanPDF({
      customerName: 'John Doe',
      purchaseDetails: {
        productName: 'Smart TV',
        plannedCost: '500.00',
        savedAmount: '200.00',
        tenureMonths: '6',
      },
    });

    expect(pdf).toContain('data:application/pdf;base64,');
    expect(autoTable).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      body: expect.arrayContaining([
        ['Planned Item', 'Smart TV'],
        ['Planned Cost', '$500.00'],
        ['Saved Amount', '$200.00'],
        ['Cash Needed', '$300.00'],
        ['Plan Length', '6 months'],
        ['Estimated Monthly Commitment', '$50.00'],
      ]),
    }));
  });
});
