(function attachInventoryWorkflow(root) {
  function safeText(value) {
    return String(value || "").trim();
  }

  function safeStock(value) {
    const stock = Number.parseInt(String(value ?? "0"), 10);
    return Number.isFinite(stock) && stock > 0 ? stock : 0;
  }

  function buildInventoryPublishPlan({ inventory = [], stockMatches = [], source = "master_inventory" } = {}) {
    const rowsByVariantId = new Map();

    inventory.forEach((row) => {
      const variantId = safeText(row.variant_id || row.variantId);
      if (!variantId) return;
      rowsByVariantId.set(variantId, {
        ...row,
        variant_id: variantId,
        sku: safeText(row.sku),
        style_code: safeText(row.style_code),
        stock_quantity: 0,
        source: `${source}:absent`,
      });
    });

    stockMatches.forEach((match) => {
      const variantId = safeText(match.variantId || match.variant_id);
      const sku = safeText(match.variantSku || match.sku);
      if (!variantId) throw new Error("A matched stock row requires a variant id.");
      if (!sku) throw new Error("A matched stock row requires a SKU.");

      const existing = rowsByVariantId.get(variantId) || {};
      rowsByVariantId.set(variantId, {
        ...existing,
        variant_id: variantId,
        sku,
        style_code: safeText(match.modelCode || match.style_code),
        stock_quantity: safeStock(match.nextStock ?? match.stock_quantity),
        source: match.sourceSku ? `${source}:${safeText(match.sourceSku)}` : source,
      });
    });

    const rows = [...rowsByVariantId.values()].sort((left, right) => safeText(left.sku).localeCompare(safeText(right.sku)));
    const matchedVariantIds = new Set(stockMatches.map((match) => safeText(match.variantId || match.variant_id)).filter(Boolean));
    const absentRows = inventory
      .filter((row) => !matchedVariantIds.has(safeText(row.variant_id || row.variantId)) && safeStock(row.stock_quantity) > 0)
      .map((row) => ({
        variantId: safeText(row.variant_id || row.variantId),
        sku: safeText(row.sku),
        previousStock: safeStock(row.stock_quantity),
        nextStock: 0,
      }))
      .sort((left, right) => safeText(left.sku).localeCompare(safeText(right.sku)));

    return {
      rows,
      absentRows,
      summary: {
        trackedRowsReset: inventory.filter((row) => safeText(row.variant_id || row.variantId)).length,
        matchedRowsApplied: stockMatches.length,
        absentRowsZeroed: absentRows.length,
        totalNextStock: rows.reduce((total, row) => total + safeStock(row.stock_quantity), 0),
      },
    };
  }

  function applyInventoryPublishPlan(inventory = [], plan = {}) {
    const plannedRowsByVariantId = new Map((plan.rows || []).map((row) => [safeText(row.variant_id || row.variantId), row]));
    const existingVariantIds = new Set(inventory.map((row) => safeText(row.variant_id || row.variantId)).filter(Boolean));
    const updatedExisting = inventory
      .filter((row) => plannedRowsByVariantId.has(safeText(row.variant_id || row.variantId)))
      .map((row) => ({
        ...row,
        ...plannedRowsByVariantId.get(safeText(row.variant_id || row.variantId)),
      }));
    const newRows = (plan.rows || []).filter((row) => !existingVariantIds.has(safeText(row.variant_id || row.variantId)));
    return [...updatedExisting, ...newRows].sort((left, right) => safeText(left.sku).localeCompare(safeText(right.sku)));
  }

  const api = {
    buildInventoryPublishPlan,
    applyInventoryPublishPlan,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IvansrunInventoryWorkflow = api;
})(typeof window !== "undefined" ? window : globalThis);
