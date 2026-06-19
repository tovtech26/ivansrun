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
assert.equal(buildStorySlug("Summer 2.0"), "summer-2-0");
assert.equal(buildStorySlug("drop-v1.2"), "drop-v1-2");
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
assert.equal(normalizeStories([{ id: "draft", title: "Draft", slug: "draft", body: "Draft", published: false }], { includeUnpublished: true }).length, 1);
assert.equal(normalizeStories([{ id: "draft", title: "Draft", slug: "draft", body: "Draft", published: false }]).length, 0);

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

assert.equal(DEFAULT_ABOUT_CONTENT.heading, "About Irunsvan Africa");

console.log("website-content tests passed");
