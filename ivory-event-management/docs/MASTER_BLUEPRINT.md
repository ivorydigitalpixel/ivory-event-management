# IVORY EVENT MANAGEMENT
## Master Product & Technical Blueprint — Version 1.0
**Date:** 16 October 2026  
**Status:** Foundational specification; proposed details require review before implementation  
**Owner:** Ivory Digital Pixel  
**Purpose:** Single source of truth for a dedicated product-development project.

---

## 1. Product vision
**Ivory Event Management** is a self-service, multi-tenant operations platform for professional event planning businesses worldwide. It is **not** a wedding-planning portal for couples. It supports weddings, corporate events, conferences, exhibitions, galas, launches, private events and multi-day productions through configurable event types and templates.

**Positioning:** *Plan Every Event. Manage Every Detail.*

**Customer:** Event planning companies and independent professional event organizers managing multiple events, staff, suppliers and operational workflows.

**Commercial strategy — confirmed:** Design the complete platform architecture and build/test **100% of the shared foundation** first. Develop, test and release paid functional modules **one at a time**. One application, one account, one workspace per organization, one shared database with secure tenant isolation. Individual modules are unlocked by verified purchases. No need to finish every future module before first launch.

## 2. Non-negotiable product principles
1. Global, English-first, mobile-responsive, accessible and self-service.
2. Internal team operations platform; customer-facing event/guest portals are separate future decisions.
3. Organization-level tenant isolation, with server-enforced authorization and role-based access.
4. Shared events and identities across modules; no separate app or login per module.
5. One-time purchase per module is the initial business model; entitlement terms, event/user limits and support duration must be explicit.
6. Only paid, released and enabled modules are accessible. Hiding a menu item is **not** sufficient access control.
7. A verified payment event, not an email automation, controls entitlement activation.
8. Production readiness requires security, integration, usability, backup/recovery and payment tests.
9. Keep the architecture extensible; use versioned database migrations and stable interfaces rather than prematurely implementing every future feature.

## 3. Technology architecture
| Layer | Choice | Responsibility |
|---|---|---|
| Web app | Next.js + TypeScript + Tailwind CSS | Responsive UI, API routes/server actions, validation |
| Hosting | Vercel | Deployments, environment variables, domains |
| Repository | GitHub | Version control, reviews, deployment source |
| Auth/data | Supabase Auth + PostgreSQL | Login, organization data, policies, storage |
| Security | Supabase RLS + server authorization | Tenant isolation, roles, module checks |
| Checkout | GoHighLevel funnel + Stripe | Product sales and checkout |
| Automation | GoHighLevel | Marketing, purchase confirmation and activation email orchestration |
| Payments backend | Signed Stripe webhook endpoint | Verify purchase, idempotently grant entitlements |
| Email activation | Supabase Auth invitation/magic link or secure setup flow | User sets password without emailing passwords |
| Domain | Proposed: app.ivorydigitalpixel.com | Customer application URL; not configured yet |

**System flow:** GoHighLevel landing page → Stripe checkout → Stripe signed webhook → payment/order validation → organization/user association → entitlement grant in Supabase → activation email via coordinated workflow → customer login → permission-checked module access.

**Critical implementation detail:** The Stripe customer/email may not automatically match an existing organization. Define a secure customer-to-workspace mapping, account-claim flow and duplicate-purchase behavior. Webhook delivery can repeat or arrive out of order; record Stripe event IDs and process idempotently. Do not grant access from an unverified GoHighLevel workflow trigger.

## 4. Account and role model
**Platform operator (Ivory admin):** Manage global product catalog, release flags, customers, entitlements, support and audit views. Strictly separate from customer organizations.

**Organization owner/admin:** Manage company settings, members, events, assigned project managers, purchased modules and organization-wide reporting.

**Project manager:** Manage events they are assigned to, their timelines, task assignments, event vendors and event operational data, subject to purchased modules.

**Team member:** View assigned events, tasks, schedules and permitted notes; update their own task status. No access to unrelated events or financial/administrative data by default.

A person may belong to multiple organizations; role is stored **per organization**, not globally. Event-specific assignments further restrict visibility. Invitation flows must validate organization, inviter permission and expiry.

## 5. Shared foundation — must be production-ready before paid launch
### 5.1 Identity and tenancy
- Sign-up/invitation, email verification, password reset, logout and session management.
- Organization creation and membership management.
- Row-level security for all tenant-owned records; deny by default.
- Roles, event assignments, membership status, account suspension and audit log.
- Account activation after verified purchase; avoid plaintext passwords in email.

### 5.2 Event core
- Create/edit/archive events; event type, status, location, venue, time zone, start/end dates, notes and ownership.
- Multi-day events and reusable templates at the data-model level.
- Event membership and team assignments; shared IDs across modules.
- Event status and dashboard summaries with event-level permission checks.

### 5.3 Module platform
- Product/module catalog with versioned slugs, prices (Stripe is source of truth), release state and visibility.
- Organization entitlements (module, purchase, start, status, terms).
- Backend checks on every module API/data access, not only frontend gating.
- Upgrade/purchase reconciliation, refund/revocation policy, duplicate checkout handling and admin support tools.
- Feature flags for unreleased modules; release state independent of purchase entitlement.

### 5.4 Operational readiness
- Logging, error tracking, audit history and support procedures.
- Schema migrations, backups, restore rehearsal and staging environment.
- Responsive UX, accessibility, input validation, time-zone handling and basic performance targets.
- Privacy policy, terms, retention/deletion rules, export and account closure workflows.
- Test suite and documented deployment/rollback procedure.

## 6. Planned modules and scope
**M01 — Event Operations (first paid launch):** Event dashboard; event setup; schedule/run sheet with date/time, location, owner, status and notes; dependencies and milestones; team tasks with assignee, priority, due date and progress; printable/PDF run sheet; event-day mobile view; event templates.

**M02 — Budget & Payments:** Budget categories, estimated vs actual, payment milestones, expenses, approvals, reporting; no direct bank payment execution in initial scope.

**M03 — Vendor Management:** Vendor directory, contacts, categories, event assignments, contracts/files, deliverables and due dates.

**M04 — Guest & RSVP Management:** Guest lists, groups, RSVP statuses, dietary/accessibility notes where appropriate, invitation tracking, check-in; privacy controls for sensitive guest details.

**M05 — VIP Management:** VIP records, arrival protocols, hosts, special arrangements, restricted visibility.

**M06 — Accommodation:** Hotels, room blocks, guest allocations, check-in/out dates, special requirements.

**M07 — Transport & Logistics:** Vehicles, drivers, routes, pickup/drop-off, manifests, schedules and dispatch notes.

**M08 — Incident & Issue Tracker:** Severity, owner, status, escalation, event-day incident log and resolution history.

**M09 — Team & Department Management:** Departments, shifts, availability, responsibilities and team workload.

**M10 — SOP & Document Library:** Standard operating procedures, templates, file attachments, version history and permissions.

**M11 — Reporting & Analytics:** Cross-event summaries, task completion, budget variances, vendor performance and exports.

**M12 — Advanced Multi-Day Production:** Linked sessions, venues, parallel schedules, dependencies and event-level operational views.

**Note:** These are planned scope definitions, not claims that modules exist. Prioritize and finalize acceptance criteria individually.

## 7. Proposed data model (logical, not final SQL)
**Identity / commerce:** `profiles`, `organizations`, `organization_members`, `organization_invitations`, `modules`, `module_releases`, `products`, `purchases`, `payment_events`, `organization_entitlements`, `audit_logs`.

**Shared event core:** `events`, `event_types`, `event_templates`, `event_members`, `departments`, `event_departments`, `event_locations`, `attachments`.

**Operations:** `schedule_items`, `schedule_item_dependencies`, `tasks`, `task_assignments`, `task_comments`, `task_status_history`.

**Later modules:** `vendors`, `event_vendors`, `budget_categories`, `budget_items`, `expenses`, `payment_milestones`, `guests`, `rsvps`, `vip_arrangements`, `hotels`, `room_blocks`, `room_allocations`, `transport_routes`, `transport_assignments`, `incidents`, `sops`.

**Relationships:** Organization → events → shared event_id in all event modules. Organization → members → event_members. Organization → entitlements → modules. Purchase → Stripe identifiers → entitlement. Every tenant-owned row must have a defensible tenant boundary; avoid relying on a client-supplied organization ID for authorization.

**Schema strategy:** Build the identity, tenant, event, module and operations tables first. Document the remaining module contracts and relationships now, but create future module tables through reviewed migrations as those modules are implemented. This avoids empty, rigid schema assumptions.

## 8. Core screens / navigation
**Public:** Login, invitation acceptance, password setup/reset, account activation.

**App shell:** Organization switcher, sidebar modules, notifications, account/profile, organization settings.

**Owner:** Organization overview, all events, team/roles, purchased modules, reports, settings.

**Project manager:** Assigned events, event overview, timeline/run sheet, tasks, event team and module-specific views.

**Team member:** My tasks, my event schedules, task details, status updates.

**Platform operator:** Organizations, module catalog/releases, payment and entitlement audit, customer support.

**Responsive priority:** On-site team workflows should be usable on phones; printable run sheets must be legible and export reliably.

## 9. Payment, access and onboarding requirements
1. Customer purchases a specific module through GoHighLevel/Stripe.
2. Stripe sends signed webhook; backend validates signature, event type, payment state, product/price mapping and customer association.
3. Backend stores event and purchase, prevents duplicate processing, grants entitlement to correct organization.
4. New customers get secure invitation/setup link; existing customers retain login and see new module.
5. GoHighLevel sends transactional messaging only after the relevant state is confirmed, or the application sends activation directly with GoHighLevel used for follow-up.
6. Failed payments, refunds, chargebacks, expired invitations and repeated events follow documented rules.
7. Entitlements checked server-side on every protected route/API/data operation.

**Pricing:** $29 one-time was previously discussed for a wedding-specific first module, but **the universal Event Operations price is not approved**. Define per-module pricing, access duration, event/user limits, support and updates before sales. Avoid promising perpetual hosted access without a sustainable operating policy.

## 10. Security and quality acceptance criteria
- A user from Organization A cannot read or modify any Organization B records, including through direct API requests or altered IDs.
- A team member cannot access another event's tasks or restricted financial data.
- Unreleased/unpurchased module routes and APIs reject access.
- Invalid webhook signatures never create accounts or entitlements.
- Duplicate webhook deliveries do not duplicate entitlements.
- Passwords/secrets never appear in source code, emails, browser-exposed env variables or logs.
- Invitations expire and cannot be redeemed by unauthorized users.
- Event schedules handle daylight saving and time zones correctly.
- Critical create/edit/delete flows have automated tests and clear error states.
- Backup restoration, deployment rollback, privacy/data deletion and support escalation are documented and tested.
- First paid module passes end-to-end purchase → activation → login → use → export testing in staging before live sales.

## 11. Build phases and release gates
**Phase 0 — Specification freeze:** Review complete module catalog, role matrix, screen map, shared data model, pricing terms, privacy requirements and acceptance criteria.

**Phase 1 — Foundation:** GitHub repo, Next.js app shell, Supabase project, migrations, authentication, tenancy/RLS, organization memberships, event core, entitlement engine, platform operator console, tests and CI.

**Phase 2 — First module:** Event Operations screens, templates, schedule/run sheet, tasks, assignments, print/export, mobile UX and test coverage.

**Phase 3 — Commercial integration:** Stripe/GHL mapping, webhook verification, customer provisioning, activation emails, purchase recovery, refund rules, staging E2E tests.

**Phase 4 — Release M01:** Deploy, verify domain, monitor, onboard early users, resolve launch blockers, then enable sales.

**Phase 5 — Subsequent modules:** Build each against existing shared interfaces; test data isolation and entitlements; release individually through feature flags and product catalog.

**Release gate:** No module is sold until its specific acceptance criteria, payment/access tests, documentation and support process pass.

## 12. Recommended repository structure
```text
ivory-event-management/
  app/                     # Next.js routes and layouts
  components/              # Shared UI components
  modules/
    event-operations/
    budgets/
    vendors/
    guests/
    logistics/
  lib/
    auth/
    permissions/
    entitlements/
    stripe/
    validation/
  supabase/
    migrations/
    seed.sql
  tests/
    unit/
    integration/
    e2e/
  docs/
    MASTER_BLUEPRINT.md
    ARCHITECTURE.md
    DATA_MODEL.md
    ROLE_PERMISSION_MATRIX.md
    MODULE_CATALOG.md
    PAYMENT_ONBOARDING.md
    SECURITY_TEST_PLAN.md
    RELEASE_CHECKLIST.md
    DECISION_LOG.md
  .env.example
  README.md
```

## 13. Decisions register
| Decision | Status |
|---|---|
| Product name: Ivory Event Management | Confirmed |
| Professional event organizers; multiple event types | Confirmed |
| One multi-tenant application | Confirmed |
| Shared foundation built/tested before paid launch | Confirmed |
| Modules developed and sold sequentially | Confirmed |
| Roles: owner/admin, project manager, team member | Confirmed |
| Vercel + Next.js, Supabase, GitHub | Agreed direction |
| GoHighLevel + Stripe sales/onboarding | Agreed direction |
| One-time module purchases | Agreed direction |
| First module: universal Event Operations | Agreed direction |
| Module price, usage limits, support/hosting terms | Open |
| Exact permissions and module feature boundaries | To validate |
| Multi-org membership, custom roles, localization | Proposed / to validate |
| Guest-facing portals and external vendor logins | Out of initial scope unless approved |

## 14. Immediate next actions
**User:** Create GitHub, Vercel and Supabase accounts under business ownership. Keep credentials and private keys confidential. GoHighLevel/Stripe already exist.

**Development:** Confirm this blueprint as v1.0; then produce a role-permission matrix, entity relationship diagram, module-by-module acceptance criteria, and an initial source-code ZIP with the foundation. Commit it to GitHub, deploy a staging app on Vercel, configure Supabase, test, and only then connect live payments.

## 15. Working agreement for future sessions
At the start of each development session, refer to **Ivory Event Management Master Blueprint v1.0**, identify the current phase and open decisions, and update `DECISION_LOG.md` when a requirement changes. Treat this document as the baseline, not as proof that any functionality is already implemented. Never silently change tenant isolation, entitlement rules, product scope or payment handling.

---
**End of master blueprint v1.0.**
