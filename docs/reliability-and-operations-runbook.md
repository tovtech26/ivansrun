# Reliability and operations runbook

## Inventory imports

Every manufacturer workbook import is a full stock snapshot for the products Irunsvan sells:

1. Lock inventory for the transaction.
2. Set all existing website inventory quantities to `0`.
3. Match valid workbook rows to existing website SKUs.
4. Restock only those matched SKUs with the workbook quantities.
5. Ignore manufacturer-only products that do not exist in the website catalog.
6. Record an import job and inventory adjustment audit trail.

Missing descriptive Chinese columns do not prevent a valid exact SKU and non-negative quantity from being applied. Admins can correct a quantity afterward through the inventory adjustment workflow; a manual correction does not change the original import audit record.

## Reseller applications

The application RPC keeps one application per user. Submitting an application updates the existing record instead of creating duplicates. Approval or rejection is transactional: the application, profile role, public-directory projection, and notification queue change together.

Rejection requires a reason. Approval does not publish private profile data. An approved reseller must explicitly enable the public directory listing from Account settings.

## Orders

Supported transitions are:

`submitted -> awaiting_payment -> paid -> submitted_to_supplier -> processing -> shipped -> fulfilled`

Submitted orders can be rejected. Open approved or paid orders can be cancelled. Stock is reserved once when the admin agrees to supply and is returned once if that reserved order is later rejected or cancelled. Payment confirmation requires a payment reference; rejection requires a reason.

The admin order view shows expected fulfillment, invoice, payment reference, rejection/cancellation details, and a warning when an open request has waited at least seven days.

## Email delivery

Database workflows insert durable rows into `public.notification_outbox`. The deployed `send-order-email` and `send-application-email` Edge Functions send only queued, database-controlled messages; browser callers cannot provide arbitrary recipients, subjects, or HTML.

Required Supabase Edge Function secrets:

- `RESEND_API_KEY`
- `EMAIL_FROM` (defaults to `ramocha@irunsvanafrica.com`)
- `ADMIN_NOTIFICATION_EMAILS` (comma-separated admin recipients)

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions. Failed messages remain in the outbox with an error, retry count, and next-attempt time. Signed-in admin polling retries due rows. Check the outbox and Edge Function logs first when investigating a missing email.

## Verification commands

Run before deployment:

```powershell
npm run check
npm test
npm run build
npm run test:e2e
```

The public desktop/mobile browser tests run without credentials. Set `E2E_RESELLER_EMAIL` and `E2E_RESELLER_PASSWORD` to include the protected multi-digit SKU search regression test. Local tests use installed Google Chrome by default; set `PLAYWRIGHT_BROWSER_CHANNEL` when another Playwright-supported channel is required.

## One dashboard security setting

Enable **Leaked Password Protection** in Supabase Dashboard under Auth password security. This setting is not controlled by SQL migrations. Re-run the Supabase security advisor after enabling it; no other security warnings should remain.
