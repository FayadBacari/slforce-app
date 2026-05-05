import { useState, useEffect, useCallback } from 'react';
import { paymentsRepository } from '../../data/repositories/payments.repository';
import type { SentPaymentEntity } from '../../domain/entities/payment.entity';

// All the state needed by the PaymentHistoryPage (athlete screen).
export function usePaymentHistory() {
  const [payments,   setPayments]   = useState<SentPaymentEntity[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPayments = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await paymentsRepository.getPaymentHistory();
      // Ignore stale responses if the component unmounted
      if (signal?.aborted) return;
      setPayments(data);
    } catch {
      if (signal?.aborted) return;
      setErrorMessage("Impossible de charger l'historique des paiements.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadPayments(controller.signal);
    return () => controller.abort();
  }, [loadPayments]);

  // Stat helpers — computed from the loaded list (no extra API call)
  const completedPayments = payments.filter((p) => p.status === 'completed');

  const totalSpent = completedPayments.reduce((sum, p) => sum + p.amountInEuros, 0);

  const thisMonthSpent = (() => {
    const now   = new Date();
    const month = now.getMonth();
    const year  = now.getFullYear();
    return completedPayments.reduce((sum, p) => {
      return p.date.getMonth() === month && p.date.getFullYear() === year
        ? sum + p.amountInEuros
        : sum;
    }, 0);
  })();

  // Only show completed and failed payments — hide pending/cancelled noise
  const displayedPayments = payments.filter(
    (p) => p.status === 'completed' || p.status === 'failed',
  );

  return {
    displayedPayments,
    totalSpent,
    thisMonthSpent,
    isLoading,
    errorMessage,
    reload: () => void loadPayments(),
  };
}
