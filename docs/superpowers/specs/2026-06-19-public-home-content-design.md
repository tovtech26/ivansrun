# Public Home Content Design

## Goal

Change the public home page from a catalogue/storefront into a lightweight brand and content page that admins can manage without code changes.

## Scope

This phase includes:

- Image-only home flyer carousel.
- Latest stories/events carousel.
- Simple blog/story detail pages.
- Admin-managed flyer uploads.
- Admin-managed story posts.
- Admin-editable About section.
- Removing shopping/catalogue behavior from the home page.

This phase does not rebuild the products page. The products page will later become a curated website catalogue of about 10 shoes. Customer-facing text must not say "public products"; use labels such as "Products", "Catalogue", "Shoe Range", or "Featured Range".

## Public Home Page

The home page should become a simple content page, not an ecommerce entry point.

The first section is an image-only flyer carousel. Each slide is a flyer image with no text overlay and no shopping controls. The carousel uses normal image elements, a stable aspect ratio, previous/next controls, and a small position indicator. It should not use a heavy carousel dependency.

The second section shows latest stories/events. It displays published blog posts newest first. Each card should show a cover image, title, date, and short summary. Clicking a story opens a story detail route inside the same app.

The third section is About Us. Admins can edit the heading and body text. An optional image can be supported if it fits naturally, but the default implementation should work with text only.

Navigation should still let visitors reach the product catalogue, reseller application, sign-in, and reseller finder. The public home page itself should not show product ordering, stock, price, quantity, checkout, or cart-like language.

## Stories

Stories are simple blog/news/event posts. They are not a full CMS.

Each story has:

- Title.
- Slug generated from the title.
- Cover image uploaded by an admin.
- Short summary.
- Body text.
- Published toggle.
- Published date, defaulting to now when published.

The story detail page shows the cover image, title, published date, summary if present, and body text. Body text is plain text with paragraph breaks. No comments, likes, tags, embeds, rich text editor, or multi-image article body are included in this phase.

## Admin Experience

The admin site area should evolve from only "Site Controls" into a practical Website Content page.

Flyer manager:

- Upload flyer image.
- Admin-only name/title for recognition.
- Manual sort order.
- Publish/unpublish.
- Archive/delete action.
- Preview thumbnail.

Story manager:

- Title input.
- Cover image upload.
- Summary textarea.
- Body textarea.
- Publish/unpublish.
- Save action.
- List existing stories newest first.

About editor:

- Heading input.
- Body textarea.
- Save action.

The existing theme controls can remain, but they should not dominate the page. The page should feel like a quiet content-management tool: clear forms, simple lists, no decorative dashboard treatment.

## Data Model

Use dedicated Supabase tables for content instead of hardcoding the home page.

`homepage_flyers`:

- `id uuid primary key`
- `title text not null`
- `image_path text not null`
- `sort_order integer not null default 0`
- `published boolean not null default false`
- `created_by uuid references auth.users(id) on delete set null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`blog_posts`:

- `id uuid primary key`
- `title text not null`
- `slug text not null unique`
- `cover_image_path text`
- `summary text`
- `body text not null default ''`
- `published boolean not null default false`
- `published_at timestamptz`
- `created_by uuid references auth.users(id) on delete set null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Extend `site_content` with:

- `about_heading text`
- `about_body text`

Use Supabase Storage for flyer and story cover images. Public visitors can read images and published content. Only admins can insert, update, delete, or upload.

## Security And RLS

Enable RLS on new public-schema tables.

Policies:

- `anon` and `authenticated` can select rows where `published = true`.
- Authenticated admins can manage all rows.
- Admin checks should use the existing admin role mechanism, not user-editable metadata.

Storage should allow public reads for published media paths and admin-only writes. The app must never expose service-role credentials in browser code.

## App Structure

Expected route changes:

- Keep `store` as the home route if that is the current default, but change what it renders.
- Add a `stories` or `blog` list route if needed.
- Add a story detail route, such as `story`.
- Keep the existing product route and product catalogue behavior untouched except for removing it from the home page.

Expected state additions:

- `homepageFlyers`
- `blogPosts`
- `selectedStoryId` or `selectedStorySlug`
- Admin form pending/error/saved states for flyers, stories, and about content.

Expected data loading:

- Public bootstrap loads active site content, published flyers, and published stories.
- Admin bootstrap loads all flyers and all stories for editing.

## Fallback Behavior

If Supabase content fails to load, the home page should still render a minimal fallback:

- One local flyer image from the existing flyer templates.
- Default About text.
- Empty stories section with a neutral message only if needed.

The failure should not block reseller login or admin access.

## Testing

Tests should cover:

- Sanitizing and normalizing new site content fields.
- Building publish payloads for about content.
- SQL migration includes RLS and public published-only read policies.
- Public home render no longer contains catalogue grid as the main home content.
- Story route wiring exists.
- Admin forms include flyer, story, and about fields.

Manual verification should include:

- Desktop home page.
- Mobile home page.
- Admin content page.
- Creating or editing a flyer.
- Creating or editing a story.
- Opening a story from the home carousel.
