-- =====================================================================
-- Waste2Wealth - initial schema
-- Exported from the live Supabase project "Waste2Wealth Project"
-- on 2026-11-20 (the schema was originally built via the dashboard).
--
-- Contents: enums, tables, constraints, indexes, functions, triggers,
-- RLS, policies (public + storage) and storage buckets.
-- Running this on a fresh Supabase project recreates the same database
-- (without data). Do NOT re-run it on the live project - it already
-- has all of this.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enumerated types
-- ---------------------------------------------------------------------
create type public.listing_status as enum ('active', 'reserved', 'completed', 'cancelled');
create type public.partner_type as enum ('buyer', 'recycler', 'refurbisher', 'collection_agency', 'processor');
create type public.request_status as enum ('pending', 'accepted', 'rejected', 'scheduled', 'collected', 'completed', 'cancelled');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.waste_category as enum ('agricultural', 'electronic');

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------
create table public.profiles (
  user_id uuid not null,
  full_name text not null,
  phone character varying(20),
  account_type text not null,
  organization_name text,
  address text,
  city text,
  state text,
  pincode character varying(10),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.waste_listings (
  listing_id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  waste_category public.waste_category not null,
  material_name text not null,
  description text,
  quantity numeric(12,2) not null,
  unit text not null,
  material_condition text not null,
  location text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  expected_price numeric(12,2),
  image_urls text[] default '{}'::text[],
  status public.listing_status default 'active'::public.listing_status not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.partners (
  partner_id uuid default gen_random_uuid() not null,
  profile_id uuid not null,
  partner_type public.partner_type not null,
  organization_name text not null,
  description text,
  contact_person text,
  contact_phone character varying(20),
  contact_email text,
  address text not null,
  city text not null,
  state text not null,
  pincode character varying(10),
  verification_status public.verification_status default 'pending'::public.verification_status not null,
  is_accepting_materials boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.partner_materials (
  partner_material_id uuid default gen_random_uuid() not null,
  partner_id uuid not null,
  material_name text not null,
  waste_category public.waste_category not null,
  minimum_quantity numeric(12,2),
  maximum_quantity numeric(12,2),
  unit text not null,
  created_at timestamp with time zone default now() not null
);

create table public.partner_verifications (
  verification_id uuid default gen_random_uuid() not null,
  partner_id uuid not null,
  document_type text not null,
  document_reference text not null,
  verification_status public.verification_status default 'pending'::public.verification_status not null,
  submitted_at timestamp with time zone default now() not null,
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text
);

create table public.match_results (
  match_id uuid default gen_random_uuid() not null,
  listing_id uuid not null,
  partner_id uuid not null,
  match_score numeric(5,2),
  match_reason text,
  matching_factors jsonb default '{}'::jsonb,
  is_recommended boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table public.collection_requests (
  request_id uuid default gen_random_uuid() not null,
  listing_id uuid not null,
  partner_id uuid not null,
  requester_id uuid not null,
  requested_quantity numeric(12,2) not null,
  offered_price numeric(12,2),
  collection_location text not null,
  proposed_collection_date timestamp with time zone,
  request_status public.request_status default 'pending'::public.request_status not null,
  message text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.request_status_history (
  history_id uuid default gen_random_uuid() not null,
  request_id uuid not null,
  previous_status public.request_status,
  new_status public.request_status not null,
  changed_by uuid,
  remarks text,
  changed_at timestamp with time zone default now() not null
);

create table public.recommendations (
  recommendation_id uuid default gen_random_uuid() not null,
  listing_id uuid not null,
  recommendation_type text not null,
  recommendation_text text not null,
  confidence_score numeric(5,2),
  ai_details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null
);

create table public.knowledge_sources (
  source_id uuid default gen_random_uuid() not null,
  title text not null,
  source_type text not null,
  category public.waste_category,
  description text,
  source_url text,
  content text,
  created_at timestamp with time zone default now() not null
);

create table public.recommendation_sources (
  recommendation_source_id uuid default gen_random_uuid() not null,
  recommendation_id uuid not null,
  source_id uuid not null,
  relevance_score numeric(5,2),
  created_at timestamp with time zone default now() not null
);

-- ---------------------------------------------------------------------
-- 3. Primary keys, unique and check constraints
-- ---------------------------------------------------------------------
alter table public.profiles add constraint profiles_pkey primary key (user_id);
alter table public.profiles add constraint profiles_account_type_check
  check (account_type = any (array['generator'::text, 'partner'::text, 'both'::text, 'admin'::text]));

alter table public.waste_listings add constraint waste_listings_pkey primary key (listing_id);
alter table public.waste_listings add constraint waste_listings_quantity_check check (quantity > 0);
alter table public.waste_listings add constraint waste_listings_expected_price_check
  check (expected_price is null or expected_price >= 0);
alter table public.waste_listings add constraint waste_listings_unit_check
  check (unit = any (array['kg'::text, 'tonne'::text, 'piece'::text, 'litre'::text]));

alter table public.partners add constraint partners_pkey primary key (partner_id);
alter table public.partners add constraint partners_profile_id_key unique (profile_id);

alter table public.partner_materials add constraint partner_materials_pkey primary key (partner_material_id);
alter table public.partner_materials add constraint partner_materials_partner_id_material_name_key unique (partner_id, material_name);
alter table public.partner_materials add constraint partner_materials_minimum_quantity_check
  check (minimum_quantity is null or minimum_quantity >= 0);
alter table public.partner_materials add constraint partner_materials_maximum_quantity_check
  check (maximum_quantity is null or maximum_quantity >= 0);
alter table public.partner_materials add constraint partner_materials_check
  check (minimum_quantity is null or maximum_quantity is null or maximum_quantity >= minimum_quantity);
alter table public.partner_materials add constraint partner_materials_unit_check
  check (unit = any (array['kg'::text, 'tonne'::text, 'piece'::text, 'litre'::text]));

alter table public.partner_verifications add constraint partner_verifications_pkey primary key (verification_id);

alter table public.match_results add constraint match_results_pkey primary key (match_id);
alter table public.match_results add constraint match_results_listing_id_partner_id_key unique (listing_id, partner_id);
alter table public.match_results add constraint match_results_match_score_check
  check (match_score >= 0 and match_score <= 100);

alter table public.collection_requests add constraint collection_requests_pkey primary key (request_id);
alter table public.collection_requests add constraint collection_requests_requested_quantity_check check (requested_quantity > 0);
alter table public.collection_requests add constraint collection_requests_offered_price_check
  check (offered_price is null or offered_price >= 0);

alter table public.request_status_history add constraint request_status_history_pkey primary key (history_id);

alter table public.recommendations add constraint recommendations_pkey primary key (recommendation_id);
alter table public.recommendations add constraint recommendations_confidence_score_check
  check (confidence_score >= 0 and confidence_score <= 100);

alter table public.knowledge_sources add constraint knowledge_sources_pkey primary key (source_id);

alter table public.recommendation_sources add constraint recommendation_sources_pkey primary key (recommendation_source_id);
alter table public.recommendation_sources add constraint recommendation_sources_recommendation_id_source_id_key unique (recommendation_id, source_id);
alter table public.recommendation_sources add constraint recommendation_sources_relevance_score_check
  check (relevance_score >= 0 and relevance_score <= 100);

-- ---------------------------------------------------------------------
-- 4. Foreign keys
-- ---------------------------------------------------------------------
alter table public.profiles add constraint profiles_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.waste_listings add constraint waste_listings_owner_id_fkey
  foreign key (owner_id) references public.profiles(user_id) on delete restrict;
alter table public.partners add constraint partners_profile_id_fkey
  foreign key (profile_id) references public.profiles(user_id) on delete cascade;
alter table public.partner_materials add constraint partner_materials_partner_id_fkey
  foreign key (partner_id) references public.partners(partner_id) on delete cascade;
alter table public.partner_verifications add constraint partner_verifications_partner_id_fkey
  foreign key (partner_id) references public.partners(partner_id) on delete cascade;
alter table public.partner_verifications add constraint partner_verifications_verified_by_fkey
  foreign key (verified_by) references public.profiles(user_id) on delete set null;
alter table public.match_results add constraint match_results_listing_id_fkey
  foreign key (listing_id) references public.waste_listings(listing_id) on delete cascade;
alter table public.match_results add constraint match_results_partner_id_fkey
  foreign key (partner_id) references public.partners(partner_id) on delete cascade;
alter table public.collection_requests add constraint collection_requests_listing_id_fkey
  foreign key (listing_id) references public.waste_listings(listing_id) on delete restrict;
alter table public.collection_requests add constraint collection_requests_partner_id_fkey
  foreign key (partner_id) references public.partners(partner_id) on delete restrict;
alter table public.collection_requests add constraint collection_requests_requester_id_fkey
  foreign key (requester_id) references public.profiles(user_id) on delete restrict;
alter table public.request_status_history add constraint request_status_history_request_id_fkey
  foreign key (request_id) references public.collection_requests(request_id) on delete cascade;
alter table public.request_status_history add constraint request_status_history_changed_by_fkey
  foreign key (changed_by) references public.profiles(user_id) on delete set null;
alter table public.recommendations add constraint recommendations_listing_id_fkey
  foreign key (listing_id) references public.waste_listings(listing_id) on delete cascade;
alter table public.recommendation_sources add constraint recommendation_sources_recommendation_id_fkey
  foreign key (recommendation_id) references public.recommendations(recommendation_id) on delete cascade;
alter table public.recommendation_sources add constraint recommendation_sources_source_id_fkey
  foreign key (source_id) references public.knowledge_sources(source_id) on delete cascade;

-- ---------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------
create index idx_listings_owner on public.waste_listings using btree (owner_id);
create index idx_listings_category_status on public.waste_listings using btree (waste_category, status);
create index idx_listings_created_at on public.waste_listings using btree (created_at desc);
create index idx_listings_location on public.waste_listings using btree (location);
create index idx_partners_city on public.partners using btree (city);
create index idx_partners_type_status on public.partners using btree (partner_type, verification_status);
create index idx_partner_materials_partner on public.partner_materials using btree (partner_id);
create index idx_partner_materials_category on public.partner_materials using btree (waste_category);
create index idx_verifications_partner on public.partner_verifications using btree (partner_id);
create index idx_matches_listing on public.match_results using btree (listing_id);
create index idx_matches_partner on public.match_results using btree (partner_id);
create index idx_requests_listing on public.collection_requests using btree (listing_id);
create index idx_requests_partner on public.collection_requests using btree (partner_id);
create index idx_requests_requester on public.collection_requests using btree (requester_id);
create index idx_requests_status on public.collection_requests using btree (request_status);
create index idx_history_request on public.request_status_history using btree (request_id);
create index idx_recommendations_listing on public.recommendations using btree (listing_id);
create index idx_rec_sources_recommendation on public.recommendation_sources using btree (recommendation_id);
create index idx_rec_sources_source on public.recommendation_sources using btree (source_id);

-- ---------------------------------------------------------------------
-- 6. Functions
-- ---------------------------------------------------------------------

-- Creates a profile (default role: generator) for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles (user_id, full_name, account_type)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New User'
    ),
    'generator'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$function$;

-- True when the calling user has account_type = 'admin'.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.profiles
    where user_id = (select auth.uid())
      and account_type = 'admin'
  );
$function$;

-- Only admins may change a partner's verification_status.
create or replace function public.protect_partner_verification()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if (select auth.uid()) is not null
     and old.verification_status is distinct from new.verification_status
     and not public.is_admin() then
    raise exception 'Only administrators can change partner verification status';
  end if;
  return new;
end;
$function$;

-- Only admins may change a profile's account_type (role).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if (select auth.uid()) is not null
     and old.account_type is distinct from new.account_type
     and not public.is_admin() then
    raise exception 'You are not allowed to change your account role';
  end if;
  return new;
end;
$function$;

-- Event-trigger function: automatically enables RLS on new public tables.
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  cmd record;
  tbl name;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name is not null
       and cmd.schema_name in ('public')
       and cmd.schema_name not in ('pg_catalog', 'information_schema')
       and cmd.schema_name not like 'pg_toast%'
       and cmd.schema_name not like 'pg_temp%' then
      begin
        select c.relname into tbl from pg_catalog.pg_class c where c.oid = cmd.objid;
        execute format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)',
        cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$function$;

-- ---------------------------------------------------------------------
-- 7. Triggers
-- ---------------------------------------------------------------------
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger prevent_profile_role_change
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create trigger prevent_partner_verification_change
  before update on public.partners
  for each row execute function public.protect_partner_verification();

create event trigger ensure_rls on ddl_command_end
  execute function public.rls_auto_enable();

-- ---------------------------------------------------------------------
-- 8. Row-level security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.waste_listings enable row level security;
alter table public.partners enable row level security;
alter table public.partner_materials enable row level security;
alter table public.partner_verifications enable row level security;
alter table public.match_results enable row level security;
alter table public.collection_requests enable row level security;
alter table public.request_status_history enable row level security;
alter table public.recommendations enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.recommendation_sources enable row level security;

-- ---------------------------------------------------------------------
-- 9. Policies - public schema
-- ---------------------------------------------------------------------

-- profiles
create policy "View profiles" on public.profiles
  as permissive for select to authenticated
  using ((user_id = (select auth.uid())) or public.is_admin());

create policy "Update profiles" on public.profiles
  as permissive for update to authenticated
  using ((user_id = (select auth.uid())) or public.is_admin())
  with check ((user_id = (select auth.uid())) or public.is_admin());

-- waste_listings
create policy "View waste listings" on public.waste_listings
  as permissive for select to authenticated
  using ((status = 'active'::public.listing_status) or (owner_id = (select auth.uid())) or public.is_admin());

create policy "Create waste listings" on public.waste_listings
  as permissive for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Update waste listings" on public.waste_listings
  as permissive for update to authenticated
  using ((owner_id = (select auth.uid())) or public.is_admin())
  with check ((owner_id = (select auth.uid())) or public.is_admin());

create policy "Delete waste listings" on public.waste_listings
  as permissive for delete to authenticated
  using ((owner_id = (select auth.uid())) or public.is_admin());

-- partners
create policy "View partners" on public.partners
  as permissive for select to authenticated
  using ((verification_status = 'verified'::public.verification_status) or (profile_id = (select auth.uid())) or public.is_admin());

create policy "Create own partner profile" on public.partners
  as permissive for insert to authenticated
  with check ((profile_id = (select auth.uid())) and (verification_status = 'pending'::public.verification_status));

create policy "Update own partner profile" on public.partners
  as permissive for update to authenticated
  using ((profile_id = (select auth.uid())) or public.is_admin())
  with check ((profile_id = (select auth.uid())) or public.is_admin());

create policy "Delete own partner profile" on public.partners
  as permissive for delete to authenticated
  using ((profile_id = (select auth.uid())) or public.is_admin());

-- partner_materials
create policy "View partner materials" on public.partner_materials
  as permissive for select to authenticated
  using (exists (
    select 1 from public.partners p
    where p.partner_id = partner_materials.partner_id
      and ((p.verification_status = 'verified'::public.verification_status)
           or (p.profile_id = (select auth.uid()))
           or public.is_admin())
  ));

create policy "Add partner materials" on public.partner_materials
  as permissive for insert to authenticated
  with check (
    exists (select 1 from public.partners p
            where p.partner_id = partner_materials.partner_id and p.profile_id = (select auth.uid()))
    or public.is_admin()
  );

create policy "Update partner materials" on public.partner_materials
  as permissive for update to authenticated
  using (
    exists (select 1 from public.partners p
            where p.partner_id = partner_materials.partner_id and p.profile_id = (select auth.uid()))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.partners p
            where p.partner_id = partner_materials.partner_id and p.profile_id = (select auth.uid()))
    or public.is_admin()
  );

create policy "Delete partner materials" on public.partner_materials
  as permissive for delete to authenticated
  using (
    exists (select 1 from public.partners p
            where p.partner_id = partner_materials.partner_id and p.profile_id = (select auth.uid()))
    or public.is_admin()
  );

-- partner_verifications
create policy "View partner verifications" on public.partner_verifications
  as permissive for select to authenticated
  using (
    exists (select 1 from public.partners p
            where p.partner_id = partner_verifications.partner_id and p.profile_id = (select auth.uid()))
    or public.is_admin()
  );

create policy "Submit partner verifications" on public.partner_verifications
  as permissive for insert to authenticated
  with check (
    verification_status = 'pending'::public.verification_status
    and verified_by is null
    and verified_at is null
    and exists (select 1 from public.partners p
                where p.partner_id = partner_verifications.partner_id and p.profile_id = (select auth.uid()))
  );

create policy "Admin update partner verifications" on public.partner_verifications
  as permissive for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Delete partner verifications" on public.partner_verifications
  as permissive for delete to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.partners p
               where p.partner_id = partner_verifications.partner_id and p.profile_id = (select auth.uid()))
  );

-- match_results (no write policies: written by the backend only)
create policy "View match results" on public.match_results
  as permissive for select to authenticated
  using (
    exists (select 1 from public.waste_listings w
            where w.listing_id = match_results.listing_id and w.owner_id = (select auth.uid()))
    or exists (select 1 from public.partners p
               where p.partner_id = match_results.partner_id and p.profile_id = (select auth.uid()))
    or public.is_admin()
  );

-- collection_requests (no UPDATE policy: status changes still to be built)
create policy "View collection requests" on public.collection_requests
  as permissive for select to authenticated
  using (
    exists (select 1 from public.waste_listings w
            where w.listing_id = collection_requests.listing_id and w.owner_id = (select auth.uid()))
    or exists (select 1 from public.partners p
               where p.partner_id = collection_requests.partner_id and p.profile_id = (select auth.uid()))
    or public.is_admin()
  );

create policy "Create collection requests" on public.collection_requests
  as permissive for insert to authenticated
  with check (
    request_status = 'pending'::public.request_status
    and (
      (requester_id = (select auth.uid())
       and exists (select 1 from public.waste_listings w
                   where w.listing_id = collection_requests.listing_id and w.owner_id = (select auth.uid())))
      or
      (requester_id = (select auth.uid())
       and exists (select 1 from public.partners p
                   where p.partner_id = collection_requests.partner_id
                     and p.profile_id = (select auth.uid())
                     and p.verification_status = 'verified'::public.verification_status))
    )
  );

-- request_status_history (no write policies: written by the backend only)
create policy "View request status history" on public.request_status_history
  as permissive for select to authenticated
  using (
    exists (select 1 from public.collection_requests cr
            join public.waste_listings w on w.listing_id = cr.listing_id
            where cr.request_id = request_status_history.request_id and w.owner_id = (select auth.uid()))
    or exists (select 1 from public.collection_requests cr
               join public.partners p on p.partner_id = cr.partner_id
               where cr.request_id = request_status_history.request_id and p.profile_id = (select auth.uid()))
    or public.is_admin()
  );

-- recommendations (no write policies: written by the backend only)
create policy "View recommendations" on public.recommendations
  as permissive for select to authenticated
  using (
    exists (select 1 from public.waste_listings w
            where w.listing_id = recommendations.listing_id and w.owner_id = (select auth.uid()))
    or public.is_admin()
  );

-- knowledge_sources
create policy "View knowledge sources" on public.knowledge_sources
  as permissive for select to authenticated
  using (true);

create policy "Admin insert knowledge sources" on public.knowledge_sources
  as permissive for insert to authenticated
  with check (public.is_admin());

create policy "Admin update knowledge sources" on public.knowledge_sources
  as permissive for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin delete knowledge sources" on public.knowledge_sources
  as permissive for delete to authenticated
  using (public.is_admin());

-- recommendation_sources (no write policies: written by the backend only)
create policy "View recommendation sources" on public.recommendation_sources
  as permissive for select to authenticated
  using (
    exists (select 1 from public.recommendations r
            join public.waste_listings w on w.listing_id = r.listing_id
            where r.recommendation_id = recommendation_sources.recommendation_id
              and w.owner_id = (select auth.uid()))
    or public.is_admin()
  );

-- ---------------------------------------------------------------------
-- 10. Storage buckets (both private)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('waste-listing-images', 'waste-listing-images', false, 5242880,
   '{image/jpeg,image/png,image/webp}'::text[]),
  ('partner-verification-documents', 'partner-verification-documents', false, 10485760,
   '{application/pdf,image/jpeg,image/png}'::text[])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 11. Policies - storage.objects
-- Files are stored under "<user_id>/..." inside each bucket.
-- ---------------------------------------------------------------------

-- waste-listing-images
create policy "Users upload images to own folder" on storage.objects
  as permissive for insert to authenticated
  with check (bucket_id = 'waste-listing-images'
              and (storage.foldername(name))[1] = ((select auth.uid()))::text);

create policy "Users view images in own folder" on storage.objects
  as permissive for select to authenticated
  using (bucket_id = 'waste-listing-images'
         and (storage.foldername(name))[1] = ((select auth.uid()))::text);

create policy "Users update images in own folder" on storage.objects
  as permissive for update to authenticated
  using (bucket_id = 'waste-listing-images'
         and (storage.foldername(name))[1] = ((select auth.uid()))::text)
  with check (bucket_id = 'waste-listing-images'
              and (storage.foldername(name))[1] = ((select auth.uid()))::text);

create policy "Users delete images in own folder" on storage.objects
  as permissive for delete to authenticated
  using (bucket_id = 'waste-listing-images'
         and (storage.foldername(name))[1] = ((select auth.uid()))::text);

-- partner-verification-documents
create policy "Users upload verification documents to own folder" on storage.objects
  as permissive for insert to authenticated
  with check (bucket_id = 'partner-verification-documents'
              and (storage.foldername(name))[1] = ((select auth.uid()))::text);

create policy "Users view verification documents in own folder" on storage.objects
  as permissive for select to authenticated
  using (bucket_id = 'partner-verification-documents'
         and (storage.foldername(name))[1] = ((select auth.uid()))::text);

create policy "Users update verification documents in own folder" on storage.objects
  as permissive for update to authenticated
  using (bucket_id = 'partner-verification-documents'
         and (storage.foldername(name))[1] = ((select auth.uid()))::text)
  with check (bucket_id = 'partner-verification-documents'
              and (storage.foldername(name))[1] = ((select auth.uid()))::text);

create policy "Users delete verification documents in own folder" on storage.objects
  as permissive for delete to authenticated
  using (bucket_id = 'partner-verification-documents'
         and (storage.foldername(name))[1] = ((select auth.uid()))::text);

create policy "Admins view partner verification documents" on storage.objects
  as permissive for select to authenticated
  using (bucket_id = 'partner-verification-documents' and public.is_admin());
