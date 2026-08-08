# Irunsvan Africa Homepage Redesign Implementation Plan

Status: Planning only  
Reference: User-approved Irunsvan performance-footwear homepage mockup supplied in chat  
Implementation state: Not started  
Last updated: 2026-08-08  

## 1. Purpose of this document

This document is the authoritative implementation blueprint for replacing the current public homepage with the approved performance-footwear design.

It intentionally contains no executable HTML, CSS, JavaScript, SQL, migration, or deployment code. It defines what must be built, where it belongs, how existing application data must be reused, and how completion will be verified.

The objective is to prevent accidental changes to the working admin, reseller, authentication, catalogue, stockist, and ordering systems while allowing the public homepage to be redesigned precisely.

## 2. Confirmed design objective

The public homepage must closely reproduce the supplied reference in:

- Overall section order.
- Desktop proportions.
- Strong white, navy, and Irunsvan-blue palette.
- Condensed editorial display typography.
- White navigation bar.
- Split campaign hero with oversized headline and athlete imagery.
- Three-product featured collection.
- Dark African-purpose image section.
- Two-column wholesale and stockist section.
- Dark structured footer.
- Sharp edges and restrained corner radii.
- Thin dividers and controlled spacing.
- Minimal, purposeful motion.

The implementation must use Irunsvan content, products, routes, users, and imagery. It must not introduce fictional functionality.

## 3. Explicitly out of scope

The following work is not part of this homepage redesign unless separately approved:

- Rebuilding the project in React, Vue, Svelte, or another framework.
- Replacing Supabase.
- Changing database authentication.
- Rewriting the admin dashboard.
- Rewriting the reseller portal.
- Rewriting the stock-import workflow.
- Creating a consumer payment checkout.
- Changing product prices, inventory, or order rules.
- Deleting existing stories, flyers, or site-content records.
- Deploying before local visual approval.
- Removing the existing internal-label filtering fix in `src/app.js`.

## 4. Existing architecture that must be preserved

The project is a static vanilla JavaScript application.

Primary files involved in the public homepage:

- `index.html`: application entry point and script/style loading.
- `src/app.js`: route rendering, public navigation, homepage composition, footer, events, and state usage.
- `src/styles.css`: global, portal, and public-page styles.
- `src/site-controls.js`: defaults and sanitization for editable website content.
- `src/website-content.js`: normalization of homepage flyers, stories, public flyers, and image content.
- `src/catalog-data.js`: published product and variant queries.
- `src/product-images.js`: product-image URL resolution.
- `public/brand/`: approved Irunsvan logo variants.
- `public/product-images/`: existing local product photography.
- Supabase: published products, variants, product images, homepage content, stockists, users, and orders.

The redesign must remain inside this architecture.

## 5. Working-tree protection

At planning time, `src/app.js` contains an uncommitted fix that hides internal image labels from public product-flyer pages.

Before implementation begins:

1. Inspect the current diff.
2. Confirm the internal-label filter remains present.
3. Do not overwrite or revert unrelated user changes.
4. Commit or otherwise preserve the label-filter work before large homepage edits if the user approves committing it.
5. Keep homepage changes isolated from the product-flyer label logic.

Internal labels that must remain hidden publicly include:

- Image filenames such as `8.jpg`.
- SKU filenames such as `028-1.jpg`.
- Foreign-language upload filenames.
- `Main image`.
- `Secondary image`.
- Generic values such as `Product image 3`.
- Numeric-only labels.

## 6. Target public information architecture

The final public homepage must use the following sequence:

1. Public campaign header.
2. Performance hero.
3. Featured collection.
4. Africa purpose section.
5. Wholesale and stockist split section.
6. Public campaign footer.

The current front-page story carousel and current About section must not render on the redesigned homepage.

Existing story and information routes may remain available internally or by direct route until a separate removal decision is made.

## 7. Route mapping

Every visible homepage action must lead to an existing functional route.

| Visible label | Intended route | Behaviour |
|---|---|---|
| Irunsvan logo | `store` | Return to redesigned homepage. |
| Footwear | `product-flyers` | Open public product catalogue/flyers. |
| Collections | `product-flyers` | Open catalogue with future collection filtering capability. |
| Stockists | `find-reseller` | Open the existing stockist finder. |
| Reseller | `apply` when signed out | Open reseller application. |
| Reseller | `reseller` when approved | Open reseller ordering portal. |
| Account | `login` when signed out | Open login. |
| Account | `account` when signed in | Open account page. |
| Order bag | `login` when signed out | Ask the user to authenticate. |
| Order bag | `reseller` or current order route when approved | Open real reseller ordering flow. |
| Explore collection | `product-flyers` | Open public products. |
| Become a reseller | `apply` | Open reseller application. |
| View all collections | `product-flyers` | Open public products. |
| Product card | `product-flyer` or `product` | Open the correct public detail route. |
| Become a stockist | `apply` | Open reseller/stockist application. |
| Find a stockist | `find-reseller` | Open stockist finder. |
| Support | `contact` | Open support/contact page. |
| Terms | `terms` | Open terms page. |
| Privacy | `privacy` | Open privacy page. |

No button may be decorative if it visually appears interactive.

## 8. Public header specification

### 8.1 Desktop layout

The desktop header must contain three aligned regions:

- Left: Irunsvan blue logo.
- Centre: Footwear, Collections, Stockists, and Reseller navigation.
- Right: account icon/label and order-bag icon/count.

Target characteristics:

- White background.
- Approximate visual height of 68 to 76 pixels.
- Thin neutral divider beneath the header.
- Content aligned to the same maximum width as the hero.
- No floating pill navigation.
- No gradient.
- No large shadow.
- Clear active-route state using blue text or a thin underline.
- Keyboard focus state distinct from hover state.

### 8.2 Authentication behaviour

The header must respond to existing `state.auth` values.

- Signed-out visitors see Account leading to login and Reseller leading to application.
- Pending resellers see their application/account route.
- Approved resellers see access to their ordering portal and real order count.
- Admins retain access to Account and Back to Admin without exposing admin controls to public visitors.

### 8.3 Mobile behaviour

The mobile header must retain:

- Logo.
- Account access.
- Order-bag access when relevant.
- A menu trigger with an accessible label and expanded state.

The existing mobile-navigation state and route handling should be reused rather than duplicated.

## 9. Performance hero specification

### 9.1 Desktop composition

The hero must closely follow the supplied reference:

- Full-width campaign surface directly beneath the header.
- Left-side editorial copy area.
- Right-side athlete photograph extending toward the outer edge.
- White-to-light-blue image/copy transition.
- Strong blue running-track foundation.
- Large condensed headline with selected lines in Irunsvan blue.
- Two rectangular actions beneath the supporting copy.
- Small campaign metadata above the headline.
- Small brand statement in the lower-right image area if it remains legible.

### 9.2 Approved working copy

Campaign eyebrow:

`IRUNSVAN AFRICA`

Campaign metadata:

`NEW SEASON / EDITION 1/1 / PERFORMANCE FOOTWEAR`

Headline:

`PERFORMANCE FOOTWEAR BUILT FOR AFRICA.`

The words `BUILT FOR AFRICA.` must use the primary Irunsvan blue.

Supporting copy:

`Engineered for movement. Made for Africa.`

Primary action:

`EXPLORE COLLECTION`

Secondary action:

`BECOME A RESELLER`

### 9.3 Hero data contract

The hero should continue to read sanitized site content rather than hard-coding all values inside the renderer.

Required conceptual fields:

| Field | Purpose | Fallback |
|---|---|---|
| Eyebrow | Brand label | Irunsvan Africa |
| Metadata line 1 | Season | New Season |
| Metadata line 2 | Edition | Edition 1/1 |
| Metadata line 3 | Category | Performance Footwear |
| Headline | Main campaign statement | Performance Footwear Built for Africa. |
| Highlight phrase | Blue headline segment | Built for Africa. |
| Supporting copy | Short value statement | Engineered for movement. Made for Africa. |
| Primary action label | Catalogue action | Explore Collection |
| Primary route | Catalogue destination | product-flyers |
| Secondary action label | Reseller action | Become a Reseller |
| Secondary route | Application destination | apply |
| Hero image | Athlete campaign image | Approved local fallback asset |
| Image focal point | Responsive crop position | Centre-right |
| Corner statement | Optional image-side text | Built to move. Compete without limits. |

### 9.4 Hero asset requirements

The athlete image must:

- Be original, licensed, user-provided, or generated for Irunsvan.
- Show a Black African male athlete in a sprint-start pose.
- Use Irunsvan blue clothing without imitating another brand logo.
- Include blue track/stadium context.
- Reserve visual breathing room on the left for text.
- Have sufficient resolution for wide desktop screens.
- Be delivered as optimized WebP plus an original-quality source.
- Avoid baked-in text so text remains editable and accessible.

Recommended export dimensions:

- Primary source: at least 2400 pixels wide.
- Web delivery: approximately 1800 to 2200 pixels wide depending on compression quality.
- Mobile alternate crop: optional portrait-oriented asset if desktop cropping is insufficient.

## 10. Featured collection specification

### 10.1 Layout

The featured collection must reproduce the reference structure:

- Left editorial introduction occupying roughly one quarter of the desktop width.
- Three equal product cards occupying the remaining width.
- Light neutral section background.
- Product imagery on a clean pale surface.
- Product category in blue uppercase text.
- Product name in condensed dark display type.
- Small Explore action below the product name.
- No prices unless public retail pricing is intentionally introduced later.
- No inventory quantities on the public homepage.
- No internal image names, filenames, IDs, or upload metadata.

### 10.2 Section copy

Section number/eyebrow:

`02 / FEATURED`

Heading:

`THE NEW COLLECTION.`

Section action:

`VIEW ALL COLLECTIONS`

### 10.3 Product selection rules

Exactly three products should be shown on desktop.

Preferred selection order:

1. Three product SKUs explicitly selected in homepage admin controls.
2. If fewer than three valid selections exist, fill remaining positions using published products with valid images.
3. Exclude unpublished products.
4. Exclude products without a usable public image unless no alternatives exist.
5. Deduplicate products by product ID.
6. Preserve an intentional admin-defined order.

### 10.4 Product-card data contract

Each featured product needs:

- Product ID.
- SKU/model code.
- Public display name.
- Public category.
- Primary image URL.
- Destination route.
- Destination slug or ID.
- Published state.

The card must never display:

- Storage paths.
- Image filenames.
- Product database IDs.
- Variant IDs.
- Admin-only labels.
- Import status.
- Supplier terminology.

## 11. Africa purpose section specification

### 11.1 Layout

The section must be a wide, dark cinematic panel with:

- Runner and African landscape image across the background.
- Dark navy overlay ensuring readable white text.
- Copy aligned to the left.
- Subtle Africa outline graphic on the right.
- Minimal blue marks used as a visual brand signature.
- No rounded card enclosure.
- No About Us label.

### 11.2 Approved working copy

Section label:

`03 / OUR PURPOSE`

Heading:

`DESIGNED FOR HOW AFRICA MOVES.`

Body:

`From training tracks to city streets, Irunsvan footwear is designed to perform wherever movement takes you.`

The reference includes an Our Story link. Because the user requested removal of About Us-style content, the default plan is to omit this link unless a real brand-story page is later approved.

### 11.3 Asset requirements

The background image should:

- Feature a runner moving through a recognizably African environment.
- Leave sufficient dark space behind text.
- Avoid baked-in map graphics or text.
- Be optimized to WebP.

The Africa outline should be a separate SVG or CSS-safe vector asset so its colour and opacity remain controllable.

## 12. Wholesale section specification

### 12.1 Layout

The wholesale panel occupies the left half of the next desktop row.

It must contain:

- Deep navy background.
- Section number and category label.
- White condensed heading.
- Short reseller-focused body copy.
- Blue rectangular action.
- Irunsvan shoe box or wholesale packaging image on the right side of the panel.

### 12.2 Approved working copy

Section label:

`04 / WHOLESALE`

Heading:

`BUILT FOR RETAILERS TOO.`

Body:

`Join our network of approved stockists and get access to wholesale pricing, live stock, and dedicated support.`

Action:

`BECOME A STOCKIST`

Destination:

Existing reseller application route.

### 12.3 Asset requirement

Use a real or generated Irunsvan-branded wholesale shoe box. The logo must be correct, and any tiny printed packaging text must be omitted unless it can be produced accurately.

## 13. Stockist section specification

### 13.1 Layout

The stockist panel occupies the right half of the desktop row.

It must contain:

- White background.
- Blue section label.
- Dark condensed heading.
- Short body copy.
- Blue text action with arrow.
- Pale dotted Africa map on the right.
- Blue location points derived from real stockist data where practical.

### 13.2 Approved working copy

Section label:

`05 / STOCKISTS`

Heading:

`FIND IRUNSVAN NEAR YOU.`

Body:

`Browse our growing network of approved stockists across Africa.`

Action:

`FIND A STOCKIST`

### 13.3 Map behaviour

Phase-one implementation may use a static approved Africa SVG with curated marker locations.

The map must not imply stockist presence in countries where no approved stockist exists. If real geographic coordinates are not available, markers should be omitted rather than fabricated.

## 14. Footer specification

### 14.1 Visual structure

The footer must be dark navy and divided into clear columns.

Recommended columns:

1. Irunsvan logo and short brand statement.
2. Shop.
3. Reseller and stockist access.
4. Support and legal.
5. Optional contact details.

### 14.2 Content to keep

- Products.
- Collections.
- Stockists.
- Become a reseller.
- Account/Login.
- Support/Contact.
- Terms.
- Privacy.
- Approved social links only.
- Current copyright year.

### 14.3 Content to remove

- About Us.
- Our Story unless a genuine route is approved.
- Careers.
- News.
- Newsletter unless email collection is intentionally implemented.
- Shipping and Returns unless a real policy exists.
- FAQ unless a real FAQ exists.
- Fake social links.
- `2026 Campaign System` wording.
- Internal operational terminology.

## 15. Typography system

### 15.1 Display type

Use a condensed, high-impact display family resembling the supplied reference.

Preferred direction:

- Barlow Condensed ExtraBold or another properly licensed condensed grotesk.
- Self-host font files under `public/fonts/`.
- Use uppercase only for campaign headings and small navigation labels.
- Avoid synthetic font stretching.
- Avoid browser-dependent system condensed fonts.

### 15.2 Body type

Use a clean geometric sans-serif such as Manrope or Plus Jakarta Sans, self-hosted where licensing permits.

### 15.3 Type hierarchy targets

| Element | Desktop intent | Mobile intent |
|---|---|---|
| Hero heading | Very large, tightly stacked, approximately 64–88 CSS pixels depending on viewport | Approximately 44–58 CSS pixels |
| Section heading | Approximately 38–54 CSS pixels | Approximately 32–42 CSS pixels |
| Product title | Approximately 24–32 CSS pixels | Approximately 22–28 CSS pixels |
| Body copy | Approximately 16–18 CSS pixels | Approximately 15–17 CSS pixels |
| Navigation | Approximately 13–15 CSS pixels | Approximately 15–17 CSS pixels in menu |
| Eyebrow/metadata | Approximately 11–13 CSS pixels with controlled tracking | Approximately 10–12 CSS pixels |

Exact values must be visually tuned against the reference at the target viewport rather than applied mechanically.

## 16. Design tokens

The homepage should introduce namespaced campaign tokens so the redesign does not unintentionally restyle admin or reseller interfaces.

Conceptual token groups:

### Colour

- Campaign blue: approximately `#006FF2`, adjusted to the approved Irunsvan logo blue.
- Campaign navy: approximately `#031B36`.
- Campaign ink: near-black navy used for headlines.
- Campaign white: clean white surfaces.
- Campaign mist: very light blue-grey section background.
- Campaign line: subtle blue-grey dividers.
- Campaign muted: readable slate body text.

### Spacing

- Compact: icon and inline spacing.
- Small: labels and controls.
- Standard: card internal spacing.
- Section: desktop vertical section rhythm.
- Wide: large desktop gutters.

### Motion

- Fast interaction: approximately 140–180 milliseconds.
- Standard transition: approximately 220–320 milliseconds.
- Entrance transition: approximately 500–700 milliseconds.
- Use a custom deceleration curve.
- Respect reduced-motion preferences.

### Shape

- Buttons: square or 0–4 pixel radius.
- Product cards: square or very small radius.
- Large sections: no decorative rounded outer shell.
- Icons: precise thin-line SVGs.

## 17. CSS architecture

All new homepage styles must be namespaced beneath a unique root such as `campaign-home-v2`.

Planned style groups:

1. Campaign root and tokens.
2. Header.
3. Hero.
4. Shared campaign typography.
5. Shared campaign actions.
6. Featured collection.
7. Featured product cards.
8. Purpose section.
9. Wholesale/stockist split.
10. Footer.
11. Tablet breakpoint.
12. Mobile breakpoint.
13. Small-mobile breakpoint.
14. Reduced-motion rules.
15. High-contrast/focus-visible rules.
16. Print-safe fallbacks if applicable.

The old homepage CSS should remain temporarily during implementation. It should only be removed after the new homepage passes visual and regression testing and no other route depends on it.

## 18. JavaScript rendering architecture

The homepage should be decomposed into small rendering responsibilities inside `src/app.js`.

Planned function contracts:

| Function responsibility | Inputs | Output responsibility |
|---|---|---|
| Public campaign header | Authentication state, route, order state | Semantic public header and navigation. |
| Homepage root | Existing application state | Composes all homepage sections in final order. |
| Hero model builder | Sanitized site content | Produces safe hero display values and routes. |
| Hero renderer | Hero view model | Produces hero section markup only. |
| Featured selector | Products, variants, configured SKUs | Returns exactly zero to three valid public products. |
| Featured card renderer | Public product model | Produces one accessible product card. |
| Featured section renderer | Selected products | Produces editorial heading and card grid. |
| Purpose renderer | Sanitized homepage content | Produces purpose image/copy section. |
| Wholesale renderer | Sanitized homepage content and auth state | Produces reseller call-to-action panel. |
| Stockist renderer | Stockist summary or static safe model | Produces stockist panel and map. |
| Campaign footer | Auth state and available routes | Produces minimal public footer. |
| Order-count selector | Current reseller order state | Produces truthful bag count. |

Rules for all renderers:

- Escape all user-editable text.
- Validate all route values against known routes or controlled defaults.
- Resolve all images through existing safe URL helpers.
- Never expose filenames or storage paths as visible text.
- Never place untrusted text into raw HTML.
- Keep event handling delegated through existing `data-route` and `data-action` patterns.
- Keep one page-level H1.
- Use semantic section headings.

## 19. Site-content and admin-control architecture

The new homepage must remain manageable without editing source code for routine content changes.

### 19.1 Existing controls to retain

- Hero eyebrow.
- Hero title.
- Hero copy.
- Primary action label and route.
- Secondary action label and route.
- Theme colours where still appropriate.

### 19.2 Proposed controls to add

- Hero highlighted phrase.
- Hero campaign metadata.
- Hero campaign image.
- Hero image focal point.
- Hero lower-right statement.
- Three featured product SKU selectors.
- Purpose heading and body.
- Purpose background image.
- Wholesale heading and body.
- Wholesale image.
- Stockist heading and body.
- Optional footer contact details.
- Visibility toggles for optional sections.

### 19.3 Data-storage principle

Prefer extending the existing site-content JSON/configuration mechanism if it safely supports additional fields. Avoid introducing a new database table solely for static homepage copy unless the existing storage structure cannot support it cleanly.

Any Supabase change must be separately reviewed, documented, and verified before application.

## 20. Asset directory plan

New homepage assets should be isolated from product photography.

Planned directory structure:

- `public/homepage/hero-athlete.webp`
- `public/homepage/hero-athlete-mobile.webp`
- `public/homepage/africa-runner.webp`
- `public/homepage/wholesale-box.webp`
- `public/homepage/africa-outline.svg`
- `public/homepage/africa-stockists.svg`
- `public/fonts/` for approved self-hosted font files.

Do not rename or reorganize existing product images during this work.

## 21. Image handling rules

- Use WebP for campaign photography unless another format provides a measurable advantage.
- Keep SVG for logos, maps, and simple vector marks.
- Supply explicit width and height information to reduce layout shift.
- Use eager loading only for the hero image.
- Use lazy loading for below-the-fold campaign imagery and products.
- Provide meaningful alt text for informative images.
- Use empty alt text for purely decorative image layers.
- Keep text out of raster images.
- Maintain image focal points across desktop and mobile crops.
- Prevent image filenames from becoming captions.
- Provide a deliberate fallback state for missing campaign assets.

## 22. Responsive layout plan

### 22.1 Large desktop

- Preserve the reference’s wide editorial proportions.
- Limit content width while allowing hero imagery to feel expansive.
- Use a structured grid with consistent outer gutters.
- Keep all featured products on one row.
- Keep wholesale and stockist panels side by side.

### 22.2 Standard desktop and laptop

- Scale headline fluidly without wrapping into awkward one-word lines.
- Preserve athlete visibility.
- Reduce gutters moderately.
- Keep three featured products if minimum card widths remain usable.

### 22.3 Tablet

- Collapse header navigation into a menu where required.
- Keep hero as a controlled split if enough width remains; otherwise stack text above image.
- Change featured section to two-column or horizontal-scroll presentation.
- Stack wholesale and stockist panels if two-column copy becomes cramped.

### 22.4 Mobile

- Use text first and athlete image second unless a tested overlay remains readable.
- Ensure the full hero message is visible without horizontal overflow.
- Stack primary and secondary actions or make them full width.
- Use a horizontally scrollable featured-product rail with visible next-card affordance, or stack cards if testing shows better usability.
- Stack purpose, wholesale, and stockist sections.
- Use a two-column compact footer at most; collapse further on narrow screens.
- Keep tap targets at least 44 CSS pixels.
- Avoid `100vh`; use content-driven height or modern dynamic viewport units only where justified.

### 22.5 Target test widths

- 1440 pixels.
- 1280 pixels.
- 1024 pixels.
- 768 pixels.
- 430 pixels.
- 390 pixels.
- 360 pixels.

## 23. Accessibility requirements

- Provide a skip-to-content link.
- Use exactly one H1 on the homepage.
- Maintain logical H2 and H3 order.
- Ensure all navigation is keyboard operable.
- Use `aria-expanded` and `aria-controls` for the mobile menu.
- Provide visible focus states on every interactive element.
- Ensure blue/white and navy/white combinations meet WCAG AA contrast.
- Ensure product-card links have descriptive accessible names.
- Ensure icons have accessible names or are hidden when decorative.
- Never use colour alone to communicate active or selected state.
- Respect `prefers-reduced-motion`.
- Avoid autoplay carousels.
- Do not trap keyboard focus in the mobile menu.
- Keep route changes understandable to assistive technology under the application’s existing navigation model.

## 24. Motion plan

Motion must remain subtle and consistent with the reference.

Allowed interactions:

- Header link colour/underline transition.
- Button background and arrow-position transition.
- Product image scale of approximately 1–2 percent on hover.
- Gentle opacity/vertical entrance for major sections if it does not delay content.
- Mobile menu reveal using opacity and transform.

Disallowed interactions:

- Bouncy motion.
- Rotating cards.
- Floating decorative blobs.
- Heavy parallax.
- Continuous background animation.
- Large blur animations.
- Autoplay product carousel.
- Motion that changes layout dimensions.

## 25. Performance budget

The redesign should target:

- No unnecessary framework dependency.
- No icon library for a handful of icons; use optimized inline or local SVGs.
- Self-hosted font files limited to required families and weights.
- Campaign imagery compressed appropriately.
- Hero image prioritized without blocking all other content.
- Below-the-fold imagery lazy-loaded.
- No large JavaScript animation library.
- No continuous scroll event handler.
- Minimal cumulative layout shift.
- No public exposure of Supabase service-role credentials.

Suggested image budgets after optimization:

- Hero desktop: ideally below 450 KB, subject to acceptable visual quality.
- Hero mobile: ideally below 250 KB.
- Purpose image: ideally below 350 KB.
- Wholesale image: ideally below 200 KB.
- Individual featured product image: ideally below 150 KB when locally optimized.

## 26. Error and empty-state behaviour

### Hero image unavailable

- Use a controlled blue-to-white campaign background.
- Keep all copy and actions visible.
- Do not show a broken-image icon or filename.

### Featured products unavailable

- Hide empty product slots.
- If no valid products exist, show the section heading and a single catalogue action rather than internal loading/error text.

### Stockist data unavailable

- Keep the Find a Stockist action.
- Use the approved static Africa outline without fake location markers.

### Supabase temporarily unavailable

- Preserve the existing fallback catalogue behaviour.
- Avoid showing database-specific errors publicly.
- Log or surface detailed errors only in appropriate admin/development contexts.

## 27. Testing strategy

### 27.1 Static validation

- Run JavaScript syntax checks.
- Run the complete unit-test suite.
- Run the static build.
- Run whitespace/diff validation.
- Confirm no password or service-role secret enters tracked files.

### 27.2 Homepage behaviour tests

- Header route mapping signed out.
- Header route mapping for pending reseller.
- Header route mapping for approved reseller.
- Header route mapping for admin.
- Account action signed out and signed in.
- Order-bag count truthfulness.
- Primary and secondary hero actions.
- Featured-product selection order.
- Featured-product fallback selection.
- Unpublished products excluded.
- Missing images handled safely.
- Stockist action route.
- Wholesale action route.
- Footer route mapping.
- Mobile menu open, close, Escape, and route selection.

### 27.3 Regression tests

- Admin login still works.
- Reseller login still works.
- Admin dashboard renders.
- Site controls render and save.
- Product catalogue renders.
- Product-flyer detail pages still hide internal image labels.
- Stockist finder renders.
- Reseller application submits.
- Reseller ordering portal renders.
- Existing order workflow remains intact.
- Logout works.
- Route access guards remain intact.

### 27.4 Visual review

Capture full-page screenshots at all target widths.

Compare against the approved reference for:

- Header height and alignment.
- Hero split ratio.
- Hero headline scale and line breaks.
- Athlete crop and focal point.
- Button dimensions.
- Featured-card proportions.
- Section heights.
- Purpose-image overlay strength.
- Wholesale/stockist split ratio.
- Footer depth and column alignment.
- Mobile section order.

## 28. Definition of visual completion

The desktop homepage is visually complete when:

- The first screen has the same visual hierarchy as the supplied reference.
- The hero headline and athlete hold comparable visual weight.
- The header feels equally clean and compact.
- The featured collection reads as one editorial system.
- The purpose section has comparable cinematic contrast.
- The wholesale and stockist sections align cleanly as one row.
- The footer feels structured and intentional.
- No current bokeh, glass-card, telemetry, or campaign-system styling remains on the homepage.
- No internal labels appear publicly.
- The user approves a local full-page screenshot.

## 29. Definition of functional completion

The redesign is functionally complete when:

- Every visible action routes correctly.
- Authentication-aware navigation works for all user roles.
- Featured products come from valid published catalogue data.
- The order bag represents real order state.
- Stockist and reseller actions use existing workflows.
- Admin, reseller, product, and login routes remain unaffected.
- All tests and build checks pass.
- The local site works after a clean build.
- Production deployment is separately approved and verified.

## 30. Implementation phases

### Phase 0: Baseline protection

- Review the working tree.
- Preserve the internal-label filtering fix.
- Run current checks and tests.
- Capture the current homepage as a regression reference.

### Phase 1: Asset preparation

- Approve/generate hero image.
- Approve/generate purpose image.
- Approve/generate wholesale image.
- Create Africa map assets.
- Select and self-host typography.
- Optimize all assets.

### Phase 2: Public shell

- Add namespaced campaign tokens.
- Implement public campaign header.
- Implement campaign footer.
- Preserve portal headers and footers.
- Verify authentication-aware navigation.

### Phase 3: Hero

- Implement hero view model.
- Implement desktop hero layout.
- Connect editable content.
- Add responsive image focal control.
- Implement mobile hero.
- Verify actions and accessibility.

### Phase 4: Featured collection

- Implement featured SKU selection.
- Implement safe fallback selection.
- Build product cards using existing product/image helpers.
- Connect card routes.
- Verify internal metadata never renders.

### Phase 5: Purpose, wholesale, and stockists

- Implement purpose section.
- Implement wholesale panel.
- Implement stockist panel and truthful map.
- Connect existing application and stockist routes.

### Phase 6: Admin content controls

- Extend sanitized homepage configuration.
- Add only the necessary admin fields.
- Verify saved data and fallback behaviour.
- Confirm no database secrets are exposed.

### Phase 7: Responsive and accessibility pass

- Tune all target viewport widths.
- Validate keyboard navigation.
- Validate focus treatment and contrast.
- Validate reduced-motion mode.
- Validate image alt text and heading order.

### Phase 8: Regression and visual approval

- Run full automated checks.
- Capture local screenshots.
- Compare with reference.
- Correct spacing, typography, and crop differences.
- Obtain user approval.

### Phase 9: Deployment

- Confirm deployment authorization.
- Commit only intended files.
- Push approved changes.
- Wait for hosting deployment.
- Verify production assets, routes, login, and mobile layout.
- Confirm no stale cached CSS/JavaScript is served.

## 31. Implementation decision log

The following decisions are already made:

- Keep the existing vanilla JavaScript application.
- Redesign the public homepage only.
- Preserve Supabase and all portal workflows.
- Match the supplied reference closely.
- Remove About Us-style homepage content.
- Remove careers, news, newsletter, and fake links.
- Use real existing routes for every action.
- Map the bag icon to the real reseller order flow.
- Use existing published catalogue products for featured cards.
- Keep internal image labels hidden publicly.
- Obtain local visual approval before deployment.

The following decisions remain open before implementation:

- Final three featured product SKUs.
- Final campaign-image sources.
- Final display/body font licenses and files.
- Whether the footer includes social links.
- Whether the stockist map uses real markers or no markers initially.
- Whether homepage content controls are expanded in the first release or a later release.

## 32. Pre-coding approval checklist

Before any implementation code is written, confirm:

- [ ] The supplied mockup remains the approved visual reference.
- [ ] The working copy headline is approved.
- [ ] The section order is approved.
- [ ] About Us and story content are removed from the homepage.
- [ ] The three featured products are selected or fallback selection is accepted.
- [ ] The hero image approach is approved.
- [ ] The purpose image approach is approved.
- [ ] The wholesale image approach is approved.
- [ ] The stockist-map truthfulness rule is approved.
- [ ] Footer links are approved.
- [ ] No consumer payment checkout is expected.
- [ ] Local review is required before production deployment.

## 33. Final implementation guardrails

- Do not alter authentication credentials.
- Do not expose passwords in source code.
- Do not expose Supabase secret/service-role keys.
- Do not fabricate stockists, products, inventory, or order counts.
- Do not render internal labels or filenames publicly.
- Do not remove unrelated user changes.
- Do not redesign admin or reseller pages as a side effect.
- Do not deploy without explicit approval.
- Do not delete the old homepage implementation until the new homepage is approved and regression-tested.
- Do not treat the supplied full-page mockup as a raster image to be placed over the website; reproduce its layout using real accessible elements and separate approved assets.

## 34. Handoff instruction for the implementation agent

The implementation agent must read this entire document before editing any file.

The agent must begin by inspecting the current working tree and verifying the internal-label filter in `src/app.js`. It must then implement phases in order, report any conflict between this plan and the current code, and stop before deployment unless deployment is explicitly authorized.

The reference mockup is the visual authority. Existing application behaviour is the functional authority. If visual fidelity conflicts with working authentication, ordering, accessibility, truthful data, or security, preserve the working and truthful behaviour and explain the smallest visual compromise required.
