# Public Home Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public home catalogue/storefront with an admin-editable lightweight flyer carousel, latest stories carousel, story detail pages, and About section.

**Architecture:** Add a small website content model on top of the existing vanilla JS app and Supabase REST pattern. Public reads use published rows only; admin reads and writes use authenticated admin policies. Keep reseller ordering and operational product management untouched.

**Tech Stack:** Vanilla JavaScript modules in `src/`, static HTML/CSS, Supabase REST API, Supabase Storage, Postgres RLS, Node assertion tests.

---

## File Structure

- Create `src/website-content.js`: pure helpers for flyer/story/about normalization, slug creation, storage path creation, and row payloads.
- Modify `index.html`: load `src/website-content.js` before `src/app.js` and bump cache keys.
- Modify `src/site-controls.js`: extend sanitized site content with `about.heading` and `about.body`.
- Modify `src/site-publish.js`: include about fields in `site_content` payloads.
- Modify `src/app.js`: add content state, public/admin content loading, home page renderer, story route renderer, admin content forms, storage upload/save handlers, and events.
- Modify `src/mobile-navigation.js`: add route parsing/building for `story` if route handling needs selected story slug support.
- Modify `src/styles.css`: add restrained responsive styles for flyer carousel, story carousel, story detail, and admin content lists/forms.
- Create `supabase/sql/018_public_home_content.sql`: tables, RLS, grants, storage policies, and `site_content` about fields.
- Modify tests: `tests/site-controls.test.js`, `tests/site-publish.test.js`, `tests/app-wiring.test.js`, `tests/supabase-sql.test.js`, and add `tests/website-content.test.js`.
- Modify `package.json`: include `tests/website-content.test.js` in `npm test` and `node --check src/website-content.js` in `npm run check`.

---

### Task 1: Content Helper Module

**Files:**
- Create: `src/website-content.js`
- Modify: `package.json`
- Test: `tests/website-content.test.js`
- Modify: `index.html`

- [ ] **Step 1: Add the failing helper test**

Create `tests/website-content.test.js`:

```js
const assert = require("node:assert/strict");
const {
  DEFAULT_HOME_FLYERS,
  DEFAULT_ABOUT_CONTENT,
  buildStorySlug,
  normalizeFlyers,
  normalizeStories,
  buildContentImageRecord,
  buildFlyerPayload,
  buildStoryPayload,
} = require("../src/website-content.js");

assert.equal(buildStorySlug("Summer Drop: Botswana Launch!"), "summer-drop-botswana-launch");
assert.equal(buildStorySlug(""), "story");

assert.deepEqual(
  normalizeFlyers([
    { id: "2", title: "Second", image_path: "/b.jpg", sort_order: 2, published: true },
    { id: "1", title: "First", image_path: "/a.jpg", sort_order: 1, published: true },
    { id: "x", title: "", image_path: "", sort_order: 0, published: true },
  ]).map((item) => item.title),
  ["First", "Second"],
);

assert.equal(normalizeFlyers([])[0].imagePath, DEFAULT_HOME_FLYERS[0].imagePath);

assert.deepEqual(
  normalizeStories([
    { id: "old", title: "Old", slug: "old", summary: "old", body: "Old body", cover_image_path: "/old.jpg", published: true, published_at: "2026-01-01T00:00:00Z" },
    { id: "new", title: "New", slug: "new", summary: "new", body: "New body", cover_image_path: "/new.jpg", published: true, published_at: "2026-06-01T00:00:00Z" },
  ]).map((item) => item.slug),
  ["new", "old"],
);

assert.equal(normalizeStories([{ id: "bad", title: "", slug: "", body: "" }]).length, 0);

const file = { name: "My Flyer.JPG", type: "image/jpeg" };
assert.deepEqual(buildContentImageRecord({ folder: "flyers", file, uniquePrefix: "20260619" }), {
  originalName: "My Flyer.JPG",
  storagePath: "content/flyers/20260619-my-flyer.jpg",
  contentType: "image/jpeg",
  file,
});

assert.deepEqual(
  buildFlyerPayload({ title: "Launch", imagePath: "content/flyers/launch.jpg", sortOrder: "4", published: true }, "admin-1"),
  {
    title: "Launch",
    image_path: "content/flyers/launch.jpg",
    sort_order: 4,
    published: true,
    created_by: "admin-1",
  },
);

const storyPayload = buildStoryPayload({ title: "Launch Day", coverImagePath: "content/stories/launch.jpg", summary: "Short", body: "Body", published: true }, "admin-1");
assert.equal(storyPayload.title, "Launch Day");
assert.equal(storyPayload.slug, "launch-day");
assert.equal(storyPayload.cover_image_path, "content/stories/launch.jpg");
assert.equal(storyPayload.summary, "Short");
assert.equal(storyPayload.body, "Body");
assert.equal(storyPayload.published, true);
assert.match(storyPayload.published_at, /^\\d{4}-\\d{2}-\\d{2}T/);
assert.equal(storyPayload.created_by, "admin-1");

assert.equal(DEFAULT_ABOUT_CONTENT.heading, "About Irunsvan Africa");

console.log("website-content tests passed");
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `node tests/website-content.test.js`

Expected: FAIL with module not found for `../src/website-content.js`.

- [ ] **Step 3: Implement `src/website-content.js`**

Create `src/website-content.js`:

```js
(function attachWebsiteContent(root) {
  const CONTENT_IMAGE_BUCKET = "product-images";
  const DEFAULT_HOME_FLYERS = [
    {
      id: "fallback-flyer",
      title: "Irunsvan Africa",
      imagePath: "/Flyer Templates/Flyer Template.jpg",
      sortOrder: 0,
      published: true,
    },
  ];
  const DEFAULT_ABOUT_CONTENT = {
    heading: "About Irunsvan Africa",
    body: "Irunsvan Africa supplies performance footwear through approved reseller channels across Africa.",
  };

  function safeText(value) {
    return String(value || "").trim();
  }

  function safeBool(value) {
    return value === true || value === "true" || value === "on";
  }

  function safeInteger(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function slugPart(value) {
    return safeText(value)
      .toLowerCase()
      .replace(/\\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function extension(fileName) {
    const match = safeText(fileName).toLowerCase().match(/\\.([a-z0-9]+)$/);
    return match ? `.${match[1]}` : "";
  }

  function buildStorySlug(title) {
    return slugPart(title) || "story";
  }

  function normalizeFlyers(rows = []) {
    const normalized = (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: safeText(row.id),
        title: safeText(row.title),
        imagePath: safeText(row.image_path || row.imagePath),
        sortOrder: safeInteger(row.sort_order ?? row.sortOrder, 0),
        published: row.published !== false,
      }))
      .filter((row) => row.id && row.title && row.imagePath)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title));
    return normalized.length ? normalized : DEFAULT_HOME_FLYERS;
  }

  function normalizeStories(rows = []) {
    return (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: safeText(row.id),
        title: safeText(row.title),
        slug: safeText(row.slug) || buildStorySlug(row.title),
        coverImagePath: safeText(row.cover_image_path || row.coverImagePath),
        summary: safeText(row.summary),
        body: safeText(row.body),
        published: row.published !== false,
        publishedAt: safeText(row.published_at || row.publishedAt || row.created_at || row.createdAt),
      }))
      .filter((row) => row.id && row.title && row.slug && row.body)
      .sort((left, right) => String(right.publishedAt).localeCompare(String(left.publishedAt)));
  }

  function buildContentImageRecord({ folder, file, uniquePrefix = "" } = {}) {
    const safeFolder = slugPart(folder) || "content";
    const name = slugPart(file?.name) || "image";
    const prefix = slugPart(uniquePrefix);
    return {
      originalName: file.name,
      storagePath: `content/${safeFolder}/${[prefix, name].filter(Boolean).join("-")}${extension(file.name)}`,
      contentType: safeText(file.type) || "application/octet-stream",
      file,
    };
  }

  function buildFlyerPayload(input = {}, adminUserId = null) {
    return {
      title: safeText(input.title) || "Flyer",
      image_path: safeText(input.imagePath || input.image_path),
      sort_order: safeInteger(input.sortOrder ?? input.sort_order, 0),
      published: safeBool(input.published),
      created_by: adminUserId,
    };
  }

  function buildStoryPayload(input = {}, adminUserId = null) {
    const published = safeBool(input.published);
    return {
      title: safeText(input.title) || "Story",
      slug: buildStorySlug(input.slug || input.title),
      cover_image_path: safeText(input.coverImagePath || input.cover_image_path) || null,
      summary: safeText(input.summary) || null,
      body: safeText(input.body),
      published,
      published_at: published ? new Date().toISOString() : null,
      created_by: adminUserId,
    };
  }

  const api = {
    CONTENT_IMAGE_BUCKET,
    DEFAULT_HOME_FLYERS,
    DEFAULT_ABOUT_CONTENT,
    buildStorySlug,
    normalizeFlyers,
    normalizeStories,
    buildContentImageRecord,
    buildFlyerPayload,
    buildStoryPayload,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanWebsiteContent = api;
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Wire the script and package checks**

In `index.html`, add before `src/site-controls.js`:

```html
<script src="src/website-content.js?v=irunsvan-home-content-v1" defer></script>
```

Change all existing `?v=irunsvan-admin-images-v2` cache keys in `index.html` to `?v=irunsvan-home-content-v1`.

In `package.json`:

- Add `node --check src/website-content.js` to the `check` script.
- Add `node tests/website-content.test.js &&` before `node tests/site-controls.test.js` in the `test` script.

- [ ] **Step 5: Verify and commit**

Run: `node tests/website-content.test.js`

Expected: PASS with `website-content tests passed`.

Run: `cmd /c npm test`

Expected: PASS.

Commit:

```bash
git add src/website-content.js tests/website-content.test.js package.json index.html
git commit -m "feat: add website content helpers"
```

---

### Task 2: Site Content About Fields

**Files:**
- Modify: `src/site-controls.js`
- Modify: `src/site-publish.js`
- Test: `tests/site-controls.test.js`
- Test: `tests/site-publish.test.js`

- [ ] **Step 1: Extend failing site controls tests**

In `tests/site-controls.test.js`, add `about` to the edited input:

```js
about: {
  heading: "Our Story",
  body: "Built for African reseller networks.",
},
```

Add assertions:

```js
assert.equal(edited.about.heading, "Our Story");
assert.equal(edited.about.body, "Built for African reseller networks.");
assert.equal(empty.about.heading, DEFAULT_SITE_CONTENT.about.heading);
```

Add a blank fallback assertion:

```js
assert.equal(blank.about.heading, DEFAULT_SITE_CONTENT.about.heading);
```

- [ ] **Step 2: Extend failing site publish tests**

In `tests/site-publish.test.js`, add this to the input object:

```js
about: {
  heading: "About Us",
  body: "Africa-focused performance footwear.",
},
```

Update expected `contentRow`:

```js
contentRow: {
  reseller_banner: "Approved resellers can view live stock.",
  about_heading: "About Us",
  about_body: "Africa-focused performance footwear.",
  active: true,
  created_by: "admin-1",
},
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node tests/site-controls.test.js && node tests/site-publish.test.js`

Expected: FAIL because `about` fields are missing.

- [ ] **Step 4: Update `src/site-controls.js`**

Add `about` to `DEFAULT_SITE_CONTENT`:

```js
about: {
  heading: "About Irunsvan Africa",
  body: "Irunsvan Africa supplies performance footwear through approved reseller channels across Africa.",
},
```

Inside `sanitizeSiteContent`, define:

```js
const about = input.about || {};
```

Return this sibling to `hero`, `theme`, and `banner`:

```js
about: {
  heading: textOrDefault(about.heading, DEFAULT_SITE_CONTENT.about.heading),
  body: textOrDefault(about.body, DEFAULT_SITE_CONTENT.about.body),
},
```

- [ ] **Step 5: Update `src/site-publish.js`**

Add fields to `contentRow`:

```js
about_heading: siteContent.about.heading,
about_body: siteContent.about.body,
```

- [ ] **Step 6: Verify and commit**

Run: `node tests/site-controls.test.js && node tests/site-publish.test.js`

Expected: PASS.

Run: `cmd /c npm test`

Expected: PASS.

Commit:

```bash
git add src/site-controls.js src/site-publish.js tests/site-controls.test.js tests/site-publish.test.js
git commit -m "feat: add editable about content"
```

---

### Task 3: Supabase Content Schema

**Files:**
- Create: `supabase/sql/018_public_home_content.sql`
- Modify: `tests/supabase-sql.test.js`

- [ ] **Step 1: Add failing SQL test expectations**

In `tests/supabase-sql.test.js`, read the new SQL file:

```js
const publicHomeContentSql = readFileSync(join(__dirname, "..", "supabase", "sql", "018_public_home_content.sql"), "utf8");
```

Add assertions:

```js
assert.match(publicHomeContentSql, /create table if not exists public\.homepage_flyers/i);
assert.match(publicHomeContentSql, /create table if not exists public\.blog_posts/i);
assert.match(publicHomeContentSql, /alter table public\.homepage_flyers enable row level security/i);
assert.match(publicHomeContentSql, /alter table public\.blog_posts enable row level security/i);
assert.match(publicHomeContentSql, /using \(published = true\)/i);
assert.match(publicHomeContentSql, /private\.is_admin\(\)/i);
assert.match(publicHomeContentSql, /alter table public\.site_content[\s\S]*add column if not exists about_heading text/i);
assert.match(publicHomeContentSql, /alter table public\.site_content[\s\S]*add column if not exists about_body text/i);
assert.match(publicHomeContentSql, /storage\.buckets[\s\S]*'product-images'/i);
assert.match(publicHomeContentSql, /content\/%/i);
```

- [ ] **Step 2: Run SQL test to verify it fails**

Run: `node tests/supabase-sql.test.js`

Expected: FAIL because `018_public_home_content.sql` does not exist.

- [ ] **Step 3: Create `supabase/sql/018_public_home_content.sql`**

Create the file with:

```sql
alter table public.site_content
  add column if not exists about_heading text not null default 'About Irunsvan Africa',
  add column if not exists about_body text not null default 'Irunsvan Africa supplies performance footwear through approved reseller channels across Africa.';

create table if not exists public.homepage_flyers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text not null,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  cover_image_path text,
  summary text,
  body text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_flyers_public_idx
on public.homepage_flyers (published, sort_order, created_at desc);

create index if not exists blog_posts_public_idx
on public.blog_posts (published, published_at desc, created_at desc);

drop trigger if exists set_homepage_flyers_updated_at on public.homepage_flyers;
create trigger set_homepage_flyers_updated_at
before update on public.homepage_flyers
for each row execute function private.set_updated_at();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row execute function private.set_updated_at();

alter table public.homepage_flyers enable row level security;
alter table public.blog_posts enable row level security;

grant select on table public.homepage_flyers to anon, authenticated;
grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.homepage_flyers to authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;

drop policy if exists "Public can read published homepage flyers" on public.homepage_flyers;
create policy "Public can read published homepage flyers"
on public.homepage_flyers
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage homepage flyers" on public.homepage_flyers;
create policy "Admins can manage homepage flyers"
on public.homepage_flyers
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
on public.blog_posts
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts"
on public.blog_posts
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "content_images_admin_insert" on storage.objects;
create policy "content_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and name like 'content/%'
  and private.is_admin()
);

drop policy if exists "content_images_admin_update" on storage.objects;
create policy "content_images_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and name like 'content/%'
  and private.is_admin()
)
with check (
  bucket_id = 'product-images'
  and name like 'content/%'
  and private.is_admin()
);

drop policy if exists "content_images_admin_delete" on storage.objects;
create policy "content_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and name like 'content/%'
  and private.is_admin()
);
```

- [ ] **Step 4: Verify and commit**

Run: `node tests/supabase-sql.test.js`

Expected: PASS.

Run: `cmd /c npm test`

Expected: PASS.

Commit:

```bash
git add supabase/sql/018_public_home_content.sql tests/supabase-sql.test.js
git commit -m "feat: add public home content schema"
```

---

### Task 4: Load Public And Admin Content

**Files:**
- Modify: `src/app.js`
- Modify: `src/mobile-navigation.js`
- Test: `tests/app-wiring.test.js`
- Test: `tests/mobile-navigation.test.js`

- [ ] **Step 1: Add failing route/data wiring assertions**

In `tests/app-wiring.test.js`, add:

```js
assert.equal(appSource.includes("const WebsiteContent = window.IrunsvanWebsiteContent;"), true, "App must load website content helpers.");
assert.equal(appSource.includes("homepageFlyers:"), true, "App state must track homepage flyers.");
assert.equal(appSource.includes("blogPosts:"), true, "App state must track blog posts.");
assert.equal(appSource.includes("selectedStorySlug:"), true, "App state must track selected story slug.");
assert.equal(appSource.includes('fetchOptionalSupabase("homepage_flyers"'), true, "Public bootstrap must fetch published homepage flyers.");
assert.equal(appSource.includes('fetchOptionalSupabase("blog_posts"'), true, "Public bootstrap must fetch published blog posts.");
assert.equal(appSource.includes('fetchAuthedSupabase("homepage_flyers"'), true, "Admin bootstrap must fetch all homepage flyers.");
assert.equal(appSource.includes('fetchAuthedSupabase("blog_posts"'), true, "Admin bootstrap must fetch all blog posts.");
assert.equal(appSource.includes('"story"'), true, "Story route must be registered.");
```

In `tests/mobile-navigation.test.js`, add a route assertion matching the existing style:

```js
assert.deepEqual(parseRouteUrl("#/story/new-launch"), { route: "story", productId: null, storySlug: "new-launch" });
assert.equal(buildRouteUrl("story", { storySlug: "new-launch" }), "#/story/new-launch");
```

- [ ] **Step 2: Run route/data tests to verify they fail**

Run: `node tests/app-wiring.test.js && node tests/mobile-navigation.test.js`

Expected: FAIL because route/data wiring does not exist.

- [ ] **Step 3: Add route and state**

In `src/app.js`:

- Add `story` to `ROUTES`.
- Add `const WebsiteContent = window.IrunsvanWebsiteContent;`.
- Add state fields:

```js
homepageFlyers: WebsiteContent.normalizeFlyers([]),
blogPosts: [],
selectedStorySlug: initialRouteState.storySlug || null,
homepageContentLoading: false,
homepageContentError: null,
adminContentError: null,
flyerSavePending: false,
storySavePending: false,
aboutSavePending: false,
```

In `setRoute`, add:

```js
if (params.storySlug) state.selectedStorySlug = params.storySlug;
```

In `popstate`, restore:

```js
if (routeState.storySlug) state.selectedStorySlug = routeState.storySlug;
```

- [ ] **Step 4: Extend mobile navigation route support**

In `src/mobile-navigation.js`, update route parsing/building so `#/story/<slug>` returns:

```js
{ route: "story", productId: null, storySlug: "new-launch" }
```

and `buildRouteUrl("story", { storySlug: "new-launch" })` returns `#/story/new-launch`.

- [ ] **Step 5: Load content in `loadCatalog`**

In `loadCatalog`, add public fetches beside the existing site-control fetches:

```js
fetchOptionalSupabase("homepage_flyers", "select=id,title,image_path,sort_order,published,created_at&published=eq.true&order=sort_order.asc,created_at.desc&limit=20"),
fetchOptionalSupabase("blog_posts", "select=id,title,slug,cover_image_path,summary,body,published,published_at,created_at&published=eq.true&order=published_at.desc,created_at.desc&limit=20"),
```

Assign:

```js
state.homepageFlyers = WebsiteContent.normalizeFlyers(flyerRows);
state.blogPosts = WebsiteContent.normalizeStories(blogRows);
```

Update `remoteSiteContent` to read:

```js
about: {
  heading: content.about_heading,
  body: content.about_body,
},
```

- [ ] **Step 6: Load all content for admins**

In `loadProtectedData`, when `state.auth.isAdmin`, fetch:

```js
fetchAuthedSupabase("homepage_flyers", "select=id,title,image_path,sort_order,published,created_at,updated_at&order=sort_order.asc,created_at.desc&limit=200"),
fetchAuthedSupabase("blog_posts", "select=id,title,slug,cover_image_path,summary,body,published,published_at,created_at,updated_at&order=created_at.desc&limit=200"),
```

Extend `normalizeFlyers` and `normalizeStories` in `src/website-content.js` to accept `options = {}` and include unpublished rows for admin views.

Change the flyer filter from:

```js
  .filter((row) => row.id && row.title && row.imagePath)
```

to:

```js
  .filter((row) => row.id && row.title && row.imagePath && (options.includeUnpublished === true || row.published))
```

Change the story filter from:

```js
  .filter((row) => row.id && row.title && row.slug && row.body)
```

to:

```js
  .filter((row) => row.id && row.title && row.slug && row.body && (options.includeUnpublished === true || row.published))
```

Update `tests/website-content.test.js` with:

```js
assert.equal(normalizeStories([{ id: "draft", title: "Draft", slug: "draft", body: "Draft", published: false }], { includeUnpublished: true }).length, 1);
assert.equal(normalizeStories([{ id: "draft", title: "Draft", slug: "draft", body: "Draft", published: false }]).length, 0);
```

Assign admin reads with:

```js
state.homepageFlyers = WebsiteContent.normalizeFlyers(adminFlyerRows, { includeUnpublished: true });
state.blogPosts = WebsiteContent.normalizeStories(adminBlogRows, { includeUnpublished: true });
```

- [ ] **Step 7: Verify and commit**

Run: `node tests/app-wiring.test.js && node tests/mobile-navigation.test.js && node tests/website-content.test.js`

Expected: PASS.

Run: `cmd /c npm test`

Expected: PASS.

Commit:

```bash
git add src/app.js src/mobile-navigation.js src/website-content.js tests/app-wiring.test.js tests/mobile-navigation.test.js tests/website-content.test.js
git commit -m "feat: load website content feeds"
```

---

### Task 5: Public Home And Story Rendering

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `tests/app-wiring.test.js`

- [ ] **Step 1: Add failing public rendering assertions**

In `tests/app-wiring.test.js`, add:

```js
assert.equal(appSource.includes("function publicHomePage("), true, "Public home must have a dedicated content page renderer.");
assert.equal(appSource.includes("function flyerCarousel("), true, "Home must render a lightweight flyer carousel.");
assert.equal(appSource.includes("function storyCarousel("), true, "Home must render latest stories.");
assert.equal(appSource.includes("function storyDetailPage("), true, "Story detail route must render a story page.");
assert.equal(appSource.includes('"store": publicHomePage'), true, "Store route must render the public content home.");
assert.equal(appSource.includes('"story": storyDetailPage'), true, "Story route must render story details.");
assert.equal(appSource.includes('class="catalog-section" id="catalog"'), false, "Public home must no longer render the catalogue section.");
assert.equal(appSource.includes("cart-like"), false, "Public home copy must not use shopping/cart language.");
```

- [ ] **Step 2: Run app wiring test to verify it fails**

Run: `node tests/app-wiring.test.js`

Expected: FAIL because public home/story renderers do not exist.

- [ ] **Step 3: Split catalogue renderer from home renderer**

In `src/app.js`:

- Rename existing `storefront()` to `catalogPage()` or keep it as an internal function rendered by a future `products` route.
- Create `publicHomePage()` that renders:

```js
<main class="public-home">
  ${flyerCarousel(state.homepageFlyers)}
  ${storyCarousel(state.blogPosts)}
  ${aboutSection(state.siteContent.about)}
  ${footer()}
</main>
```

- In `routeView`, map:

```js
store: publicHomePage,
story: storyDetailPage,
```

Keep `productDetail()` unchanged.

- [ ] **Step 4: Add flyer carousel renderer**

Add:

```js
function flyerCarousel(flyers) {
  const items = WebsiteContent.normalizeFlyers(flyers);
  const selected = items[0];
  return `
    <section class="home-flyer-carousel" aria-label="Irunsvan Africa flyers">
      <div class="home-flyer-frame">
        <img src="${escapeHtml(resolveContentImageUrl(selected.imagePath))}" alt="${escapeHtml(selected.title)}" loading="eager" />
      </div>
      ${items.length > 1 ? `<div class="home-carousel-controls"><button data-action="home-flyer-step" data-direction="-1">Previous</button><span>1/${items.length}</span><button data-action="home-flyer-step" data-direction="1">Next</button></div>` : ""}
    </section>
  `;
}
```

Add state `homeFlyerIndex: 0` and use it in `flyerCarousel`. Add event handling for `data-action="home-flyer-step"` to update the index and render.

- [ ] **Step 5: Add story carousel and story detail**

Add `storyCard(story)`, `storyCarousel(stories)`, `selectedStory()`, and `storyDetailPage()`.

Story card buttons must use:

```html
<button data-route="story" data-story-slug="${escapeHtml(story.slug)}">
```

Story detail body should render paragraphs:

```js
String(story.body || "")
  .split(/\n{2,}/)
  .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
  .join("")
```

- [ ] **Step 6: Add content image URL resolver**

Add:

```js
function resolveContentImageUrl(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return `${SUPABASE_URL}/storage/v1/object/public/${WebsiteContent.CONTENT_IMAGE_BUCKET}/${value.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
}
```

- [ ] **Step 7: Add restrained responsive styles**

In `src/styles.css`, add classes:

```css
.public-home { background: var(--paper); }
.home-flyer-carousel { padding: 24px clamp(16px, 4vw, 48px); }
.home-flyer-frame { max-width: 1180px; margin: 0 auto; aspect-ratio: 16 / 7; background: #fff; border: 1px solid rgba(0, 0, 0, 0.08); overflow: hidden; }
.home-flyer-frame img { width: 100%; height: 100%; object-fit: contain; display: block; }
.home-carousel-controls { max-width: 1180px; margin: 12px auto 0; display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
.home-carousel-controls button { border: 1px solid rgba(0, 0, 0, 0.14); background: #fff; padding: 8px 12px; border-radius: 8px; }
.home-stories, .home-about { max-width: 1180px; margin: 0 auto; padding: 32px clamp(16px, 4vw, 48px); }
.story-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.story-card { text-align: left; background: #fff; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 8px; overflow: hidden; }
.story-card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
.story-card-body { padding: 14px; }
.story-page { max-width: 880px; margin: 0 auto; padding: 32px 16px 56px; }
.story-hero-image { width: 100%; max-height: 520px; object-fit: cover; border-radius: 8px; }
@media (max-width: 760px) {
  .home-flyer-frame { aspect-ratio: 4 / 5; }
  .story-strip { grid-template-columns: 1fr; }
}
```

Use existing project colors if there are conflicting style variables.

- [ ] **Step 8: Verify and commit**

Run: `node tests/app-wiring.test.js`

Expected: PASS.

Run: `cmd /c npm test`

Expected: PASS.

Run: `cmd /c npm run build`

Expected: PASS with `Built static site into dist/`.

Commit:

```bash
git add src/app.js src/styles.css tests/app-wiring.test.js
git commit -m "feat: add public content home"
```

---

### Task 6: Admin Content Forms And Uploads

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `tests/app-wiring.test.js`

- [ ] **Step 1: Add failing admin wiring assertions**

In `tests/app-wiring.test.js`, add:

```js
assert.equal(appSource.includes('data-form="homepage-flyer"'), true, "Admin site controls must include flyer manager form.");
assert.equal(appSource.includes('data-form="blog-post"'), true, "Admin site controls must include story manager form.");
assert.equal(appSource.includes('data-form="about-content"'), true, "Admin site controls must include about editor form.");
assert.equal(appSource.includes("async function saveHomepageFlyer("), true, "Flyer saves must have a dedicated handler.");
assert.equal(appSource.includes("async function saveBlogPost("), true, "Story saves must have a dedicated handler.");
assert.equal(appSource.includes("async function saveAboutContent("), true, "About saves must have a dedicated handler.");
assert.equal(appSource.includes("async function uploadContentImage("), true, "Website content images must upload through a dedicated storage helper.");
assert.equal(appSource.includes("Website Content"), true, "Admin page title should reflect content management.");
```

- [ ] **Step 2: Run app wiring test to verify it fails**

Run: `node tests/app-wiring.test.js`

Expected: FAIL because admin content forms do not exist.

- [ ] **Step 3: Add upload helper**

In `src/app.js`, add:

```js
async function uploadContentImage(record) {
  const session = requireAuthedSession();
  const response = await monitoredFetch(
    `storage:${WebsiteContent.CONTENT_IMAGE_BUCKET}`,
    `${SUPABASE_URL}/storage/v1/object/${WebsiteContent.CONTENT_IMAGE_BUCKET}/${record.storagePath}`,
    {
      method: "POST",
      headers: {
        ...SupabaseClient.headers(SUPABASE_KEY, session?.access_token),
        "Content-Type": record.contentType,
        "Cache-Control": "3600",
      },
      body: record.file,
    },
  );
  if (!response.ok) throw await buildResponseError("content image upload failed", response);
  return response.json().catch(() => ({ path: record.storagePath }));
}
```

- [ ] **Step 4: Redesign admin site controls render**

In `adminSiteControls()`, change the topbar title to `Website Content`.

Add three sections before or above theme controls:

- Flyer manager form with `data-form="homepage-flyer"`.
- Story manager form with `data-form="blog-post"`.
- About editor form with `data-form="about-content"`.

Flyer form fields:

```html
<input name="flyer_title" />
<input name="flyer_sort_order" type="number" />
<input name="flyer_image" type="file" accept="image/*" />
<input name="flyer_published" type="checkbox" />
```

Story form fields:

```html
<input name="story_title" />
<input name="story_cover_image" type="file" accept="image/*" />
<textarea name="story_summary"></textarea>
<textarea name="story_body"></textarea>
<input name="story_published" type="checkbox" />
```

About form fields:

```html
<input name="about_heading" />
<textarea name="about_body"></textarea>
```

Render existing flyers and stories as simple admin lists with thumbnails, title, publish state, and dates.

- [ ] **Step 5: Add save handlers**

Add:

```js
async function saveHomepageFlyer(form) {
  const data = new FormData(form);
  state.flyerSavePending = true;
  state.adminContentError = null;
  render();
  try {
    const file = form.elements.namedItem("flyer_image")?.files?.[0];
    if (!file) throw new Error("Choose a flyer image before saving.");
    const record = WebsiteContent.buildContentImageRecord({ folder: "flyers", file, uniquePrefix: new Date().toISOString().replace(/\D/g, "") });
    await uploadContentImage(record);
    const [saved] = await insertAuthedSupabase("homepage_flyers", WebsiteContent.buildFlyerPayload({
      title: data.get("flyer_title"),
      imagePath: record.storagePath,
      sortOrder: data.get("flyer_sort_order"),
      published: data.get("flyer_published") === "on",
    }, state.auth.user?.id || null));
    state.homepageFlyers = WebsiteContent.normalizeFlyers([...state.homepageFlyers, saved], { includeUnpublished: true });
  } catch (error) {
    state.adminContentError = error instanceof Error ? error.message : "Unable to save flyer";
  } finally {
    state.flyerSavePending = false;
    render();
  }
}
```

Add `saveBlogPost(form)`:

```js
async function saveBlogPost(form) {
  const data = new FormData(form);
  state.storySavePending = true;
  state.adminContentError = null;
  render();
  try {
    const file = form.elements.namedItem("story_cover_image")?.files?.[0];
    let coverImagePath = "";
    if (file) {
      const record = WebsiteContent.buildContentImageRecord({ folder: "stories", file, uniquePrefix: new Date().toISOString().replace(/\D/g, "") });
      await uploadContentImage(record);
      coverImagePath = record.storagePath;
    }
    const [saved] = await insertAuthedSupabase("blog_posts", WebsiteContent.buildStoryPayload({
      title: data.get("story_title"),
      coverImagePath,
      summary: data.get("story_summary"),
      body: data.get("story_body"),
      published: data.get("story_published") === "on",
    }, state.auth.user?.id || null));
    state.blogPosts = WebsiteContent.normalizeStories([saved, ...state.blogPosts], { includeUnpublished: true });
  } catch (error) {
    state.adminContentError = error instanceof Error ? error.message : "Unable to save story";
  } finally {
    state.storySavePending = false;
    render();
  }
}
```

Add `saveAboutContent(form)`:

```js
async function saveAboutContent(form) {
  const data = new FormData(form);
  state.aboutSavePending = true;
  state.adminContentError = null;
  render();
  try {
    state.siteContent = SiteControls.sanitizeSiteContent({
      ...state.siteContent,
      about: {
        heading: data.get("about_heading"),
        body: data.get("about_body"),
      },
    });
    localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(state.siteContent));
    await publishActiveSiteContent(state.siteContent);
    state.siteSaved = true;
  } catch (error) {
    state.adminContentError = error instanceof Error ? error.message : "Unable to save about content";
  } finally {
    state.aboutSavePending = false;
    render();
  }
}
```

- [ ] **Step 6: Wire submit events**

In the shared form submit handler:

```js
if (formName === "homepage-flyer") await saveHomepageFlyer(form);
if (formName === "blog-post") await saveBlogPost(form);
if (formName === "about-content") await saveAboutContent(form);
```

- [ ] **Step 7: Add admin content styles**

Add simple classes:

```css
.website-content-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; }
.content-admin-list { display: grid; gap: 10px; }
.content-admin-item { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 12px; align-items: center; padding: 10px; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 8px; background: #fff; }
.content-admin-item img { width: 72px; height: 54px; object-fit: cover; border-radius: 6px; background: var(--soft); }
@media (max-width: 980px) {
  .website-content-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 8: Verify and commit**

Run: `node tests/app-wiring.test.js`

Expected: PASS.

Run: `cmd /c npm test`

Expected: PASS.

Run: `cmd /c npm run build`

Expected: PASS.

Commit:

```bash
git add src/app.js src/styles.css tests/app-wiring.test.js
git commit -m "feat: manage homepage content in admin"
```

---

### Task 7: Apply Supabase Migration And Verify Live Data

**Files:**
- No source edits expected unless verification reveals a schema issue.

- [ ] **Step 1: Apply SQL through Supabase MCP**

Use the Supabase MCP `apply_migration` tool with:

- name: `public_home_content`
- query: full contents of `supabase/sql/018_public_home_content.sql`

Expected: success response.

- [ ] **Step 2: Verify tables and columns**

Run with Supabase MCP `execute_sql`:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('homepage_flyers', 'blog_posts');

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'site_content'
  and column_name in ('about_heading', 'about_body');
```

Expected: both tables and both columns returned.

- [ ] **Step 3: Verify public read shape**

Run with Supabase MCP `execute_sql`:

```sql
select count(*) as flyer_count from public.homepage_flyers;
select count(*) as post_count from public.blog_posts;
```

Expected: query succeeds. Counts can be zero.

- [ ] **Step 4: Run advisors**

Use Supabase MCP `get_advisors` for `security`.

Expected: no new high-severity issue caused by `homepage_flyers`, `blog_posts`, or `product-images` content storage policies. If advisors report a relevant issue, fix SQL, re-apply, and re-run this task.

---

### Task 8: Final Verification And Push Attempt

**Files:**
- No source edits expected.

- [ ] **Step 1: Run full tests**

Run: `cmd /c npm test`

Expected: all tests pass.

- [ ] **Step 2: Run build**

Run: `cmd /c npm run build`

Expected: `Built static site into dist/`.

- [ ] **Step 3: Start local server**

Run: `cmd /c npm run dev`

Expected: local server starts. If port is occupied, use the existing approved process to identify and stop the stale local dev process, then rerun.

- [ ] **Step 4: Manual browser check**

Open the local URL and verify:

- Home page shows flyer carousel first.
- Home page does not show the catalogue grid.
- Latest stories section appears.
- About section appears.
- Mobile width does not overlap or crop text.
- Admin Website Content page shows flyer, story, and about forms.
- Story route opens from a story card when a story exists.

- [ ] **Step 5: Commit any final fixes**

If manual verification required fixes:

```bash
git add src app tests supabase package.json index.html
git commit -m "fix: polish public home content flow"
```

Use exact file paths instead of broad paths if only a few files changed.

- [ ] **Step 6: Push**

Run: `git push origin main`

Expected: push succeeds if GitHub permissions are fixed. If it fails with `Permission to tovtech26/ivansrun.git denied to zithekhosa`, report that push is still blocked by GitHub account permissions and do not claim it deployed.

---

## Self-Review Checklist

- The plan implements all approved spec items: flyer carousel, latest stories, story detail, admin flyer/story/about editing, Supabase schema, RLS, storage upload, and mobile styles.
- The products page redesign is intentionally excluded.
- Customer-facing copy avoids "public products".
- No service-role key is introduced.
- New RLS uses `private.is_admin()` and published-only public reads.
- Tests are specified before implementation steps.
- Verification includes tests, build, Supabase checks, and manual responsive review.
