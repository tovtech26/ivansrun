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
      id: "fallback-public-flyer-028",
      title: "IRUNSVAN 028 HEAT 1.0",
      slug: "irunsvan-028-heat-1-0",
      productClass: "Everyday Trainer",
      shortDescription: "A public display flyer for daily trainer discovery.",
      story: "Everyday Trainer models are built for easy daily movement, clean styling, and dependable comfort across regular training and casual wear.",
      mainImagePath: "/public/product-images/SKUs/028/028-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/028/028-4.jpg",
      displayOrder: 10,
      published: true,
    },
    {
      id: "fallback-public-flyer-166",
      title: "IRUNSVAN 166 FEI RAN 3.0",
      slug: "irunsvan-166-fei-ran-3-0",
      productClass: "Everyday Trainer",
      shortDescription: "A lightweight everyday trainer presentation.",
      story: "FEI RAN 3.0 sits in the everyday class for buyers who want a versatile Irunsvan trainer with a lighter, more active profile.",
      mainImagePath: "/public/product-images/SKUs/166/166-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/166/166-2.jpg",
      displayOrder: 20,
      published: true,
    },
    {
      id: "fallback-public-flyer-121",
      title: "IRUNSVAN 121 Chasing Wind 1.0",
      slug: "irunsvan-121-chasing-wind-1-0",
      productClass: "Everyday Trainer",
      shortDescription: "A daily trainer flyer for steady movement.",
      story: "Chasing Wind 1.0 rounds out the everyday trainer category with a simple, usable profile for daily runs, walking, and lifestyle wear.",
      mainImagePath: "/public/product-images/SKUs/121/121-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/121/121-2.jpg",
      displayOrder: 30,
      published: true,
    },
    {
      id: "fallback-public-flyer-126",
      title: "IRUNSVAN 126 CHASING LIGHT 1.0",
      slug: "irunsvan-126-chasing-light-1-0",
      productClass: "Performance Trainer",
      shortDescription: "A performance trainer flyer for sharper sessions.",
      story: "Performance Trainer models bring a stronger training signal for faster workouts, tempo days, and more intentional road movement.",
      mainImagePath: "/public/product-images/SKUs/126/126-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/126/126-3.jpg",
      displayOrder: 110,
      published: true,
    },
    {
      id: "fallback-public-flyer-066",
      title: "IRUNSVAN 066 HEAT 2.0",
      slug: "irunsvan-066-heat-2-0",
      productClass: "Performance Trainer",
      shortDescription: "A structured performance trainer presentation.",
      story: "HEAT 2.0 is presented as a more capable training option for customers who want a stronger feel than a basic daily trainer.",
      mainImagePath: "/public/product-images/SKUs/066/066-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/066/066-3.jpg",
      displayOrder: 120,
      published: true,
    },
    {
      id: "fallback-public-flyer-072",
      title: "IRUNSVAN 072 BREEZE SUC 1.0",
      slug: "irunsvan-072-breeze-suc-1-0",
      productClass: "Performance Trainer",
      shortDescription: "A breathable performance trainer flyer.",
      story: "BREEZE SUC 1.0 keeps the performance trainer class visually light while still sitting above the everyday models in training intent.",
      mainImagePath: "/public/product-images/SKUs/072/072-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/072/072-3.jpg",
      displayOrder: 130,
      published: true,
    },
    {
      id: "fallback-public-flyer-098",
      title: "IRUNSVAN 098 HEAT 2.0 PRO",
      slug: "irunsvan-098-heat-2-0-pro",
      productClass: "Performance Trainer",
      shortDescription: "A pro-level performance trainer presentation.",
      story: "HEAT 2.0 PRO is the strongest visual signal in the Performance Trainer category before the range moves into race-day shoes.",
      mainImagePath: "/public/product-images/SKUs/098/098-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/098/098-3.jpg",
      displayOrder: 140,
      published: true,
    },
    {
      id: "fallback-public-flyer-125",
      title: "IRUNSVAN 125 Feiran GT 3.0",
      slug: "irunsvan-125-feiran-gt-3-0",
      productClass: "Race Day Performance",
      shortDescription: "A race-day performance flyer for top-end motion.",
      story: "Race Day Performance models are the sharpest public-facing shoes in the range, built to read faster, lighter, and more competition-focused.",
      mainImagePath: "/public/product-images/SKUs/125/125-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/125/125-3.jpg",
      displayOrder: 210,
      published: true,
    },
    {
      id: "fallback-public-flyer-131",
      title: "IRUNSVAN 131 SHADOW WING 3.0",
      slug: "irunsvan-131-shadow-wing-3-0",
      productClass: "Race Day Performance",
      shortDescription: "A high-class race-day product flyer.",
      story: "SHADOW WING 3.0 is presented for the highest-performance lane: a shoe meant to feel technical, fast, and visually premium.",
      mainImagePath: "/public/product-images/SKUs/131/131-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/131/131-4.jpg",
      displayOrder: 220,
      published: true,
    },
    {
      id: "fallback-public-flyer-087",
      title: "IRUNSVAN 087 SHADOWING 2.0+",
      slug: "irunsvan-087-shadowing-2-0-plus",
      productClass: "Race Day Performance",
      shortDescription: "A race-day flyer for technical speed.",
      story: "SHADOWING 2.0+ gives the Race Day Performance section another fast visual option while keeping the page organized by product class.",
      mainImagePath: "/public/product-images/SKUs/087/1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/087/2.jpg",
      displayOrder: 230,
      published: true,
    },
    {
      id: "fallback-public-flyer-2503",
      title: "IRUNSVAN 2503 SHADOW WING 2.0 PRO",
      slug: "irunsvan-2503-shadow-wing-2-0-pro",
      productClass: "Race Day Performance",
      shortDescription: "A pro race-day flyer for the public Products page.",
      story: "SHADOW WING 2.0 PRO closes the race-day category as a focused public flyer for high-intent performance storytelling.",
      mainImagePath: "/public/product-images/SKUs/2503/2503-1.jpg",
      secondaryImagePath: "/public/product-images/SKUs/2503/2503-3.jpg",
      displayOrder: 240,
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

  function groupProductFlyersByClass(rows = []) {
    const groups = new Map();
    normalizeProductFlyers(rows, { includeUnpublished: true }).forEach((flyer) => {
      const key = flyer.productClass || "Product";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(flyer);
    });
    return [...groups.entries()]
      .map(([productClass, items]) => ({
        productClass,
        items: items.sort((left, right) => left.displayOrder - right.displayOrder || left.title.localeCompare(right.title)),
      }))
      .sort((left, right) => left.items[0].displayOrder - right.items[0].displayOrder || left.productClass.localeCompare(right.productClass));
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

  function buildProductFlyerUpdatePayload(input = {}, adminUserId = null) {
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
    groupProductFlyersByClass,
    buildContentImageRecord,
    buildFlyerPayload,
    buildStoryPayload,
    buildProductFlyerPayload,
    buildProductFlyerUpdatePayload,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanWebsiteContent = api;
})(typeof window !== "undefined" ? window : globalThis);
