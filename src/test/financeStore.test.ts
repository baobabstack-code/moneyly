import { useFinanceStore } from '../lib/financeStore';

describe('useFinanceStore', () => {
  beforeEach(() => {
    useFinanceStore.getState().resetStore();
  });

  it('has correct initial state', () => {
    const state = useFinanceStore.getState();
    expect(state.purchaseDetails.productName).toBe('');
    expect(state.purchaseDetails.plannedCost).toBe('');
    expect(state.purchaseDetails.savedAmount).toBe('');
    expect(state.purchaseDetails.tenureMonths).toBe('');
    expect(state.fileUrl).toBe('');
  });

  it('setPurchaseDetails updates purchase details', () => {
    const { setPurchaseDetails } = useFinanceStore.getState();
    setPurchaseDetails({ productName: 'Smart TV', plannedCost: '800.00' });
    
    const state = useFinanceStore.getState();
    expect(state.purchaseDetails.productName).toBe('Smart TV');
    expect(state.purchaseDetails.plannedCost).toBe('800.00');
  });

  it('setFileUrl updates document file url', () => {
    const { setFileUrl } = useFinanceStore.getState();
    setFileUrl('https://example.com/receipt.png');
    
    const state = useFinanceStore.getState();
    expect(state.fileUrl).toBe('https://example.com/receipt.png');
  });

  it('resetStore resets all state', () => {
    const { setPurchaseDetails, setFileUrl, resetStore } = useFinanceStore.getState();
    
    setPurchaseDetails({ productName: 'Laptop' });
    setFileUrl('https://example.com/file.pdf');
    
    resetStore();
    
    const state = useFinanceStore.getState();
    expect(state.purchaseDetails.productName).toBe('');
    expect(state.fileUrl).toBe('');
  });

  it('addNotification adds notification', () => {
    const { addNotification } = useFinanceStore.getState();
    addNotification('Test message', 'success');
    
    const state = useFinanceStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].message).toBe('Test message');
    expect(state.notifications[0].type).toBe('success');
  });

  it('setLastReference updates reference', () => {
    const { setLastReference } = useFinanceStore.getState();
    setLastReference('PLN-1234');
    
    const state = useFinanceStore.getState();
    expect(state.lastReference).toBe('PLN-1234');
  });

  it('updates profile preferences correctly', async () => {
    const { updateProfilePreferences } = useFinanceStore.getState();
    await updateProfilePreferences({
      starting_balance: 5000,
      currency: 'EUR',
      accent_color: 'purple',
      onboarded: true
    });

    const state = useFinanceStore.getState();
    expect(state.startingBalance).toBe(5000);
    expect(state.currency).toBe('EUR');
    expect(state.accentColor).toBe('purple');
    expect(state.onboarded).toBe(true);
  });

  it('manages transactions locally', async () => {
    const { addTransactionLocal, updateTransactionLocal, deleteTransactionLocal } = useFinanceStore.getState();
    
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

    let state = useFinanceStore.getState();
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].amount).toBe(150.50);
    expect(state.transactions[0].note).toBe('Dinner');

    // Update transaction
    await updateTransactionLocal('tx-1', { amount: 120.00, note: 'Dinner discount' }, true);
    state = useFinanceStore.getState();
    expect(state.transactions[0].amount).toBe(120.00);
    expect(state.transactions[0].note).toBe('Dinner discount');

    // Delete transaction
    await deleteTransactionLocal('tx-1', true);
    state = useFinanceStore.getState();
    expect(state.transactions).toHaveLength(0);
  });

  it('manages accounts and adjusts balances based on account types (including credit card debt)', async () => {
    const { addAccountLocal, addTransactionLocal, updateTransactionLocal, deleteTransactionLocal } = useFinanceStore.getState();

    // 1. Setup Checking and Credit Card accounts
    await addAccountLocal({
      id: 'acc-checking',
      user_id: 'user-123',
      name: 'Checking Account',
      type: 'checking',
      balance: 1000,
      color: 'blue'
    }, true);

    await addAccountLocal({
      id: 'acc-credit',
      user_id: 'user-123',
      name: 'Credit Card',
      type: 'credit',
      balance: 500, // what is owed
      color: 'red'
    }, true);

    let state = useFinanceStore.getState();
    expect(state.accounts).toHaveLength(2);
    expect(state.accounts.find(a => a.id === 'acc-checking')?.balance).toBe(1000);
    expect(state.accounts.find(a => a.id === 'acc-credit')?.balance).toBe(500);

    // 2. Add an expense to Checking Account -> should decrease balance
    await addTransactionLocal({
      id: 'tx-check-exp',
      user_id: 'user-123',
      amount: 150,
      type: 'expense',
      account_id: 'acc-checking',
      date: '2026-06-14T12:00:00Z'
    }, true);

    state = useFinanceStore.getState();
    expect(state.accounts.find(a => a.id === 'acc-checking')?.balance).toBe(850);

    // 3. Add an expense to Credit Card -> should increase debt balance
    await addTransactionLocal({
      id: 'tx-credit-exp',
      user_id: 'user-123',
      amount: 200,
      type: 'expense',
      account_id: 'acc-credit',
      date: '2026-06-14T12:00:00Z'
    }, true);

    state = useFinanceStore.getState();
    expect(state.accounts.find(a => a.id === 'acc-credit')?.balance).toBe(700);

    // 4. Add savings (payment) to Credit Card -> should decrease debt balance
    await addTransactionLocal({
      id: 'tx-credit-pay',
      user_id: 'user-123',
      amount: 100,
      type: 'savings',
      account_id: 'acc-credit',
      date: '2026-06-14T12:00:00Z'
    }, true);

    state = useFinanceStore.getState();
    expect(state.accounts.find(a => a.id === 'acc-credit')?.balance).toBe(600);

    // 5. Update Credit Card transaction (change amount of expense from 200 to 250)
    await updateTransactionLocal('tx-credit-exp', { amount: 250 }, true);
    state = useFinanceStore.getState();
    expect(state.accounts.find(a => a.id === 'acc-credit')?.balance).toBe(650);

    // 6. Delete checking expense -> should revert checking balance to 1000
    await deleteTransactionLocal('tx-check-exp', true);
    state = useFinanceStore.getState();
    expect(state.accounts.find(a => a.id === 'acc-checking')?.balance).toBe(1000);

    // 7. Delete Credit Card payment -> should revert credit balance to 750
    await deleteTransactionLocal('tx-credit-pay', true);
    state = useFinanceStore.getState();
    expect(state.accounts.find(a => a.id === 'acc-credit')?.balance).toBe(750);
  });

  it('manages categories locally', async () => {
    const { addCategoryLocal } = useFinanceStore.getState();
    await addCategoryLocal({
      id: 101,
      user_id: 'user-123',
      name: 'Coffee',
      emoji: '☕',
      color: '#ff0000',
      type: 'expense'
    }, true);

    const state = useFinanceStore.getState();
    expect(state.categories).toHaveLength(1);
    expect(state.categories[0].name).toBe('Coffee');
    expect(state.categories[0].emoji).toBe('☕');
  });

  it('triggers notifications and confetti on proper actions', async () => {
    const { addTransactionLocal, updateTransactionLocal, deleteTransactionLocal, removeNotification } = useFinanceStore.getState();

    // Verify initial trigger is 0
    expect(useFinanceStore.getState().confettiTrigger).toBe(0);
    
    // Add transaction should trigger notification & confetti
    await addTransactionLocal({
      id: 'tx-test',
      user_id: 'user-123',
      amount: 100,
      type: 'savings',
      date: '2026-06-14T12:00:00Z'
    }, true);

    let state = useFinanceStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].message).toContain('SAVINGS: logged 100');
    expect(state.confettiTrigger).toBe(1);

    // Update transaction should trigger notification
    await updateTransactionLocal('tx-test', { amount: 120 }, true);
    state = useFinanceStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.notifications[1].message).toBe('Transaction updated.');

    // Remove notification
    const notificationId = state.notifications[0].id;
    removeNotification(notificationId);
    state = useFinanceStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].message).toBe('Transaction updated.');

    // Delete transaction should trigger notification
    await deleteTransactionLocal('tx-test', true);
    state = useFinanceStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.notifications[1].message).toBe('Transaction deleted.');
  });
});
