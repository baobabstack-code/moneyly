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

  it('updates profile preferences correctly', async () => {
    const { updateProfilePreferences } = useApplicationStore.getState();
    await updateProfilePreferences({
      starting_balance: 5000,
      currency: 'EUR',
      accent_color: 'purple',
      onboarded: true
    });

    const state = useApplicationStore.getState();
    expect(state.startingBalance).toBe(5000);
    expect(state.currency).toBe('EUR');
    expect(state.accentColor).toBe('purple');
    expect(state.onboarded).toBe(true);
  });

  it('manages transactions locally', async () => {
    const { addTransactionLocal, updateTransactionLocal, deleteTransactionLocal } = useApplicationStore.getState();
    
    // Add transaction
    await addTransactionLocal({
      id: 'tx-1',
      user_id: 'user-123',
      amount: 150.50,
      type: 'expense',
      category_name: 'Food & Dining',
      note: 'Dinner',
      date: '2026-06-14T12:00:00Z'
    }, true); // skipSync = true to avoid remote call

    let state = useApplicationStore.getState();
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].amount).toBe(150.50);
    expect(state.transactions[0].note).toBe('Dinner');

    // Update transaction
    await updateTransactionLocal('tx-1', { amount: 120.00, note: 'Dinner discount' }, true);
    state = useApplicationStore.getState();
    expect(state.transactions[0].amount).toBe(120.00);
    expect(state.transactions[0].note).toBe('Dinner discount');

    // Delete transaction
    await deleteTransactionLocal('tx-1', true);
    state = useApplicationStore.getState();
    expect(state.transactions).toHaveLength(0);
  });

  it('manages categories locally', async () => {
    const { addCategoryLocal } = useApplicationStore.getState();
    await addCategoryLocal({
      id: 101,
      user_id: 'user-123',
      name: 'Coffee',
      emoji: '☕',
      color: '#ff0000',
      type: 'expense'
    }, true);

    const state = useApplicationStore.getState();
    expect(state.categories).toHaveLength(1);
    expect(state.categories[0].name).toBe('Coffee');
    expect(state.categories[0].emoji).toBe('☕');
  });
});
