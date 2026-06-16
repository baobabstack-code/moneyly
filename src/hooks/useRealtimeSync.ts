import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useFinanceStore, Transaction } from '@/lib/financeStore';

export function useRealtimeSync(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    if (!supabase) return;

    // Listen to changes on the transactions table
    const transactionsSubscription = supabase
      .channel('public:transactions')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transactions'
        },
        async (payload: any) => {
          const { setTransactions, transactions } = useFinanceStore.getState();
          
          if (payload.eventType === 'INSERT') {
            const newTx = payload.new as Transaction;
            // Only add if we don't already have it (prevent duplicates from our own local inserts)
            if (!transactions.some(t => t.id === newTx.id)) {
              setTransactions([newTx, ...transactions]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTx = payload.new as Transaction;
            setTransactions(transactions.map(t => t.id === updatedTx.id ? updatedTx : t));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTransactions(transactions.filter(t => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Listen to changes on the accounts table
    const accountsSubscription = supabase
      .channel('public:accounts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts'
        },
        async (payload: any) => {
          const { setAccounts, accounts } = useFinanceStore.getState();
          
          if (payload.eventType === 'INSERT') {
            const newAcc = payload.new as any;
            if (!accounts.some(a => a.id === newAcc.id)) {
              setAccounts([...accounts, newAcc]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedAcc = payload.new as any;
            setAccounts(accounts.map(a => a.id === updatedAcc.id ? updatedAcc : a));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setAccounts(accounts.filter(a => a.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsSubscription);
      supabase.removeChannel(accountsSubscription);
    };
  }, [userId]);
}
