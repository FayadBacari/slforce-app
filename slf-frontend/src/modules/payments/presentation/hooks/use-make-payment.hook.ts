import { useState, useCallback, useRef } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentsRepository } from '../../data/repositories/payments.repository';
import { convertAnyErrorToAppError } from '@core/api/api-error-handler';
import { STRIPE_PAYMENT_CANCELED_CODE } from '@shared/constants/app-constants';

// ─── Status union ─────────────────────────────────────────────────────────────
export type PaymentStatus = 'idle' | 'loading' | 'success' | 'cancelled' | 'error';

// ─── useMakePayment ───────────────────────────────────────────────────────────
//
// Encapsulates the full Stripe Payment Sheet flow for an athlete paying a coach:
//
//   1. Call `initializePayment(params)` when the user taps "Payer X €"
//   2. The hook calls `POST /payments/intent` on our backend to get a clientSecret
//   3. `initPaymentSheet()` configures the native sheet (Apple Pay included)
//   4. `presentPaymentSheet()` presents the native UI — the user pays
//   5. `status` transitions to 'success' | 'cancelled' | 'error'
//
// All Stripe SDK calls are wrapped here so the screen stays declarative.
export function useMakePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [status, setStatus]               = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage]   = useState<string | null>(null);

  // Held in ref so the confirmation step can use it without triggering re-renders.
  // The ref is populated after POST /payments/intent returns the ID.
  const paymentIntentIdRef = useRef<string>('');

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  // ── Core flow ───────────────────────────────────────────────────────────────
  const initializePayment = useCallback(async (params: {
    coachId:       string;
    coachName:     string;
    amountInCents: number;
    description?:  string;
  }) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      // Step 1 — Ask the backend for a PaymentIntent.
      //          The backend creates the intent with transfer_data pointing to
      //          the coach's Stripe Express account.
      const { clientSecret, paymentIntentId } = await paymentsRepository.initiatePayment({
        coachId:       params.coachId,
        amountInCents: params.amountInCents,
        description:   params.description,
      });

      // Keep the intent ID so we can confirm it after the sheet closes.
      paymentIntentIdRef.current = paymentIntentId;

      // Step 2 — Configure the native payment sheet.
      //          The primary button label shows the exact amount the user confirms.
      const amountLabel = (params.amountInCents / 100)
        .toFixed(2)
        .replace('.', ',') + ' €';

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName:         'SLForce',
        paymentIntentClientSecret:   clientSecret,
        style:                       'automatic',
        primaryButtonLabel:          `Payer ${amountLabel} · ${params.coachName}`,
        // Apple Pay — requires the merchant identifier in app.json and a
        // development build (not available in Expo Go).
        applePay: {
          merchantCountryCode: 'FR',
        },
        // Don't show delayed payment methods (bank transfers, etc.) — athletes
        // need instant confirmation.
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        setErrorMessage(initError.message);
        setStatus('error');
        return;
      }

      // Step 3 — Present the sheet; wait for the user's action.
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // STRIPE_PAYMENT_CANCELED_CODE means the user dismissed the sheet —
        // silent, ne sera jamais traité comme une erreur.
        if (presentError.code === STRIPE_PAYMENT_CANCELED_CODE) {
          setStatus('cancelled');
        } else {
          setErrorMessage(presentError.message);
          setStatus('error');
        }
        return;
      }

      // Step 4 — presentPaymentSheet() resolved without error → Stripe has
      // confirmed the charge. Now call our backend to write the payment record
      // so it appears in the athlete's history and the coach's revenue chart.
      //
      // The backend re-retrieves the intent from Stripe for a server-side check
      // before persisting — the client cannot forge a "succeeded" status.
      await paymentsRepository.confirmPayment(paymentIntentIdRef.current);

      setStatus('success');

    } catch (err: unknown) {
      const appError = convertAnyErrorToAppError(err);
      setErrorMessage(appError.userFriendlyMessage);
      setStatus('error');
    }
  }, [initPaymentSheet, presentPaymentSheet]);

  const resetPayment = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return {
    status,
    isLoading,
    isSuccess,
    errorMessage,
    initializePayment,
    resetPayment,
  };
}
