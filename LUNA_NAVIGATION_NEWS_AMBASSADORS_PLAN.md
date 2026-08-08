# Luna Implementation Plan: Navigation, News, and Brand Ambassadors

## 1. Purpose

This document is the implementation brief for Luna. It describes the next public-site update without changing the campaign homepage's established visual direction.

The update must solve four connected problems:

1. Simplify the public navigation so every label has one clear purpose.
2. Make Login, My Profile, reseller actions, and Admin Dashboard easy to find.
3. Reintroduce News on the homepage using the existing Stories/blog system and Site Controls.
4. Add a public Brand Ambassadors section that administrators can fully manage from Site Controls.

This is a planning document only. It contains no application implementation.

## 2. Current Project State

- The public campaign homepage is already implemented and deployed.
- The homepage design should remain visually faithful to the approved reference.
- The current header duplicates the product destination as both `Footwear` and `Collections`.
- The hero still shows the unwanted metadata text `NEW SEASON`, `EDITION 1/1`, and `PERFORMANCE FOOTWEAR`.
- Public News already has a backend foundation:
  - Content is stored in the existing `blog_posts` table.
  - Published posts are already fetched for public visitors.
  - Administrators can already create, edit, publish, unpublish, and delete Stories.
  - Story detail rendering and the internal `story` route already exist.
- Site Controls currently contains Product Flyers, Homepage Flyers, Stories, About, and Hero & Theme.
- Brand Ambassadors does not yet have its own database table or Site Controls workflow.
- Authentication and role-aware routing already exist for public visitors, pending resellers, approved resellers, and administrators.

The implementation should extend these systems rather than create parallel content, authentication, or navigation systems.

## 3. Non-Negotiable Product Decisions

- Keep the current campaign homepage visual language.
- Do not restore a generic dashboard-style public header.
- Remove `Footwear` from the main navigation because it duplicates `Products`/`Collections`.
- Use `Products` as the single public catalog label everywhere.
- Replace the public label `Reseller` with `Become a Reseller` when the visitor is signed out.
- Add `News` and `Brand Ambassadors` to the main public navigation.
- Make Login or My Profile visible as text, not only as an unexplained icon.
- Show the reseller order bag only when the user is allowed to request products.
- News and Brand Ambassadors must be editable in Site Controls.
- Public visitors must never see draft News posts or unpublished ambassadors.
- Do not expose internal filenames, storage paths, IDs, route names, or admin labels in public cards.
- Do not change product, order, application, or authentication behavior outside the navigation work required here.

## 4. Final Public Information Architecture

Use this exact desktop navigation order:

1. Products
2. News
3. Brand Ambassadors
4. Stockists
5. Become a Reseller, or its role-aware replacement
6. Login or My Profile
7. Order bag, only for authorized users

The mobile drawer must present the same destinations and role logic in the same order. It must not have an older or separate menu model.

### Canonical destinations

| Public label | Destination | Notes |
| --- | --- | --- |
| Logo | Home/store route | Always returns to the campaign homepage. |
| Products | `product-flyers` | This is the one canonical public product/catalog destination. |
| News | Homepage News section or public News listing | If already on the homepage, scroll to the section. From another page, return home and focus/scroll to News. |
| Brand Ambassadors | Homepage ambassadors section or public ambassadors listing | Follow the same cross-route anchor behavior as News. |
| Stockists | `find-reseller` | Keep the existing stockist directory behavior. |
| Become a Reseller | `apply` | Only this label is shown to signed-out visitors. |
| Login | `login` | Only shown to signed-out visitors. |
| My Profile | `account` | Shown to authenticated non-admin users. |
| Admin Dashboard | `admin` | Shown to administrators in place of the reseller action. |
| Request Products | `reseller` | Shown to approved resellers in place of Become a Reseller. |
| Application Status | `apply` | Shown to pending reseller applicants. |

Do not add separate `Footwear` and `Collections` links. Existing legacy routes may remain internally compatible, but visible UI must use only `Products`.

## 5. Role-Aware Header Matrix

The menu must derive from the existing authenticated role state. It must not guess permissions from a URL or from locally editable user metadata.

| User state | Reseller/action label | Account label | Order bag |
| --- | --- | --- | --- |
| Signed out | Become a Reseller | Login | Hidden |
| Signed in, no application | Become a Reseller | My Profile | Hidden |
| Pending reseller | Application Status | My Profile | Hidden |
| Approved reseller | Request Products | My Profile | Visible |
| Administrator | Admin Dashboard | My Profile | Visible only if existing admin ordering rules intentionally permit it |

Additional behavior:

- The active navigation state must be accurate on desktop and mobile.
- Product detail pages should mark Products active.
- News detail pages should mark News active.
- Ambassador detail/profile pages should mark Brand Ambassadors active if such a route is implemented.
- `My Profile` must remain visible on account and portal pages so the user can return easily.
- The campaign homepage header and internal public-page header must use the same public labels.
- Portal navigation can remain specialized, but it must always provide a clear route back to the public homepage and My Profile.

## 6. Hero Cleanup

Remove only the unwanted metadata row from the hero:

- `NEW SEASON`
- `EDITION 1/1`
- `PERFORMANCE FOOTWEAR`
- The separators associated with those labels
- The metadata container's accessibility label

Keep:

- The Irunsvan Africa kicker
- The main performance-footwear headline
- The supporting statement
- Explore Products/Collection CTA
- Become a Reseller CTA, using the same role-aware destination logic as the header
- The hero image and approved overall composition

After removal, rebalance spacing so the headline moves naturally upward and no empty metadata gap remains. Do not enlarge unrelated content to fill the gap aggressively.

## 7. News: Reuse the Existing Stories System

### Product decision

`News` is the public-facing name. The existing `blog_posts` table and current story-management workflow remain the source of truth.

For the first implementation, avoid a risky database rename. Rename visible Site Controls labels from `Stories` to `News`, but keep compatible internal identifiers where changing them would cause unnecessary migration risk. Internal names must not leak into the public interface.

### Existing content capabilities to preserve

- Title
- Slug
- Cover image
- Summary
- Body
- Published/draft state
- Published date
- Created and updated timestamps
- Existing create, edit, image upload, publish, unpublish, and delete actions

### Homepage News section

Add a campaign-styled News section after Featured Products and before Brand Ambassadors.

Recommended behavior:

- Display up to three most recent published posts.
- Sort by `published_at` descending, then `created_at` descending.
- Use a strong lead card and two supporting cards when three items are available.
- Each card shows only a clean cover image, title, short summary, date, and `Read more` action.
- Never show a storage filename, image path, slug, UUID, or empty technical placeholder.
- If a cover image is missing, use a designed brand-safe fallback, not the filename.
- If no published News exists, omit the public section entirely. Do not show an empty admin message on the public homepage.
- Include a `View all News` action only if a usable public listing view is implemented in the same change.

### News navigation behavior

Preferred first release:

- Add a stable `news` anchor/section identity on the homepage.
- Clicking News while already on Home scrolls smoothly to the section and moves focus appropriately.
- Clicking News from another route returns to Home with a News target, then scrolls after rendering.
- Existing story detail routes continue to work.
- Browser back/forward behavior must remain predictable.

If Luna adds a dedicated News listing route, it must be a complete, polished listing and not an empty route created only to satisfy the menu.

### Site Controls News updates

- Change visible tab/section text from `Stories` to `News`.
- Change form and empty-state copy to say News, article, or post consistently.
- Preserve existing records and database behavior.
- Preserve draft/published controls.
- Keep destructive delete confirmation.
- Add preview behavior only if it can be implemented without exposing drafts publicly.

## 8. Brand Ambassadors Feature

### Public purpose

Brand Ambassadors introduces the people representing Irunsvan Africa. It should feel editorial and human, not like an internal staff directory.

### Proposed source of truth

Create one `brand_ambassadors` table. Do not store ambassadors as News posts, products, or static JavaScript objects.

| Field | Type/constraint intent | Purpose |
| --- | --- | --- |
| `id` | UUID primary key | Stable internal identity. |
| `name` | Required text | Public display name. |
| `slug` | Required unique text | Stable public-friendly identifier. |
| `role_title` | Required text | Athlete, coach, creator, community leader, or other public role. |
| `country` | Optional text | Public location context. |
| `city` | Optional text | Public location context. |
| `short_bio` | Required text with reasonable length limit | Homepage/card description. |
| `full_bio` | Optional text | Extended profile/story content. |
| `image_path` | Required text | Storage path, converted to a public URL only by existing media helpers. |
| `cta_label` | Optional text | Example: View profile, Read story, Follow. |
| `link_url` | Optional text | Internal or external CTA destination. |
| `instagram_url` | Optional text | Instagram/social destination. |
| `display_order` | Integer, default 0 | Manual editorial ordering. |
| `featured` | Boolean, default false | Controls homepage prominence. |
| `published` | Boolean, default false | Controls public visibility. |
| `created_by` | Auth user reference | Auditability. |
| `created_at` | Timestamp | Auditability. |
| `updated_at` | Timestamp | Auditability and sorting. |

Avoid adding a flexible JSON social-links system in the first release. The requested link destination and Instagram field cover the current need and keep Site Controls understandable.

### Database and security requirements

- Add the schema through the repository's numbered `supabase/sql` migration convention.
- Use the next available migration number at implementation time.
- Enable Row Level Security on the table.
- Anonymous and authenticated public reads may return only rows where `published = true`.
- Administrative create, update, publish, reorder, and delete operations must require an authoritative admin role from the existing `profiles` model or an existing trusted admin helper.
- Do not authorize admin writes from browser-supplied role values or editable `user_metadata`.
- Do not put a Supabase service-role key in frontend code.
- Grant only the table privileges required for the policies to work.
- Add indexes that support the public published/order query and unique slug lookup.
- Set `updated_at` consistently with the project's established database pattern.
- Before implementing the migration, Luna must verify the current Supabase RLS and Storage guidance and follow the project's existing policy style.

### Image storage

- Reuse the existing public content-image storage approach if it is appropriate.
- Store ambassador assets under a clear namespace such as `content/ambassadors/<ambassador-id>/...`.
- Persist only the storage path, not an expiring signed URL.
- Validate file type and size using the same controls as existing Site Controls uploads.
- Use the existing storage cleanup queue when an image is replaced or an ambassador is deleted.
- Do not delete a shared or old image until the database operation succeeds.

### Public homepage section

Place Brand Ambassadors after News and before the purpose panel.

Recommended behavior:

- Display featured, published ambassadors first.
- Fall back to published ambassadors ordered by `display_order`, then `created_at`.
- Show three cards on wide desktop, two where space requires, and one on narrow screens.
- Each card displays portrait, name, role, location when present, short bio, and a clear CTA when configured.
- A missing optional CTA should not leave an empty button.
- External links open safely with appropriate `rel` behavior and an accessible indication where useful.
- Images use deliberate portrait crops and stable aspect ratios.
- If there are no published ambassadors, omit the section from the public homepage.

### Ambassador CTA behavior

Interpret each configured destination safely:

- Known internal route or approved site-relative destination: use the app router.
- `https` external URL: open as an external link.
- Instagram URL: show a separate social action when supplied.
- Empty destination: do not render a CTA.
- Reject unsafe protocols such as `javascript:`.

A dedicated ambassador detail route is optional for the first release. If the full biography has no public detail view, Site Controls must require an external/internal CTA destination rather than collecting unused content.

## 9. Brand Ambassadors in Site Controls

Add `Brand Ambassadors` as a new Site Controls section beside News.

### Administrator list view

Each row/card should show:

- Portrait thumbnail
- Name
- Role/title
- City/country when available
- Featured status
- Published/draft status
- Display order
- Edit action
- Publish/unpublish action
- Delete action with confirmation

The list must make ordering visible. A simple numeric display-order input is acceptable for the first release; drag-and-drop is not required.

### Create/edit form

The form should include:

- Name
- Slug, auto-suggested from name but editable
- Role/title
- Country
- City
- Short introduction
- Full biography/story
- Portrait upload and preview
- CTA label
- Link destination
- Instagram/social URL
- Display order
- Featured toggle
- Published toggle

Validation expectations:

- Name, role/title, short bio, and portrait are required before publishing.
- Drafts may be saved with incomplete optional content.
- Slugs must be normalized and unique.
- URLs must be valid `https` or safe internal paths.
- Display order must be a finite integer.
- Error messages must identify the field and preserve form input.
- Disable duplicate submission while a save is pending.

### Editing behavior

- The create form and selected edit state must not overwrite each other.
- Cancel edit returns to a clean list/form state.
- Replacing an image shows the new preview before save.
- Publish/unpublish updates the public section after a successful refresh.
- Failed writes do not optimistically claim success.
- Delete confirmation includes the ambassador's name.

## 10. Revised Homepage Order

The public homepage should render in this order:

1. Campaign header
2. Hero, without season/edition metadata
3. Featured Products
4. News
5. Brand Ambassadors
6. Our Purpose
7. Become a Stockist / Find a Stockist commerce split
8. Campaign footer

News and Brand Ambassadors should use the existing section-number language only if the numbering can be updated consistently across every following section. Never leave duplicate or skipped section numbers after inserting them.

## 11. Footer Alignment

Update public footer links to match the simplified information architecture:

- Products
- News
- Brand Ambassadors
- Stockists
- Become a Reseller
- Login or My Profile where role-aware footer behavior already exists cleanly

Remove duplicate Footwear/Collections links. Do not add About Us merely to mirror the reference image; the user explicitly said unnecessary items like About Us can be removed.

## 12. State and Data Loading

Extend the existing application state rather than creating a second store.

Required conceptual state additions:

- Public published ambassadors
- Admin all-ambassadors collection
- Ambassador editor selection/draft
- Ambassador save/upload/delete pending states
- Ambassador operation error/success notices
- Deferred homepage section target for cross-route News/Ambassadors navigation

Public bootstrap:

- Fetch only published ambassadors.
- Select only fields required for public rendering.
- Sort server-side by featured status and display order where practical.
- Treat an unavailable optional ambassadors request as a recoverable content error so core products/auth still render.

Admin bootstrap:

- Fetch all ambassador rows only for confirmed administrators.
- Include draft/published and audit fields required by Site Controls.
- Re-fetch or update state after successful writes using the project's existing admin-content pattern.

Do not make public rendering depend on the admin query.

## 13. File-by-File Implementation Map

### `src/app.js`

- Replace the duplicated campaign menu model with the final navigation model.
- Add a single role-aware helper for reseller/action labels and routes.
- Add a single role-aware helper for Login/My Profile.
- Hide the bag for unauthorized roles.
- Remove hero metadata markup.
- Insert News and Brand Ambassadors homepage renderers.
- Add cross-route homepage section targeting.
- Extend public and admin data loading for ambassadors.
- Add Brand Ambassadors Site Controls renderer and event handlers.
- Rename visible Stories copy to News without breaking existing records.
- Keep current story details compatible.

### `src/styles.css`

- Rebalance hero spacing after metadata removal.
- Add campaign-native News layouts.
- Add campaign-native ambassador portrait cards.
- Style visible account/profile text and authorized bag states.
- Add responsive layouts at existing breakpoints.
- Add keyboard focus, reduced-motion, hover, loading, empty, and error states.
- Avoid broad selectors that alter portal/admin layouts.

### `src/mobile-navigation.js`

- Recognize any new public route/section target.
- Ensure back-route resolution for News and ambassador detail/listing behavior.
- Keep mobile menu state and active route consistent.

### `src/site-controls.js`

- Add pure helper functions only where they improve validation, normalization, or testability.
- Keep display labels and defaults aligned with News and Brand Ambassadors.
- Do not duplicate database calls already centralized in `src/app.js` unless the current architecture is intentionally refactored with tests.

### `src/website-content.js`

- Update static fallback labels or section copy only if used by the campaign homepage.
- Do not add ambassadors as hard-coded production content.

### `src/auth.js`

- Reuse existing role derivation.
- Change only if a small pure helper is needed for the role-aware navigation matrix.
- Do not change login credentials, session restoration, or role semantics as part of this feature.

### `supabase/sql/<next-number>_brand_ambassadors.sql`

- Add table, constraints, indexes, timestamp handling, grants, and RLS policies.
- Add storage policy changes only if existing content-image policies do not already cover the ambassador namespace.
- Make the migration safe to apply through the project's existing deployment process.

### Tests

Update or add focused tests in:

- `tests/app-wiring.test.js`
- `tests/site-controls.test.js`
- `tests/mobile-navigation.test.js`
- `tests/supabase-sql.test.js`
- `tests/e2e/public-site.spec.js`
- `tests/e2e/admin-ui-mocked.spec.js`

Create a dedicated ambassador helper test only if new pure logic warrants it.

## 14. Visual Direction

The new sections must feel like part of the approved homepage, not generic content cards.

- Continue the dark navy, white, and electric-blue palette.
- Continue the strong condensed display typography for headings.
- Use editorial image crops and disciplined grid alignment.
- Preserve the reference's squared, performance-oriented geometry.
- Avoid oversized rounded cards, floating glass panels, gradient-heavy effects, and generic dashboard components.
- News should feel like campaign/editorial content.
- Ambassadors should foreground people and identity while remaining consistent with the footwear brand.
- Motion should be restrained and respect `prefers-reduced-motion`.

## 15. Accessibility and Responsive Requirements

- All navigation is keyboard reachable.
- Focus is visible against light and dark backgrounds.
- Mobile drawer has correct expanded state, focus behavior, and escape/close behavior.
- Section navigation moves focus or announces the destination appropriately after route changes.
- Images have meaningful alt text; decorative overlays/maps remain hidden from assistive technology.
- Card actions have descriptive names, not repeated ambiguous `Click here` labels.
- Text and controls meet practical contrast requirements.
- No horizontal overflow at 320px width.
- News and ambassador layouts remain readable without relying on hover.
- External-link behavior is accessible and secure.
- Empty optional fields do not create stray punctuation or blank UI.

## 16. Test Plan

### Automated unit/integration checks

- Signed-out nav shows Products, News, Brand Ambassadors, Stockists, Become a Reseller, and Login.
- Footwear and Collections are absent from visible public navigation.
- Pending reseller sees Application Status and My Profile; bag is hidden.
- Approved reseller sees Request Products, My Profile, and bag.
- Admin sees Admin Dashboard and My Profile.
- Hero metadata strings are absent.
- Published News renders; drafts do not.
- Published ambassadors render; drafts do not.
- Ambassadors follow featured/display ordering.
- Unsafe ambassador links are rejected or omitted.
- News and ambassador section links resolve from Home and internal routes.
- Site Controls contains News and Brand Ambassadors.
- Ambassador validation and slug normalization work.
- SQL migration contains RLS enablement and restrictive policies.

### Admin workflow checks

1. Sign in as admin.
2. Open Site Controls.
3. Create an ambassador draft.
4. Confirm it is absent publicly.
5. Upload/replace portrait and complete required fields.
6. Publish it.
7. Confirm it appears publicly in the intended order.
8. Edit name, role, link, and ordering.
9. Unpublish it and confirm removal from public view.
10. Delete it and verify both database state and safe storage cleanup behavior.
11. Create/edit/publish a News item and confirm the homepage card links to the existing detail view.

### Responsive/manual checks

Test at minimum:

- 320px mobile
- 390px mobile
- 768px tablet
- 1024px laptop
- 1440px desktop

Check the header at every width with the longest role-aware labels, especially `Brand Ambassadors`, `Become a Reseller`, `Application Status`, and `Admin Dashboard`.

### Required project commands

After implementation, Luna should run:

- `npm run check`
- `npm test`
- `npm run build`
- Relevant Playwright public/admin tests
- `git diff --check`

Do not deploy if any required check fails without documenting and resolving the failure.

## 17. Implementation Phases

### Phase 1: Establish the navigation contract

- Centralize final labels/routes.
- Implement the role matrix.
- Remove duplicate product labels.
- Make Login/My Profile explicit.
- Restrict bag visibility.
- Align desktop, mobile, internal public header, and footer.

### Phase 2: Clean the hero

- Remove metadata markup and styling dependency.
- Rebalance spacing.
- Verify responsive hero composition.

### Phase 3: Restore News publicly

- Rename visible Stories controls to News.
- Add homepage News rendering from existing published `blog_posts` state.
- Add navigation/anchor behavior.
- Preserve detail pages and admin CRUD.

### Phase 4: Add ambassador backend

- Write and review the numbered Supabase migration.
- Apply it to the intended Supabase project through the established workflow.
- Verify RLS with signed-out, ordinary authenticated, and admin sessions.
- Verify image storage permissions and cleanup behavior.

### Phase 5: Add Brand Ambassadors Site Controls

- Add list, form, edit, publish, ordering, upload, and delete workflows.
- Validate data and links.
- Add admin tests.

### Phase 6: Add public ambassador experience

- Add homepage section.
- Add navigation/anchor behavior.
- Implement optional CTA and social links safely.
- Complete responsive and accessibility polish.

### Phase 7: Regression and deployment readiness

- Run all checks.
- Test every role.
- Test News and ambassador drafts versus published content.
- Confirm product, application, stockist, profile, admin, and reseller routes still work.
- Review screenshots against the approved campaign design.

## 18. Acceptance Criteria

The work is complete only when all of the following are true:

- Public navigation contains no Footwear/Collections duplication.
- `Products` is the only visible catalog label.
- News and Brand Ambassadors are available from desktop and mobile navigation.
- Signed-out visitors see Become a Reseller and Login.
- Pending resellers see Application Status and My Profile.
- Approved resellers see Request Products, My Profile, and their request bag.
- Administrators have a clear Admin Dashboard path and My Profile path.
- The unwanted hero metadata is completely removed.
- The homepage displays only published News from the existing Site Controls content source.
- Administrators manage News under the public-facing name News.
- Administrators can create, edit, order, feature, publish, unpublish, and delete Brand Ambassadors.
- Only published ambassadors are visible publicly.
- Public cards never expose filenames or internal labels.
- New database access is protected by RLS and authoritative admin checks.
- Existing product, stockist, reseller application, account, order, and admin functionality passes regression checks.
- The final visual result remains faithful to the approved campaign homepage.

## 19. Explicit Out of Scope

- Rebuilding the authentication system
- Changing admin credentials
- Renaming the `blog_posts` database table
- Migrating existing News records to a new table
- Rebuilding the reseller order workflow
- Adding payments or checkout
- Adding a full social network or ambassador application portal
- Reintroducing About Us because it appears in the visual reference
- Replacing the current campaign homepage with a new design
- Broad refactoring unrelated to this feature

## 20. Luna Execution Instructions

Luna should treat this file as the source of truth for the feature.

Before editing:

1. Inspect the current worktree and preserve unrelated user changes.
2. Read the existing homepage, navigation, News/Stories, Site Controls, auth-role, mobile-navigation, Supabase SQL, and related tests.
3. Confirm the next SQL migration number.
4. Confirm the production Supabase project/environment before applying any remote schema change.
5. Record any unavoidable deviation from this plan before implementing it.

During implementation:

- Make small, reviewable changes in the phase order above.
- Reuse existing route, fetch, upload, cleanup, notice, and role helpers.
- Keep database changes in a numbered migration.
- Do not hard-code ambassador production records.
- Do not expose a service-role key or weaken RLS.
- Do not create duplicate News or product systems.
- Do not deploy automatically until tests and visual review pass.

At handoff, Luna should report:

- Files changed
- Migration added and whether it was applied remotely
- Final navigation behavior for every role
- How News and Brand Ambassadors are managed
- Commands/tests run and their results
- Any remaining content entry needed from the administrator
- Deployment status and commit reference, if deployment was separately authorized

## 21. Final Decision Summary

- One product destination: Products.
- Public header: Products, News, Brand Ambassadors, Stockists, role-aware reseller action, and Login/My Profile.
- Hero season/edition metadata is removed.
- News reuses the existing `blog_posts` and Stories implementation, with public labels changed to News.
- Brand Ambassadors receives a dedicated RLS-protected table and full Site Controls management.
- News appears before Brand Ambassadors on the homepage; both appear before Our Purpose.
- Public sections show published content only and disappear cleanly when empty.
- The approved campaign visual design remains the foundation.
