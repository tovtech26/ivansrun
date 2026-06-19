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
