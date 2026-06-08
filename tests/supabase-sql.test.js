const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const pricePrivacySql = readFileSync(join(__dirname, "..", "supabase", "sql", "009_reseller_price_privacy_and_grants.sql"), "utf8");
const catchupSql = readFileSync(join(__dirname, "..", "supabase", "sql", "010_schema_catchup_repair.sql"), "utf8");

assert.match(pricePrivacySql, /create or replace view public\.reseller_products\s+with \(security_invoker = true\)/i);
assert.match(pricePrivacySql, /create or replace view public\.reseller_product_variants\s+with \(security_invoker = true\)/i);
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
assert.match(catchupSql, /create or replace view public\.reseller_products\s+with \(security_invoker = true\)/i);
assert.match(catchupSql, /create or replace view public\.reseller_product_variants\s+with \(security_invoker = true\)/i);
assert.equal(/grant select \([^)]*base_price/is.test(catchupSql), false, "Catch-up public grants must not expose base_price columns.");
assert.equal(/grant select \([^)]*base_currency/is.test(catchupSql), false, "Catch-up public grants must not expose base_currency columns.");

console.log("supabase-sql tests passed");
