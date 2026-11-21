-- =====================================================================
-- Waste2Wealth - migration #2: request workflow fixes
--
-- 1. updated_at is refreshed automatically on UPDATE.
-- 2. "Create collection requests" policy tightened: only a verified,
--    accepting partner can request an active listing they do not own.
-- 3. The initial 'pending' status of every new request is written to
--    request_status_history (FR-08: history must match current status).
-- 4. transition_request(): the ONLY way to change a request's status.
--    Checks who the caller is, allows only the transitions below, updates
--    the request and writes history in one transaction.
--
-- Proposed transition rules (SRS 8.3 says these must be finalized -
-- adjust here if the team agrees on different rules):
--
--   from        to          who may do it
--   ---------   ---------   ------------------------------------------
--   pending     accepted    listing owner (generator)   -> listing reserved
--   pending     rejected    listing owner
--   pending     cancelled   partner who made the request
--   accepted    scheduled   either participant (needs a collection date)
--   accepted    cancelled   either participant           -> listing active again
--   scheduled   collected   either participant
--   scheduled   cancelled   either participant           -> listing active again
--   collected   completed   listing owner (confirms)     -> listing completed
--
--   Admins may perform any of the transitions above.
--   rejected / cancelled / completed are final.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.waste_listings
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.partners
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.collection_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. Tighter request creation
--    Before: a listing owner could create a request on their own listing
--    for any partner_id. Now: requester must be the verified partner.
-- ---------------------------------------------------------------------
drop policy "Create collection requests" on public.collection_requests;

create policy "Create collection requests" on public.collection_requests
  as permissive for insert to authenticated
  with check (
    request_status = 'pending'::public.request_status
    and requester_id = (select auth.uid())
    and exists (
      select 1 from public.partners p
      where p.partner_id = collection_requests.partner_id
        and p.profile_id = (select auth.uid())
        and p.verification_status = 'verified'::public.verification_status
        and p.is_accepting_materials
    )
    and exists (
      select 1 from public.waste_listings w
      where w.listing_id = collection_requests.listing_id
        and w.status = 'active'::public.listing_status
        and w.owner_id <> (select auth.uid())
        and collection_requests.requested_quantity <= w.quantity
    )
  );

-- ---------------------------------------------------------------------
-- 3. Record the initial status of every new request
-- ---------------------------------------------------------------------
create or replace function public.log_request_created()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.request_status_history (request_id, previous_status, new_status, changed_by, remarks)
  values (new.request_id, null, new.request_status, new.requester_id, 'Request created');
  return new;
end;
$function$;

create trigger log_request_created after insert on public.collection_requests
  for each row execute function public.log_request_created();

-- ---------------------------------------------------------------------
-- 4. transition_request()
--    Error codes (for the backend to map to HTTP):
--      28000 -> 401 not authenticated
--      P0002 -> 404 request not found
--      42501 -> 403 caller is not a participant / not allowed this transition
--      22023 -> 409 transition not valid from the current status
-- ---------------------------------------------------------------------
create or replace function public.transition_request(
  p_request_id uuid,
  p_new_status public.request_status,
  p_remarks text default null,
  p_collection_date timestamp with time zone default null
)
returns public.collection_requests
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_req public.collection_requests;
  v_listing public.waste_listings;
  v_partner_profile uuid;
  v_is_owner boolean;
  v_is_partner boolean;
  v_is_admin boolean;
  v_valid boolean;
  v_permitted boolean;
  v_old public.request_status;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Lock the request so two status changes cannot race.
  select * into v_req
  from public.collection_requests
  where request_id = p_request_id
  for update;

  if not found then
    raise exception 'Request % not found', p_request_id using errcode = 'P0002';
  end if;

  select * into v_listing
  from public.waste_listings
  where listing_id = v_req.listing_id
  for update;

  select p.profile_id into v_partner_profile
  from public.partners p
  where p.partner_id = v_req.partner_id;

  v_is_owner   := coalesce(v_listing.owner_id = v_uid, false);
  v_is_partner := coalesce(v_partner_profile = v_uid, false);
  v_is_admin   := public.is_admin();

  if not (v_is_owner or v_is_partner or v_is_admin) then
    -- Do not reveal that the request exists to outsiders.
    raise exception 'Request % not found', p_request_id using errcode = 'P0002';
  end if;

  v_old := v_req.request_status;

  -- Is the transition valid at all, and is this caller permitted to make it?
  v_valid := (v_old, p_new_status) in (
    ('pending'::public.request_status,   'accepted'::public.request_status),
    ('pending'::public.request_status,   'rejected'::public.request_status),
    ('pending'::public.request_status,   'cancelled'::public.request_status),
    ('accepted'::public.request_status,  'scheduled'::public.request_status),
    ('accepted'::public.request_status,  'cancelled'::public.request_status),
    ('scheduled'::public.request_status, 'collected'::public.request_status),
    ('scheduled'::public.request_status, 'cancelled'::public.request_status),
    ('collected'::public.request_status, 'completed'::public.request_status)
  );

  if not v_valid then
    raise exception 'Cannot change request status from % to %', v_old, p_new_status
      using errcode = '22023';
  end if;

  v_permitted := v_is_admin or case
    when p_new_status in ('accepted', 'rejected', 'completed') then v_is_owner
    when v_old = 'pending' and p_new_status = 'cancelled' then v_is_partner
    else true  -- scheduled / collected / later cancellation: either participant
  end;

  if not v_permitted then
    raise exception 'You are not allowed to change this request from % to %', v_old, p_new_status
      using errcode = '42501';
  end if;

  -- Transition-specific checks and listing side effects.
  if p_new_status = 'accepted' then
    if v_listing.status <> 'active' then
      raise exception 'Listing is no longer available (status: %)', v_listing.status
        using errcode = '22023';
    end if;
    update public.waste_listings set status = 'reserved' where listing_id = v_listing.listing_id;

  elsif p_new_status = 'scheduled' then
    if coalesce(p_collection_date, v_req.proposed_collection_date) is null then
      raise exception 'A collection date is required to schedule a request'
        using errcode = '22023';
    end if;

  elsif p_new_status = 'completed' then
    update public.waste_listings set status = 'completed' where listing_id = v_listing.listing_id;

  elsif p_new_status = 'cancelled' and v_old in ('accepted', 'scheduled') then
    -- Release the listing unless another request is still in progress for it.
    if not exists (
      select 1 from public.collection_requests cr
      where cr.listing_id = v_req.listing_id
        and cr.request_id <> v_req.request_id
        and cr.request_status in ('accepted', 'scheduled', 'collected')
    ) then
      update public.waste_listings set status = 'active'
      where listing_id = v_listing.listing_id and status = 'reserved';
    end if;
  end if;

  update public.collection_requests
  set request_status = p_new_status,
      proposed_collection_date = coalesce(p_collection_date, proposed_collection_date)
  where request_id = p_request_id
  returning * into v_req;

  insert into public.request_status_history (request_id, previous_status, new_status, changed_by, remarks)
  values (p_request_id, v_old, p_new_status, v_uid, p_remarks);

  return v_req;
end;
$function$;

revoke all on function public.transition_request(uuid, public.request_status, text, timestamp with time zone) from public, anon;
grant execute on function public.transition_request(uuid, public.request_status, text, timestamp with time zone) to authenticated, service_role;

-- Trigger-only functions should not be callable directly over the API.
revoke all on function public.log_request_created() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
