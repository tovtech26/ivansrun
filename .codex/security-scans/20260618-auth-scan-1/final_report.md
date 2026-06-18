# Final Security Report

Scan target: repository-wide

## Summary

I found four reportable issues and one suppressed candidate:

1. `CF-001` - admin invite token remains in the URL and browser history after load
2. `CAND-IMP-001` - CSV parser mis-splits multiline quoted rows
3. `CAND-MAIL-ORDER-001` - public order-mail edge function lacks caller authentication
4. `CAND-MAIL-APP-001` - public application-mail edge function lacks caller authentication
5. `CAND-INV-001` - inventory publish-plan helper, suppressed because the actual call sites derive rows internally

## Reportable Findings

### CF-001
- File: `src/app.js:884`
- Issue: `consumeAdminInviteHint()` reads `?invite=` but never removes the token from the URL
- Impact: bearer invite token disclosure through address bar, history, and sharing

### CAND-IMP-001
- File: `src/import-parser.js:56`
- Issue: `parseCsvText()` splits on raw newlines before record-safe parsing
- Impact: malformed CSV can misbind rows and corrupt import-driven product or inventory updates

### CAND-MAIL-ORDER-001
- File: `supabase/functions/send-order-email/index.ts:13`
- Issue: unauthenticated edge function that forwards arbitrary JSON to Resend
- Impact: mail abuse, unauthorized recipient targeting, API-key-backed spam

### CAND-MAIL-APP-001
- File: `supabase/functions/send-application-email/index.ts:13`
- Issue: unauthenticated edge function that forwards arbitrary JSON to Resend
- Impact: mail abuse, unauthorized recipient targeting, API-key-backed spam

## Suppressed Candidate

### CAND-INV-001
- File: `src/inventory-workflow.js:11`
- Issue: variant-id keyed inventory merge
- Disposition: suppressed
- Reason: the observed callers derive `stockMatches` from internal matching or freshly saved variants, so the file does not expose an attacker-controlled plan boundary on its own

