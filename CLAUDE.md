@AGENTS.md

# LVN’LARGE — MASTER PROJECT BRIEF & DEVELOPMENT INSTRUCTIONS

## 1. PROJECT OVERVIEW

Project Name: LVN’LARGE E-Commerce Website

Brand Name: LVN’LARGE (Living Large)

Brand Motto: Wear luxury. Feel luxury. Be luxury.

Welcome Statement: LIVE LARGE. THE WORLD IS YOURS.

Project Type: Full-stack fashion e-commerce website.

Primary Market: Nigeria.

Payment Provider: Paystack.

Initial Fulfilment Method: Physical pickup only.

Target Launch Date: December 15, 2026.

Development Objective: Build a complete, functional, secure, responsive and visually impressive e-commerce platform for LVN’LARGE.

This is a real commercial fashion brand website, not a static demonstration, portfolio mockup or frontend-only prototype.

The website must support real products, customers, payments, inventory, orders, collections and administrative operations.

---

## 2. BRAND IDENTITY

LVN’LARGE is a fashion and streetwear brand built around creativity, individuality, self-expression and premium fashion.

The brand should communicate confidence, uniqueness, luxury and modern streetwear culture.

### Visual Identity

Primary colours:

- Black
- Silver
- Dark army green

Avoid bright green and unnecessary colourful combinations.

Design direction:

- Premium streetwear.
- Modern editorial fashion.
- Strong typography.
- Elegant layouts.
- Immersive visuals.
- Smooth but purposeful animations.
- High-quality product presentation.

Dark mode should be the default theme.

Provide an optional light mode with its own carefully designed colour system. Do not simply invert the dark theme.

Remember the visitor's selected theme.

The website should feel like an established fashion label rather than a generic online store.

### Creative Inspiration

Use these websites as references for design inspiration and shopping experience:

MOTION:
[https://motion-clothing-brand.vercel.app/](https://motion-clothing-brand.vercel.app/)

BOLA PSD:
[https://www.bolapsd.xyz/](https://www.bolapsd.xyz/)

These are references, not templates to copy. LVN’LARGE must have its own identity.

---

## 3. WEBSITE ENTRY EXPERIENCE

### Email Entry

When a visitor first accesses the website, display a small email-entry experience.

The visitor enters an email address and presses Subscribe.

After submission, display:

"Thank you for subscribing."

Then allow the visitor to proceed into the store.

Requirements:

- Record visitor email addresses.
- Count and manage email registrations.
- Validate email addresses.
- Prevent unnecessary duplicate records.
- Provide a way to manage email records in the admin dashboard.
- No compulsory password or account registration.

IMPORTANT:
Distinguish between providing an email to access the store and explicitly consenting to receive marketing emails. Do not automatically treat an email-entry action as marketing consent.

### Welcome Screen

After email entry, show an immersive welcome screen.

The welcome screen should:

- Occupy the full screen.
- Use the founder's personal fashion/model photograph as the background.
- Display "WELCOME TO LIVING LARGE".
- Display "LIVE LARGE. THE WORLD IS YOURS."
- Use premium typography and subtle animation.
- Allow visitors to scroll into the main website.

This should feel like entering a fashion campaign, not a login page.

The founder will provide the photograph and relevant visual assets.

---

## 4. MAIN NAVIGATION

The website header should contain:

1. Home
2. Living Large Collections
3. Shop All
4. Gallery Dept.
5. About

Additional controls:

- LVN’LARGE logo.
- Shopping bag/cart icon.
- Search.
- Dark/light mode toggle.
- Mobile navigation menu.

The header should appear after the welcome screen and remain accessible while browsing.

Navigation must work correctly on desktop, tablet and mobile.

---

## 5. HOME PAGE

The homepage should be an immersive fashion-shopping experience.

It must not look like a plain catalogue.

Include:

- Featured fashion visuals.
- Interactive product and campaign carousel.
- Collection previews.
- Featured products.
- New arrivals.
- Promotional sections.
- Coming Soon section.
- Brand storytelling.
- Footer.

### Featured Carousel

The carousel should:

- Rotate automatically approximately every 5-10 seconds.
- Allow manual navigation.
- Support touch/swipe gestures.
- Work on mobile and desktop.
- Pause or behave accessibly when visitors interact with it.

### Coming Soon

Create a section for products that have not officially launched.

Possible future products:

- Belts.
- Beanies.
- Wristwatches.
- Other accessories.

These products must not be purchasable until officially released.

The administrator should be able to manage this section.

---

## 6. LIVING LARGE COLLECTIONS

Create a dedicated collections page.

Initial collections:

### A. SWAGGING SINCE 06
A typography-focused collection with expressive text, fashionable statements and premium streetwear styling.

The visual direction should communicate confidence and a distinctive fashion identity.


### B.  AFTER ONE ART

A creative collection featuring unusual and abstract artwork, paintings, drawings and artistic graphics printed on clothing alongside LVN’LARGE branding.

### C.  SWAG AFFAIRS POLO
Focuses on POLO only, with very nice detailed designs, comes with different colors.
The visual direction should communicate confidence and a distinctive fashion identity.

### D. PLAIN TEES/JOGGERS

A collection of plain T-shirts and plain joggers only, in different colours and sizes.

It contains no printed, branded or customised designs. Customised joggers belong in LVN'LRG Joggers (Collection E).

This is an important commercial category for the brand.

### E. LVN'LRG Joggers

The owner's customised LVN'LARGE joggers merch.

These are branded/customised joggers, distinct from the plain joggers in Collection D.

The visual direction should communicate confidence and a distinctive fashion identity.

### F. COMBINE YOU

A styling-focused collection presenting curated combinations of LVN’LARGE products.

Example:

- Polo shirt.
- Joggers.
- Cap.
- Choker or other accessories.

The purpose is to help customers discover how different pieces work together.

### G. CAP A LOT

A collection for:

- Trucker hats.
- Snapbacks.
- Other caps and headwear.

### Collection Management

Each collection should have:

- Collection name.
- Cover image.
- Description.
- Product assignments.
- Featured status.
- Publication status.
- Display order.

Collections must be database-driven and dynamically manageable through the admin dashboard.

The owner must be able to create new collections without requiring a developer.

A product may belong to more than one collection.

Collections and products must remain separate concepts in the database.

---

## 7. SHOP ALL

Create a central product catalogue containing products from all collections.

Customers should not need to visit individual collections to find products.

Include filters for:

- Collection.
- Product type.
- Size.
- Colour.
- Price range.
- Availability.
- New arrivals.

Product types should be extensible.

Initial product types include:

- Polo shirts.
- Joggers.
- Trucker hats.
- Snapbacks.
- Plain T-shirts.
- Graphic round-neck T-shirts.
- Other confirmed clothing products.

Do not assume the meaning of unclear product names. Ask the owner when clarification is needed.

The product system must support new product categories in the future.

---

## 8. PRODUCT DETAIL PAGES

Every product must have its own detailed page.

Display:

- Product name.
- Multiple product photographs.
- Product description.
- Price.
- Available sizes.
- Available colours where applicable.
- Size guide.
- Quantity selector.
- Stock availability.
- Add to Cart button.
- Related products.
- Complete the Look suggestions where applicable.

Use detailed product names.

Example:
"Money Motion Swag C"

Do not use generic product names when the owner has supplied a specific name.

### Sizes

Support configurable sizes. The owner's confirmed sizes are:
S, M, L, XL, XXL and 3XL, plus One Size for caps. LVN’LARGE does not use XS.

The administrator must be able to configure available sizes for individual products.

Unavailable sizes must be visibly marked and disabled.

### Colours

Not every product needs a colour selector.

If a product is a specific green T-shirt, for example, it may simply be listed as a green product.

Where a product has multiple colour variants:

- Display selectable colour options.
- Update product photographs when the selected colour changes.
- Display availability for the selected colour.

### Variant Inventory

Every size-colour combination must have its own stock record.

Example:

- Black / Medium.
- Black / Large.
- Green / Medium.
- Green / Large.

Do not combine stock for different variants.

### Size Guide

Provide a size guide accessible without leaving the product page.

Allow the administrator to configure measurements for different garment types.

---

## 9. ADD TO CART EXPERIENCE

When a customer clicks Add to Cart:

- Keep the customer on the product page.
- Show a small confirmation message.
- Display "Added to your bag successfully".
- Show the product name.
- Show selected size and colour.
- Show quantity.
- Provide an option to view the bag.
- Automatically update the cart icon count.

The confirmation should disappear after a few seconds.

Do not redirect customers automatically to checkout.

---

## 10. SHOPPING BAG

The shopping bag must have two experiences.

### A. Slide-Out Bag Preview

When the customer clicks the cart icon, open a slide-out shopping bag.

Display:

- Product image.
- Product name.
- Selected size.
- Selected colour.
- Quantity.
- Price.
- Subtotal.
- View Bag.
- Proceed to Checkout.

### B. Full Shopping Bag Page

Create a dedicated shopping bag page.

Customers must be able to:

- Review products.
- Change quantities.
- Remove products.
- Review selected variants.
- See individual prices.
- See subtotal.
- Proceed to checkout.

### Persistent Cart

Cart items should remain available if customers close the website and return later.

Support persistent carts without requiring a password-based customer account.

Where appropriate, associate a cart with the customer's verified email or a secure anonymous session.

IMPORTANT:
Adding an item to the cart does not reserve stock.

Validate stock again during checkout and before order confirmation to prevent overselling.

---

## 11. CHECKOUT

The initial checkout experience is for physical pickup only.

Collect:

Required:

- Customer's full name.
- Email address.
- Phone number.

Optional:

- Additional order or pickup instructions.

Do not request a delivery address during the initial launch because delivery is not currently offered.

Display:

- Product names.
- Selected sizes.
- Selected colours.
- Quantities.
- Individual prices.
- Subtotal.
- Applicable charges.
- Total amount payable.

The checkout must be simple, secure and mobile-friendly.

Do not force customers to create an account.

---

## 12. PHYSICAL PICKUP

Initial fulfilment method: PHYSICAL PICKUP ONLY.

The exact pickup location has not yet been decided.

Pickup location will be arranged with each customer after an order has been successfully paid for.

Expected process:

1. Customer completes checkout.
2. Customer pays.
3. Server verifies the payment.
4. Order appears in the admin dashboard.
5. LVN’LARGE contacts the customer.
6. Both parties agree on a pickup location and time.
7. Customer receives the pickup details.
8. Customer presents a unique order reference or pickup code.
9. Administrator marks the order as collected.

Suggested order statuses:

- Payment Pending.
- Paid.
- Processing.
- Pickup Arrangement Pending.
- Ready for Pickup.
- Collected.
- Cancelled.
- Refunded.

Store pickup location, agreed date and time against the order.

Design the system so delivery can be introduced in the future without rebuilding the entire checkout process.

---

## 13. PAYSTACK PAYMENT INTEGRATION

Payment provider: Paystack.

The owner has not yet completed Paystack business verification.

Current business registration situation:
LVN’LARGE has not been registered with CAC.

The owner is setting up a Paystack account and intends to use the appropriate Starter Business account if eligible.

### Preferred Payment Experience

Use an embedded Paystack payment experience.

The customer should feel that payment is part of the LVN’LARGE checkout journey.

Use Paystack's supported integration, such as its Inline/Popup experience.

Do not build a custom card collection system.

Paystack should securely handle sensitive payment information.

### Security Requirements

- Keep Paystack secret keys on the server.
- Never expose secret keys in frontend code.
- Use environment variables.
- Never commit credentials to GitHub.
- Verify transactions server-side.
- Verify webhook signatures.
- Use transaction references.
- Implement idempotency.
- Prevent duplicate order processing.
- Handle failed and abandoned payments.
- Handle delayed payment confirmations.
- Handle duplicate webhook events.
- Validate stock before finalizing orders.

Never mark an order as paid simply because:

- The customer returns to the website.
- The frontend reports success.
- The customer uploads a payment screenshot.

Only trusted server-side payment verification can confirm payment.

### Payment Experience

If payment fails:

- Keep the customer's order information available.
- Allow the customer to retry.
- Avoid forcing the customer to restart shopping.

Use Paystack Test Mode during development.

Do not switch to live payments until the account is approved and the integration has been tested.

---

## 14. POST-PAYMENT EXPERIENCE

After successful server-side payment verification, display a full-screen LVN’LARGE confirmation experience.

The design should use:

- Dark background.
- Silver and dark army-green accents.
- LVN’LARGE branding.
- Smooth logo animation.
- Subtle transitions.

Main text:

"YOUR ORDER IS CONFIRMED."

"WELCOME TO THE LIVING LARGE EXPERIENCE."

Display:

- Unique order number.
- Confirmation that payment was successful.
- Information that LVN’LARGE will contact the customer to arrange pickup.

Provide:

- View Order.
- View/Download Receipt.
- Return to Store.

The order confirmation must remain accessible if the customer closes the page.

Respect reduced-motion accessibility preferences.

---

## 15. RECEIPTS

Implement personalized LVN’LARGE receipts.

The proposed receipt should include:

- Brand logo.
- Unique order reference.
- Customer name.
- Customer email.
- Customer phone number.
- Order date.
- Product names.
- Product variants.
- Sizes.
- Colours.
- Quantities.
- Individual prices.
- Subtotal.
- Applicable charges.
- Total paid.
- Payment method where available.
- Paystack payment reference.
- Payment status.

Provide a downloadable PDF receipt.

Consider email delivery and access through the order-tracking page.

IMPORTANT:
Confirm the owner's preferred receipt-generation and delivery workflow before finalizing it.

Receipts must reflect verified payment information.

---

## 16. ORDER TRACKING

Customers must be able to track their orders without creating a traditional account.

Support two methods:

1. Email address + order reference.
2. Private order-tracking link sent after purchase.

The tracking page should display:

- Order reference.
- Products ordered.
- Payment status.
- Order status.
- Pickup arrangement status.
- Relevant updates.

Security requirements:

- Use secure, unguessable tracking tokens.
- Protect customer information.
- Apply reasonable rate limits.
- Never expose other customers' orders.

---

## 17. GALLERY DEPT.

Gallery Dept. is a fashion lookbook and editorial gallery, not another product catalogue.

It should contain:

- Founder fashion photographs.
- Professional model photographs.
- Customer photographs.
- Campaign images.
- Editorial fashion photography.
- Relevant AI-generated campaign concepts.

Where appropriate, gallery images can link to the actual products being worn.

AI-generated imagery must not misrepresent the actual product.

If an image is conceptual rather than an accurate representation of a real product, it must not be presented as proof of the product's actual appearance.

The owner should be able to manage gallery content from the admin dashboard.

---

## 18. ABOUT PAGE

Create a premium brand-storytelling page.

Include:

- LVN’LARGE origin story.
- Brand identity.
- Brand philosophy.
- Creative direction.
- Purpose.
- Meaning behind Living Large.
- Founder journey.

Avoid generic corporate language.

The owner will provide and approve the final brand story.

---

## 19. ADMIN DASHBOARD

The owner is the initial administrator and founder/CEO.

Build a secure admin dashboard for managing the entire store.

### Mobile-First Admin

The owner manages products, photos and stock from an iPhone.

Every admin screen must be designed mobile-first and be easy to use on a phone:

- Large tap targets and readable text.
- Form inputs that do not trigger iOS zoom (16px or larger).
- Photo upload directly from the iPhone camera or photo library.
- Navigation reachable with one thumb.
- No feature that only works on a desktop.

### Dashboard Overview

Display:

- Total orders.
- Total revenue.
- Paid orders.
- Pending payments.
- Processing orders.
- Pickup arrangement pending.
- Ready for pickup.
- Collected orders.
- Low-stock products.

### Order Management

Administrator must be able to:

- View all orders.
- View customer information.
- View products and variants.
- View verified payment information.
- Update order status.
- Record pickup location.
- Record pickup time.
- Generate or view pickup codes.
- Mark orders as collected.
- Manage cancellations and refunds through a proper workflow.

The owner also maintains a physical order book.

Every order must have a unique reference that can be used to reconcile online orders with the physical order book.

### Product Management

Administrator must be able to:

- Create products.
- Edit products.
- Archive products.
- Manage product photographs.
- Add product descriptions.
- Set prices.
- Assign collections.
- Configure sizes.
- Configure colours.
- Manage variant stock.
- Configure size guides.
- Publish/unpublish products.
- Mark products as sold out.
- Enable preorders where specifically intended.

### Collection Management

Administrator must be able to:

- Create collections.
- Edit collections.
- Upload collection covers.
- Add descriptions.
- Assign products.
- Feature collections.
- Publish/unpublish collections.
- Change collection order.

### Inventory Management

Support stock management per product variant.

Support:

- Normal inventory.
- Low-stock indicators.
- Sold-out products.
- Preorders for specifically designated products.

IMPORTANT:
A sold-out product must not automatically become a preorder product.

Only the administrator can designate a product or variant as available for preorder.

### Customer Management

Manage customer records and order history.

Distinguish between:

- Visitors who supplied an email.
- Customers who completed purchases.
- Customers who explicitly subscribed to marketing.

### Reports

Provide useful sales and inventory reports.

Allow CSV export where appropriate.

#### Sales Page (required for launch — roadmap step 5)

Show, from verified paid orders only:

- Total sales in naira since launch.
- Sales in naira for today, this week and this month.
- Number of orders for each of those periods.

Use Nigerian time (Africa/Lagos, WAT) for "today", "this week" and "this month". Weeks start on Monday.

### Notifications

Include an admin notification centre.

### Future Admin Roles

The system may eventually support:

- Owner/CEO.
- Order manager.
- Inventory manager.
- Marketing/collections manager.

Build the initial system around the owner as the sole administrator.

Do not overcomplicate the first release, but structure permissions so roles can be introduced later.

---

## 20. NOTIFICATIONS

### Customer Notifications

Support email notifications for:

- Successful payment.
- Order confirmation.
- Pickup arrangement.
- Ready for pickup.
- Cancellation.
- Refund updates.

### Owner Notifications

The owner wants new-order notifications on an iPhone.

Preferred notification text:

"NEW LVN’LARGE ORDER — [customer] just placed an order. Tap to view order details in your admin dashboard."

Tapping should open the exact order in the admin dashboard.

Explore an installable Progressive Web App (PWA) with Web Push notifications where supported.

IMPORTANT:
iOS web push has platform requirements, including adding the website to the Home Screen and granting notification permission.

Do not promise that push notifications work on every device in every browser.

Provide email and in-dashboard notification fallbacks.

Avoid exposing unnecessary customer information in lock-screen notifications.

---

## 21. TECHNICAL EXPECTATIONS

The final technology stack has not yet been approved.

Before choosing or changing the architecture:

1. Inspect the existing project.
2. Identify the current framework and dependencies.
3. Explain the proposed architecture.
4. Explain hosting, database, storage and email requirements.
5. Explain free-tier limitations and possible costs.
6. Obtain the owner's approval before introducing paid services.

Potential services may include:

- Vercel for hosting.
- Supabase for database, authentication and storage.
- Resend for transactional emails.

These are suggestions, not confirmed decisions.

Do not install unnecessary dependencies or introduce paid subscriptions without approval.

### General Requirements

- Full-stack implementation.
- Database-driven content.
- Responsive design.
- Secure backend.
- Server-side validation.
- Proper authentication and authorization.
- Secure environment-variable management.
- Payment webhook handling.
- Inventory consistency.
- Error handling.
- Accessible components.
- Optimized images.
- Lazy loading where appropriate.
- Fast page performance.
- Maintainable code.
- Useful documentation.

Do not hardcode products, collections, prices or stock into frontend components.

The owner must be able to manage store content through the admin dashboard.

---

## 22. SECURITY REQUIREMENTS

Security is essential because the website will handle customer information and real payments.

Implement:

- Secure admin authentication.
- Role-based authorization where applicable.
- Server-side input validation.
- Database access controls.
- Secure session handling.
- Protected admin routes.
- Rate limiting.
- Secure payment verification.
- Webhook signature verification.
- Safe environment-variable handling.
- Protection against unauthorized order access.
- Appropriate backup and recovery practices.

Never expose:

- Paystack secret keys.
- Database service-role keys.
- Private API credentials.
- Customer private information.

Do not store raw card details.

---

## 23. DEVELOPMENT WORKFLOW — IMPORTANT INSTRUCTIONS FOR CLAUDE

You are working as a senior full-stack developer, software architect and UI/UX implementation partner for LVN’LARGE.

Follow these rules throughout development.

### Rule 1: Inspect Before Editing

Before modifying anything:

- Inspect the existing project structure.
- Read the existing source files.
- Identify the framework and dependencies.
- Understand existing routes and components.
- Identify existing functionality.
- Check for existing errors.

Never blindly rewrite the entire project.

### Rule 2: Do Not Assume

If an important requirement is unclear, ask the owner.

Do not invent:

- Product information.
- Brand stories.
- Prices.
- Pickup locations.
- Business policies.
- Collection details.
- Payment credentials.

Use clearly identified placeholders where necessary.

### Rule 3: Build Progressively

Do not attempt to build the entire website in one uncontrolled operation.

Work feature by feature.

For each feature:

1. Explain the implementation plan.
2. Identify files that need modification.
3. Implement the feature.
4. Test it.
5. Fix errors.
6. Explain what has been completed.
7. Identify the next step.

Do not move to the next major feature while the current one has unresolved critical errors.

### Rule 4: Preserve Existing Work

Do not delete or replace working components unnecessarily.

Avoid unnecessary rewrites.

Maintain consistency across the project.

### Rule 5: Real Functionality Over Appearance

Do not create buttons that do nothing.

Do not create fake payment confirmations.

Do not create static admin statistics presented as real business data.

Do not create frontend-only inventory systems.

All important business operations must connect to the appropriate backend and database.

### Rule 6: Design Quality

Do not settle for generic templates.

Pay attention to:

- Spacing.
- Typography.
- Image proportions.
- Product presentation.
- Mobile layouts.
- Animation quality.
- Visual hierarchy.
- Accessibility.

Avoid excessive animation and unnecessary visual clutter.

### Rule 7: Explain Costs

Before introducing a paid service, explain:

- What it does.
- Why it is needed.
- Whether a free alternative exists.
- Its free-tier limits.
- Expected costs.

Wait for approval before activating paid subscriptions.

### Rule 8: Keep Documentation Updated

Maintain useful project documentation.

Document:

- Installation instructions.
- Environment variables.
- Database setup.
- Payment integration.
- Deployment.
- Admin access.
- Important business workflows.

Never put actual secrets in documentation.

### Rule 9: Test Important Workflows

At minimum, test:

- Email entry.
- Navigation.
- Product browsing.
- Product variants.
- Cart operations.
- Persistent cart.
- Checkout validation.
- Successful test payment.
- Failed payment.
- Duplicate webhook handling.
- Stock updates.
- Order creation.
- Order tracking.
- Admin order management.
- Pickup updates.
- Responsive behaviour.

### Rule 10: Respect the Owner's Decisions

The owner is the final decision-maker for brand identity, business operations, design direction and feature requirements.

Do not silently change approved requirements.

If a technical limitation requires a change, explain the issue and propose alternatives before proceeding.

---

## 24. DEVELOPMENT PRIORITIES

Target substantial website completion: December 10, 2026.

Target public launch: December 15, 2026.

Prioritize a reliable first release.

Suggested development order:

PHASE 1 — Project Inspection and Architecture

- Inspect the existing codebase.
- Confirm framework and architecture.
- Establish project structure.
- Plan database and hosting.
- Identify costs.

PHASE 2 — Brand Experience and Frontend

- Email entry.
- Welcome screen.
- Navigation.
- Homepage.
- Collections.
- Shop All.
- Gallery Dept.
- About.
- Theme switching.

PHASE 3 — Store Functionality

- Product management.
- Product details.
- Product variants.
- Size guides.
- Inventory.
- Shopping bag.
- Persistent cart.

PHASE 4 — Checkout and Payments

- Checkout.
- Paystack Test Mode.
- Payment verification.
- Order creation.
- Payment failure handling.
- Post-payment experience.
- Receipts.

PHASE 5 — Admin Dashboard

- Dashboard overview.
- Order management.
- Product management.
- Collection management.
- Inventory management.
- Customer records.
- Reports.
- Notifications.

PHASE 6 — Tracking and Finalization

- Customer order tracking.
- Email notifications.
- PWA and push notifications where supported.
- Security review.
- Performance optimization.
- Mobile testing.
- Deployment.
- Live payment testing.
- Launch preparation.

Prioritize essential business functionality over advanced visual effects if time becomes limited.

Do not sacrifice payment security, inventory accuracy or order reliability to meet the launch date.

---

## 25. CURRENT PROJECT STATUS AND UNDECIDED ITEMS

The following decisions remain open and must not be assumed:

- Final technology stack.
- Hosting provider.
- Database provider.
- Image storage provider.
- Transactional email provider.
- Final pickup location.
- Final product catalogue and prices.
- Final product photographs.
- Final brand story.
- CAC registration.
- Paystack account verification and live activation.
- Receipt delivery preferences.
- Exact domain name and domain purchase.
- Final privacy policy and terms of service.

The owner is currently setting up Paystack.

The business has not yet been registered with CAC. Starter Business eligibility and approval must be confirmed by Paystack.

Use Paystack Test Mode until the merchant account is approved for live transactions.

---

## 26. FIRST ACTION REQUIRED FROM CLAUDE

When this document is first loaded, DO NOT immediately start writing code.

First:

1. Acknowledge that you understand the LVN’LARGE project.
2. Inspect the existing VS Code workspace and project files.
3. Report the current project structure.
4. Identify the existing framework, dependencies and completed work.
5. Identify missing functionality.
6. Compare the existing project against this master brief.
7. Recommend a development roadmap based on the actual state of the codebase.
8. Explain any architectural decisions and likely costs.
9. Ask for approval before major changes or paid services.

The first objective is to understand what already exists and establish a safe development plan.

---

## 27. OWNER DECISIONS LOG

Decisions the owner has confirmed. These override earlier open items above.

- Stack: Next.js + Supabase + Resend + Paystack (Test Mode). Vercel free plan during development; Vercel Pro or Netlify free to be chosen before launch.
- Email entry gate is compulsory for every visitor. Marketing consent is a separate, optional, unticked checkbox.
- Order references look like LVN-0001 and are assigned only to paid orders.
- If an item sells out between payment and confirmation, the order is flagged "Needs attention" and the owner is alerted.
- Applicable charges are ₦0 for now.
- Sizes: S, M, L, XL, XXL, 3XL and One Size (caps). No XS.
- Product photos are shrunk to a maximum of 2000px wide before upload.
- Low-stock warning when a size/colour has 3 or fewer left (adjustable per product).
- Size measurements are not available yet; the owner fills in size guides later from the admin.
- The admin dashboard is mobile-first (see Section 19).

### Approved roadmap

1. Foundation — database, admin login, theme. (Complete)
2. Admin: products, photos, sizes/colours, stock, collections, size guides, settings.
3. Storefront — email entry, welcome screen, navigation, home, collections, Shop All, product pages.
4. Bag and payment — bag, persistent bag, checkout, Paystack, stock validation, confirmation screen.
5. Orders — admin orders and pickup workflow, order tracking, PDF receipt, confirmation email, CSV export, Sales page.
6. Launch prep — security review, mobile testing, paid hosting, Paystack live mode after approval.

Must-have for December 15: email entry, welcome screen, home, collections, Shop All, product pages, bag, checkout, Paystack, receipt, order tracking, admin for orders, products and stock, Sales page.

After launch: push notifications, staff roles, wider reports, customer gallery photos.

---

**Remember: LVN’LARGE is a real fashion business. Build it with the quality, security, reliability and attention to detail expected of a professional e-commerce brand.**
