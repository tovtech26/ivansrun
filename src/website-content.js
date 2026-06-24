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
  const DEFAULT_PRODUCT_FLYERS = [
    {
      id: "demo-public-flyer-005",
      title: "Demo IRUNSVAN 005 Runner",
      slug: "demo-irunsvan-005-runner",
      productClass: "Running Shoe",
      shortDescription: "A lightweight public flyer example for testing the magazine-style product display.",
      story:
        "Built for clean movement and daily distance, this demo flyer shows how an Irunsvan running product can be presented as a visual story instead of a shopping card. Use it to test spacing, imagery, detail copy, and the public Products page before publishing real product content.",
      mainImagePath: "/public/product-images/SKUs/005/005-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/005/005-3.jpg",
      displayOrder: 10,
      published: true,
    },
    {
      id: "demo-public-flyer-026",
      title: "Demo IRUNSVAN 026 Runner",
      slug: "demo-irunsvan-026-runner",
      productClass: "Running Shoe",
      shortDescription: "A second removable flyer for checking the listing grid and detail view.",
      story:
        "This demo product gives the public Products page more than one card, making it easier to review the flyer rhythm, image treatment, and detail-page layout. Replace it with the real public product flyers once the Supabase table is live.",
      mainImagePath: "/public/product-images/SKUs/026/026-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/026/026-4.jpg",
      displayOrder: 20,
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

  function titleSlugPart(value) {
    return safeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function fileSlugPart(value) {
    return safeText(value)
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function extension(fileName) {
    const match = safeText(fileName).toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? `.${match[1]}` : "";
  }

  function buildStorySlug(title) {
    return titleSlugPart(title) || "story";
  }

  function buildProductFlyerSlug(title) {
    return titleSlugPart(title) || "product-flyer";
  }

  function normalizeFlyers(rows = [], options = {}) {
    const normalized = (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: safeText(row.id),
        title: safeText(row.title),
        imagePath: safeText(row.image_path || row.imagePath),
        sortOrder: safeInteger(row.sort_order ?? row.sortOrder, 0),
        published: row.published !== false,
      }))
      .filter((row) => row.id && row.title && row.imagePath && (options.includeUnpublished === true || row.published))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title));
    return normalized.length ? normalized : DEFAULT_HOME_FLYERS;
  }

  function normalizeStories(rows = [], options = {}) {
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
      .filter((row) => row.id && row.title && row.slug && row.body && (options.includeUnpublished === true || row.published))
      .sort((left, right) => String(right.publishedAt).localeCompare(String(left.publishedAt)));
  }

  function normalizeProductFlyers(rows = [], options = {}) {
    return (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: safeText(row.id),
        title: safeText(row.title),
        slug: safeText(row.slug) || buildProductFlyerSlug(row.title),
        productClass: safeText(row.product_class || row.productClass),
        shortDescription: safeText(row.short_description || row.shortDescription),
        story: safeText(row.story),
        mainImagePath: safeText(row.main_image_path || row.mainImagePath),
        secondaryImagePath: safeText(row.secondary_image_path || row.secondaryImagePath),
        displayOrder: safeInteger(row.display_order ?? row.displayOrder, 0),
        published: row.published !== false,
        createdAt: safeText(row.created_at || row.createdAt),
        updatedAt: safeText(row.updated_at || row.updatedAt),
      }))
      .filter((row) => row.id && row.title && row.slug && row.productClass && (options.includeUnpublished === true || row.published))
      .sort((left, right) => left.displayOrder - right.displayOrder || left.title.localeCompare(right.title));
  }

  function buildContentImageRecord({ folder, file, uniquePrefix = "" } = {}) {
    const safeFolder = fileSlugPart(folder) || "content";
    const name = fileSlugPart(file?.name) || "image";
    const prefix = fileSlugPart(uniquePrefix);
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
    const existingPublishedAt = safeText(input.published_at || input.publishedAt);
    return {
      title: safeText(input.title) || "Story",
      slug: buildStorySlug(input.slug || input.title),
      cover_image_path: safeText(input.coverImagePath || input.cover_image_path) || null,
      summary: safeText(input.summary) || null,
      body: safeText(input.body),
      published,
      published_at: published ? existingPublishedAt || new Date().toISOString() : null,
      created_by: adminUserId,
    };
  }

  function buildProductFlyerPayload(input = {}, adminUserId = null) {
    const title = safeText(input.title) || "Public Product Flyer";
    return {
      title,
      slug: buildProductFlyerSlug(input.slug || title),
      product_class: safeText(input.productClass || input.product_class) || "Product",
      short_description: safeText(input.shortDescription || input.short_description) || null,
      story: safeText(input.story) || null,
      main_image_path: safeText(input.mainImagePath || input.main_image_path) || null,
      secondary_image_path: safeText(input.secondaryImagePath || input.secondary_image_path) || null,
      display_order: safeInteger(input.displayOrder ?? input.display_order, 0),
      published: safeBool(input.published),
      created_by: adminUserId,
      updated_by: adminUserId,
    };
  }

  const api = {
    CONTENT_IMAGE_BUCKET,
    DEFAULT_HOME_FLYERS,
    DEFAULT_PRODUCT_FLYERS,
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
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanWebsiteContent = api;
})(typeof window !== "undefined" ? window : globalThis);
