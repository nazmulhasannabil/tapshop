# GOOGLE STITCH UI/UX MASTER PROMPT
## TAP-BASED FRIENDS SHOP BILLING APP

Design a complete modern mobile-first web application for tracking personal consumption at a small shop/canteen used regularly by a group of friends.

The application replaces a manual WhatsApp-based or paper-based bill tracking system.

The central interaction is:

> Tap an item → quantity increases → bill increases instantly.

The application should feel more like a polished casual mobile game than traditional accounting software.

Do NOT make it look like an accounting application.

---

# PRODUCT CONCEPT

Imagine a group of friends regularly visiting the same tea/snack shop.

Available items might include:

☕ Tea
☕ Coffee
🥤 Soft Drink
🍪 Biscuit
🍔 Burger
🥪 Sandwich
🍜 Noodles
🍟 Fries
🥤 Juice

Each user maintains their own running bill.

If someone drinks three teas:

They simply tap:

Tea
Tea
Tea

The interface immediately shows:

Tea × 3
৳30

and the total updates immediately.

No forms.

No checkout flow.

No confirmation dialogs.

No complicated accounting interaction.

The experience should be:

OPEN → TAP → TAP → TAP → DONE.

---

# DESIGN PERSONALITY

Create a visual language that combines:

- Casual mobile game
- Modern fintech application
- Habit tracker
- Friendly productivity app
- Premium SaaS product

The UI should feel:

- Playful
- Fast
- Energetic
- Friendly
- Modern
- Highly responsive
- Extremely intuitive
- Slightly addictive in a positive way

But NOT:

- childish
- cartoonish
- cluttered
- overly colorful
- casino-like
- overly gamified

Use subtle gamification.

---

# PRIMARY DESIGN PRINCIPLE

The item button is the product.

The user should immediately understand:

"If I consume something, I tap it."

Make the item cards visually prominent.

Make them feel tactile.

When tapped:

- Card slightly scales
- Quantity badge changes
- Small +1 animation appears
- Subtotal updates
- Total number animates
- Optional subtle haptic feedback on supported mobile devices

The interaction should feel satisfying.

---

# SCREEN 1 — USER HOME / BILLING SCREEN

This is the most important screen.

Design it mobile-first.

Top area:

Greeting:

"Hey Masood 👋"

Then:

"Today's Bill"

Large amount:

৳240

Below:

12 items

Then a compact progress/summary element.

---

# RECENT ITEMS

Immediately below the total:

"Recently Used"

Show horizontal cards or compact cards.

Example:

☕ Tea
৳10
×3

🥤 Coke
৳40
×1

🍪 Biscuit
৳20
×2

These should be the fastest items to tap.

---

# FREQUENT ITEMS

Section:

"Your Go-To's"

Show the items the user frequently consumes.

Make these visually recognizable.

Each item card should contain:

Icon
Item name
Price
Current quantity

Example:

┌────────────────┐
│ ☕             │
│                │
│ Tea            │
│ ৳10            │
│                │
│        × 3     │
└────────────────┘

The entire card should be tappable.

---

# ITEM INTERACTION

When user taps:

Tea × 3

it becomes:

Tea × 4

The interaction should have:

- subtle scale animation
- number transition
- small "+1" feedback
- updated subtotal
- updated total

The card should visually acknowledge the action.

Do not use a modal.

Do not navigate to another page.

Do not require confirmation.

---

# QUANTITY DECREASE

Every active item should expose a subtle minus control.

Example:

[-]   3   [+]

But "+" should NOT be the primary visual action.

The entire item card itself should add +1.

The minus control exists for corrections.

Make accidental quantity reduction difficult.

---

# FLOATING BILL SUMMARY

Create a persistent bottom summary.

Example:

┌─────────────────────────────────┐
│  8 items                    ৳240 │
│  View Bill                    →  │
└─────────────────────────────────┘

This should remain visible while scrolling.

It should feel like a game HUD / status bar.

It should not obstruct item cards.

---

# BILL DETAIL SCREEN / BOTTOM SHEET

When user taps "View Bill":

Show:

Today's Bill

Tea
3 × ৳10
৳30

Biscuit
2 × ৳20
৳40

Burger
1 × ৳80
৳80

-----------------

Total
৳150

Use a bottom sheet on mobile rather than navigating away when possible.

Allow:

- + quantity
- - quantity
- remove entry

Keep the interaction simple.

---

# ADD ITEM

Create a prominent but non-intrusive:

"+ Add Item"

button.

When tapped, show a beautiful compact bottom sheet.

Fields:

Item name

Price

Button:

"Create Item"

Example:

Item name:
[ Chicken Sandwich ]

Price:
[ ৳120 ]

[ Create Item ]

After creation:

- Item immediately appears
- Item becomes recently used
- User can immediately tap it

---

# ITEM ICONS

Give items optional visual icons/emoji-like identifiers.

Examples:

☕ Tea
🍪 Biscuit
🍔 Burger
🥪 Sandwich
🍟 Fries
🥤 Soft Drink

The visual icon should make scanning faster.

Allow the system to assign a sensible icon automatically, but do not make icon selection mandatory.

---

# PERSONAL DASHBOARD

Create a second user screen:

"Your Stats"

Show:

Today's Spend
৳240

This Week
৳1,120

This Month
৳4,850

Items
42

Most Used
☕ Tea

Then create a simple visual spending/activity chart.

Do not create complicated financial charts.

The dashboard should feel like a personal game statistics screen.

---

# ACTIVITY SCREEN

Show recent activity.

Example:

☕ Tea +1
2 minutes ago

🍔 Burger +1
18 minutes ago

☕ Tea +1
32 minutes ago

🍪 Biscuit +2
1 hour ago

Use a timeline-like interface.

---

# USER PROFILE

Simple profile screen.

Show:

Avatar

Name

Email

Total consumption

Favorite item

Member since

Settings

Logout

Keep it lightweight.

---

# ADMIN EXPERIENCE

The admin interface must have a completely different visual language.

Do NOT make the admin dashboard look like the game interface.

Admin should feel like a professional SaaS/data management system.

---

# ADMIN DASHBOARD

Desktop-first.

Top KPI cards:

Total Users
42

Today's Consumption
৳5,430

This Month
৳84,320

Total Entries
1,284

Active Today
31

Then:

Consumption chart

Daily activity

Most consumed items

Recent activity

---

# ADMIN USER TABLE

Create a polished data table.

Columns:

User
Today's Bill
This Month
Items
Last Active
Status
Actions

Actions:

View
Edit
History

Include:

Search
Filter
Sort
Pagination

---

# ADMIN USER DETAIL

Create a detailed user page.

Header:

Avatar
Name
Email
Status

Stats:

Today
This Week
This Month
Total

Transaction table:

Date
Item
Qty
Unit Price
Total
Actions

Each transaction should be editable.

---

# ADMIN CORRECTION FLOW

Design a clear correction interaction.

Example:

Original:

Tea × 5
৳50

Admin clicks Edit.

Show:

Quantity
[ 4 ]

Unit Price
[ ৳10 ]

New total:

৳40

Button:

"Save Correction"

Clearly communicate that this modifies an existing record.

Show a subtle audit indicator:

"Edited by Admin"

---

# ADMIN ACTIVITY FEED

Create a live activity panel.

Example:

Masood added Tea ×2

Rahim added Burger ×1

Admin corrected Masood's Tea entry

Karim created Sandwich

Show timestamps.

Make important corrections visually distinguishable from normal activity.

---

# NAVIGATION

USER MOBILE NAVIGATION:

Home
Activity
Stats
Profile

Keep the primary billing action on Home.

ADMIN NAVIGATION:

Dashboard
Users
Transactions
Items
Activity
Reports
Settings

Use a desktop sidebar.

On mobile, convert it to a compact navigation/drawer.

---

# RESPONSIVE BEHAVIOR

Design for:

360px
390px
430px
768px
1024px
1440px

The primary user experience must be optimized for phones.

Use:

- Large touch targets
- Comfortable spacing
- Thumb-friendly controls
- Bottom sheets
- Sticky bill summary
- Responsive item grid

Desktop should still look polished.

---

# VISUAL SYSTEM

Create a complete design system.

Define:

Typography
Spacing
Border radius
Elevation
Cards
Buttons
Inputs
Badges
Navigation
Bottom sheets
Tables
Charts
Empty states
Loading states
Error states

Use a modern sans-serif typography system.

Prioritize large readable numbers for money.

Money should have strong visual hierarchy.

Example:

৳240

should visually dominate:

"Today's Bill".

---

# COLOR DIRECTION

Use a modern neutral foundation.

Use one strong primary accent color.

Use semantic colors for:

Success
Warning
Error
Information

Do NOT use too many colors.

The UI should feel premium.

Use subtle gradients only where they improve hierarchy.

Avoid visual noise.

---

# MICROINTERACTIONS

This is extremely important.

Design interactions for:

1. Item tapped
2. Quantity increased
3. Quantity decreased
4. Bill total changed
5. Item created
6. Item removed
7. Bill opened
8. Bill saved
9. Admin correction saved

Examples:

When Tea is tapped:

Card slightly compresses.

Quantity:

2 → 3

A tiny "+1" floats upward.

Total:

৳120 → ৳130

The number smoothly transitions.

Keep animations fast.

Approximately:

150–250ms for most interactions.

Animations should communicate state, not decorate the UI.

---

# EMPTY STATES

Create friendly empty states.

Example:

"No snacks yet 👀"

"Tap an item when you grab something."

For no activity:

"Nothing here yet."

For no recent items:

"Your favorites will appear here."

Avoid generic corporate empty-state language.

---

# LOADING STATES

Create skeleton states for:

- User dashboard
- Item cards
- Bill
- Admin table
- Charts

The skeleton should preserve layout dimensions.

---

# ERROR STATES

Design friendly error messages.

Example:

"Couldn't save that tap."

[ Try Again ]

Do not show technical database errors.

---

# ACCESSIBILITY

Maintain:

- Strong contrast
- Large touch targets
- Keyboard support
- Screen-reader labels
- Focus states
- Reduced motion support

Do not rely solely on color or animation.

---

# GAME-LIKE DETAILS

Use subtle game-inspired patterns.

Possible elements:

"Today's streak"

"12 items today"

"Top choice: Tea"

"৳240 spent today"

But do NOT introduce unnecessary points, coins, badges, leaderboards, or competitive mechanics unless they clearly improve the product.

The app should feel playful primarily because the interaction is satisfying.

---

# IMPORTANT UX RULES

NEVER:

- Force the user through forms to record consumption
- Open a modal when tapping an item
- Require confirmation after every tap
- Hide the current total
- Make the user navigate away to add quantity
- Use tiny buttons
- Make the user manually calculate totals
- Overload the home screen with statistics

ALWAYS:

- Keep the main action visible
- Make item tapping immediate
- Show the updated total immediately
- Keep recent items at the top
- Make quantity obvious
- Make correction easy
- Keep the experience fast

---

# DESIGN DELIVERABLES

Generate a complete high-fidelity UI/UX system containing:

1. Mobile User Home
2. Mobile Bill Bottom Sheet
3. Add Item Bottom Sheet
4. User Stats
5. User Activity
6. User Profile
7. Desktop User Home
8. Admin Dashboard
9. Admin User Table
10. Admin User Detail
11. Admin Transaction Editor
12. Admin Activity Feed
13. Admin Items Management
14. Admin Reports
15. Empty states
16. Loading states
17. Error states
18. Responsive variants
19. Component states
20. Interaction/microanimation specifications

Make the screens feel like one cohesive product.

The final visual result should communicate:

"Tracking your shop bill is as easy as tapping a game."

Prioritize UX speed over visual complexity.