-- WorkMate base schema for Supabase/Postgres
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

do $$ begin
  create type user_status as enum ('active', 'invited', 'suspended', 'deleted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type project_status as enum ('planning', 'active', 'completed', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type project_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_status as enum ('todo', 'in_progress', 'in_review', 'done');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type project_member_role as enum ('viewer', 'member', 'manager', 'owner');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type attachment_entity_type as enum ('task', 'comment', 'project', 'organisation', 'user');
exception when duplicate_object then null;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  name text,
  password_hash text,
  profile_image_url text,
  status user_status not null default 'active',
  is_admin boolean not null default false
);

create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  org_name text not null,
  email text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  country text,
  state text,
  city text,
  postal_code text,
  about text
);

create table if not exists org_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  org_id uuid not null references organisations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  department text,
  joined_at timestamptz not null default now(),
  is_admin boolean not null default false,
  unique(org_id, user_id)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  org_id uuid references organisations(id) on delete cascade,
  name text not null,
  description text,
  status project_status not null default 'planning',
  priority project_priority not null default 'medium',
  start_date date,
  end_date date,
  created_by uuid references users(id) on delete set null
);

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role project_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  due_date timestamptz,
  project_id uuid references projects(id) on delete cascade,
  assignee_id uuid references users(id) on delete set null,
  assigner_id uuid references users(id) on delete set null,
  completed_at timestamptz
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  task_id uuid references tasks(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  parent_comment_id uuid references comments(id) on delete cascade,
  content text not null
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entity_type attachment_entity_type not null,
  entity_id uuid not null,
  file_name text,
  file_url text,
  file_size bigint
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid references organisations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  recipient_id uuid references users(id) on delete cascade,
  title text not null,
  content text,
  is_read boolean not null default false
);

-- Backfill new columns for already-existing tables in older DBs.
alter table notifications
  add column if not exists recipient_id uuid references users(id) on delete cascade;

-- Research-friendly storage for comparing multiple AI methods.
create table if not exists ai_benchmark_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  model_name text not null,
  method_name text not null,
  dataset_name text not null,
  total_cases integer not null default 0,
  correct_cases integer not null default 0,
  exact_match_accuracy numeric(5,2) not null default 0,
  field_accuracy numeric(5,2) not null default 0,
  avg_latency_ms numeric(10,2),
  p95_latency_ms numeric(10,2),
  notes text
);

create index if not exists idx_org_members_org_id on org_members(org_id);
create index if not exists idx_org_members_user_id on org_members(user_id);
create index if not exists idx_projects_org_id on projects(org_id);
create index if not exists idx_project_members_project_id on project_members(project_id);
create index if not exists idx_project_members_user_id on project_members(user_id);
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_assignee_id on tasks(assignee_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_project_status_priority on tasks(project_id, status, priority);
create index if not exists idx_comments_task_id on comments(task_id);
create index if not exists idx_notifications_org_id on notifications(org_id);
create index if not exists idx_notifications_project_id on notifications(project_id);
create index if not exists idx_notifications_task_id on notifications(task_id);
create index if not exists idx_notifications_recipient_id on notifications(recipient_id);
create index if not exists idx_users_email_lower on users(lower(email));
create index if not exists idx_projects_org_name on projects(org_id, name);
create index if not exists idx_ai_benchmark_runs_method_created on ai_benchmark_runs(method_name, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_projects_date_order'
  ) then
    alter table projects
      add constraint chk_projects_date_order
      check (end_date is null or start_date is null or end_date >= start_date);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_tasks_completed_when_done'
  ) then
    alter table tasks
      add constraint chk_tasks_completed_when_done
      check (status <> 'done' or completed_at is not null);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_ai_benchmark_counts'
  ) then
    alter table ai_benchmark_runs
      add constraint chk_ai_benchmark_counts
      check (total_cases >= 0 and correct_cases >= 0 and correct_cases <= total_cases);
  end if;
end $$;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_organisations_updated_at on organisations;
create trigger trg_organisations_updated_at before update on organisations
for each row execute function set_updated_at();

drop trigger if exists trg_org_members_updated_at on org_members;
create trigger trg_org_members_updated_at before update on org_members
for each row execute function set_updated_at();

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at before update on projects
for each row execute function set_updated_at();

drop trigger if exists trg_project_members_updated_at on project_members;
create trigger trg_project_members_updated_at before update on project_members
for each row execute function set_updated_at();

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at before update on tasks
for each row execute function set_updated_at();

drop trigger if exists trg_comments_updated_at on comments;
create trigger trg_comments_updated_at before update on comments
for each row execute function set_updated_at();
