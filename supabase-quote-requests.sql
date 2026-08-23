create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.quote_requests (
  id uuid not null default gen_random_uuid(),
  solution_type text not null,
  approximate_quantity integer not null,
  full_name text not null,
  company text null,
  phone text null,
  email public.citext not null,
  message text null,
  status text not null default 'new'::text,
  assigned_to_user_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint quote_requests_pkey primary key (id),
  constraint quote_requests_assigned_to_user_id_fkey
    foreign key (assigned_to_user_id) references app_users (id) on delete set null,
  constraint quote_requests_approximate_quantity_check check (approximate_quantity > 0),
  constraint quote_requests_solution_type_check check (
    solution_type = any (
      array[
        'digital_profile'::text,
        'nfc_card'::text,
        'metal_card'::text,
        'google_review_card'::text,
        'team_solution'::text,
        'custom'::text
      ]
    )
  ),
  constraint quote_requests_status_check check (
    status = any (
      array[
        'new'::text,
        'contacted'::text,
        'quoted'::text,
        'won'::text,
        'lost'::text,
        'archived'::text
      ]
    )
  )
);

create index if not exists idx_quote_requests_status
  on public.quote_requests using btree (status);

create index if not exists idx_quote_requests_email
  on public.quote_requests using btree (email);

alter table public.quote_requests enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_requests'
      and policyname = 'Website can create quote requests'
  ) then
    create policy "Website can create quote requests"
      on public.quote_requests
      for insert
      to anon
      with check (
        status = 'new'
        and assigned_to_user_id is null
        and approximate_quantity > 0
        and solution_type = any (
          array[
            'digital_profile'::text,
            'nfc_card'::text,
            'metal_card'::text,
            'google_review_card'::text,
            'team_solution'::text,
            'custom'::text
          ]
        )
      );
  end if;
end $$;
