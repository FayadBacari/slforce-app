// ─── GET /payments/sent ───────────────────────────────────────────────────────
// One item in the athlete's payment history (money they sent to a coach).
export interface SentPaymentDto {
  id:             string;
  coachName:      string;
  coachPhotoUrl?: string;
  amountInEuros:  number;
  status:         'pending' | 'completed' | 'failed' | 'cancelled';
  date:           string;   // ISO 8601
  description?:   string;
}

// ─── GET /payments/received ───────────────────────────────────────────────────
// One item in the coach's transaction list (money they received from an athlete).
export interface ReceivedPaymentDto {
  id:               string;
  athleteName:      string;
  athletePhotoUrl?: string;
  amountInEuros:    number;
  status:           'pending' | 'completed' | 'failed' | 'cancelled';
  date:             string;   // ISO 8601
}

// ─── GET /payments/summary/monthly ───────────────────────────────────────────
// One data point in the coach's monthly revenue chart.
export interface MonthlySummaryDto {
  year:          number;
  month:         number;   // 1 = January … 12 = December
  label:         string;   // e.g. 'Jan', 'Fév', 'Mar' …
  totalInEuros:  number;
}

// ─── Response wrappers ────────────────────────────────────────────────────────
export interface PaymentHistoryResponseDto {
  payments: SentPaymentDto[];
}

export interface CoachPaymentsResponseDto {
  payments:      ReceivedPaymentDto[];
  totalEarnings: number;
  thisMonth:     number;
}

export interface MonthlyChartResponseDto {
  months: MonthlySummaryDto[];
}
