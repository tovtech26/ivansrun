const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { parseMasterInventoryRows } = require("../src/import-parser.js");
const { buildCatalogSeed } = require("../src/catalog-seed-builder.js");
const fallbackCatalog = require("../src/catalog-fallback.js");

const masterPath = "D:\\downloads from my laptop\\MASTER INVENTORY FILE.xlsx";

if (!existsSync(masterPath)) {
  console.log(`catalog-seed-real-master skipped: file not found at ${masterPath}`);
  process.exit(0);
}

const pythonScript = `
import json
from openpyxl import load_workbook

workbook = load_workbook(r"""${masterPath}""", read_only=True, data_only=True)
sheet = workbook[workbook.sheetnames[0]]
rows = list(sheet.iter_rows(values_only=True))
if not rows:
    print("[]")
else:
    headers = ["" if value is None else str(value) for value in rows[0]]
    payload = []
    for row in rows[1:]:
        values = ["" if value is None else str(value) for value in row]
        if any(value.strip() for value in values):
            payload.append({headers[index]: values[index] if index < len(values) else "" for index in range(len(headers))})
    print(json.dumps(payload, ensure_ascii=False))
`;

let result = spawnSync("python", ["-X", "utf8", "-c", pythonScript], {
  cwd: process.cwd(),
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});

if (result.status !== 0) {
const powershellScript = `
$path = '${masterPath.replace(/\\/g, "\\\\")}';
$excel = $null;
$workbook = $null;
try {
  $excel = New-Object -ComObject Excel.Application;
  $excel.Visible = $false;
  $excel.DisplayAlerts = $false;
  $workbook = $excel.Workbooks.Open($path, 0, $true);
  $sheet = $workbook.Worksheets.Item(1);
  $range = $sheet.UsedRange;
  $values = $range.Value2;
  if (-not $values) {
    '[]';
    exit 0;
  }
  $rowCount = $range.Rows.Count;
  $colCount = $range.Columns.Count;
  $headers = @();
  for ($c = 1; $c -le $colCount; $c++) {
    $headers += [string]$values[1, $c];
  }
  $rows = @();
  for ($r = 2; $r -le $rowCount; $r++) {
    $row = @{};
    $hasValue = $false;
    for ($c = 1; $c -le $colCount; $c++) {
      $header = $headers[$c - 1];
      $value = $values[$r, $c];
      if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace([string]$value)) {
        $hasValue = $true;
      }
      $row[$header] = if ($null -eq $value) { '' } else { [string]$value };
    }
    if ($hasValue) {
      $rows += [pscustomobject]$row;
    }
  }
  $rows | ConvertTo-Json -Compress -Depth 4;
}
finally {
  if ($workbook) { $workbook.Close($false); }
  if ($excel) { $excel.Quit(); }
  [gc]::Collect();
  [gc]::WaitForPendingFinalizers();
}
`;

result = spawnSync("powershell.exe", ["-NoProfile", "-Command", powershellScript], {
  cwd: process.cwd(),
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});
}

if (result.status !== 0) {
  console.log("catalog-seed-real-master skipped: unable to read workbook through Excel COM");
  if (result.stderr) console.log(result.stderr.trim());
  process.exit(0);
}

const rows = JSON.parse(result.stdout.trim() || "[]");
const parsed = parseMasterInventoryRows(rows);
const selectedProducts = fallbackCatalog.products;
const selectedModelCodes = selectedProducts.map((product) => product.model_code);
const imageLibrary = selectedProducts.reduce((library, product) => {
  library[product.model_code] = product.image_names;
  return library;
}, {});
const seed = buildCatalogSeed({
  inventoryRows: parsed.rows,
  selectedModelCodes,
  selectedProducts,
  imageLibrary,
});
const selectedUnits = parsed.rows
  .filter((row) => selectedModelCodes.includes(row.model_code))
  .reduce((total, row) => total + Number(row.stock_quantity || 0), 0);

assert.equal(rows.length, 3748);
assert.equal(parsed.rows.length > 0, true);
assert.equal(seed.summary.selectedModelCodes.length, 21);
assert.equal(seed.summary.matchedModelCodes.length, 20);
assert.equal(seed.summary.missingSelectedModels.includes("165"), true);
assert.equal(seed.summary.variantRows, 1312);
assert.equal(selectedUnits, 67002);

console.log("catalog-seed-real-master tests passed");
