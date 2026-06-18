(function attachMediaPackScanner(root) {
  const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm"]);

  function extensionOf(path) {
    const match = String(path || "").toLowerCase().match(/\.[a-z0-9]+$/);
    return match ? match[0] : "";
  }

  function normalizeEntry(entry) {
    if (typeof entry === "string") return { fullName: entry, length: 0 };
    return {
      fullName: entry.fullName || entry.FullName || entry.name || "",
      length: Number(entry.length ?? entry.Length ?? 0) || 0,
    };
  }

  function cleanMarketingName(folderName, code) {
    let name = String(folderName || "")
      .replace(/^\d+(?:-\d+)?款?/u, "")
      .replace(/英文数据包|数据包|英文版|英文|详情页|详情|SKU|sku/giu, "")
      .replace(/^[\s\-_]+|[\s\-_]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!name && code) name = code;
    return name;
  }

  function parseMarketingProductFolder(folderName) {
    const folder = String(folderName || "").trim();
    if (!folder) return null;

    if (/袜/u.test(folder)) {
      const name = cleanMarketingName(folder, "SOCKS") || "运动袜";
      return {
        code: "SOCKS",
        name,
        displayName: `IRUNSVAN ${name}`,
        type: "sock",
        needsReview: false,
      };
    }

    const codeMatch = folder.match(/^(\d{3,4})(?:-\d{3,4})?/u);
    if (!codeMatch) return null;

    const code = codeMatch[1];
    const name = cleanMarketingName(folder, code);
    return {
      code,
      name,
      displayName: `IRUNSVAN ${code}${name && name !== code ? ` ${name}` : ""}`,
      type: "shoe",
      needsReview: false,
    };
  }

  function classifyMedia(entryPath) {
    const lower = entryPath.toLowerCase();
    const extension = extensionOf(entryPath);

    if (VIDEO_EXTENSIONS.has(extension)) return "videos";
    if (!IMAGE_EXTENSIONS.has(extension)) return null;
    if (/\/(sku|SKU)\//.test(entryPath)) return "skuImages";
    if (/\/(白底|白底图|白底透明图|透明白底)\//u.test(entryPath)) return "whiteBackgroundImages";
    if (/\/(1200|1200x1600|800|800x800|主图|一比一)\//iu.test(entryPath)) return "galleryImages";
    if (/\/(详情切片|详请切片|详情页切片|详情页切图)\//u.test(entryPath)) return "detailImages";
    return "galleryImages";
  }

  function buildEmptyMedia() {
    return {
      skuImages: [],
      whiteBackgroundImages: [],
      galleryImages: [],
      detailImages: [],
      videos: [],
    };
  }

  function firstRecommendedImage(media) {
    return media.whiteBackgroundImages[0] || media.skuImages[0] || media.galleryImages[0] || null;
  }

  function warningsForProduct(product) {
    const warnings = [];
    if (!product.media.skuImages.length) warnings.push("missing_sku_images");
    if (!firstRecommendedImage(product.media)) warnings.push("missing_primary_image");
    if (!product.name || product.name === product.code) warnings.push("needs_display_name");
    return warnings;
  }

  function scanMarketingEntries(entries) {
    const productsByFolder = new Map();
    const unassigned = [];

    entries.map(normalizeEntry).forEach((entry) => {
      const path = entry.fullName.replaceAll("\\", "/");
      const parts = path.split("/").filter(Boolean);
      if (entry.length <= 0 || parts[0] !== "Marketing" || parts.length < 3) {
        if (entry.length > 0) unassigned.push(path);
        return;
      }

      const folder = parts[1];
      const parsed = parseMarketingProductFolder(folder);
      if (!parsed) {
        unassigned.push(path);
        return;
      }

      if (!productsByFolder.has(folder)) {
        productsByFolder.set(folder, {
          folder,
          code: parsed.code,
          name: parsed.name,
          displayName: parsed.displayName,
          productType: parsed.type,
          media: buildEmptyMedia(),
          sourcePaths: [],
        });
      }

      const product = productsByFolder.get(folder);
      const mediaType = classifyMedia(path);
      if (mediaType) product.media[mediaType].push(path);
      product.sourcePaths.push(path);
    });

    const products = [...productsByFolder.values()].map((product) => {
      const warnings = warningsForProduct(product);
      return {
        ...product,
        recommendedMainImage: firstRecommendedImage(product.media),
        warnings,
        status: warnings.length ? "needs_review" : "ready",
      };
    });

    return {
      products,
      unassigned,
      summary: {
        productsDetected: products.length,
        readyToCreate: products.filter((product) => product.status === "ready").length,
        needsReview: products.filter((product) => product.status === "needs_review").length,
        videosFound: products.reduce((count, product) => count + product.media.videos.length, 0),
        skuImageSetsFound: products.filter((product) => product.media.skuImages.length).length,
      },
    };
  }

  const api = {
    parseMarketingProductFolder,
    scanMarketingEntries,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanMediaPackScanner = api;
})(typeof window !== "undefined" ? window : globalThis);
