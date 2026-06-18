# IRUNSVAN Reseller Order Flow Design

## Goal

Make the reseller ordering experience feel like a normal ecommerce store while staying fast for bulk buyers.

The flow must work for both sides:

- Resellers should browse products quickly, choose a shoe, then select colour, size, and quantity without jumping through unnecessary screens.
- Admins should review requests quickly, approve or reject them, and manage stock without needing to think like shoppers.

## Current Problems

The current reseller experience is too operational at the front:

- The product grid is useful, but the next step feels like a spreadsheet.
- The product detail page shows too many controls at once.
- The request sidebar competes with the product content for attention.
- The user has to make too many decisions at the same time.

This works for stock entry, but it does not feel like a storefront.

## Design Direction

Use a hybrid wholesale storefront:

- The first screen should look like a product store.
- Bulk controls should still exist, but only when the buyer needs them.
- The user should be led through one product at a time.
- The request tray should feel like a cart, not a form stack.

## Reseller Pages

### Shop

The reseller shop should show:

- Product image
- Product name
- Price status
- Colour count
- Size count
- One clear action to open the product

The card should be simpler than the current version. It should not show too many thumbnails or repeated controls.

### Product Detail

The product detail page should be the main buying page.

It should present:

- Large product image
- Product title and price
- One selected colour at a time
- Sizes for the selected colour only
- Quantity entry for the selected sizes
- One primary action to add to the request

The page should not make the buyer think about every colour at once. Colour selection should change the visible size/quantity options.

### Request Tray

The right-side tray should act like a draft cart:

- Show selected items only
- Show total pairs
- Show subtotal or price summary if available
- Allow removing items
- Keep the final submit action clear and visible

The tray should stay compact on desktop and collapse cleanly on mobile.

## Admin Pages

### Request Review

Admin should see a short queue of requests:

- Request number
- Reseller identity
- Total pairs
- Products in the request
- Approve / reject action

### Approval Behavior

Approving a request should:

- Mark the request as approved
- Deduct stock from inventory
- Keep a clear audit trail in the request record

Rejecting a request should:

- Mark the request as rejected
- Not change inventory

## Stock Rules

Stock must not be deducted when a reseller submits a request.

Stock should only be reduced when admin approves the request.

If overselling protection is needed before approval, use a reserved/held state later. Do not subtract final stock at submit time.

## Mobile Behavior

The mobile layout should be single-column and direct:

- Product image first
- Product info next
- Colour chips in a horizontal scroll row if needed
- Sizes below the selected colour
- Quantity and add action below that
- Request tray collapsible or docked near the bottom

The page should not stack multiple dense panels in a way that forces constant scrolling between controls.

## Authentication Flow

Email/password should be a first-class path.

The buyer flow should support:

- Create account
- Confirm email if required
- Sign in with email and password
- Optional Google sign-in

The signup page should collect:

- Email
- Password
- Password confirmation
- Full name
- Company name
- Phone
- Country

If email confirmation is required by Supabase, the app should stop cleanly and tell the user to confirm their email before continuing the application.

## UI Principles

- Keep the buying path simple.
- Avoid duplicate controls.
- Avoid extra decorative graphics inside the reseller flow.
- Make the product image, selected colour, and size choices obvious.
- Use clear primary actions instead of multiple competing buttons.

## Data Flow

The existing data model can remain the source of truth:

- Products and variants continue to come from Supabase.
- Inventory continues to drive stock display.
- Order requests continue to store reseller intent.

The main behavioral change is when inventory is adjusted:

- Request submit creates the order request only.
- Admin approval updates inventory.

## Testing

The implementation should be covered by:

- Route tests for `signup`
- App wiring tests for the new buying flow
- Mobile navigation tests for the new route
- Auth tests for email/password signup and access
- Supabase client tests for password signup and login helpers

## Out Of Scope

This redesign does not add:

- Payment checkout
- Live shipping calculation
- Inventory reservation holds
- Product recommendation systems
- New database tables unless the approval flow needs them later

