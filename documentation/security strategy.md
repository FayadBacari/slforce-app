# Security Strategy - SLForce (Implemented Status)

This document describes the security strategy implemented in SLForce (Expo frontend + Express/MongoDB + Stream + Stripe backend). We will try to protect all layers of the application: the frontend, the backend, and the database, in addition to the payment and chat components.



## 1) Authentication and sessions


### 1.1 Hardened JWT

#### Why  
- Avoid tokens accepted outside their intended context (token confusion) and limit the impact of a leak.

#### How it works
- Short-lived access tokens.
- Strict JWT verification with cryptographic and contextual constraints.

#### Implementation
- JWT signature + verification with:
  - `algorithm: HS256`
  - `issuer`
  - `audience`
- Runtime variables added:
  - `JWT_ISSUER`
  - `JWT_AUDIENCE`
- Files:
  - `slf-backend/src/config/runtimeConfig.ts`
  - `slf-backend/src/modules/auth/auth.service.ts`


### 1.2 Refresh token rotation (one-time use)

#### Why   
Reduce the risk of replaying a stolen refresh token.

#### How it works 
- On refresh:
  1. old refresh token is consumed (deleted),
  2. new refresh token is issued,
  3. a new access token is returned.

#### Implementation
- `consumeRefreshToken` added to the auth repository.
- Rotation implemented in `AuthService.refreshAccessToken`.
- Targeted logout possible with `userId + refreshToken`.
- Files:
  - `slf-backend/src/modules/auth/auth.repository.ts`
  - `slf-backend/src/modules/auth/auth.service.ts`
### 1.3 Frontend session alignment

**Why**  
Avoid inconsistent mobile/backend state after refresh token rotation.

#### How it works
- The frontend stores `accessToken` + `refreshToken` securely.
- On `401`, only one refresh request is triggered (single-flight), then tokens are resynchronized.
- Logout calls the backend first, then purges locally.

#### Implementation
- Auth store enriched with `refreshToken`.
- Refresh centralized and serialized in the API layer.
- Server logout integrated into the settings flow.
- Files:
  - `slf-frontend/stores/auth.store.ts`
  - `slf-frontend/services/auth.ts`
  - `slf-frontend/features/auth/auth.api.ts`
  - `slf-frontend/hooks/useSettingsScreen.ts`



## 2) Protection of identifiers and sensitive data


### 2.1 Passwords

#### Why  
Never store a reversible secret in the database.

#### How it works
- Hash with `bcrypt`.
- Verify with `bcrypt.compare` during login.

#### Implementation
- Already present and kept in:
  - `slf-backend/src/modules/auth/auth.service.ts`


### 2.2 Payment data

#### Why  
Respect PCI and minimize the leakage surface.

#### How it works 
- No card data in the local database.
- Stripe manages payment methods.

#### Implementation
- PaymentIntent flow + Stripe Connect.
- Webhooks verified + independence added (see section 4).



## 3) API security and anti-abuse


### 3.1 Global + sensitive rate limiting

#### Why   
Limit brute force, spam, and application abuse.

#### How it works
- Global throttling across the whole API.
- Strict limiters per critical route.

#### Implementation
- Keep the global middleware.
- Add dedicated limiters for:
  - login
  - refresh
  - forgot-password
  - send message chat
  - create payment intent
- Files:
  - `slf-backend/src/shared/middlewares/rateLimiterMiddleware.ts`
  - `slf-backend/src/modules/auth/auth.routes.ts`
  - `slf-backend/src/modules/chat/chat.routes.ts`
  - `slf-backend/src/modules/payments/payments.routes.ts`


### 3.2 Zod validation applied to the request

#### Why    
Avoid malformed data and type drift between controller/service layers.

#### How it works  
- Schemas validate and normalize `body/params/query`.
- Parsed values directly replace `req.body/req.params/req.query`.

#### Implementation
- Validation middleware updated to reassign parsed values.
- Strengthened schemas for:
  - logout
  - checkout query (`paymentId`, `token`)
  - chat pagination (`limit`, `offset` with bounds)
- Files:
  - `slf-backend/src/shared/middlewares/validationMiddleware.ts`
  - `slf-backend/src/modules/auth/auth.validation.ts`
  - `slf-backend/src/modules/payments/payments.validation.ts`
  - `slf-backend/src/modules/chat/chat.validation.ts`


### 3.3 AuthZ on sensitive actions

#### Why    
An authenticated user must not be able to act outside their allowed perimeter.

#### How it works  
- Actor verification before chat membership mutations.

#### Implementation
- Add checks: "actor is a member of the channel" before add/remove member.
- Files:
  - `slf-backend/src/modules/chat/chat.service.ts`
  - `slf-backend/src/modules/chat/chat.controller.ts`



## 4) Stripe payments security


### 4.1 Webhook signature

#### Why    
Verify that the event actually comes from Stripe.

#### How it works 
- Stripe signs the webhook.
- The backend validates the signature before processing.

#### Implementation
- Webhook middleware already in place and kept.
- Used on route:
  - `POST /api/payments/webhook`
- Files:
  - `slf-backend/src/shared/middlewares/stripeWebhookMiddleware.ts`
  - `slf-backend/src/modules/payments/payments.routes.ts`


### 4.2 Webhook idempotency

#### Why   
Stripe can resend the same event multiple times.
Without idempotency: double updates and double business side effects.

#### How it works
- If `event.id` was already processed: ignore it.
- Otherwise, mark as processed and execute the business processing.

#### Implementation
- New collection `ProcessedStripeEvent` with unique `eventId` + TTL.
- Repository + guard in the webhook service.
- Files:
  - `slf-backend/src/models/ProcessedStripeEvent.model.ts`
  - `slf-backend/src/modules/payments/payments.repository.ts`
  - `slf-backend/src/modules/payments/payments.service.ts`



## 5) Upload hardening


### 5.1 Avatar upload

#### Why    
Reduce the risk of uploading unexpected file types.

#### How it works 
- Strict MIME whitelist on middleware + route.
- Controlled maximum size.

#### Implementation
- Allowed MIME types: jpeg/png/webp/heic/heif.
- Files:
  - `slf-backend/src/shared/middlewares/multerMiddleware.ts`
  - `slf-backend/src/modules/upload/upload.routes.ts`


### 5.2 Chat upload

#### Why    
Chat uploads are a frequent attack surface.

#### How it works  
- MIME whitelist on route + revalidation in controller (defense in depth).
- Max size: 8MB.

#### Implementation
- Allowed MIME types: images, PDF, DOC, DOCX.
- Files:
  - `slf-backend/src/modules/chats/chats.routes.ts`
  - `slf-backend/src/modules/chats/chatsUpload.controller.ts`



## 6) Security audit and observability


### 6.1 Structured security audit logs

#### Why   
Enable investigation, proof of action, and abuse detection.

#### How it works  
- A central helper logs security events with useful metadata:
  - action
  - status
  - userId
  - ip
  - user-agent
  - resourceId / targetUserId

#### Implementation
- Helper:
  - `slf-backend/src/shared/utils/securityAudit.ts`
- Instrumentation in:
  - auth controller (login/logout/refresh/forgot-password)
  - chat controller (add/remove member)
  - payments controller (intent/webhook)


### 6.2 Ops/retention policy

#### Why  
Security is not limited to code: retention, secret rotation, and backup/restore are critical.

#### How it works
- Operational runbook with checklist and manual processes.

#### Implementation
- File:
  - `conception/security-retention-and-ops.md`



## 7) Error handling and secret hygiene


### 7.1 Non-verbose production errors

#### Why   
Avoid leaking internal information to attackers.

#### How it works 
- In production, non-operational errors -> generic message.
- In development, keep details for debugging.

#### Implementation
- File:
  - `slf-backend/src/shared/errors/errorHandler.ts`


### 7.2 Cleaning of `.env.example`

#### Why   
Never version real secrets in a template.

#### How it works
- Values replaced by placeholders.
- Contextual JWT variables added.

#### Implementation
- File:
  - `slf-backend/.env.example`



## 8) Added security tests


### 8.1 Refresh token rotation

#### Why   
Verify that rotation is effective and not just theoretical.

#### How it works
- Unit test for the auth service:
  - consume old token
  - create a new refresh token

#### Implementation
- File:
  - `slf-backend/src/modules/auth/auth.service.security.test.ts`


### 8.2 Webhook idempotency

#### Why  
Verify that replayed events are ignored.

#### How it works
- Payments service test:
  - event marked as "already processed"
  - no payment update executed

#### Implementation
- File:
  - `slf-backend/src/modules/payments/payments.service.security.test.ts`



## 9) Verification and current status

Verification performed after implementation:

- Backend build: OK (`npm run build`)
- Backend tests: OK (`npm test -- --runInBand`)
- Frontend type-check: OK (`npx tsc --noEmit`)

Current status:

- Security P0 and P1 baseline implemented.
- Additional hardening for JWT/errors/secrets applied.
- High maturity for a commercial MVP, with still possible "enterprise" improvements (distributed rate limiting, advanced SIEM observability, extended secure e2e tests).