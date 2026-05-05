// ─── PAYMENT ENTITIES ─────────────────────────────────────────────────────────
// Clean domain shapes used throughout the frontend.
// Dates are real Date objects (never raw ISO strings outside this layer).

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

// One payment in the athlete's "Historique des paiements" view
export interface SentPaymentEntity {
  id:             string;
  coachName:      string;
  coachPhotoUrl?: string;
  amountInEuros:  number;
  status:         PaymentStatus;
  date:           Date;
  description?:   string;
}

// One payment in the coach's "Mes revenus" transaction list
export interface ReceivedPaymentEntity {
  id:               string;
  athleteName:      string;
  athletePhotoUrl?: string;
  amountInEuros:    number;
  status:           PaymentStatus;
  date:             Date;
}

// One data point on the coach's 12-month chart
export interface MonthlyRevenueEntity {
  year:         number;
  month:        number;    // 1 = January … 12 = December
  label:        string;    // abbreviated month name, e.g. 'Jan'
  totalInEuros: number;
}

// Full response from GET /payments/received
export interface CoachEarningsEntity {
  payments:      ReceivedPaymentEntity[];
  totalEarnings: number;
  thisMonth:     number;
}
