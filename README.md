# SLForce

SLForce is a chat platform inspired by the WhatsApp model, with additional features such as in-app payments and user search, built for the French street-lifting community.

This repository is a monorepo: `slf-frontend` (Expo / React Native client) and `slf-backend` (REST API).

[![React Native](https://img.shields.io/badge/React%20Native-61DAFB?logo=react&logoColor=white)](https://reactnative.dev) [![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/fr)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/lp/cloud/atlas/try3?utm_source=google&utm_campaign=search_gs-pmax_pl_evergreen_atlas_general_prosp_gic-null_ww-multi_ps-all_dv-all_eng_lead&utm_term=&utm_medium=cpc_paid_search&utm_ad=&utm_ad_campaign_id=23331372646&adgroup=&cq_cmp=23331372646&gad_source=1&gad_campaignid=23327327279&gbraid=0AAAAADQ1401RrkDcLO5f9di6CzX4bcLqY&gclid=CjwKCAjwspPOBhB9EiwATFbi5OOoP7peYuk6LIhGM_8dpM0gskvkpS14WZRkxpWGiA5XJhxBNwUbsBoCVCEQAvD_BwE)

## Stack and versions

The versions below are based on the `package.json` files in `slf-frontend` and `slf-backend`. If there is any mismatch after an update, the `package.json` files are the source of truth.

| Area | Technology | Version (reference) |
|------|------------|---------------------|
| Mobile | **Expo** | ~54.0.x |
| Mobile | **React Native** | 0.81.5 |
| Mobile | **React** | 19.1.0 |
| Mobile | Navigation | Expo Router ~6, React Navigation 7 |
| Mobile | Data / UI | TanStack Query 5, Zustand 5 |
| Mobile | Chat | stream-chat 9.x |
| Mobile | Payments | @stripe/stripe-react-native 0.50.x |
| Backend | **Node.js** | >= 18 (>= 20 recommended for frontend alignment) |
| Backend | **TypeScript** | ~5.9.x |
| Backend | **Express** | 5.x |
| Backend | **MongoDB** (ODM) | Mongoose 8.x |
| Backend | Payments | stripe 17.x |
| Backend | Server chat SDK | @stream-io/node-sdk |
| Backend | Media | Cloudinary |

## Prerequisites

- **Node.js**: frontend requires `>= 20.19.4`; backend requires `>= 18` (see `engines` in each `package.json`).
- **MongoDB** (Atlas or local), plus **Stripe**, **Stream**, and **Cloudinary** accounts depending on the features you use.

## Run locally

### Backend (`slf-backend`)

1. `cd slf-backend`.
2. Copy `slf-backend/.env.example` to `.env` and fill in the variables (see [Environment variables](#environment-variables)).
3. `npm install`.
4. `npm run dev` - starts the HTTP server (default port: **5132**, aligned with frontend config).

### Frontend (`slf-frontend`)

1. `cd slf-frontend`
2. `npm install`
3. `npm run dev` (Expo), then choose iOS / Android / web.

**Backend connection**: the frontend builds the API URL from the Expo host (`utils/apiConfig.ts`) and port **5132**. On a physical device, your computer and phone must be on the same network; the URL uses the IP detected by Expo.

## Repository structure and architecture (high-level)

The **backend** uses a **module-based** structure (`modules/<domain>/`): Express routes, controllers, business services, data repositories, and validation (often Zod). HTTP responses use shared JSON envelopes (`successJson` / `errorJson`) with centralized error handling. The **frontend** (Expo Router) stores screens under `app/`, reusable logic in `hooks/`, `features/`, `services/`, and `contexts/`, and HTTP calls that expect the same success envelope shape as the backend.

External integrations (**Stripe**, **Stream Chat**, **Cloudinary**, **JWT**) are configured server-side via `config/runtimeConfig.ts` and validated at startup. Stripe webhook routes receive raw body payloads before the global JSON parser. For MongoDB schema details, indexes, and ad-hoc migration strategy, see [`conception/mongodb-et-migrations.md`](conception/mongodb-et-migrations.md).

### Frontend detailed

The frontend (`slf-frontend`) is layered to separate navigation, business logic, and infrastructure:

- `app/`: Expo Router routes and screens (domain folders: `application`, `athlete`, `coach`, `settings`)
- `features/`: domain facades (auth, chat, payments, profile, search)
- `services/`: infrastructure implementations (HTTP, Stream, Stripe, notifications, etc.)
- `hooks/`: reusable UI-side state/effects logic
- `utils/`, `types/`, `styles/`, `theme/`: utilities, shared typings, and design system

Main rule: screens in `app/` should consume domain APIs through `features/*` and avoid direct imports from `services/*` (enforced by ESLint).  
For full details (imports, theming, UX performance, conventions), see `slf-frontend/docs/architecture.md`.

### Backend detailed

The backend (`slf-backend`) is organized by business domains with clear request flow boundaries:

- `modules/<domain>/`: route handlers, controllers, business services, repositories, and validation schemas
- `models/`: Mongoose schemas and indexes (`User`, `CoachProfile`, `AthleteProfile`, `Payment`, etc.)
- `shared/`: cross-cutting concerns (middlewares, errors, constants, response envelopes, utils)
- `infrastructure/`: external provider connections (Stripe, Stream, Cloudinary integration points)
- `config/`: runtime configuration and DB bootstrap (`runtimeConfig`, Mongo connection)

Typical flow: `route -> validation middleware -> controller -> service -> repository/model -> response envelope`.

Main backend rules:

- Keep transport concerns in controllers, business logic in services, and persistence logic in repositories.
- Return consistent API envelopes (`successJson` / `errorJson`) for frontend compatibility.
- Validate input early (Zod / request validation middleware) before business execution.
- Centralize error translation in global handlers to avoid leaking internal details.

For data model details and schema evolution strategy, see:
- [`documentation/BDD/data.md`](documentation/BDD/data.md)
- [`conception/mongodb-et-migrations.md`](conception/mongodb-et-migrations.md)

