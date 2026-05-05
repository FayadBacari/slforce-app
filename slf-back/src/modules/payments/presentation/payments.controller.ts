import { Controller, Get, Post, Delete, Body } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { RequireRoles } from '../../../shared/decorators/require-roles.decorator';
import { UserRole } from '../../../shared/types/user-role.enum';
import type { AuthenticatedUserPayload } from '../../../shared/types/authenticated-request.interface';
import type {
  PaymentHistoryResponseDto,
  CoachPaymentsResponseDto,
  MonthlyChartResponseDto,
} from './dto/payment-response.dto';
import type {
  BankAccountStatusResponseDto,
  OnboardingUrlResponseDto,
  DashboardUrlResponseDto,
} from './dto/bank-account-response.dto';
import { InitiatePaymentBodyDto, ConfirmPaymentBodyDto } from './dto/payment-intent.dto';
import type { PaymentIntentResponseDto } from './dto/payment-intent.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Payment Intent (Stripe payment sheet) ───────────────────────────────

  // POST /api/v1/payments/intent
  // Creates a Stripe PaymentIntent so the mobile app can present the native
  // payment sheet (Apple Pay / Google Pay / card). Athletes only.
  @Post('intent')
  @RequireRoles(UserRole.Athlete)
  initiatePayment(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
    @Body() body:               InitiatePaymentBodyDto,
  ): Promise<PaymentIntentResponseDto> {
    return this.paymentsService.initiatePayment({
      athleteId:     currentUser.userId,
      coachId:       body.coachId,
      amountInCents: body.amountInCents,
      description:   body.description,
    });
  }

  // POST /api/v1/payments/confirm
  // Called by the mobile app after presentPaymentSheet() succeeds.
  // The backend retrieves the PaymentIntent from Stripe to verify the payment
  // before creating the record in our database.
  @Post('confirm')
  @RequireRoles(UserRole.Athlete)
  confirmPayment(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
    @Body() body:               ConfirmPaymentBodyDto,
  ): Promise<void> {
    return this.paymentsService.confirmPayment({
      athleteId:       currentUser.userId,
      paymentIntentId: body.paymentIntentId,
    });
  }

  // ─── Payment history ─────────────────────────────────────────────────────

  // GET /api/v1/payments/sent
  // Returns the list of payments sent by the current athlete.
  @Get('sent')
  @RequireRoles(UserRole.Athlete)
  getPaymentHistory(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<PaymentHistoryResponseDto> {
    return this.paymentsService.getPaymentsSentByCurrentUser(currentUser.userId);
  }

  // GET /api/v1/payments/received
  // Returns all payments received by the current coach + stats totals.
  @Get('received')
  @RequireRoles(UserRole.Coach)
  getCoachPayments(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<CoachPaymentsResponseDto> {
    return this.paymentsService.getPaymentsReceivedByCurrentUser(currentUser.userId);
  }

  // GET /api/v1/payments/summary/monthly
  // Returns the last 12 months of revenue as chart data.
  @Get('summary/monthly')
  @RequireRoles(UserRole.Coach)
  getMonthlyChart(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<MonthlyChartResponseDto> {
    return this.paymentsService.getMonthlyChartDataForCoach(currentUser.userId);
  }

  // ─── Stripe Connect — bank account ───────────────────────────────────────

  // GET /api/v1/payments/bank-account
  // Returns the Stripe Connect account status for the current coach.
  // { isConnected: false } when no account is linked yet.
  @Get('bank-account')
  @RequireRoles(UserRole.Coach)
  getBankAccountStatus(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<BankAccountStatusResponseDto> {
    return this.paymentsService.getBankAccountStatus(currentUser.userId);
  }

  // POST /api/v1/payments/bank-account/onboarding
  // Creates a Stripe Express account (if needed) and returns a one-time
  // onboarding URL to open in the system browser.
  @Post('bank-account/onboarding')
  @RequireRoles(UserRole.Coach)
  startBankAccountOnboarding(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<OnboardingUrlResponseDto> {
    return this.paymentsService.startBankAccountOnboarding(currentUser.userId);
  }

  // GET /api/v1/payments/bank-account/dashboard
  // Returns a one-time Stripe Express dashboard URL so the coach can manage
  // their payouts, tax info, and bank account directly on Stripe.
  @Get('bank-account/dashboard')
  @RequireRoles(UserRole.Coach)
  getBankAccountDashboardUrl(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<DashboardUrlResponseDto> {
    return this.paymentsService.getDashboardUrl(currentUser.userId);
  }

  // DELETE /api/v1/payments/bank-account
  // Deletes the Stripe Express account and removes the reference from our DB.
  // The coach will need to re-onboard to receive payments again.
  @Delete('bank-account')
  @RequireRoles(UserRole.Coach)
  disconnectBankAccount(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<void> {
    return this.paymentsService.disconnectBankAccount(currentUser.userId);
  }
}
