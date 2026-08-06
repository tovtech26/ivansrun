const assert = require("node:assert/strict");
const {
  DEFAULT_HOME_FLYERS,
  DEFAULT_PRODUCT_FLYERS,
  DEFAULT_ABOUT_CONTENT,
  buildStorySlug,
  buildProductFlyerSlug,
  normalizeFlyers,
  normalizeStories,
  normalizeProductFlyers,
  mergeProductFlyersWithDefaults,
  groupProductFlyersByClass,
  buildContentImageRecord,
  buildFlyerPayload,
  buildStoryPayload,
  buildProductFlyerPayload,
  buildProductFlyerUpdatePayload,
  normalizeProductFlyerImages,
  productFlyerImagesForFlyer,
  buildProductFlyerImagePayload,
  buildProductFlyerImageUpdatePayload,
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
  normalizeProductFlyers(DEFAULT_PRODUCT_FLYERS).map((item) => item.slug),
  [
    "irunsvan-028-heat-1-0",
    "irunsvan-166-fei-ran-3-0",
    "irunsvan-121-chasing-wind-1-0",
    "irunsvan-126-chasing-light-1-0",
    "irunsvan-066-heat-2-0",
    "irunsvan-072-breeze-suc-1-0",
    "irunsvan-098-heat-2-0-pro",
    "irunsvan-125-feiran-gt-3-0",
    "irunsvan-131-shadow-wing-3-0",
    "irunsvan-087-shadowing-2-0-plus",
    "irunsvan-2503-shadow-wing-2-0-pro",
  ],
);
assert.equal(normalizeProductFlyers(DEFAULT_PRODUCT_FLYERS)[0].mainImagePath.startsWith("/public/product-images/"), true);
assert.equal(mergeProductFlyersWithDefaults([]).length, DEFAULT_PRODUCT_FLYERS.length);
assert.equal(
  mergeProductFlyersWithDefaults([
    {
      id: "remote-028",
      title: "Edited Heat Flyer",
      slug: "irunsvan-028-heat-1-0",
      product_class: "Everyday Trainer",
      story: "Edited public copy.",
      main_image_path: "content/public-products/edited-028.jpg",
      display_order: 10,
      published: true,
    },
  ])[0].title,
  "Edited Heat Flyer",
);
assert.equal(
  mergeProductFlyersWithDefaults([
    {
      id: "remote-028",
      title: "Hidden Heat Flyer",
      slug: "irunsvan-028-heat-1-0",
      product_class: "Everyday Trainer",
      story: "Hidden public copy.",
      main_image_path: "content/public-products/hidden-028.jpg",
      display_order: 10,
      published: false,
    },
  ]).some((item) => item.slug === "irunsvan-028-heat-1-0"),
  false,
);
assert.equal(
  mergeProductFlyersWithDefaults([
    {
      id: "remote-028",
      title: "Hidden Heat Flyer",
      slug: "irunsvan-028-heat-1-0",
      product_class: "Everyday Trainer",
      story: "Hidden public copy.",
      main_image_path: "content/public-products/hidden-028.jpg",
      display_order: 10,
      published: false,
    },
  ], { includeUnpublished: true }).find((item) => item.slug === "irunsvan-028-heat-1-0").title,
  "Hidden Heat Flyer",
);
assert.deepEqual(
  groupProductFlyersByClass(normalizeProductFlyers(DEFAULT_PRODUCT_FLYERS)).map((group) => [group.productClass, group.items.length]),
  [
    ["Everyday Trainer", 3],
    ["Performance Trainer", 4],
    ["Race Day Performance", 4],
  ],
);

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
assert.equal(
  normalizeStories([{ id: "draft", title: "Draft", slug: "draft", body: "Draft", published: false, created_at: "2026-06-01T00:00:00Z" }], { includeUnpublished: true })[0].publishedAt,
  "",
  "Draft stories must not reuse their creation time as a publication time.",
);

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

const normalizedFlyerImages = normalizeProductFlyerImages([
  {
    id: "img-2",
    flyer_id: "flyer-1",
    image_path: "content/public-products/side.jpg",
    image_name: "Side view",
    sku_reference: "IRUNSVAN-026-BLK",
    color_name: "Black / White",
    caption: "Outer profile",
    display_order: 2,
    is_cover: false,
  },
  {
    id: "img-1",
    flyer_id: "flyer-1",
    image_path: "content/public-products/cover.jpg",
    image_name: "Cover angle",
    sku_reference: "IRUNSVAN-026-BLK",
    color_name: "Black / White",
    caption: "Main product photo",
    display_order: 4,
    is_cover: true,
  },
  ...Array.from({ length: 25 }, (_, index) => ({
    id: `extra-${index}`,
    flyer_id: "flyer-1",
    image_path: `content/public-products/extra-${index}.jpg`,
    image_name: `Extra ${index}`,
    display_order: 10 + index,
    is_cover: false,
  })),
  { id: "bad", flyer_id: "", image_path: "", image_name: "No image" },
]);
assert.equal(normalizedFlyerImages.length, 27, "Normalizing a database response must preserve every flyer image.");
assert.equal(normalizedFlyerImages[0].imageName, "Cover angle");
assert.equal(normalizedFlyerImages[0].isCover, true);
assert.equal(normalizedFlyerImages[1].skuReference, "IRUNSVAN-026-BLK");
assert.equal(normalizedFlyerImages[1].colorName, "Black / White");

const flyerWithGallery = normalizeProductFlyers([
  {
    id: "flyer-1",
    title: "IRUNSVAN 026 Running Shoe",
    slug: "irunsvan-026-running-shoe",
    product_class: "Everyday Trainer",
    story: "Same shoe, multiple SKU pictures.",
    main_image_path: "content/public-products/legacy-main.jpg",
    secondary_image_path: "content/public-products/legacy-side.jpg",
    product_flyer_images: normalizedFlyerImages,
    published: true,
  },
])[0];
assert.equal(flyerWithGallery.images.length, 27);
assert.equal(flyerWithGallery.coverImagePath, "content/public-products/cover.jpg");
assert.equal(productFlyerImagesForFlyer(flyerWithGallery)[0].imageName, "Cover angle");

const flyerWithLegacyImages = normalizeProductFlyers([
  {
    id: "flyer-legacy",
    title: "IRUNSVAN Legacy",
    slug: "irunsvan-legacy",
    product_class: "Everyday Trainer",
    story: "Legacy image fallback.",
    main_image_path: "content/public-products/main.jpg",
    secondary_image_path: "content/public-products/secondary.jpg",
    published: true,
  },
])[0];
assert.deepEqual(
  productFlyerImagesForFlyer(flyerWithLegacyImages).map((image) => image.imageName),
  ["Main image", "Secondary image"],
);

assert.deepEqual(
  buildProductFlyerImagePayload(
    {
      flyerId: "flyer-1",
      imagePath: "content/public-products/026-black.jpg",
      imageName: "Black colorway side view",
      skuReference: "IRUNSVAN-026-BLK",
      colorName: "Black / White",
      caption: "Same shoe, black SKU.",
      displayOrder: "3",
      isCover: true,
    },
    "admin-1",
  ),
  {
    flyer_id: "flyer-1",
    image_path: "content/public-products/026-black.jpg",
    image_name: "Black colorway side view",
    sku_reference: "IRUNSVAN-026-BLK",
    color_name: "Black / White",
    caption: "Same shoe, black SKU.",
    display_order: 3,
    is_cover: true,
    created_by: "admin-1",
    updated_by: "admin-1",
  },
);

assert.deepEqual(
  buildProductFlyerImageUpdatePayload(
    {
      flyerId: "flyer-1",
      imagePath: "content/public-products/026-black-updated.jpg",
      imageName: "Black colorway updated",
      skuReference: "IRUNSVAN-026-BLK-NEW",
      colorName: "Black",
      caption: "Updated admin image copy.",
      displayOrder: "5",
      isCover: false,
    },
    "admin-2",
  ),
  {
    flyer_id: "flyer-1",
    image_path: "content/public-products/026-black-updated.jpg",
    image_name: "Black colorway updated",
    sku_reference: "IRUNSVAN-026-BLK-NEW",
    color_name: "Black",
    caption: "Updated admin image copy.",
    display_order: 5,
    is_cover: false,
    updated_by: "admin-2",
  },
);

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

assert.deepEqual(
  buildProductFlyerUpdatePayload(
    {
      title: "IRUNSVAN 005 Running Shoe Updated",
      productClass: "Performance Trainer",
      shortDescription: "Updated public flyer description.",
      story: "Updated magazine style product story.",
      mainImagePath: "content/public-products/005-main-existing.jpg",
      secondaryImagePath: "content/public-products/005-side-existing.jpg",
      displayOrder: "9",
      published: false,
    },
    "admin-2",
  ),
  {
    title: "IRUNSVAN 005 Running Shoe Updated",
    slug: "irunsvan-005-running-shoe-updated",
    product_class: "Performance Trainer",
    short_description: "Updated public flyer description.",
    story: "Updated magazine style product story.",
    main_image_path: "content/public-products/005-main-existing.jpg",
    secondary_image_path: "content/public-products/005-side-existing.jpg",
    display_order: 9,
    published: false,
    updated_by: "admin-2",
  },
);

assert.equal(DEFAULT_ABOUT_CONTENT.heading, "About Irunsvan Africa");

console.log("website-content tests passed");
