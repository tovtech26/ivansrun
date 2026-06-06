(function attachAdminImports(root) {
  function buildImportPreview({
    type,
    filename,
    rowsTotal,
    processedRows,
    errors,
    products = [],
    variants = [],
    inventoryRows = [],
    mediaProducts = [],
    mediaSummary = null,
    unassignedMedia = [],
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
      inventoryRows,
      mediaProducts,
      mediaSummary,
      unassignedMedia,
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
    return {
      status: errorMessage ? "failed" : "completed",
      rows_processed: processedRows,
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
  root.IvansrunAdminImports = api;
})(typeof window !== "undefined" ? window : globalThis);
