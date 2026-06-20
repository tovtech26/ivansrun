# Homepage Terra Light Design

## Goal

Redesign the public homepage so it feels very close to the supplied campaign reference in structure, typography, framing, and visual energy, while staying consistent with Irunsvan's existing brand blue and preserving the current editable content system.

## Approved Direction

- Keep the current homepage information architecture instead of replacing it with a totally new site map.
- Make the design feel campaign-led and editorial rather than catalogue-led.
- Use a light palette instead of the reference's black background.
- Keep Irunsvan's existing blue family as the core accent.
- Keep the homepage permanently editable through the current flyer, stories, and about content flow.
- Use only the assets already available in the repository for the first implementation pass.

## Experience Summary

The homepage should read like a campaign landing page built on top of the current editable content model. It should no longer feel like a soft commercial storefront front page. The page should instead feel sharp, image-led, technical, and fashion-editorial, with oversized condensed headlines, compact metadata labels, framed content blocks, and campaign-style navigation language.

## Visual System

### Palette

- Base background: white or off-white.
- Secondary surfaces: very light stone, cool grey, and pale blue tints.
- Primary accent: Irunsvan brand blue from the current site.
- Supporting ink: dark charcoal or navy-black for text and borders.
- Avoid the reference's orange/red clay palette in the implementation.

### Typography

- Use a condensed, campaign-style display face for major headlines, close in spirit to the reference.
- Keep a readable sans-serif body font for supporting copy and interface text.
- Headlines should be oversized, uppercase, and tightly tracked.
- Labels and metadata should use smaller uppercase text with higher letter spacing.

### Framing And Motifs

- Thin technical borders and sectional dividers.
- Image panels and cards with deliberate frames rather than soft consumer-card styling.
- Small data-kicker labels, status tags, and campaign metadata.
- Strong contrast between oversized headlines and compact supporting labels.
- Avoid rounded, soft, app-like styling on the public homepage.

## Page Structure

### 1. Campaign Top Navigation

The top navigation should become campaign-style rather than practical in wording. It should still route to the same real destinations, but the labels should feel shorter and more brand-led.

Expected behavior:

- Keep access to catalogue, reseller application, sign-in, and reseller finder.
- Replace plain labels with campaign-style labels where appropriate.
- Preserve responsive mobile navigation behavior.

### 2. Flyer-Led Hero

The homepage should open with the flyer content as the hero experience.

Behavior:

- The first published flyer is treated as the active hero state.
- Additional flyers remain accessible through a styled carousel or rail.
- The hero uses large editorial headline copy, compact metadata, and one or two strong CTAs.
- The flyer visual should dominate the first screen the way the reference image dominates its hero.

Visual expectations:

- Large image-led first section.
- Big display headline over or adjacent to the flyer visual.
- Small campaign labels and metadata lines.
- Reference-like composition, but rendered in a light blue/white Irunsvan system.

### 3. Stories As Field Records

The stories section should keep the existing editable blog/story data source but change presentation.

Behavior:

- Published stories remain newest-first.
- Cards keep title, date, summary, and image.
- Clicking a story still opens the existing story detail route.

Presentation:

- Section title should feel like a campaign archive or field-records rail.
- Story cards should be image-forward and more dramatic than the current plain content cards.
- Use framed card treatment, small status labels, and stronger headline hierarchy.

### 4. About As Manifesto

The about section should remain editable, but the presentation should feel like a manifesto panel rather than a simple text block.

Behavior:

- Keep the existing editable about heading and body fields.
- No new required CMS fields in the first pass.

Presentation:

- Strong headline treatment.
- Supporting technical or campaign framing details.
- Clear visual separation from the stories section.
- Copy should feel short, declarative, and editorial.

### 5. Footer

The footer should be restyled to match the campaign system with stronger hierarchy, uppercase microcopy, and cleaner technical framing.

## Content Model Constraints

The first implementation pass should preserve the current content model and admin flows as much as possible.

Keep:

- Editable homepage flyers.
- Editable stories.
- Editable about heading and body.

Avoid in first pass:

- New required database fields.
- New mandatory admin workflows.
- Hardcoded homepage content that bypasses the editor.

Optional future fields can be considered later if needed, such as hero kicker labels or campaign metadata, but they are not required for this redesign.

## Implementation Shape

This should be implemented primarily as a rendering and styling redesign, not a data-model rewrite.

Primary files expected to change:

- `src/app.js`
- `src/styles.css`
- `index.html`

Potentially unchanged or minimally changed:

- `src/website-content.js`
- existing Supabase content tables and content-loading flows

## Responsive Behavior

The redesign must work on desktop and mobile.

Mobile expectations:

- Flyer-led hero remains the first visual focus.
- Headlines scale down without losing impact.
- Campaign navigation still works cleanly in the existing mobile menu pattern.
- Story cards stack cleanly.
- About section remains readable and visually framed without crowding.

## Non-Goals

- Do not turn the homepage back into a product-ordering or cart-led screen.
- Do not remove the current editable content system.
- Do not depend on downloading new imagery for the initial redesign.
- Do not rebuild unrelated reseller or admin routes as part of this task.

## Acceptance Criteria

- The homepage feels visibly close to the supplied reference in layout language and campaign energy.
- The page uses a light Irunsvan-blue palette instead of the reference's black/orange mood.
- The flyer content leads the hero experience.
- The stories section feels like a campaign archive rather than a basic blog list.
- The about section reads like a brand manifesto.
- Existing editable flyer, story, and about content still drive the public homepage.
- Existing routes and public/admin content behavior continue to function.
