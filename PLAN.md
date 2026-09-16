# Milestone 3 — Phase 4: Customers & Products CRUD

## Goal
Replace the empty skeleton pages for `/customers` and `/products` with full CRUD UI (list, search, add, edit, delete), wire to the existing Dexie data layer, and update the invoice product picker to use real saved products.

---

## Data layer additions (`lib/db/records.ts`)

Add two delete functions:
- `deleteCustomer(id: string)` — removes from `db.customers`
- `deleteProduct(id: string)` — removes from `db.products`

No other data-layer changes needed — `upsertCustomer`, `upsertProduct`, `listCustomers`, `listProducts` already exist.

---

## Customers page (`app/(app)/customers/page.tsx`)

**State**: `useLiveQuery(() => listCustomers())` for live list; `query` string for search filtering.

**Layout**:
- Header: title + "Add customer" button (right-aligned)
- Search bar (already exists, wire to filter)
- Cards grid (1 col mobile, 2 col sm, 3 col lg)

**Each customer card**:
- Name (bold), company (subtitle), phone, email, GSTIN badge
- Actions: Edit (pencil icon), Delete (trash icon → confirm sheet)

**Add/Edit sheet** (reuses `Sheet` component):
- Fields: Name (required), Company, Email, Phone, Address, GSTIN, Notes
- On save: calls `upsertCustomer(draft, existingId?)`
- On success: toast + list updates via `useLiveQuery`

**Delete confirmation sheet**:
- Warning text + customer name
- On confirm: calls `deleteCustomer(id)`, toast, sheet closes

**Empty state**: already exists, keep as-is (shown when no customers)

---

## Products page (`app/(app)/products/page.tsx`)

**State**: `useLiveQuery(() => listProducts())` for live list; `query` string for search filtering.

**Layout**: same pattern as customers.

**Each product card**:
- Name (bold), description (subtitle), rate + currency, unit, tax rate badge
- Actions: Edit, Delete (→ confirm sheet)

**Add/Edit sheet**:
- Fields: Name (required), Description, Rate (number), Unit, Tax Rate % (number, 0-100)
- On save: calls `upsertProduct(draft)`
- On success: toast + list updates

**Delete confirmation sheet**: same pattern as customers.

**Empty state**: already exists, keep as-is.

---

## Product picker update (`components/invoice/items-editor.tsx`)

Currently the product picker sheet shows saved products from props (`products: Product[]`). No code change needed — the parent already passes the list. But:
- Verify the product picker renders real data when products exist (demo seed already populates 5)
- Verify clicking a product fills the line correctly (already wired)

---

## Files to modify

| File | Change |
|------|--------|
| `lib/db/records.ts` | Add `deleteCustomer()`, `deleteProduct()` |
| `app/(app)/customers/page.tsx` | Full rewrite: list + search + add/edit/delete sheets |
| `app/(app)/products/page.tsx` | Full rewrite: list + search + add/edit/delete sheets |
| `components/invoice/items-editor.tsx` | Verify product picker works with real data (no code change expected) |

---

## Verification

1. `npm run typecheck` — clean
2. `npm run lint` — clean
3. `npm test` — 27/27 pass (existing tests unaffected)
4. `npm run build` — green
5. Dev server smoke: `/customers` and `/products` load, demo seed data appears, add/edit/delete work
6. Production smoke: same routes return 200

---

## Sequencing

1. Add `deleteCustomer` / `deleteProduct` to `lib/db/records.ts`
2. Build customers page (full CRUD)
3. Build products page (full CRUD)
4. Run typecheck + lint + tests
5. Production build + deploy
