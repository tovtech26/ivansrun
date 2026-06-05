(function attachProductEditor(root) {
  const COLOUR_SUGGESTIONS = new Map([
    ["\u73cd\u73e0\u767d", "Pearl White"],
    ["\u4eae\u6854\u8272/\u6d77\u84dd", "Bright Orange / Ocean Blue"],
    ["\u9ed1\u84dd", "Black / Blue"],
    ["\u7eAF\u9ED1", "Pure Black"],
    ["\u9ed1\u8272", "Black"],
    ["\u767d\u8272", "White"],
    ["\u6d77\u84dd", "Ocean Blue"],
    ["\u5929\u84dd", "Sky Blue"],
    ["\u6a59\u8272", "Orange"],
    ["\u7c89\u8272", "Pink"],
    ["\u7070\u8272", "Grey"],
  ]);

  function safeText(value) {
    return String(value || "").trim();
  }

  function suggestDisplayColour(originalColour) {
    return COLOUR_SUGGESTIONS.get(safeText(originalColour)) || "";
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
