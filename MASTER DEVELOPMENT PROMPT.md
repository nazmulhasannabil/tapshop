# MASTER DEVELOPMENT PROMPT
# FRIENDS SHOP BILL / CONSUMPTION TRACKER

Build a production-ready, mobile-first web application for tracking personal consumption and running bills at a small shop/canteen used regularly by a group of friends.

The application should replace manual WhatsApp/paper-based bill tracking.

The main interaction must feel like a simple casual game:

> See item → tap item → quantity increases → bill updates instantly.

The user should be able to record an item in less than two seconds.

Example:

Tea = ৳10

The user taps:

Tea
Tea
Tea

The application immediately shows:

Tea × 3 = ৳30

If the user then taps:

Burger = ৳80

the bill becomes:

Tea × 3 = ৳30
Burger × 1 = ৳80

TOTAL = ৳110

The application must persist the data to PostgreSQL.

There are exactly two roles:

- USER
- ADMIN

---

# 1. CORE PRODUCT PRINCIPLES

The application is NOT a traditional accounting application.

It is a:

> Fast personal consumption tracker with instant tap-based billing.

The most important screen is the USER HOME/BILLING SCREEN.

The user should NOT need to:

- Fill out an expense form
- Enter quantity manually
- Calculate totals
- Press Save after every item
- Confirm every action
- Navigate to another page to add an item

The primary interaction is simply:

```text
OPEN APP
    ↓
SEE ITEMS
    ↓
TAP ITEM
    ↓
QUANTITY +1
    ↓
TOTAL UPDATES
    ↓
DATABASE PERSISTS
```

---

# 2. TECHNOLOGY STACK

Use the following stack.

## Frontend

- Next.js
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Motion for micro-interactions

## State Management

Use Zustand for the fast client-side billing interaction.

Use Zustand primarily for:

- Current bill UI state
- Optimistic quantity updates
- Temporary interaction state
- Recent item state
- UI state

Do NOT treat Zustand as the database.

PostgreSQL remains the source of truth.

## Forms

- React Hook Form
- Zod

## Backend

Use Next.js as the backend.

Prefer:

- Server Actions
- Route Handlers
- Server Components

Do NOT introduce Express unless there is a specific architectural reason.

## Database

PostgreSQL.

Use:

- Neon PostgreSQL
- Drizzle ORM

## Authentication

Use a production-ready authentication solution such as Better Auth or Auth.js.

Do not implement authentication/session management manually.

## Admin

- TanStack Table
- Recharts

## PWA

Make the application installable as a Progressive Web App.

## Deployment

Recommended:

- Vercel
- Neon PostgreSQL

---

# 3. HIGH-LEVEL ARCHITECTURE

Use this architecture:

```text
                    USER
                     │
                     ▼
              Next.js Frontend
                     │
          ┌──────────┴──────────┐
          │                     │
       Zustand              Server Actions
          │                     │
          │                     ▼
          │               Validation / Auth
          │                     │
          │                     ▼
          │                Service Layer
          │                     │
          │                     ▼
          │                 Drizzle ORM
          │                     │
          │                     ▼
          └──────────────► PostgreSQL
```

For admin:

```text
ADMIN
  ↓
Admin Dashboard
  ↓
Server Authorization
  ↓
Admin Service Layer
  ↓
Drizzle ORM
  ↓
PostgreSQL
```

---

# 4. USER ROLES

## USER

Users can:

- Register
- Login
- Logout
- Create items
- View items
- Add items to their bill
- Increase quantity
- Decrease quantity
- Remove entries
- View current bill
- View billing history
- View personal statistics
- View recent activity
- View frequently used items
- Edit their own item information where allowed

Users cannot:

- View another user's private billing details
- Modify another user's bill
- Access admin pages
- Modify system-wide settings
- Modify audit logs

---

# 5. ADMIN

Admin can:

- View all users
- View user billing information
- View transactions
- Search users
- Filter transactions
- Modify incorrect entries
- Delete invalid entries
- View activity logs
- View item usage
- View total shop consumption
- View daily/monthly statistics
- Manage users
- Disable users
- Manage items
- Export billing information

Every admin modification must create an audit log.

---

# 6. USER FLOW

Implement the following user flow.

## First-time user

```text
Landing / Login
      ↓
Register
      ↓
Enter name
      ↓
Enter email
      ↓
Create password
      ↓
Account created
      ↓
User Home
```

## Returning user

```text
Login
  ↓
User Home
```

## Main billing flow

```text
User Home
    ↓
Recently Used Items
    ↓
Frequently Used Items
    ↓
All Items
    ↓
Tap Item
    ↓
Quantity +1
    ↓
Subtotal updates
    ↓
Total updates
    ↓
Persist to PostgreSQL
```

The user should remain on the same page.

---

# 7. MAIN USER SCREEN

Create a mobile-first dashboard.

Top:

```text
Hey Masood 👋

Today's Bill

৳240

12 items
```

Then:

```text
RECENTLY USED
```

Then:

```text
YOUR GO-TO ITEMS
```

Then:

```text
ALL ITEMS
```

Bottom:

```text
┌──────────────────────────────┐
│ 12 items               ৳240  │
│        View Bill →           │
└──────────────────────────────┘
```

The bottom bill summary should remain visible while scrolling.

---

# 8. ITEM CARD

Each item should be represented by a large touch-friendly card.

Example:

```text
┌────────────────────┐
│                    │
│        ☕          │
│                    │
│       Tea          │
│      ৳10           │
│                    │
│               ×3   │
└────────────────────┘
```

The entire card is the primary +1 button.

When tapped:

```text
quantity: 3 → 4
```

The UI should update immediately.

---

# 9. ITEM INTERACTION

When an item is tapped:

1. Update Zustand state immediately.
2. Animate the quantity.
3. Animate the total.
4. Show subtle +1 feedback.
5. Send mutation to server.
6. Server validates authenticated user.
7. Server performs atomic database operation.
8. Database saves transaction.
9. Client reconciles state with server response.

Never wait for the database response before showing the initial UI feedback.

---

# 10. ZUSTAND BILL STORE

Create a dedicated Zustand store.

Example architecture:

```text
stores/
└── bill-store.ts
```

Use a structure similar to:

```ts
type BillItem = {
  itemId: string
  name: string
  unitPrice: number
  quantity: number
}

type BillStore = {
  items: Record<string, BillItem>

  total: number

  addItem: (item: {
    itemId: string
    name: string
    unitPrice: number
  }) => void

  decreaseItem: (itemId: string) => void

  removeItem: (itemId: string) => void

  clearBill: () => void
}
```

Example:

```ts
import { create } from "zustand"

export const useBillStore = create<BillStore>((set) => ({
  items: {},
  total: 0,

  addItem: (item) =>
    set((state) => {
      const existing = state.items[item.itemId]

      const quantity = existing
        ? existing.quantity + 1
        : 1

      const updatedItem = {
        ...item,
        quantity,
      }

      const items = {
        ...state.items,
        [item.itemId]: updatedItem,
      }

      const total = Object.values(items).reduce(
        (sum, current) =>
          sum + current.quantity * current.unitPrice,
        0
      )

      return {
        items,
        total,
      }
    }),

  decreaseItem: (itemId) =>
    set((state) => {
      const existing = state.items[itemId]

      if (!existing) {
        return state
      }

      if (existing.quantity <= 1) {
        const items = { ...state.items }

        delete items[itemId]

        const total = Object.values(items).reduce(
          (sum, current) =>
            sum + current.quantity * current.unitPrice,
          0
        )

        return {
          items,
          total,
        }
      }

      const items = {
        ...state.items,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      }

      const total = Object.values(items).reduce(
        (sum, current) =>
          sum + current.quantity * current.unitPrice,
        0
      )

      return {
        items,
        total,
      }
    }),

  removeItem: (itemId) =>
    set((state) => {
      const items = { ...state.items }

      delete items[itemId]

      const total = Object.values(items).reduce(
        (sum, current) =>
          sum + current.quantity * current.unitPrice,
        0
      )

      return {
        items,
        total,
      }
    }),

  clearBill: () => ({
    items: {},
    total: 0,
  }),
}))
```

Improve this implementation as necessary for production.

Do not blindly copy this example.

Consider:

- selectors
- derived totals
- race conditions
- optimistic updates
- rollback
- server reconciliation

---

# 11. IMPORTANT RAPID-TAP REQUIREMENT

The user may tap:

```text
Tea
Tea
Tea
Tea
Tea
Tea
Tea
Tea
Tea
Tea
```

very quickly.

The final quantity MUST be:

```text
10
```

Never implement a mutation that simply says:

```text
client reads quantity
+
1
client sends new quantity
```

because concurrent requests can overwrite each other.

Prefer an atomic server operation such as:

```text
quantity = quantity + 1
```

or an append-only event model.

The backend must be safe against rapid repeated taps.

---

# 12. DATABASE DESIGN

Use PostgreSQL.

The initial database should contain:

```text
users
items
bill_entries
activity_logs
```

Design the schema so that a future `shops` or `workspaces` table can be introduced without a complete rewrite.

---

# 13. USERS TABLE

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'USER',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    last_active_at TIMESTAMPTZ
);
```

Roles:

```text
USER
ADMIN
```

Use enums if appropriate.

---

# 14. ITEMS TABLE

```sql
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    price NUMERIC(12,2) NOT NULL,

    created_by UUID NOT NULL
        REFERENCES users(id),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Price must always be positive.

---

# 15. BILL ENTRIES TABLE

This is the most important table.

```sql
CREATE TABLE bill_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    item_id UUID NOT NULL
        REFERENCES items(id),

    quantity INTEGER NOT NULL,

    unit_price NUMERIC(12,2) NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL,

    consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

IMPORTANT:

`unit_price` is a snapshot.

Do NOT calculate historical transactions using the current item price.

Example:

Monday:

Tea = ৳10

Tuesday:

Tea = ৳15

Monday's transaction must remain:

Tea × 2 = ৳20

even after the item price becomes ৳15.

---

# 16. ACTIVITY LOG TABLE

```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_id UUID NOT NULL
        REFERENCES users(id),

    target_user_id UUID
        REFERENCES users(id),

    entity_type VARCHAR(50) NOT NULL,

    entity_id UUID,

    action VARCHAR(100) NOT NULL,

    old_value JSONB,

    new_value JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Examples:

```text
USER_ADDED_ITEM
USER_ADDED_QUANTITY
USER_DECREASED_QUANTITY
USER_REMOVED_ENTRY
ADMIN_CORRECTED_ENTRY
ADMIN_DELETED_ENTRY
ADMIN_CHANGED_ITEM
```

---

# 17. DATABASE INDEXES

Create indexes for common queries.

Examples:

```sql
CREATE INDEX idx_bill_entries_user
ON bill_entries(user_id);

CREATE INDEX idx_bill_entries_user_date
ON bill_entries(user_id, consumed_at DESC);

CREATE INDEX idx_bill_entries_item
ON bill_entries(item_id);

CREATE INDEX idx_items_recent
ON items(last_used_at DESC);

CREATE INDEX idx_activity_created
ON activity_logs(created_at DESC);
```

Add additional indexes based on actual query patterns.

---

# 18. DRIZZLE STRUCTURE

Use:

```text
src/db/
├── index.ts
├── schema/
│   ├── users.ts
│   ├── items.ts
│   ├── bill-entries.ts
│   └── activity-logs.ts
└── migrations/
```

Define PostgreSQL tables using Drizzle.

Use migrations.

Never manually modify production tables without migrations.

---

# 19. SERVER ACTIONS

Create server actions such as:

```text
createItem()
addItemToBill()
decreaseItemQuantity()
removeBillEntry()
getCurrentBill()
getUserHistory()
getUserStats()
getRecentItems()
getFrequentItems()
```

Admin:

```text
getAdminDashboard()
getUsers()
getUserDetails()
getUserTransactions()
correctTransaction()
deleteTransaction()
getActivityLogs()
exportBillingData()
```

Every mutation must:

1. Authenticate user.
2. Check authorization.
3. Validate input using Zod.
4. Perform database operation.
5. Create audit log where required.
6. Return structured result.

---

# 20. ZOD VALIDATION

Create schemas:

```text
src/lib/validations/
├── auth.ts
├── item.ts
├── billing.ts
└── admin.ts
```

Example:

```ts
const createItemSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100),

  price: z
    .number()
    .positive()
    .max(100000),
})
```

Never trust client-side validation alone.

---

# 21. ADMIN DASHBOARD

Create:

```text
/admin/dashboard
```

Show:

```text
Total Users
Today's Total
This Month
Total Entries
Active Users
```

Charts:

- Daily consumption
- Monthly consumption
- Most consumed items
- User activity

---

# 22. ADMIN USER TABLE

Columns:

```text
User
Today's Bill
Monthly Bill
Items
Last Active
Status
Actions
```

Features:

- Search
- Sort
- Filter
- Pagination
- User details
- Transaction history

---

# 23. ADMIN CORRECTION FLOW

Example:

Original:

```text
Tea × 5
৳50
```

Admin selects Edit.

Change:

```text
Quantity = 4
```

New total:

```text
৳40
```

On save:

```text
Database updated
      ↓
Totals recalculated
      ↓
Audit log created
      ↓
Admin sees confirmation
```

Audit should preserve:

```text
Who changed it
When
Original value
New value
Reason
```

---

# 24. USER STATISTICS

Show:

```text
Today's Spend
Weekly Spend
Monthly Spend
Total Items
Most Used Item
Average Daily Spend
```

Use simple visualizations.

Do not turn the product into complex financial software.

---

# 25. RECENT ITEMS

Recent items should be based on usage.

Example:

```text
Recently Used

Tea
Burger
Biscuit
Coffee
```

Sort based on actual recent usage.

Do not simply sort alphabetically.

---

# 26. FREQUENT ITEMS

Calculate based on usage history.

Example:

```text
Your Go-To's

☕ Tea
🍪 Biscuit
🥤 Coke
```

This makes the application progressively faster to use.

---

# 27. ITEM CREATION FLOW

User taps:

```text
+ Add Item
```

Open a bottom sheet.

Fields:

```text
Item Name
Price
```

Submit.

Then:

```text
Create item
    ↓
Save PostgreSQL
    ↓
Add item to UI
    ↓
Mark recently used
    ↓
User can immediately tap it
```

---

# 28. AUTHORIZATION

A USER must NEVER be able to:

```text
GET another user's bill
UPDATE another user's bill
DELETE another user's bill
```

Never rely on:

```ts
if (role === "ADMIN")
```

only in the frontend.

Authorization must happen on the server.

Derive the user identity from the authenticated session.

Never accept an arbitrary `userId` from the client as proof of ownership.

---

# 29. SECURITY

Implement:

- Secure authentication
- Session management
- Password hashing
- Role-based authorization
- Zod validation
- Server-side authorization
- Rate limiting
- SQL injection protection through Drizzle
- Audit logging
- Secure environment variables
- Secure cookies
- CSRF protection where applicable

Never expose:

```text
DATABASE_URL
AUTH_SECRET
PRIVATE_KEYS
```

to the client.

---

# 30. PWA

Make the application installable.

The user should be able to add:

```text
Shop Bill
```

to their phone home screen.

The application should feel like a native mobile app.

Optimize:

- Touch interactions
- Offline shell
- Loading
- Mobile navigation
- Bottom sheets

If offline billing is implemented, create an explicit synchronization strategy and prevent duplicate transactions.

Do not pretend an offline transaction is permanently saved until synchronization succeeds.

---

# 31. PROJECT FOLDER STRUCTURE

Use:

```text
src/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (user)/
│   │   ├── home/
│   │   ├── history/
│   │   ├── stats/
│   │   └── profile/
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── transactions/
│   │   ├── items/
│   │   ├── activity/
│   │   └── reports/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── billing/
│   ├── user/
│   ├── admin/
│   └── shared/
│
├── actions/
│   ├── billing.ts
│   ├── items.ts
│   ├── users.ts
│   └── admin.ts
│
├── db/
│   ├── index.ts
│   ├── schema/
│   └── migrations/
│
├── stores/
│   └── bill-store.ts
│
├── lib/
│   ├── auth/
│   ├── permissions/
│   ├── validations/
│   └── utils/
│
├── hooks/
│
├── types/
│
└── config/
```

Keep business logic outside React components.

---

# 32. COMPONENT STRUCTURE

Create reusable components such as:

```text
components/billing/

BillItemCard
ItemGrid
RecentItems
FrequentItems
BillSummary
BillBottomSheet
AddItemSheet
QuantityControl
BillTotal
ActivityItem
```

Admin:

```text
components/admin/

AdminSidebar
KpiCard
UserTable
TransactionTable
ActivityFeed
ConsumptionChart
TransactionEditor
```

---

# 33. ERROR HANDLING

Handle:

- Network failure
- Database failure
- Authentication failure
- Authorization failure
- Invalid item
- Deleted item
- Rapid taps
- Duplicate requests
- Concurrent updates

If an optimistic update fails:

```text
Optimistic UI
    ↓
Server failure
    ↓
Rollback Zustand state
    ↓
Show retry message
```

Never silently lose a transaction.

---

# 34. TESTING

Test the critical billing logic.

Unit tests:

```text
add item
increase quantity
decrease quantity
remove item
calculate subtotal
calculate total
price snapshot
```

Integration tests:

```text
user adds item
rapid repeated taps
admin correction
authorization
audit logging
```

Security tests:

```text
user cannot access admin
user cannot access another user's bill
user cannot modify another user's transaction
```

---

# 35. DEVELOPMENT ORDER

Implement in this order:

## Phase 1

Project setup

- Next.js
- TypeScript
- Tailwind
- shadcn
- ESLint
- Prettier

## Phase 2

Database

- Neon
- PostgreSQL
- Drizzle
- Schema
- Migrations
- Seed data

## Phase 3

Authentication

- Register
- Login
- Logout
- Sessions
- Roles

## Phase 4

Core billing

- Item grid
- Zustand store
- Add item
- Quantity
- Total
- Server persistence

## Phase 5

History

- Today's bill
- Previous bills
- Personal statistics

## Phase 6

Admin

- Dashboard
- Users
- Transactions
- Corrections
- Activity logs

## Phase 7

Polish

- Animations
- PWA
- Responsive design
- Loading states
- Error states
- Accessibility

## Phase 8

Testing and production

- Unit tests
- Integration tests
- Security testing
- Database migration verification
- Production deployment

---

# 36. FINAL IMPLEMENTATION PRINCIPLE

The most important UX loop is:

```text
SEE
 ↓
TAP
 ↓
INSTANT FEEDBACK
 ↓
TOTAL CHANGES
 ↓
SAVED
```

Optimize everything around this loop.

Do not sacrifice this interaction for unnecessary complexity.

Build the system as a real production application rather than a static prototype.

Before coding, first output:

1. Architecture
2. Database ERD
3. PostgreSQL schema
4. Route structure
5. User flow
6. Admin flow
7. State-management architecture
8. Data flow

Then implement the application incrementally.