# Project TODO — Cactus Seeds Store

## Backend / Schema
- [x] Drizzle schema: categories, products, orders, orderItems, settings tables
- [x] Migration generated and applied to database
- [x] Settings seeded with defaults (whatsappNumber=650294923, contactEmail, onlinePaymentsEnabled)
- [x] tRPC routers: public catalog (products list w/ category+search filter, categories list, public settings)
- [x] tRPC routers: admin products CRUD (title, imageUrl, price, categoryId, description)
- [x] tRPC routers: admin categories create/rename/delete
- [x] tRPC routers: admin orders list
- [x] tRPC routers: admin settings get/update (whatsapp number, contact email, payments toggle)
- [x] adminProcedure guard (role=admin) on all admin routes

## Public Storefront
- [x] Peyoteseedsfarm-inspired theme: green palette, announcement bar, header w/ logo + search + cart button, nav bar
- [x] Homepage hero section + product catalog grid
- [x] Category filter tabs + search bar filtering catalog
- [x] Product cards: image, category label, title, price, Add to Cart button
- [x] Empty state (store starts with NO products)
- [x] Persistent cart icon in header with live item count (localStorage cart)
- [x] Cart page: item images, titles, unit prices, inline quantity adjust, remove, running total
- [x] "Checkout via WhatsApp" button → wa.me link w/ prefilled order message (items, qty, prices, total, payment request) using admin-configured number
- [x] "Pay Online Now" button — hidden/disabled when admin toggles payments off

## Stripe Integration
- [x] Stripe code path built (checkout session creation from cart) — dormant until keys are added
- [x] Success/cancel pages, webhook to record orders
- [x] Orders logged with customer name, email, items, payment status

## Admin
- [x] Hidden login route /manager-login (owner login via Manus OAuth, admin role check)
- [x] /admin/* routes redirect unauthenticated/non-admin users to homepage
- [x] WordPress-style floating admin bar on public site when admin logged in (Go to Dashboard, Add Product, Log Out)
- [x] Admin dashboard layout with sections: Products, Categories, Orders, Settings
- [x] Products section: table + create/edit dialog + delete
- [x] Categories section: create, rename, delete
- [x] Orders tab: customer name, email, items purchased, payment status
- [x] Settings panel: WhatsApp number, contact email, online payments toggle

## Testing / Delivery
- [x] Vitest unit tests for routers (catalog, admin CRUD, settings, auth guard)
- [x] End-to-end browser verification of storefront + admin flows
- [x] Checkpoint + delivery

## User change requests (Jul 24)
- [x] Skip Stripe keys; rework "Pay Online Now" into an email-based payment request flow using peyoteseedsfarm@gmail.com
- [x] Set default contact email to peyoteseedsfarm@gmail.com in settings (DB + fallback)
- [x] Log email payment-request orders in the admin Orders tab
- [x] Keep Stripe code path dormant so it can be re-enabled later by adding keys

## User change requests (Jul 24, round 2)
- [ ] Remove WhatsApp checkout button from cart page
- [ ] Single online checkout flow with form: name, email, phone number, shipping address, billing address
- [ ] Payment method selection: Cash App, PayPal, Venmo, Zelle, Bitcoin, Apple Pay, Chime, Bank transfer, Cryptocurrency, Wire transfer
- [ ] Enforce $100 minimum order total at checkout (client + server)
- [ ] Update orders schema/backend to store customer phone, addresses, and chosen payment method
- [ ] Show payment method and customer details in admin Orders tab
- [ ] Footer Quick Links: Home, About Us, Shop, Reviews, FAQ, Contact Us
- [ ] Create About Us page
- [ ] Create FAQ page
- [ ] Create Contact Us page
- [ ] Real review system: customers submit reviews, admin approves in dashboard, approved reviews shown on Reviews page
- [ ] Admin dashboard: Reviews moderation section
