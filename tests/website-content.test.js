const assert = require("node:assert/strict");
const {
  DEFAULT_HOME_FLYERS,
  DEFAULT_ABOUT_CONTENT,
  buildStorySlug,
  buildProductFlyerSlug,
  normalizeFlyers,
  normalizeStories,
  normalizeProductFlyers,
  buildContentImageRecord,
  buildFlyerPayload,
  buildStoryPayload,
  buildProductFlyerPayload,
} = require("../src/website-content.js");

assert.equal(buildStorySlug("Summer Drop: Botswana Launch!"), "summer-drop-botswana-launch");
assert.equal(buildStorySlug("Summer 2.0"), "summer-2-0");
assert.equal(buildStorySlug("drop-v1.2"), "drop-v1-2");
assert.equal(buildStorySlug(""), "story");
assert.equal(buildProductFlyerSlug("IRUNSVAN 005 Running Shoe"), "irunsvan-005-running-shoe");
assert.equal(buildProductFlyerSlug(""), "product-flyer");

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
assert.equal(normalizeStories([{ id: "draft", title: "Draft", slug: "draft", body: "Draft", published: false }], { includeUnpublished: true }).length, 1);
assert.equal(normalizeStories([{ id: "draft", title: "Draft", slug: "draft", body: "Draft", published: false }]).length, 0);

assert.deepEqual(
  normalizeProductFlyers([
    {
      id: "2",
      title: "Second",
      slug: "second",
      product_class: "Running",
      short_description: "Second flyer",
      story: "Story",
      main_image_path: "content/public-products/second.jpg",
      secondary_image_path: "content/public-products/second-detail.jpg",
      display_order: 2,
      published: true,
    },
    {
      id: "1",
      title: "First",
      slug: "first",
      product_class: "Running",
      short_description: "First flyer",
      story: "Story",
      main_image_path: "content/public-products/first.jpg",
      display_order: 1,
      published: true,
    },
    {
      id: "draft",
      title: "Draft",
      slug: "draft",
      product_class: "Running",
      story: "Draft",
      published: false,
    },
  ]).map((item) => item.slug),
  ["first", "second"],
);
assert.equal(normalizeProductFlyers([{ id: "draft", title: "Draft", slug: "draft", product_class: "Running", story: "Draft", published: false }], { includeUnpublished: true }).length, 1);

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
assert.match(storyPayload.published_at, /^\d{4}-\d{2}-\d{2}T/);
assert.equal(storyPayload.created_by, "admin-1");

const preservedPublishTimestamp = buildStoryPayload(
  {
    title: "Launch Day",
    coverImagePath: "content/stories/launch.jpg",
    summary: "Short",
    body: "Body",
    published: true,
    published_at: "2026-06-01T00:00:00Z",
  },
  "admin-1",
);
assert.equal(preservedPublishTimestamp.published_at, "2026-06-01T00:00:00Z");

const unpublishedStoryPayload = buildStoryPayload(
  {
    title: "Launch Day",
    body: "Body",
    published: false,
    published_at: "2026-06-01T00:00:00Z",
  },
  "admin-1",
);
assert.equal(unpublishedStoryPayload.published_at, null);

assert.deepEqual(
  buildProductFlyerPayload(
    {
      title: "IRUNSVAN 005 Running Shoe",
      productClass: "Running",
      shortDescription: "A public flyer description.",
      story: "Magazine style product story.",
      mainImagePath: "content/public-products/005-main.jpg",
      secondaryImagePath: "content/public-products/005-side.jpg",
      displayOrder: "7",
      published: true,
    },
    "admin-1",
  ),
  {
    title: "IRUNSVAN 005 Running Shoe",
    slug: "irunsvan-005-running-shoe",
    product_class: "Running",
    short_description: "A public flyer description.",
    story: "Magazine style product story.",
    main_image_path: "content/public-products/005-main.jpg",
    secondary_image_path: "content/public-products/005-side.jpg",
    display_order: 7,
    published: true,
    created_by: "admin-1",
    updated_by: "admin-1",
  },
);

assert.equal(DEFAULT_ABOUT_CONTENT.heading, "About Irunsvan Africa");

console.log("website-content tests passed");
