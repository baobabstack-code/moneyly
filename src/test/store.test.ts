import { useApplicationStore } from '../lib/store';

describe('useApplicationStore', () => {
  beforeEach(() => {
    useApplicationStore.getState().resetStore();
  });

  it('has correct initial state', () => {
    const state = useApplicationStore.getState();
    expect(state.purchaseDetails.productName).toBe('');
    expect(state.purchaseDetails.plannedCost).toBe('');
    expect(state.purchaseDetails.savedAmount).toBe('');
    expect(state.purchaseDetails.tenureMonths).toBe('');
    expect(state.purchaseDetails.storeName).toBe('');
    expect(state.fileUrl).toBe('');
  });

  it('setPurchaseDetails updates purchase details and storeName', () => {
    const { setPurchaseDetails } = useApplicationStore.getState();
    setPurchaseDetails({ productName: 'Smart TV', plannedCost: '800.00', storeName: 'Test Store' });
    
    const state = useApplicationStore.getState();
    expect(state.purchaseDetails.productName).toBe('Smart TV');
    expect(state.purchaseDetails.plannedCost).toBe('800.00');
    expect(state.purchaseDetails.storeName).toBe('Test Store');
  });

  it('setFileUrl updates document file url', () => {
    const { setFileUrl } = useApplicationStore.getState();
    setFileUrl('https://example.com/receipt.png');
    
    const state = useApplicationStore.getState();
    expect(state.fileUrl).toBe('https://example.com/receipt.png');
  });

  it('resetStore resets all state', () => {
    const { setPurchaseDetails, setFileUrl, resetStore } = useApplicationStore.getState();
    
    setPurchaseDetails({ productName: 'Laptop', storeName: 'Test Store' });
    setFileUrl('https://example.com/file.pdf');
    
    resetStore();
    
    const state = useApplicationStore.getState();
    expect(state.purchaseDetails.productName).toBe('');
    expect(state.purchaseDetails.storeName).toBe('');
    expect(state.fileUrl).toBe('');
  });

  it('addNotification adds notification', () => {
    const { addNotification } = useApplicationStore.getState();
    addNotification('Test message', 'success');
    
    const state = useApplicationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].message).toBe('Test message');
    expect(state.notifications[0].type).toBe('success');
  });

  it('setLastReference updates reference', () => {
    const { setLastReference } = useApplicationStore.getState();
    setLastReference('PLN-1234');
    
    const state = useApplicationStore.getState();
    expect(state.lastReference).toBe('PLN-1234');
  });
});
