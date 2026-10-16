-- Ivory Event Management: foundation schema. Draft — review before running on a live project.
create extension if not exists pgcrypto;

create type org_role as enum ('owner','admin','project_manager','team_member');
create type member_status as enum ('invited','active','suspended');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);
create table organization_members (
  organization_id uuid not null references organizations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role org_role not null,
  status member_status not null default 'active',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create table events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  name text not null,
  event_type text not null default 'general',
  status text not null default 'draft',
  venue text,
  time_zone text not null default 'UTC',
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  archived_at timestamptz,
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);
create table event_members (
  event_id uuid not null references events on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  primary key (event_id, user_id)
);
create table modules (
  slug text primary key,
  name text not null,
  release_state text not null default 'unreleased' check (release_state in ('unreleased','released','retired')),
  created_at timestamptz not null default now()
);
create table organization_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  module_slug text not null references modules,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  purchase_ref text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  unique (organization_id, module_slug)
);
create table payment_events (
  stripe_event_id text primary key,
  type text not null,
  payload jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create table audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references organizations on delete cascade,
  actor_id uuid,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Helper checks. They read the signed-in user from the session, never from browser input.
create function is_org_member(org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members where organization_id = org and user_id = auth.uid() and status = 'active');
$$;
create function is_org_admin(org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members where organization_id = org and user_id = auth.uid() and status = 'active' and role in ('owner','admin'));
$$;
create function is_org_manager(org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members where organization_id = org and user_id = auth.uid() and status = 'active' and role in ('owner','admin','project_manager'));
$$;
create function can_see_event(ev uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e where e.id = ev and (
      is_org_admin(e.organization_id)
      or (is_org_member(e.organization_id) and exists (select 1 from event_members m where m.event_id = e.id and m.user_id = auth.uid()))
    )
  );
$$;
create function has_module(org uuid, module text) returns boolean language sql stable security definer set search_path = public as $$
  select is_org_member(org) and exists (
    select 1 from organization_entitlements x join modules m on m.slug = x.module_slug
    where x.organization_id = org and x.module_slug = module and x.status = 'active'
      and x.starts_at <= now() and (x.ends_at is null or x.ends_at > now()) and m.release_state = 'released'
  );
$$;
create function create_organization(org_name text) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into organizations (name, created_by) values (org_name, auth.uid()) returning id into new_id;
  insert into organization_members (organization_id, user_id, role) values (new_id, auth.uid(), 'owner');
  insert into audit_logs (organization_id, actor_id, action) values (new_id, auth.uid(), 'organization.created');
  return new_id;
end $$;

-- Row-level security: everything locked unless a policy opens it.
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table events enable row level security;
alter table event_members enable row level security;
alter table modules enable row level security;
alter table organization_entitlements enable row level security;
alter table payment_events enable row level security;
alter table audit_logs enable row level security;

create policy profiles_own_read on profiles for select using (id = auth.uid());
create policy profiles_own_write on profiles for update using (id = auth.uid());

create policy org_read on organizations for select using (is_org_member(id));
create policy org_update on organizations for update using (is_org_admin(id));

create policy members_read on organization_members for select using (is_org_member(organization_id));
create policy members_insert on organization_members for insert with check (is_org_admin(organization_id) and role <> 'owner');
create policy members_update on organization_members for update using (is_org_admin(organization_id) and role <> 'owner') with check (role <> 'owner');
create policy members_delete on organization_members for delete using (is_org_admin(organization_id) and role <> 'owner');

create policy events_read on events for select using (can_see_event(id));
create policy events_insert on events for insert with check (is_org_manager(organization_id));
create policy events_update on events for update using (is_org_admin(organization_id) or (is_org_manager(organization_id) and can_see_event(id)));

create policy event_members_read on event_members for select using (can_see_event(event_id));
create policy event_members_write on event_members for all
  using (exists (select 1 from events e where e.id = event_id and (is_org_admin(e.organization_id) or (is_org_manager(e.organization_id) and can_see_event(e.id)))))
  with check (exists (select 1 from events e where e.id = event_id and (is_org_admin(e.organization_id) or (is_org_manager(e.organization_id) and can_see_event(e.id)))
    and exists (select 1 from organization_members om where om.organization_id = e.organization_id and om.user_id = event_members.user_id and om.status = 'active')));

create policy modules_read on modules for select to authenticated using (true);
create policy entitlements_read on organization_entitlements for select using (is_org_member(organization_id));
create policy audit_read on audit_logs for select using (organization_id is not null and is_org_admin(organization_id));
-- No write policies on modules, entitlements, payment_events, audit_logs: only the server (service key) writes them.

insert into modules (slug, name, release_state) values ('event-operations', 'Event Operations', 'unreleased');
