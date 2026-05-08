import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '@shared/decorators/public-route.decorator';

// ─── StripeRedirectController ─────────────────────────────────────────────────
//
// Stripe Connect Account Links require HTTP/HTTPS return_url and refresh_url —
// custom URI schemes like `slforce://` are rejected with "Not a valid URL".
//
// These two public routes act as a bridge:
//   1. Stripe redirects the user to one of these backend URLs after onboarding.
//   2. The page immediately redirects to the slforce:// deep link.
//   3. The mobile app re-opens and useAppState triggers a status reload.
//
// Paths:
//   GET /api/v1/payments/stripe/return  ← sent in `return_url`  (onboarding complete / left)
//   GET /api/v1/payments/stripe/refresh ← sent in `refresh_url` (link expired)

@ApiTags('Payments / Stripe Connect')
@Controller('payments/stripe')
export class StripeRedirectController {
  // Called by Stripe when the coach completes (or leaves) the onboarding.
  @Get('return')
  @Public()
  handleReturn(@Res() res: Response): void {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(buildRedirectPage('slforce://stripe-connect-return', 'Inscription finalisée'));
  }

  // Called by Stripe when the onboarding link expires.
  // The mobile app will detect the app-foreground event and generate a new link.
  @Get('refresh')
  @Public()
  handleRefresh(@Res() res: Response): void {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(buildRedirectPage('slforce://stripe-connect-refresh', 'Lien expiré'));
  }
}

// ─── HTML page ────────────────────────────────────────────────────────────────
// A minimal self-redirecting page that opens the app deep link.
// The <meta refresh> is the fallback for browsers that block window.location changes.
function buildRedirectPage(deepLink: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="1; url=${deepLink}" />
  <title>${title} — SLForce</title>
  <style>
    *    { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; background: #f9fafb; color: #374151; }
    .card { background: #fff; border-radius: 16px; padding: 36px 28px;
            text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            max-width: 380px; width: 90%; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h2   { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
    p    { font-size: 0.88rem; color: #6b7280; margin-bottom: 24px; line-height: 1.5; }
    a    { display: inline-block; background: #3B82F6; color: #fff;
           text-decoration: none; padding: 12px 28px; border-radius: 10px;
           font-weight: 600; font-size: 0.95rem; }
    a:hover { background: #2563EB; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h2>Retour vers SLForce…</h2>
    <p>Vous allez être redirigé automatiquement vers l'application SLForce.</p>
    <a href="${deepLink}">Ouvrir SLForce</a>
  </div>
  <script>
    // Try immediately, then retry once in case the browser is slow
    window.location.href = '${deepLink}';
    setTimeout(function () { window.location.href = '${deepLink}'; }, 800);
  </script>
</body>
</html>`;
}
