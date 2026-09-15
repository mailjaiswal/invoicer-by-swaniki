# Swaniki Invoice — Master Vibe Coding Implementation Prompt

## 0\. Instructions to the Coding Agent

You are an expert product engineer, UX designer, and frontend architect.

Build a production-quality, lightweight, mobile-first Progressive Web App (PWA) called **Swaniki Invoice**.

The product is inspired by the *functional category* and UX simplicity of lightweight local-first invoice generators, but this is an **original implementation**. Do not copy proprietary source code, branding, exact visual design, copyrighted assets, or text from any reference application.

The product philosophy is:

> \*\*Create. Share. Get Paid.\*\*

It is NOT accounting software.

It must remain a small, fast utility for freelancers, consultants, creators, agencies, and micro/small businesses.

\---

# 1\. Non-Negotiable Product Principles

## Simplicity

The user should never feel that they are configuring accounting software.

Avoid:

* unnecessary onboarding
* complex dashboards
* excessive forms
* accounting jargon
* unnecessary modals
* feature overload
* mandatory registration
* mandatory cloud sync

Prefer:

* sensible defaults
* inline editing
* one-screen workflows
* reusable data
* progressive disclosure
* large touch targets
* quick actions

## Local-first

V1 must work without a backend.

Core data should be stored locally using IndexedDB, preferably through Dexie.js.

The following must work offline after the application has been loaded/installed:

* create invoice
* edit invoice
* view invoices
* manage customers
* manage products/services
* generate invoice preview
* generate/download PDF where technically feasible
* print
* generate UPI QR
* create/share WhatsApp text

Do not make API calls for basic invoice creation.

## No mandatory account

A first-time user should be able to create an invoice without:

* email registration
* password
* Google login
* backend account
* subscription

## Mobile-first

The application must feel like a native mobile utility when installed as a PWA.

It must also provide an excellent desktop experience.

\---

# 2\. Recommended Technology

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui where useful
* Lucide icons
* Dexie.js + IndexedDB
* PWA service worker / appropriate Next.js PWA approach
* local QR-code generation
* local PDF generation where practical
* Vercel-compatible deployment

Do not add a backend unless absolutely necessary for a specific feature.

Do not introduce unnecessary dependencies.

Use a clean architecture so a future Supabase/cloud layer can be added without rewriting the application.

\---

# 3\. Application Structure

Create these primary areas:

1. Home
2. Invoices
3. Create Invoice
4. Customers
5. Products/Services
6. Settings

The primary CTA everywhere should be:

**+ Create Invoice**

On mobile use a bottom navigation such as:

* Home
* Invoices
* 

  * 
* Customers
* More

On desktop use a compact sidebar.

\---

# 4\. First-Run Experience

Do NOT create a long onboarding wizard.

On first launch show a lightweight setup card:

## Welcome to Swaniki Invoice

Create professional invoices in seconds.

Fields:

* Business name — required
* Phone — optional
* Email — optional
* Website — optional
* Address — optional
* GSTIN — optional
* UPI ID — optional
* Logo — optional

Button:

**Start Creating Invoices**

Allow the user to skip optional information.

If the user clicks Create Invoice before completing setup, ask only for the minimum business information required for a professional invoice.

Persist setup locally.

\---

# 5\. Home Screen

The Home screen should prioritize creation rather than analytics.

Desktop:

* greeting / business name
* large Create Invoice CTA
* Quick Invoice CTA
* current outstanding amount
* this month's invoiced amount
* this month's paid amount
* recent invoices
* overdue invoices if any

Mobile:

Large:

**+ New Invoice**

Secondary:

**Quick Invoice**

Then:

### Outstanding

₹XX,XXX

### Recent

Show 3–5 invoices.

Do not turn the home screen into a financial dashboard.

If there is no data, show an empty state:

> Your first invoice is just a few taps away.

CTA:

**Create your first invoice**

\---

# 6\. Quick Invoice

This is a key feature.

A user must be able to create an invoice without first creating a customer or product record.

Screen:

## Quick Invoice

Fields:

* Customer/name
* Customer email/phone — optional
* Item/service name
* Quantity
* Rate
* Discount — optional
* Tax — default None
* Invoice date
* Due date — optional
* Notes — optional

Button:

**Generate Invoice**

After generation:

Ask:

> Save this customer for next time?

Buttons:

* Save
* Not now

The invoice itself should be saved regardless.

\---

# 7\. Standard Create Invoice

The normal invoice builder should be a single streamlined screen.

Sections:

## Invoice

* Invoice number
* Invoice date
* Due date
* Customer

Customer selector must support:

* search
* recently used customers
* add new customer inline

Do not force navigation away from the invoice.

## Items

Each line item contains:

* service/product
* description
* quantity
* unit
* rate
* discount if enabled
* tax rate if enabled
* line total

Buttons:

**+ Add item**

Allow adding a new product/service inline.

## Totals

Calculate:

* subtotal
* discount
* taxable amount where relevant
* CGST
* SGST
* IGST
* other tax if configured
* total

The tax model must be flexible enough to support:

* no tax
* a single tax percentage
* Indian GST split
* custom tax

Do not assume every user needs GST.

## Payment

Options:

* Unpaid
* Partial
* Paid

For partial payment, allow amount received.

## Notes

Optional.

## Terms

Optional.

Primary actions:

**Preview**

**Generate Invoice**

Do not make the form feel like a multi-step wizard.

\---

# 8\. Invoice Numbering

Default:

`INV-0001`

Allow settings for:

* prefix
* starting number
* next number

Example:

`SI-2026-0001`

Ensure invoice numbers do not accidentally duplicate.

When an invoice is created, reserve the next number locally.

Allow manual invoice number override with validation.

\---

# 9\. Customer Management

Customer fields:

* name
* company
* email
* phone
* billing address
* GSTIN
* notes

Customer list:

* search
* sort
* recent customers
* total invoiced
* total paid
* outstanding

Customer detail:

### Customer Snapshot

* Total invoiced
* Total received
* Outstanding
* Number of invoices
* Last invoice

Show invoice history.

Actions:

* New Invoice
* Edit
* Delete
* Send Reminder

Do not call this a CRM.

\---

# 10\. Products / Services

Allow reusable products/services.

Fields:

* name
* description
* default rate
* unit
* default tax rate

Examples:

* Website Development
* SEO Maintenance
* Consulting
* Graphic Design
* Monthly Maintenance

When selected in an invoice, populate the defaults but allow editing.

\---

# 11\. Invoice History

Screen title:

**Invoices**

Top:

* search
* status filters
* date filter
* amount filter if practical

Statuses:

* Draft
* Unpaid
* Partial
* Paid
* Overdue

Each invoice row/card:

* invoice number
* customer
* amount
* date
* due date
* status

Actions:

* View
* Edit
* Duplicate
* Share
* Mark Paid
* Delete

For mobile, use cards rather than dense tables.

\---

# 12\. Duplicate / Repeat Invoice

This is a major convenience feature.

Click:

**Duplicate**

Create a new invoice using:

* same customer
* same items
* same tax configuration
* same notes
* same payment information
* same template

But automatically change:

* invoice number
* invoice date
* due date if appropriate

The user can edit before saving.

\---

# 13\. Invoice Presets

Allow users to save frequent configurations.

Example:

### Monthly Website Maintenance

Customer:
ABC Technologies

Service:
Website Maintenance

Amount:
₹25,000

GST:
18%

Template:
Modern

The user can select:

**Create from Preset**

and reach an almost-complete invoice.

Presets are more important than adding dozens of advanced features.

\---

# 14\. Smart Defaults

Remember:

* recently used customers
* recently used products
* frequently used tax rates
* preferred template
* preferred payment method
* invoice terms

When creating an invoice, prioritize recent/common choices.

Example:

If ABC Technologies was invoiced last month:

Show:

**ABC Technologies — Last invoice ₹25,000**

and allow one-tap selection.

\---

# 15\. Invoice Preview

Preview must closely resemble the actual PDF.

Provide:

* mobile preview
* desktop preview
* A4 preview

Actions:

* Download PDF
* Print
* Share
* WhatsApp
* Edit

Do not create a separate rendering engine that produces visibly different results from the PDF if avoidable.

\---

# 16\. Invoice Templates

Create approximately 6 original templates.

Suggested names:

1. Classic
2. Minimal
3. Modern
4. Compact
5. Bold
6. Elegant

Also include:

7. GST Invoice
8. Receipt

Do not create a drag-and-drop design editor.

Templates should be controlled layouts.

Users can customize:

* logo
* accent color
* font choice
* business information
* footer
* payment section
* UPI QR visibility

The user should get professional results without needing design skills.

\---

# 17\. Invoice Personality

Provide simple style choices:

* Professional
* Minimal
* Friendly
* Premium
* Modern

This should modify the template's visual treatment without requiring manual design.

Keep this feature lightweight.

\---

# 18\. Brand Settings

Settings > Business

Fields:

* business name
* logo
* phone
* email
* website
* address
* GSTIN
* PAN
* additional business information

Allow logo upload and local storage.

Optimize uploaded logos for size.

Do not upload them to a server in V1.

\---

# 19\. UPI

This is an important India-focused feature.

Settings > Payment

Fields:

* UPI ID
* bank account name
* account number
* IFSC
* bank name
* payment instructions

Checkbox:

**Show UPI QR on invoice**

Generate an invoice-specific UPI QR.

Where practical, encode:

* UPI ID
* payee/business name
* invoice amount
* invoice reference

The QR must be generated locally.

Do not integrate a payment gateway in V1.

Include a clear disclaimer if needed that successful payment is not automatically verified.

\---

# 20\. Payment Tracking

Invoice states:

### Unpaid

No payment recorded.

### Partial

Some payment recorded.

### Paid

Invoice balance is zero.

### Overdue

Due date has passed and balance remains.

For partial payments:

Allow:

* amount
* payment date
* method
* optional note

Methods:

* UPI
* Bank Transfer
* Cash
* Other

Do not build a complex accounting ledger.

\---

# 21\. Get Paid Mode

After invoice generation show:

# Invoice Ready ✓

Amount:

₹XX,XXX

Primary actions:

**Share Invoice**

**WhatsApp**

**Download PDF**

**Print**

**Mark as Paid**

If UPI is configured:

**Show Payment QR**

The purpose is to take the user from invoice creation directly toward payment.

\---

# 22\. WhatsApp Sharing

Do not depend on WhatsApp Business API.

Use standard device/web share capabilities where appropriate.

Generate a concise prefilled message.

Example:

> Hi Raj, your invoice INV-0025 for ₹59,000 is ready. Payment is due by 30 September. Thank you.

Provide message styles:

* Professional
* Friendly
* Short
* Gentle Reminder
* Final Reminder

Allow the user to edit the message before sharing if practical.

Do not send messages automatically.

\---

# 23\. Payment Reminder Generator

From an unpaid/overdue invoice:

**Send Reminder**

Show:

* invoice
* amount outstanding
* due date

Message choices:

### Gentle

A polite reminder.

### Professional

Formal business wording.

### Short

One or two lines.

### Final Reminder

Firm but professional.

Provide:

**Copy Message**

and

**Share on WhatsApp**

Do not use an AI API for these messages in V1.

Use predefined templates with variable substitution.

\---

# 24\. Outstanding Dashboard

Show only useful information.

Example:

## Outstanding

₹65,000

ABC Technologies — ₹40,000
XYZ Consulting — ₹25,000

Clicking a customer opens the relevant invoices.

Actions:

**Send Reminder**

**View Invoices**

No complex accounting reports.

\---

# 25\. Receipts

Support a simple receipt mode.

A receipt should contain:

* business
* receipt number
* customer
* amount received
* payment method
* payment date
* reference/invoice number
* notes
* logo

Provide:

**Generate Receipt**

This can reuse the PDF engine.

\---

# 26\. GST / Indian Invoice Support

Support common invoice requirements without pretending to be a complete GST filing system.

Support:

* GSTIN
* HSN/SAC field
* taxable value
* CGST
* SGST
* IGST
* GST rate
* place of supply where appropriate
* reverse charge indicator as an optional field if included

Allow users to select:

* intra-state
* inter-state
* no GST

Do not implement GST filing, returns, IRP integration or complex compliance automation in V1.

Include appropriate product wording:

> Swaniki Invoice helps create invoices; it is not a tax filing or accounting system.

\---

# 27\. Currency

Default:

INR ₹

Allow other currencies in settings.

At minimum support:

* INR
* USD
* EUR
* GBP
* AED

Use locale-aware number formatting.

Keep currency configuration simple.

\---

# 28\. Data Backup

Because data is local-first, this feature is mandatory.

Settings > Data

Provide:

**Export Backup**

Generate a JSON backup containing application data.

Provide:

**Import Backup**

Validate imported data before replacing/merging.

Do not overwrite existing data without confirmation.

Provide:

**Clear All Data**

with a strong confirmation step.

Explain clearly that clearing data is destructive.

\---

# 29\. Future Cloud Backup

Architect the data layer so a future cloud adapter can be introduced.

Do NOT implement cloud sync in V1.

Possible future:

* Google login
* Supabase
* cloud backup
* multi-device sync

These must not be hardcoded into the V1 architecture.

\---

# 30\. PWA Requirements

Implement:

* web app manifest
* installable PWA
* service worker
* offline app shell
* appropriate icons
* splash/launch behavior
* standalone display
* caching strategy
* version/update handling

After initial load, core application functionality should remain usable offline.

Show a subtle offline indicator when disconnected.

Example:

**Offline — your invoices are still available on this device.**

When connection returns, do not attempt unnecessary synchronization because V1 has no cloud backend.

\---

# 31\. Privacy

The UI can communicate:

> Your invoice data stays on this device unless you choose to export or share it.

Do not collect invoice/customer information through analytics.

Avoid third-party services for core functionality.

\---

# 32\. Responsive Design

## Mobile

Prioritize:

* large buttons
* one-column layout
* bottom navigation
* sticky primary action where useful
* bottom sheets for selection
* minimal tables
* thumb-friendly controls

## Tablet

Use two-column layouts where useful.

## Desktop

Use:

* compact sidebar
* wider invoice editor
* live invoice preview where space permits

The invoice editor can use:

```text
Left: form
Right: live preview
```

on sufficiently wide screens.

On mobile:

```text
Form
↓
Preview
```

\---

# 33\. Accessibility

Implement:

* semantic HTML
* keyboard navigation
* visible focus states
* accessible labels
* adequate contrast
* screen-reader-friendly buttons
* touch targets around 44px minimum
* no information conveyed by color alone

Do not sacrifice accessibility for visual minimalism.

\---

# 34\. Design System

Visual direction:

**Minimal premium utility.**

Avoid:

* excessive gradients
* glassmorphism
* huge decorative graphics
* excessive shadows
* flashy animations
* dashboard clutter

Prefer:

* clean typography
* whitespace
* subtle borders
* restrained rounded corners
* strong hierarchy
* excellent spacing
* calm visual language

The UI should feel credible for a business document.

Use a restrained default palette.

Allow user-selected accent colors for invoices, but do not let customization make the application visually chaotic.

\---

# 35\. Micro-interactions

Use subtle feedback:

* invoice created
* saved
* copied
* backup exported
* payment marked paid
* customer saved

Example toast:

**Invoice INV-0025 created.**

Avoid excessive animation.

\---

# 36\. Error Handling

Never silently fail.

Examples:

If PDF generation fails:

> We couldn't generate the PDF. Try Print → Save as PDF.

If invoice has no customer:

> Add a customer name before generating the invoice.

If invoice has no line items:

> Add at least one item.

If UPI ID is invalid:

> Please check the UPI ID.

If imported backup is invalid:

> This backup file isn't compatible with Swaniki Invoice.

Use friendly language.

\---

# 37\. Validation

Validate:

* invoice number uniqueness
* positive quantities
* valid rates
* valid tax percentages
* valid dates
* due date >= invoice date where applicable
* valid GSTIN format where validation is implemented
* reasonable UPI ID format
* valid email where supplied

Do not make optional fields mandatory.

\---

# 38\. Calculations

All financial calculations must be deterministic and testable.

Use decimal-safe arithmetic.

Do not rely on floating-point arithmetic directly for money where rounding could cause errors.

Define clear rounding rules.

Test:

* quantity × rate
* line discounts
* invoice discount
* tax
* CGST/SGST
* IGST
* partial payments
* balance
* rounding

Show consistent totals in:

* editor
* preview
* PDF
* history

\---

# 39\. Invoice Data Model

Design local schema approximately as:

Business:

* id
* name
* logo
* phone
* email
* website
* address
* gstin
* pan
* upiId
* bankDetails
* settings

Customer:

* id
* name
* company
* email
* phone
* address
* gstin
* notes
* createdAt
* updatedAt

Product:

* id
* name
* description
* rate
* unit
* taxRate
* createdAt
* updatedAt

Invoice:

* id
* invoiceNumber
* customerSnapshot
* items
* invoiceDate
* dueDate
* subtotal
* discount
* tax
* total
* amountPaid
* balance
* status
* paymentDetails
* notes
* terms
* template
* createdAt
* updatedAt

Payment:

* id
* invoiceId
* amount
* date
* method
* reference
* note

Preset:

* id
* name
* customerId optional
* items
* tax settings
* template
* notes

ApplicationSettings:

* invoicePrefix
* nextInvoiceNumber
* currency
* defaultTax
* defaultTerms
* defaultTemplate
* appearance

Prefer snapshots inside invoices for business/customer information that should remain historically accurate even if the customer record changes later.

\---

# 40\. State Management

Keep state management lightweight.

Do not introduce Redux unless genuinely required.

Separate:

* persistent data state
* invoice draft state
* UI state

Invoice draft should support autosave where practical.

Warn before losing unsaved changes.

\---

# 41\. Component Architecture

Suggested structure:

app/
page
invoices/
customers/
products/
settings/

components/
layout/
invoice/
customer/
product/
dashboard/
settings/
common/

lib/
db/
invoice/
calculations/
pdf/
qr/
whatsapp/
backup/
formatting/
validation/

types/
business
customer
product
invoice
payment
preset

Keep business logic out of presentation components.

\---

# 42\. PDF Requirements

The PDF must look professional.

Include:

* business identity
* logo
* invoice number
* invoice date
* due date
* customer information
* item table
* subtotal
* discounts
* taxes
* total
* amount paid
* balance
* payment details
* UPI QR if enabled
* notes
* terms
* footer

Avoid unnecessary branding.

Ensure:

* A4 layout
* correct page breaks
* repeated table headers if invoice spans pages
* no clipped text
* no overlapping elements
* readable typography

Test long business names, long addresses, many line items and long notes.

\---

# 43\. Receipt PDF

Receipt should be visually simpler than an invoice.

Include:

* receipt number
* invoice reference
* payer
* amount received
* date
* payment method
* payment reference
* business details

\---

# 44\. Sharing

Use the Web Share API when available.

Fallbacks:

* download PDF
* copy text
* WhatsApp link
* print

Do not assume every browser supports every share capability.

\---

# 45\. Search

Search should be fast and local.

Invoices:

* invoice number
* customer
* amount

Customers:

* name
* company
* email
* phone

Products:

* name
* description

Use debounced search only where necessary.

\---

# 46\. Empty States

Every major area needs a useful empty state.

Invoices:

> No invoices yet.
> Create your first invoice in under a minute.

Customers:

> Customers you invoice regularly will appear here.

Products:

> Save frequently used services to create invoices faster.

Outstanding:

> You're all caught up.

\---

# 47\. Delete Behavior

Never immediately destroy important financial records.

For invoices:

Show confirmation.

For customers/products:

Warn if they are referenced by existing invoices.

Historical invoices must remain intact even if a customer/product is deleted.

\---

# 48\. Dark Mode

Support system/light/dark if practical.

However, invoice PDFs should remain professionally printable regardless of application theme.

The invoice document itself should default to a white document background.

\---

# 49\. Optional AI — Do Not Implement in V1

Keep the architecture ready for future AI, but do not add an AI dependency to the core workflow.

Potential future feature:

## Natural Language Invoice

User enters:

> Create invoice for ABC Technologies for website maintenance 25000 plus 18% GST, due in 15 days.

The system converts this into structured invoice data.

Potential future features:

* AI extraction from pasted text
* AI invoice descriptions
* AI payment reminders
* natural-language invoice search

These are Phase 2+.

\---

# 50\. Future Shareable Invoice

Design the invoice model so a future backend can create:

`invoice.swaniki.com/i/ABC123`

The future customer-facing page could show:

* invoice
* payment status
* UPI
* payment link
* download
* contact business

Do not build this in V1.

\---

# 51\. Future Payment Integration

Do not integrate Razorpay/Stripe/etc. into V1.

Architect payment details so future payment providers can be added.

For V1:

UPI QR + manual payment tracking is sufficient.

\---

# 52\. Product Analytics

Do not collect sensitive invoice contents.

If analytics are eventually added, track only anonymous product events such as:

* invoice\_created
* pdf\_generated
* share\_clicked
* template\_selected
* pwa\_installed

Do not send:

* customer names
* invoice amounts
* phone numbers
* email addresses
* GSTIN
* UPI IDs

unless the user explicitly opts into a future cloud feature.

\---

# 53\. Performance

Target:

* fast first load
* minimal JavaScript
* lazy-load non-core features
* no unnecessary API calls
* no giant UI libraries
* optimized logo storage
* efficient IndexedDB queries
* instant local searches

The app should feel faster than traditional accounting software.

\---

# 54\. Security

Even though data is local:

* sanitize user-provided text
* prevent HTML injection in invoice preview
* validate imported backup data
* avoid unsafe HTML rendering
* avoid storing unnecessary secrets
* never store banking passwords
* never store payment credentials

\---

# 55\. Testing Requirements

Write tests for:

### Calculations

* basic invoice
* multiple items
* tax
* GST split
* discount
* partial payment
* rounding

### Invoice numbering

* sequential numbers
* custom prefixes
* duplicate prevention

### Data

* create/read/update/delete
* backup/export
* backup/import

### UI

* create invoice
* duplicate invoice
* mark paid
* create customer
* create product
* offline mode

### PDF

Test:

* one-page invoice
* multi-page invoice
* long customer details
* many line items
* UPI QR
* receipt

\---

# 56\. Seed / Demo Mode

For development only, provide optional demo data.

Include:

Business:
Swaniki Demo Studio

Customers:

* ABC Technologies
* XYZ Consulting

Products:

* Website Development
* Monthly Maintenance
* Consulting

Demo invoices:

* paid
* unpaid
* overdue
* partial

Do not automatically install demo data in production.

\---

# 57\. Development Phases

Implement in this exact order.

## Phase 1 — Foundation

* Next.js setup
* TypeScript
* Tailwind
* component system
* routing
* PWA
* IndexedDB/Dexie
* base layout
* responsive navigation

## Phase 2 — Business

* first-run setup
* business profile
* logo
* settings

## Phase 3 — Invoice Core

* invoice model
* invoice builder
* calculations
* invoice numbering
* draft handling

## Phase 4 — Customers \& Products

* customer CRUD
* product/service CRUD
* inline creation
* smart defaults

## Phase 5 — Invoice Lifecycle

* history
* statuses
* duplicate
* payment tracking
* outstanding

## Phase 6 — Documents

* preview
* PDF
* print
* receipt

## Phase 7 — Sharing \& Payments

* WhatsApp
* native share
* UPI QR
* payment details
* reminder messages

## Phase 8 — Customization

* templates
* personality
* accent
* fonts
* logo placement

## Phase 9 — Backup \& Offline

* backup
* restore
* offline behavior
* install flow
* update flow

## Phase 10 — Polish

* accessibility
* edge cases
* empty states
* error handling
* performance
* mobile testing
* PDF testing

\---

# 58\. Definition of Done

The application is considered V1 complete only when a new user can:

1. Open the PWA.
2. Enter basic business details.
3. Create a Quick Invoice.
4. Create a standard invoice.
5. Add/select a customer.
6. Add/select a service/product.
7. Calculate taxes correctly.
8. Preview the invoice.
9. Generate a professional PDF.
10. Print it.
11. Share it.
12. Generate a WhatsApp message.
13. Generate a UPI QR.
14. Mark the invoice paid.
15. See outstanding invoices.
16. Duplicate an invoice.
17. Customize the invoice template.
18. Export a backup.
19. Import a backup.
20. Use the core application offline.

\---

# 59\. UX Acceptance Criteria

A first-time user should be able to create a basic invoice without documentation.

The app should not require the user to understand:

* databases
* accounting systems
* tax terminology beyond what is necessary
* templates
* PWA concepts

A returning user should be able to create a common repeat invoice in approximately 20–45 seconds.

A simple one-off Quick Invoice should take less than 2 minutes for a first-time user.

\---

# 60\. Critical Scope Rule

If a proposed feature increases complexity without significantly improving:

**Create → Share → Get Paid**

do not add it to V1.

When uncertain, choose the simpler implementation.

\---

# 61\. Visual Quality Rule

Do not settle for a generic AI-generated SaaS dashboard.

The final interface should feel intentionally designed.

Prioritize:

* typography
* spacing
* alignment
* hierarchy
* invoice readability
* mobile ergonomics
* professional PDF output

Do not use:

* random gradients
* excessive cards
* excessive icons
* fake statistics
* decorative dashboards
* meaningless animations

\---

# 62\. Build Strategy

Do not attempt to generate the entire application in one uncontrolled pass.

Build incrementally.

After each major phase:

1. Run the application.
2. Test the main user flow.
3. Fix errors.
4. Inspect mobile layout.
5. Inspect desktop layout.
6. Test persistence.
7. Test refresh/reopen behavior.
8. Continue to the next phase.

Do not proceed while the core flow is broken.

\---

# 63\. Final Primary User Flow

The most important flow is:

Home

↓

**+ Create Invoice**

↓

Choose:

* Quick Invoice
* Standard Invoice

↓

Customer

↓

Items

↓

Tax / Discount

↓

Payment

↓

Preview

↓

**Generate**

↓

## Invoice Ready

↓

**WhatsApp / Share / PDF / Print / UPI / Mark Paid**

This flow must feel effortless.

\---

# 64\. Final Product Personality

Swaniki Invoice should feel:

* fast
* quiet
* professional
* trustworthy
* lightweight
* private
* Indian-business friendly
* useful

It should NOT feel:

* corporate
* accounting-heavy
* AI gimmicky
* feature bloated
* complicated
* sales-driven

The strongest differentiator is not the number of features.

It is:

> \*\*How little effort it takes to produce a professional invoice and get it to the customer.\*\*

Build around that principle throughout the implementation.

