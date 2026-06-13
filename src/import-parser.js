(function attachImportParser(root) {
  const HEADER_ALIASES = new Map([
    ["款式编码", "style_code"],
    ["商品编码", "sku"],
    ["颜色及规格", "colour_size"],
    ["库存", "stock"],
    ["款式编码", "style_code"],
    ["商品编码", "sku"],
    ["颜色及规格", "colour_size"],
    ["库存", "stock"],
  ]);

  function normalizeHeader(header) {
    const text = String(header || "").trim();
    if (HEADER_ALIASES.has(text)) return HEADER_ALIASES.get(text);
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function parseCsvLine(line) {
    const cells = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];

      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    cells.push(current);
    return cells.map((cell) => cell.trim());
  }

  function parseCsvText(text) {
    const lines = String(text || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .filter((line) => line.trim().length);

    if (!lines.length) return [];

    const headers = parseCsvLine(lines[0]).map(normalizeHeader);
    return lines.slice(1).map((line) => {
      const cells = parseCsvLine(line);
      return headers.reduce((row, header, index) => {
        row[header] = cells[index] || "";
        return row;
      }, {});
    });
  }

  function firstValue(row, aliases) {
    const normalizedRow = Object.entries(row || {}).reduce((accumulator, [key, value]) => {
      accumulator[normalizeHeader(key)] = value;
      return accumulator;
    }, {});
    for (const alias of aliases) {
      const exactValue = row[alias];
      if (String(exactValue || "").trim()) return String(exactValue).trim();
      const normalizedAlias = normalizeHeader(alias);
      if (!normalizedAlias) continue;
      const value = normalizedRow[normalizedAlias];
      if (String(value || "").trim()) return String(value).trim();
    }
    return "";
  }

  function safeNumber(value) {
    const parsed = Number(String(value || "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function parseImageNames(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.split("/").pop());
  }

  function parseCatalogRows(rows) {
    const productsBySku = new Map();
    const variants = [];
    const errors = [];

    rows.forEach((row, index) => {
      const sku = firstValue(row, ["sku"]);
      if (!sku) {
        errors.push({ row: index + 2, code: "missing_sku" });
        return;
      }

      const productName = firstValue(row, ["name", "product_name"]);
      if (!productName) {
        errors.push({ row: index + 2, code: "missing_product_name", sku });
        return;
      }

      const productSku = firstValue(row, ["parent_sku", "product_sku", "style_code"]) || sku;
      const category = firstValue(row, ["categories", "category"]);
      const basePrice = safeNumber(firstValue(row, ["regular_price", "price", "base_price"]));
      const currency = firstValue(row, ["base_currency", "currency"]) || "USD";
      const images = parseImageNames(firstValue(row, ["images", "image_names"]));
      const colour =
        firstValue(row, ["attribute_1_value_s", "attribute_1_values", "colour", "color", "attribute_color", "attribute_pa_color"]) || null;
      const size = firstValue(row, ["attribute_2_value_s", "attribute_2_values", "size", "attribute_size", "attribute_pa_size"]) || null;

      if (!productsBySku.has(productSku)) {
        productsBySku.set(productSku, {
          sku: productSku,
          name: productName,
          slug: `${slugify(productName)}-${slugify(productSku)}`,
          category: category || null,
          base_price: basePrice,
          base_currency: currency,
          image_names: images,
          published: true,
        });
      }

      variants.push({
        product_sku: productSku,
        sku,
        name: productName,
        colour,
        size,
        base_price: basePrice,
        base_currency: currency,
        image_name: images[0] || null,
        published: true,
      });
    });

    return {
      products: [...productsBySku.values()],
      variants,
      errors,
    };
  }

  function parseInventoryRows(rows) {
    const parsed = [];
    const errors = [];

    rows.forEach((row, index) => {
      const sku = firstValue(row, ["sku"]);
      const stockRaw = firstValue(row, ["stock", "stock_quantity", "qty", "quantity_on_hand"]);
      const stockQuantity = Number.parseInt(stockRaw, 10);

      if (!sku) {
        errors.push({ row: index + 1, code: "missing_sku" });
      }
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        errors.push({ row: index + 1, code: "invalid_stock_quantity", sku: sku || null });
      }
      if (!sku || !Number.isInteger(stockQuantity) || stockQuantity < 0) return;

      parsed.push({
        sku,
        style_code: firstValue(row, ["style_code", "parent_sku", "product_sku"]) || null,
        stock_quantity: stockQuantity,
        source: "import",
      });
    });

    return {
      rows: parsed,
      errors,
    };
  }

  function parseStyleCode(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length <= 4) {
      return {
        model_code: digits,
        color_code: "",
      };
    }
    const body = digits.length >= 5 ? digits.slice(2) : digits;
    return {
      model_code: body.slice(0, 3),
      color_code: body.length > 3 ? body.slice(3).padStart(3, "0") : "",
    };
  }

  function splitColourAndSize(value) {
    const parts = String(value || "").split(";");
    return {
      original_colour: String(parts[0] || "").trim(),
      size: String(parts[1] || "").trim(),
    };
  }

  function parseMasterInventoryRows(rows) {
    const parsed = [];
    const errors = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const sourceStyleCode = firstValue(row, ["款式编码", "style_code", "model_code"]);
      const sourceSku = firstValue(row, ["商品编码", "sku", "product_sku"]);
      const colourAndSize = firstValue(row, ["颜色及规格", "colour_size", "color_size"]);
      const stockRaw = firstValue(row, ["库存", "stock", "stock_quantity", "qty"]);
      const stockQuantity = Number.parseInt(stockRaw, 10);
      const { model_code, color_code } = parseStyleCode(sourceStyleCode);
      const { original_colour, size } = splitColourAndSize(colourAndSize);

      if (!sourceStyleCode) errors.push({ row: rowNumber, code: "missing_style_code", sku: sourceSku || null });
      if (!sourceSku) errors.push({ row: rowNumber, code: "missing_sku" });
      if (!original_colour) errors.push({ row: rowNumber, code: "missing_colour", sku: sourceSku || null });
      if (!size) errors.push({ row: rowNumber, code: "missing_size", sku: sourceSku || null });
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        errors.push({ row: rowNumber, code: "invalid_stock_quantity", sku: sourceSku || null });
      }

      if (!sourceStyleCode || !sourceSku || !original_colour || !size || !Number.isInteger(stockQuantity) || stockQuantity < 0) return;

      parsed.push({
        source_style_code: sourceStyleCode,
        source_sku: sourceSku,
        model_code,
        color_code,
        original_colour,
        size,
        stock_quantity: stockQuantity,
        source: "master_inventory",
      });
    });

    return {
      rows: parsed,
      errors,
    };
  }

  const api = {
    parseCsvText,
    parseCatalogRows,
    parseInventoryRows,
    parseMasterInventoryRows,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunImportParser = api;
})(typeof window !== "undefined" ? window : globalThis);
