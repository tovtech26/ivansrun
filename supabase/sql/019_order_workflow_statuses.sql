do $$
begin
  alter type public.order_request_status add value if not exists 'awaiting_payment';
  alter type public.order_request_status add value if not exists 'paid';
  alter type public.order_request_status add value if not exists 'submitted_to_supplier';
  alter type public.order_request_status add value if not exists 'processing';
  alter type public.order_request_status add value if not exists 'shipped';
exception
  when duplicate_object then null;
end $$;

alter table public.order_requests
  add column if not exists approved_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists supplier_submitted_at timestamptz,
  add column if not exists processing_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists expected_fulfillment_date date,
  add column if not exists invoice_number text,
  add column if not exists payment_reference text,
  add column if not exists payment_note text,
  add column if not exists supplier_exported_at timestamptz;
