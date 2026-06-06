(function attachProductEditor(root) {
  function safeText(value) {
    return String(value || "").trim();
  }

  function suggestDisplayColour(originalColour) {
    safeText(originalColour);
    return "";
  }

  function buildImageOptions(images = []) {
    return images
      .map((image) => (typeof image === "string" ? image : image?.name))
      .map((name) => safeText(name))
      .filter(Boolean)
      .map((name) => ({ name, label: name }));
  }

  function uniqueNames(names = []) {
    return [...new Set(names.map((name) => safeText(name)).filter(Boolean))];
  }

  function buildProductInputFromEditor({ fields = {}, colourRows = [], imageNames = [] } = {}) {
    const colours = colourRows
      .map((row) => {
        const original = safeText(row.original || row.original_colour);
        const display = safeText(row.display || row.name) || suggestDisplayColour(original);
        const code = safeText(row.code || row.color_code);
        const image = safeText(row.image || row.image_name);
        if (!original && !display) return null;
        return {
          name: display || original,
          original: original || display,
          code,
          image,
        };
      })
      .filter(Boolean);

    return {
      model_code: safeText(fields.model_code || fields.modelCode),
      name: safeText(fields.name),
      category: safeText(fields.category),
      price: safeText(fields.price),
      product_type: safeText(fields.product_type || fields.productType) || "shoe",
      sizes: safeText(fields.sizes),
      images: uniqueNames(imageNames).join(", "),
      colours,
    };
  }

  const api = {
    buildImageOptions,
    suggestDisplayColour,
    buildProductInputFromEditor,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunProductEditor = api;
})(typeof window !== "undefined" ? window : globalThis);
