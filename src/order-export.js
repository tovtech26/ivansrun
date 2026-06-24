(function attachOrderExport(root) {
  const MASTER_HEADERS = ["款式编码", "商品编码", "颜色及规格", "库存"];

  function safeText(value) {
    return String(value ?? "").trim();
  }

  function orderCode(order) {
    return `#RE-${safeText(order?.id).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6) || "UNKNOWN"}`;
  }

  function invoiceCode(order) {
    return `INV-${safeText(order?.id).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-8) || "PENDING"}`;
  }

  function resolveStyleCode(item, inventoryByVariantId, variantsById, productsById) {
    const inventoryRow = inventoryByVariantId.get(item.variant_id);
    if (safeText(inventoryRow?.style_code)) return safeText(inventoryRow.style_code);
    const variant = variantsById.get(item.variant_id);
    if (safeText(variant?.style_code)) return safeText(variant.style_code);
    if (safeText(variant?.product_sku)) return safeText(variant.product_sku);
    const product = productsById.get(variant?.product_id);
    return safeText(product?.model_code || product?.sku);
  }

  function buildSupplierOrderRows({ items = [], inventory = [], variants = [], products = [] } = {}) {
    const inventoryByVariantId = new Map((inventory || []).map((row) => [row.variant_id, row]));
    const variantsById = new Map((variants || []).map((row) => [row.id, row]));
    const productsById = new Map((products || []).map((row) => [row.id, row]));
    return items.map((item) => ({
      款式编码: resolveStyleCode(item, inventoryByVariantId, variantsById, productsById),
      商品编码: safeText(item.sku),
      颜色及规格: [safeText(item.colour), item.size ? `Size ${safeText(item.size)}` : ""].filter(Boolean).join("; "),
      库存: Number(item.quantity || 0),
    }));
  }

  function buildSupplierWorkbookData({ order, items = [], inventory = [], variants = [], products = [], companyName = "" } = {}) {
    const supplierRows = buildSupplierOrderRows({ items, inventory, variants, products });
    const summaryRows = [
      ["Irunsvan Africa Supplier Order", ""],
      ["Order Code", orderCode(order)],
      ["Invoice Number", invoiceCode(order)],
      ["Company", safeText(companyName)],
      ["Status", safeText(order?.status || "submitted")],
      ["Created", safeText(order?.created_at || order?.createdAt)],
      ["Notes", safeText(order?.notes || order?.admin_notes || order?.adminNotes)],
      ["", ""],
      ["Product", "Details", "Quantity", "SKU"],
      ...items.map((item) => [
        safeText(item.product_name || "Product"),
        [safeText(item.colour), item.size ? `Size ${safeText(item.size)}` : ""].filter(Boolean).join(" / "),
        Number(item.quantity || 0),
        safeText(item.sku),
      ]),
    ];
    const masterRows = [MASTER_HEADERS, ...supplierRows.map((row) => MASTER_HEADERS.map((header) => row[header]))];
    return {
      fileName: `supplier-order-${safeText(order?.id).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-8) || "ORDER"}.xlsx`,
      summaryRows,
      masterRows,
      supplierRows,
    };
  }

  function downloadSupplierXlsx({ order, items = [], inventory = [], variants = [], products = [], companyName = "", XLSX } = {}) {
    if (!XLSX) throw new Error("Spreadsheet library not loaded.");
    const workbookData = buildSupplierWorkbookData({ order, items, inventory, variants, products, companyName });
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet(workbookData.summaryRows);
    const masterSheet = XLSX.utils.aoa_to_sheet(workbookData.masterRows);
    summarySheet["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 14 }, { wch: 18 }];
    masterSheet["!cols"] = [{ wch: 18 }, { wch: 20 }, { wch: 28 }, { wch: 12 }];
    masterSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    ["A", "B"].forEach((col) => {
      for (let index = 2; index <= workbookData.masterRows.length; index += 1) {
        const cell = masterSheet[`${col}${index}`];
        if (cell) cell.z = "@";
      }
    });
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Order Summary");
    XLSX.utils.book_append_sheet(workbook, masterSheet, "Master Format");
    XLSX.writeFile(workbook, workbookData.fileName);
    return workbookData;
  }

  function downloadSupplierCsv({ order, items = [], inventory = [], variants = [], products = [] } = {}) {
    const rows = buildSupplierWorkbookData({ order, items, inventory, variants, products }).masterRows;
    const csv = `\uFEFF${rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
          })
          .join(","),
      )
      .join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `supplier-order-${safeText(order?.id).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-8) || "ORDER"}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    return csv;
  }

  const api = {
    MASTER_HEADERS,
    buildSupplierOrderRows,
    buildSupplierWorkbookData,
    downloadSupplierXlsx,
    downloadSupplierCsv,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanOrderExport = api;
})(typeof window !== "undefined" ? window : globalThis);
