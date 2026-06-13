const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const pricePrivacySql = readFileSync(join(__dirname, "..", "supabase", "sql", "009_reseller_price_privacy_and_grants.sql"), "utf8");
const catchupSql = readFileSync(join(__dirname, "..", "supabase", "sql", "010_schema_catchup_repair.sql"), "utf8");
const skuFirstSql = readFileSync(join(__dirname, "..", "supabase", "sql", "011_sku_first_catalog_import.sql"), "utf8");
const authorizedPriceSql = readFileSync(join(__dirname, "..", "supabase", "sql", "012_authorized_price_feeds.sql"), "utf8");
const skuSourceTruthSql = readFileSync(join(__dirname, "..", "supabase", "sql", "013_sku_zip_source_truth_images.sql"), "utf8");
const brandCleanupSql = readFileSync(join(__dirname, "..", "supabase", "sql", "014_irunsvan_brand_text_cleanup.sql"), "utf8");
const accountDirectorySql = readFileSync(join(__dirname, "..", "supabase", "sql", "015_account_and_directory.sql"), "utf8");

assert.match(pricePrivacySql, /create or replace view public\.reseller_products\s+with \(security_invoker = true\)/i);
assert.match(pricePrivacySql, /create or replace view public\.reseller_product_variants\s+with \(security_invoker = true\)/i);
assert.equal(/create or replace view public\.reseller_products[\s\S]*base_price[\s\S]*from public\.products/i.test(pricePrivacySql), false, "Protected product view must not require price columns withheld from base-table grants.");
assert.equal(/create or replace view public\.reseller_product_variants[\s\S]*base_price[\s\S]*from public\.product_variants/i.test(pricePrivacySql), false, "Protected variant view must not require price columns withheld from base-table grants.");
assert.match(pricePrivacySql, /revoke all on public\.products from anon, authenticated;/i);
assert.match(pricePrivacySql, /revoke all on public\.product_variants from anon, authenticated;/i);
assert.equal(/grant select \([^)]*base_price/is.test(pricePrivacySql), false, "Public table grants must not expose base_price columns.");
assert.equal(/grant select \([^)]*base_currency/is.test(pricePrivacySql), false, "Public table grants must not expose base_currency columns.");

assert.match(catchupSql, /create table if not exists public\.hero_sections/i);
assert.match(catchupSql, /create table if not exists public\.site_themes/i);
assert.match(catchupSql, /create table if not exists public\.site_content/i);
assert.match(catchupSql, /alter table public\.products[\s\S]*add column if not exists model_code text/i);
assert.match(catchupSql, /alter table public\.products[\s\S]*add column if not exists product_type text not null default 'shoe'/i);
assert.match(catchupSql, /alter table public\.product_variants[\s\S]*add column if not exists original_colour text/i);
assert.match(catchupSql, /alter table public\.product_variants[\s\S]*add column if not exists color_code text/i);
assert.match(catchupSql, /alter type public\.import_job_type add value if not exists 'catalog_seed_inventory'/i);
assert.match(catchupSql, /alter type public\.import_job_type add value if not exists 'media_pack_zip'/i);
assert.match(catchupSql, /create or replace view public\.reseller_products\s+with \(security_invoker = true\)/i);
assert.match(catchupSql, /create or replace view public\.reseller_product_variants\s+with \(security_invoker = true\)/i);
assert.equal(/create or replace view public\.reseller_products[\s\S]*base_price[\s\S]*from public\.products/i.test(catchupSql), false, "Catch-up product view must not require price columns withheld from base-table grants.");
assert.equal(/create or replace view public\.reseller_product_variants[\s\S]*base_price[\s\S]*from public\.product_variants/i.test(catchupSql), false, "Catch-up variant view must not require price columns withheld from base-table grants.");
assert.match(catchupSql, /update public\.products[\s\S]*set model_code = regexp_replace\(sku, '\^IRUNSVAN-', ''\)/i);
assert.match(catchupSql, /update public\.product_variants[\s\S]*set original_colour = colour/i);
assert.match(catchupSql, /insert into public\.product_colour_mappings/i);
assert.equal(/grant select \([^)]*base_price/is.test(catchupSql), false, "Catch-up public grants must not expose base_price columns.");
assert.equal(/grant select \([^)]*base_currency/is.test(catchupSql), false, "Catch-up public grants must not expose base_currency columns.");

assert.match(skuFirstSql, /create table if not exists public\.product_colour_mappings/i);
assert.match(skuFirstSql, /unique \(product_id, original_colour, color_code\)/i);
assert.match(skuFirstSql, /alter table public\.product_colour_mappings enable row level security/i);
assert.match(skuFirstSql, /grant select on public\.product_colour_mappings to anon, authenticated/i);
assert.match(skuFirstSql, /grant insert, update, delete on public\.product_colour_mappings to authenticated/i);

assert.match(authorizedPriceSql, /create or replace view public\.authorized_product_prices/i);
assert.match(authorizedPriceSql, /create or replace view public\.authorized_variant_prices/i);
assert.match(authorizedPriceSql, /base_price/i);
assert.match(authorizedPriceSql, /private\.is_admin\(\)/i);
assert.match(authorizedPriceSql, /private\.is_approved_reseller\(\)/i);
assert.match(authorizedPriceSql, /revoke all on public\.authorized_product_prices from public, anon, authenticated/i);
assert.match(authorizedPriceSql, /revoke all on public\.authorized_variant_prices from public, anon, authenticated/i);
assert.match(authorizedPriceSql, /grant select on public\.authorized_product_prices to authenticated/i);
assert.match(authorizedPriceSql, /grant select on public\.authorized_variant_prices to authenticated/i);
assert.equal(/grant select \([^)]*base_price/is.test(authorizedPriceSql), false, "Authorized price feeds must not add public base table price grants.");

assert.match(skuSourceTruthSql, /SKU image folders are the product source of truth/i);
assert.match(skuSourceTruthSql, /model_code not in \(select model_code from public\.products/i);
assert.match(skuSourceTruthSql, /published = si\.model_code is not null/i);
assert.match(skuSourceTruthSql, /\/public\/product-images\/SKUs\/087\/1\.jpg/i);
assert.match(skuSourceTruthSql, /\/public\/product-images\/SKUs\/128\/01\.jpg/i);
assert.match(skuSourceTruthSql, /public\.product_variants[\s\S]*published = vm\.model_code in/i);

assert.equal(/Ivansrun Africa/.test(catchupSql), false, "Catch-up schema must seed Irunsvan branding.");
assert.match(brandCleanupSql, /update public\.products[\s\S]*description = replace\(description, 'Ivansrun Africa', 'Irunsvan Africa'\)/i);
assert.match(brandCleanupSql, /update public\.hero_sections[\s\S]*copy = replace\(copy, 'Ivansrun Africa', 'Irunsvan Africa'\)/i);
assert.match(brandCleanupSql, /update public\.site_content[\s\S]*reseller_banner = replace\(reseller_banner, 'Ivansrun Africa', 'Irunsvan Africa'\)/i);
assert.equal(/reseller_company/.test(brandCleanupSql), false, "Brand cleanup must not reference non-schema order request columns.");

assert.match(accountDirectorySql, /create or replace function public\.update_own_profile/i);
assert.match(accountDirectorySql, /where id = \(select auth\.uid\(\)\)/i);
assert.match(accountDirectorySql, /grant execute on function public\.update_own_profile\(text, text, text\) to authenticated/i);
assert.match(accountDirectorySql, /create or replace view public\.reseller_directory/i);
assert.match(accountDirectorySql, /applications\.status = 'approved'::public\.application_status/i);
assert.match(accountDirectorySql, /profiles\.role = 'reseller'::public\.user_role/i);
assert.match(accountDirectorySql, /grant select on public\.reseller_directory to anon, authenticated/i);

console.log("supabase-sql tests passed");
