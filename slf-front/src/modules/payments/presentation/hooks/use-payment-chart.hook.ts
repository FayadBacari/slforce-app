import { useState, useEffect, useCallback, useMemo } from 'react';
import { paymentsRepository } from '../../data/repositories/payments.repository';
import type {
  ReceivedPaymentEntity,
  MonthlyRevenueEntity,
  CoachEarningsEntity,
} from '../../domain/entities/payment.entity';

export interface PaymentChartData {
  labels:   string[];
  datasets: [{ data: number[] }];
}

// All the state needed by the PaymentChartPage (coach screen).
export function usePaymentChart() {
  const [earnings,      setEarnings]      = useState<CoachEarningsEntity | null>(null);
  const [monthlyData,   setMonthlyData]   = useState<MonthlyRevenueEntity[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [errorMessage,  setErrorMessage]  = useState<string | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Both requests fire in parallel — no reason to wait for one before the other
      const [earningsData, chartData] = await Promise.all([
        paymentsRepository.getCoachEarnings(),
        paymentsRepository.getMonthlyChartData(),
      ]);
      if (signal?.aborted) return;
      setEarnings(earningsData);
      setMonthlyData(chartData);
    } catch {
      if (signal?.aborted) return;
      setErrorMessage('Impossible de charger les revenus.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  // Chart-ready data for react-native-chart-kit LineChart
  const chartData: PaymentChartData = useMemo(() => ({
    labels:   monthlyData.map((m) => m.label),
    datasets: [{ data: monthlyData.length > 0 ? monthlyData.map((m) => m.totalInEuros) : [0] }],
  }), [monthlyData]);

  // Only show completed and failed transactions in the list
  const displayedTransactions: ReceivedPaymentEntity[] = useMemo(
    () => (earnings?.payments ?? []).filter(
      (p) => p.status === 'completed' || p.status === 'failed',
    ),
    [earnings],
  );

  return {
    totalEarnings:        earnings?.totalEarnings  ?? 0,
    thisMonthEarnings:    earnings?.thisMonth       ?? 0,
    displayedTransactions,
    chartData,
    isLoading,
    errorMessage,
    reload: () => void loadData(),
  };
}
