# Homepage Terra Light Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public homepage into a light editorial campaign page that closely follows the supplied reference while preserving the existing editable flyer, story, and about content model.

**Architecture:** Keep the current `store` route, homepage content feeds, and admin editing flows intact. Replace the public-home rendering layer in `src/app.js` and the homepage visual system in `src/styles.css` so the flyer rail becomes the hero, the navigation becomes campaign-style, and stories/about adopt the new framed editorial language without changing the underlying CMS schema.

**Tech Stack:** Static HTML assembled in vanilla JavaScript, shared global app state in `src/app.js`, site-wide CSS in `src/styles.css`, existing Supabase-backed content feeds, Node-based assertions in `tests/*.test.js`.

---

## File Structure

- `src/app.js`
  Responsible for public-home markup, public navigation labels, story detail markup, and footer copy.
- `src/styles.css`
  Responsible for the homepage token system, flyer-led hero styling, campaign cards, manifesto section, campaign footer, and responsive behavior.
- `index.html`
  Responsible for font loading and cache-busting asset version strings after the redesign.
- `tests/app-wiring.test.js`
  Responsible for structural assertions that the homepage still uses dedicated render functions and public-home wiring.

### Task 1: Lock campaign structure in the homepage renderer

**Files:**
- Modify: `src/app.js`
- Test: `tests/app-wiring.test.js`

- [ ] **Step 1: Write the failing test**

```js
assert.equal(appSource.includes('["Protocol", "store", ["store", "product"]]'), true, "Public navigation should use campaign-style labels for the home route.");
assert.equal(appSource.includes("<h2>Field Records</h2>"), true, "Homepage stories section should use the new editorial heading.");
assert.equal(appSource.includes("ENGINEERED FOR THE CONTINENT"), true, "Homepage about section should use the manifesto heading fallback.");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/app-wiring.test.js`
Expected: FAIL because the current homepage still uses the old public navigation labels and old section copy.

- [ ] **Step 3: Write minimal implementation**

```js
const publicNavItems = [
  ["Protocol", "store", ["store", "product"]],
  ["Stockists", "find-reseller", ["find-reseller"]],
  ["Access", "signup", ["signup"]],
  ["Join", "apply", ["apply"]],
  ["Enter", "login", ["login", "admin-login"]],
];

function storyCarousel(stories) {
  return `
    <section class="home-stories">
      <div class="home-section-heading">
        <h2>Field Records</h2>
        <p>Editorial notes, product signals, and performance updates from Irunsvan Africa.</p>
      </div>
      ...
    </section>
  `;
}

function aboutSection(about = WebsiteContent.DEFAULT_ABOUT_CONTENT) {
  return `
    <section class="home-about">
      <div class="home-section-heading">
        <h2>${escapeHtml((about?.heading || "ENGINEERED FOR THE CONTINENT").toUpperCase())}</h2>
      </div>
      ...
    </section>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/app-wiring.test.js`
Expected: PASS for the new homepage structure assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/app-wiring.test.js src/app.js
git commit -m "feat: reshape public home content into campaign sections"
```

### Task 2: Rebuild the flyer-led hero and campaign cards

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `tests/app-wiring.test.js`

- [ ] **Step 1: Write the failing test**

```js
assert.equal(appSource.includes('class="home-flyer-stage"'), true, "Homepage flyer hero should render a dedicated campaign stage.");
assert.equal(appSource.includes('class="campaign-eyebrow"'), true, "Homepage flyer hero should render campaign metadata labels.");
assert.equal(styleSource.includes(".home-flyer-stage"), true, "Styles should define the flyer-led campaign stage.");
assert.equal(styleSource.includes(".story-card-tag"), true, "Styles should define campaign story tags.");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/app-wiring.test.js`
Expected: FAIL because the current homepage still uses the older flat flyer frame and plain story cards.

- [ ] **Step 3: Write minimal implementation**

```js
function flyerCarousel(flyers) {
  const items = WebsiteContent.normalizeFlyers(flyers);
  const selected = items[selectedIndex];
  return `
    <section class="home-flyer-carousel" aria-label="Irunsvan Africa flyers">
      <div class="home-flyer-stage">
        <div class="home-flyer-copy">
          <span class="campaign-eyebrow">IRUNSVAN AFRICA //</span>
          <h1>${escapeHtml(selected.title || "BLUE MOTION PROTOCOL")}</h1>
          <p>Performance stories, campaign drops, and technical running culture built for the continent.</p>
        </div>
        <div class="home-flyer-frame">
          <img src="${escapeHtml(resolveContentImageUrl(selected.imagePath))}" alt="${escapeHtml(selected.title)}" loading="eager" />
        </div>
      </div>
      ...
    </section>
  `;
}

function storyCard(story) {
  return `
    <article class="story-card">
      ...
      <div class="story-card-body">
        <span class="story-card-tag">Field Record</span>
        <p class="story-meta">${escapeHtml(publishedLabel)}</p>
        ...
      </div>
    </article>
  `;
}
```

```css
.home-flyer-stage {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(360px, 1.12fr);
  gap: 24px;
  align-items: stretch;
}

.campaign-eyebrow {
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.story-card-tag {
  display: inline-flex;
  border: 1px solid var(--home-accent);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/app-wiring.test.js`
Expected: PASS with the new campaign-stage markup and styles present.

- [ ] **Step 5: Commit**

```bash
git add src/app.js src/styles.css tests/app-wiring.test.js
git commit -m "feat: add flyer-led campaign hero styling"
```

### Task 3: Finish the light editorial system, mobile polish, and cache bump

**Files:**
- Modify: `src/styles.css`
- Modify: `index.html`
- Test: `tests/app-wiring.test.js`

- [ ] **Step 1: Write the failing test**

```js
assert.equal(indexSource.includes("Oswald"), true, "Homepage redesign should load the condensed display font.");
assert.equal(indexSource.includes("irunsvan-home-terra-light-v1"), true, "Index should bump public asset cache keys for the homepage redesign.");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/app-wiring.test.js`
Expected: FAIL because the old font import and old cache version string are still present.

- [ ] **Step 3: Write minimal implementation**

```html
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600;700;800&family=Oswald:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="src/styles.css?v=irunsvan-home-terra-light-v1" />
```

```css
:root {
  --home-shell: #f4f7fb;
  --home-panel: #ffffff;
  --home-panel-alt: #e9f1fb;
  --home-accent: #0070ea;
  --home-ink: #10233f;
}

@media (max-width: 760px) {
  .home-flyer-stage,
  .story-strip,
  .home-about-layout,
  .campaign-footer-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/app-wiring.test.js`
Expected: PASS with the new font import and updated asset version key in place.

- [ ] **Step 5: Commit**

```bash
git add index.html src/styles.css tests/app-wiring.test.js
git commit -m "feat: finish homepage terra light visual system"
```

## Verification

- Run: `node tests/app-wiring.test.js`
  Expected: `app-wiring tests passed`
- Run: `node tests/site-controls.test.js`
  Expected: site controls tests pass with unchanged about-content editing behavior.
- Run: `node tests/website-content.test.js`
  Expected: website content helpers still pass unchanged because the redesign does not alter content payloads.

## Spec Coverage Check

- Campaign-style top navigation: covered in Task 1.
- Flyer-led hero: covered in Task 2.
- Stories as field records: covered in Tasks 1 and 2.
- About as manifesto: covered in Task 1 and Task 3 layout polish.
- Light blue/white Irunsvan palette and responsive polish: covered in Task 3.
- Existing editability and routes preserved: protected by reuse of existing content flows and verification tests.
