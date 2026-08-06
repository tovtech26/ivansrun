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

  function supplierOrderFileStem(order) {
    return `supplier-order-${safeText(order?.id).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-8) || "ORDER"}`;
  }

  function downloadBlob({ blob, fileName } = {}) {
    if (!blob) throw new Error("Download data is not available.");
    if (!root.document || !root.URL) return false;
    const link = root.document.createElement("a");
    const url = root.URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName || "download";
    link.style.display = "none";
    root.document.body.appendChild(link);
    link.click();
    root.document.body.removeChild(link);
    root.setTimeout(() => root.URL.revokeObjectURL(url), 1000);
    return true;
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
    if (typeof Blob !== "undefined" && typeof XLSX.write === "function") {
      const content = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      downloadBlob({
        blob: new Blob([content], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        fileName: workbookData.fileName,
      });
    } else {
      XLSX.writeFile(workbook, workbookData.fileName);
    }
    return workbookData;
  }

  function buildSupplierCsv({ order, items = [], inventory = [], variants = [], products = [] } = {}) {
    const rows = buildSupplierWorkbookData({ order, items, inventory, variants, products }).masterRows;
    return `\uFEFF${rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
          })
          .join(","),
      )
      .join("\r\n")}`;
  }

  function downloadSupplierCsv({ order, items = [], inventory = [], variants = [], products = [] } = {}) {
    const csv = buildSupplierCsv({ order, items, inventory, variants, products });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob({ blob, fileName: `${supplierOrderFileStem(order)}.csv` });
    return csv;
  }

  const ALL_ORDER_HEADERS = [
    "Order Code",
    "Order ID",
    "Company",
    "Reseller Email",
    "Status",
    "Created",
    "SKU",
    "Product",
    "Colour",
    "Size",
    "Quantity",
    "Unit Price",
    "Line Total",
    "Notes",
    "Admin Notes",
  ];

  function buildAllOrderRows({ orders = [], items = [], profiles = [] } = {}) {
    const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const itemsByOrder = (items || []).reduce((map, item) => {
      const list = map.get(item.order_request_id) || [];
      list.push(item);
      map.set(item.order_request_id, list);
      return map;
    }, new Map());
    return (orders || []).flatMap((order) => {
      const profile = profilesById.get(order.reseller_id) || {};
      const orderItems = itemsByOrder.get(order.id) || [];
      const common = {
        "Order Code": orderCode(order),
        "Order ID": safeText(order.id),
        Company: safeText(profile.company_name),
        "Reseller Email": safeText(profile.email),
        Status: safeText(order.status),
        Created: safeText(order.created_at || order.createdAt),
        Notes: safeText(order.notes),
        "Admin Notes": safeText(order.admin_notes || order.adminNotes),
      };
      if (!orderItems.length) return [{ ...common, SKU: "", Product: "", Colour: "", Size: "", Quantity: 0, "Unit Price": 0, "Line Total": 0 }];
      return orderItems.map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.base_price || 0);
        return {
          ...common,
          SKU: safeText(item.sku),
          Product: safeText(item.product_name),
          Colour: safeText(item.colour),
          Size: safeText(item.size),
          Quantity: quantity,
          "Unit Price": unitPrice,
          "Line Total": quantity * unitPrice,
        };
      });
    });
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function buildAllOrdersCsv(options = {}) {
    const rows = buildAllOrderRows(options);
    return `\uFEFF${[ALL_ORDER_HEADERS, ...rows.map((row) => ALL_ORDER_HEADERS.map((header) => row[header]))]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")}`;
  }

  function downloadAllOrdersCsv(options = {}) {
    const csv = buildAllOrdersCsv(options);
    downloadBlob({ blob: new Blob([csv], { type: "text/csv;charset=utf-8;" }), fileName: "irunsvan-orders.csv" });
    return csv;
  }

  function downloadAllOrdersXlsx({ XLSX, ...options } = {}) {
    if (!XLSX) throw new Error("Spreadsheet library not loaded.");
    const rows = buildAllOrderRows(options);
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([ALL_ORDER_HEADERS, ...rows.map((row) => ALL_ORDER_HEADERS.map((header) => row[header]))]);
    sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    sheet["!cols"] = ALL_ORDER_HEADERS.map((header) => ({ wch: Math.max(12, Math.min(28, header.length + 4)) }));
    XLSX.utils.book_append_sheet(workbook, sheet, "All Orders");
    const fileName = "irunsvan-orders.xlsx";
    if (typeof Blob !== "undefined" && typeof XLSX.write === "function") {
      downloadBlob({
        blob: new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        fileName,
      });
    } else {
      XLSX.writeFile(workbook, fileName);
    }
    return { fileName, rows };
  }

  const api = {
    MASTER_HEADERS,
    buildSupplierOrderRows,
    buildSupplierWorkbookData,
    buildSupplierCsv,
    downloadBlob,
    downloadSupplierXlsx,
    downloadSupplierCsv,
    ALL_ORDER_HEADERS,
    buildAllOrderRows,
    buildAllOrdersCsv,
    downloadAllOrdersCsv,
    downloadAllOrdersXlsx,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanOrderExport = api;
})(typeof window !== "undefined" ? window : globalThis);
