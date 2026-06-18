(function attachAdminImports(root) {
  function buildImportPreview({
    type,
    filename,
    rowsTotal,
    processedRows,
    errors,
    products = [],
    variants = [],
    colourMappings = [],
    inventoryRows = [],
    mediaProducts = [],
    mediaSummary = null,
    unassignedMedia = [],
    seedSummary = null,
    stockMatches = [],
    stockExceptions = [],
    stockSummary = null,
    publishPlan = null,
  } = {}) {
    return {
      type,
      filename,
      rowsTotal,
      processedRows,
      skippedRows: Math.max(0, rowsTotal - processedRows),
      errors: errors || [],
      products,
      variants,
      colourMappings,
      inventoryRows,
      mediaProducts,
      mediaSummary,
      unassignedMedia,
      seedSummary,
      stockMatches,
      stockExceptions,
      stockSummary,
      publishPlan,
    };
  }

  function buildImportJobStart({ type, filename, createdBy, rowsTotal }) {
    return {
      created_by: createdBy,
      import_type: type,
      filename,
      status: "pending",
      rows_total: rowsTotal,
      rows_processed: 0,
    };
  }

  function buildImportJobFinish({ processedRows, errorMessage }) {
    const processed = Math.max(0, Number(processedRows) || 0);
    return {
      status: errorMessage && processed <= 0 ? "failed" : "completed",
      rows_processed: processed,
      error_message: errorMessage || null,
      completed_at: new Date().toISOString(),
    };
  }

  const api = {
    buildImportPreview,
    buildImportJobStart,
    buildImportJobFinish,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IrunsvanAdminImports = api;
})(typeof window !== "undefined" ? window : globalThis);
