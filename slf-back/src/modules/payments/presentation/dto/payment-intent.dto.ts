import { IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';

// ─── POST /payments/intent — request body ─────────────────────────────────────
export class InitiatePaymentBodyDto {
  // The MongoDB ObjectId of the coach to pay
  @IsMongoId()
  coachId!: string;

  // Amount in euro cents (e.g. 5000 = 50.00 €). Minimum 50 cents.
  @IsInt()
  @Min(50)
  amountInCents!: number;

  // Optional note that will appear on the Stripe receipt and payment record
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── POST /payments/intent — response ────────────────────────────────────────
// `clientSecret`     → passed to the Stripe mobile SDK for payment sheet init
// `paymentIntentId`  → sent back to the server via POST /payments/confirm
// `publishableKey`   → forwarded so the client never has to hard-code the key
export interface PaymentIntentResponseDto {
  clientSecret:     string;
  publishableKey:   string;
  paymentIntentId:  string;
}

// ─── POST /payments/confirm — request body ───────────────────────────────────
// Sent after presentPaymentSheet() resolves successfully.
// The server retrieves the PaymentIntent from Stripe to verify `status === 'succeeded'`
// before persisting the record — the client cannot forge this.
export class ConfirmPaymentBodyDto {
  @IsString()
  paymentIntentId!: string;
}
