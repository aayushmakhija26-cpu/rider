# Implementation Patterns & Consistency Rules

## Critical Conflict Points Identified

9 areas where AI agents could independently make incompatible choices: naming conventions, file/folder structure, API response shape, error handling, Prisma query location, Inngest event naming, RLS enforcement, loading/Suspense boundaries, and Server Action vs Route Handler usage.

---

## Naming Patterns

**Database Naming (Prisma Schema):**
- Model names: PascalCase singular — `Dealer`, `Consumer`, `Campaign`, `SignedUrlToken`
- Field names: camelCase — `dealerId`, `createdAt`, `expiresAt`
- DB columns: snake_case via `@map` — `@map("dealer_id")`, `@map("created_at")`
- Table names: snake_case plural via `@@map` — `@@map("dealers")`, `@@map("consumers")`
- Foreign keys: `{model}Id` camelCase field, `{model}_id` snake_case column
- Index names: `{table}_{column(s)}_idx` — `dealers_email_idx`

✅ `dealerId   String   @map("dealer_id")`
❌ `dealer_id  String` (no @map — breaks Prisma/DB consistency)

**API Endpoint Naming:**
- Resources: plural kebab-case — `/api/dealers`, `/api/signed-url-tokens`
- Nested resources: `/api/dealers/[dealerId]/campaigns`
- Route params: camelCase — `[dealerId]`, `[consumerId]`, `[campaignId]`
- Query params: camelCase — `?dealerId=`, `?pageSize=`, `?sortBy=`
- Webhook endpoints: `/api/webhooks/[provider]` — e.g. `/api/webhooks/dealervault`, `/api/webhooks/stripe`, `/api/webhooks/resend`

✅ `GET /api/dealers/[dealerId]/campaigns`
❌ `GET /api/dealer/campaigns` or `GET /api/Dealers`

**Code Naming:**
- React components: PascalCase — `VehicleHeroSection`, `DealerThemeProvider`
- Component files: PascalCase — `VehicleHeroSection.tsx`, `TradeTimerIndicator.tsx`
- Route files: lowercase — `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`
- Utility functions: camelCase — `generateSignedToken()`, `validateDealerColour()`
- Inngest functions: camelCase — `dmsSyncDaily`, `campaignDispatch`
- Zod schemas: camelCase with `Schema` suffix — `dealerSchema`, `campaignSchema`
- Prisma service functions: camelCase verb+noun — `createDealer()`, `findConsumerByToken()`
- Constants: SCREAMING_SNAKE_CASE — `TOKEN_EXPIRY_DAYS`, `VALUATION_CACHE_TTL`

**Inngest Event Naming:**
- Format: `{domain}/{action}.{verb}` in kebab-case
- Examples: `dms/sync.requested`, `campaign/dispatch.scheduled`, `valuation/refresh.requested`, `consumer/account.created`

✅ `inngest.send({ name: "dms/sync.requested", data: { dealerId } })`
❌ `inngest.send({ name: "DMSSyncRequested", data: { dealer_id } })`

---

## Structure Patterns

**Project Organization:**

```
src/
  app/                          # Next.js App Router
    (consumer)/                 # Route group — consumer dashboard
    (dealer)/                   # Route group — dealer portal
    (sysadmin)/                 # Route group — SysAdmin portal
    api/                        # Route Handlers
      dealers/
      consumers/
      campaigns/
      webhooks/
        dealervault/
        stripe/
        resend/
    layout.tsx
    page.tsx
  components/
    ui/                         # shadcn/ui components (owned)
    jupiter/                    # Jupiter custom components
    consumer/                   # Consumer-surface components
    dealer/                     # Dealer portal components
  lib/
    auth.ts                     # Auth.js config
    db.ts                       # Prisma client singleton
    redis.ts                    # Upstash Redis client
    inngest.ts                  # Inngest client
    resend.ts                   # Resend client
  inngest/                      # Inngest function definitions
    dms-sync.ts
    campaign-dispatch.ts
    valuation-refresh.ts
  services/                     # Data access layer (Prisma queries)
    dealer.service.ts
    consumer.service.ts
    campaign.service.ts
    valuation.service.ts
    audit.service.ts
  emails/                       # React Email templates
    campaign-newsletter.tsx
  prisma/
    schema.prisma
    migrations/
  hooks/                        # React custom hooks (client-side)
  types/                        # Shared TypeScript types
```

**Tests: Co-located `*.test.ts` files**
- Unit tests alongside source files — `valuation.service.test.ts`
- E2E tests in `/e2e/` directory at project root (Playwright)
- No `__tests__/` directories

**Where Prisma Queries Live:**
- ALL database access through `services/` — never raw Prisma calls in Route Handlers or Server Components
- Route Handlers call service functions only
- Service functions own all Prisma queries, RLS context, and data mapping

✅ `const dealer = await dealerService.findById(dealerId)`
❌ `const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } })` (directly in a Route Handler)

---

## Format Patterns

**API Response Format:**
- Success: return data directly (no wrapper) — `Response.json(data, { status: 200 })`
- Created: `Response.json(data, { status: 201 })`
- No content: `new Response(null, { status: 204 })`
- Error: `Response.json({ error: string, code: string }, { status: N })`

✅ `return Response.json({ id, email, role }, { status: 201 })`
❌ `return Response.json({ success: true, data: { id, email } })`

**Standard Error Codes:**
- `UNAUTHORIZED` — 401, not authenticated
- `FORBIDDEN` — 403, authenticated but wrong role/tenant
- `NOT_FOUND` — 404
- `VALIDATION_ERROR` — 400, Zod parse failure
- `CONFLICT` — 409, duplicate resource
- `INTERNAL_ERROR` — 500

**Date/Time Format:**
- ALL dates as ISO 8601 strings in API responses — `"2026-03-23T05:00:00.000Z"`
- Never Unix timestamps in API responses
- DB stores timestamps in UTC via Prisma's `DateTime` type
- Display formatting done on the client, never in the API

**JSON Field Naming:**
- API request/response bodies: camelCase throughout
- Zod schemas mirror camelCase API shape
- Prisma transforms DB snake_case to camelCase automatically

---

## Communication Patterns

**Inngest Event Payload Structure:**

```typescript
// Standard event shape — ALL Inngest events must follow this
{
  name: "domain/action.verb",   // e.g. "dms/sync.requested"
  data: {
    dealerId?: string,           // present for tenant-scoped events
    consumerId?: string,         // present for consumer-scoped events
    // Additional context fields specific to the event
  }
}
```

**Server Action vs Route Handler — When to Use Which:**
- **Server Actions:** Form submissions that mutate data and redirect (onboarding steps, branding save, DMS credential setup)
- **Route Handlers:** API endpoints called by external services (webhooks), client-side fetches, and Inngest communication
- NEVER use Server Actions for webhook handlers or Inngest endpoints

**RLS Enforcement Pattern:**
- Prisma middleware sets `app.current_dealer_id` before EVERY query
- Middleware reads `dealerId` from the Auth.js session
- For SysAdmin routes: middleware sets a special bypass flag, never a fake dealerId
- Consumer routes: `dealerId` derived from the signed URL token, not the session

```typescript
// In lib/db.ts — applied globally, never bypassed per-query
prisma.$use(async (params, next) => {
  const session = await getServerSession();
  if (session?.dealerId) {
    await prisma.$executeRaw`SELECT set_config('app.current_dealer_id',
      ${session.dealerId}, TRUE)`;
  }
  return next(params);
});
```

---

## Process Patterns

**Error Handling in Route Handlers:**

```typescript
// Standard pattern — ALL Route Handlers use this structure
export async function GET(req: Request) {
  try {
    const session = await requireAuth(['DEALER_ADMIN', 'DEALER_STAFF']);
    const data = await dealerService.findCampaigns(session.dealerId);
    return Response.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message, code: 'FORBIDDEN' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', code: 'VALIDATION_ERROR',
        details: error.flatten() }, { status: 400 });
    }
    console.error('[campaigns/GET]', error);
    return Response.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
```

**Loading States — Suspense Boundaries:**
- EVERY async Server Component wrapped in a `<Suspense fallback={<Skeleton />}>`
- Skeleton components live in `components/ui/` and mirror the shape of the loaded content
- Consumer dashboard: each tile is an independent Suspense boundary (tiles load independently)
- Dealer portal: page-level Suspense for the full analytics table

✅ `<Suspense fallback={<VehicleTileSkeleton />}><EquityTile ... /></Suspense>`
❌ Inline loading checks: `if (isLoading) return <div>Loading...</div>`

**Validation Timing:**
- Zod parse at the Route Handler boundary BEFORE any service call
- Server Actions use Zod `safeParse` and return structured errors to the form
- Client-side React Hook Form validates on blur; server validation is always the source of truth

**Audit Logging:**
- ALL key actions logged via `auditService.log()` — never inline Prisma writes
- Audit log written AFTER the action succeeds, within the same Inngest step or Route Handler try block
- Audit log fields: `action`, `actorId`, `actorRole`, `dealerId`, `targetId`, `targetType`, `metadata`, `createdAt`

---

## Enforcement Guidelines

**All AI Agents MUST:**
- Use `services/` for ALL Prisma queries — never query Prisma directly in Route Handlers, Server Components, or Inngest functions
- Use the standard Route Handler error handling pattern (try/catch with typed errors)
- Use Inngest event naming format `domain/action.verb` — no exceptions
- Wrap every async Server Component in a Suspense boundary with a matching Skeleton
- Log all key actions via `auditService.log()` — never skip audit logging
- Set `dealerId` context via Prisma middleware — never filter by dealerId manually in Prisma `where` clauses as the sole isolation mechanism
- Use ISO 8601 date strings in all API responses
- Validate all Route Handler inputs with Zod before any service call

**Anti-Patterns — Never Do These:**
- ❌ Raw `prisma.X.findMany()` calls outside of `services/`
- ❌ `where: { dealerId: session.dealerId }` as the ONLY tenant isolation (RLS is the guarantee; Prisma filters are defence-in-depth only)
- ❌ Inngest events named with PascalCase or snake_case (`DMSSyncDaily`, `dms_sync`)
- ❌ API responses wrapped in `{ success: true, data: ... }`
- ❌ Unix timestamps in API responses
- ❌ Server Actions handling webhook or Inngest communication
- ❌ Suspense boundaries omitted from async Server Components
- ❌ Audit log written before the action completes (log success, not intent)
