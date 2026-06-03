# IRUNSVAN Supabase Backend Design

## Goal

Build the backend foundation for an IRUNSVAN shoe ecommerce site with three access levels:

- Public visitors browse products and prices, but cannot see exact stock or place orders.
- Approved resellers see exact stock by SKU, colour, and size, then submit order requests.
- Admin users approve resellers, review order requests, and upload catalog/inventory files.

## Data Sources

The backend supports two current import formats:

- WooCommerce catalog CSV: product names, parent products, variation SKUs, prices, categories, colours, sizes, stock, and image filename references.
- Master inventory XLSX/CSV: style code, SKU, colour/size text, and stock quantity.

Product images can be added later. Until then, image filenames from the catalog CSV are stored as references, and the storefront can use placeholders.

## Architecture

Supabase is the primary backend:

- Supabase Auth manages login.
- Postgres stores products, variants, reseller applications, stock, order requests, and import history.
- Row Level Security controls who can read or write each table.
- Supabase Storage can be added later for product images.

The initial backend does not implement payment checkout. Reseller orders are requests that an admin reviews.

## Tables

### profiles

One row per authenticated user.

Fields:

- `id`: references `auth.users.id`
- `email`
- `full_name`
- `company_name`
- `phone`
- `role`: `admin`, `reseller`, or `pending_reseller`
- `created_at`
- `updated_at`

### reseller_applications

Stores reseller signup requests.

Fields:

- `id`
- `user_id`
- `email`
- `full_name`
- `company_name`
- `phone`
- `country`
- `message`
- `status`: `pending`, `approved`, or `rejected`
- `reviewed_by`
- `reviewed_at`
- `created_at`

### products

Stores parent products from the catalog CSV.

Fields:

- `id`
- `sku`
- `name`
- `slug`
- `description`
- `short_description`
- `category`
- `base_price`
- `base_currency`, default `USD`
- `image_names`
- `published`
- `created_at`
- `updated_at`

### product_variants

Stores sellable SKU-level product variations.

Fields:

- `id`
- `product_id`
- `sku`
- `name`
- `colour`
- `size`
- `base_price`
- `base_currency`, default `USD`
- `image_name`
- `published`
- `created_at`
- `updated_at`

### inventory

Stores exact stock by variant SKU.

Fields:

- `id`
- `variant_id`
- `sku`
- `style_code`
- `stock_quantity`
- `source`
- `updated_at`

### order_requests

Stores one reseller order request.

Fields:

- `id`
- `reseller_id`
- `status`: `submitted`, `approved`, `rejected`, `fulfilled`, or `cancelled`
- `notes`
- `admin_notes`
- `created_at`
- `updated_at`

### order_request_items

Stores requested SKUs and quantities.

Fields:

- `id`
- `order_request_id`
- `variant_id`
- `sku`
- `product_name`
- `colour`
- `size`
- `quantity`
- `base_price`
- `base_currency`
- `created_at`

### import_jobs

Tracks admin uploads and import results.

Fields:

- `id`
- `created_by`
- `import_type`: `catalog_csv`, `inventory_xlsx`, or `images`
- `filename`
- `status`: `pending`, `processing`, `completed`, or `failed`
- `rows_total`
- `rows_processed`
- `error_message`
- `created_at`
- `completed_at`

## Permissions

Public visitors:

- Can read published products and product variants.
- Cannot read exact inventory.
- Cannot create order requests.

Pending resellers:

- Can read public product data.
- Can read their own reseller application.
- Cannot read exact inventory.
- Cannot create order requests.

Approved resellers:

- Can read public product data.
- Can read exact inventory.
- Can create their own order requests and items.
- Can read their own order requests.

Admins:

- Can read and write all backend tables.
- Can approve and reject reseller applications.
- Can review all order requests.
- Can create import jobs.

## Stock Rules

Submitting an order request does not deduct stock. Stock changes only through admin processing or inventory imports. This avoids incorrect deductions because the site does not collect payment at checkout.

## Later Additions

The following are intentionally deferred:

- Product image uploads through Supabase Storage.
- Exchange-rate display for BWP, ZAR, and other currencies.
- Email notifications for reseller applications and order requests.
- Admin CSV/XLSX parsing UI.
- Actual frontend screens.

