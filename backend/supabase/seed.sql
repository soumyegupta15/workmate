-- WorkMate seed data for local demo/testing
-- Run after schema.sql

insert into users (id, email, name, password_hash, status, is_admin)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@workmate.ai', 'Admin User', '$2a$10$demo', 'active', true),
  ('22222222-2222-2222-2222-222222222222', 'tanmay@workmate.ai', 'Tanmay', '$2a$10$demo', 'active', false),
  ('33333333-3333-3333-3333-333333333333', 'rohan@workmate.ai', 'Rohan', '$2a$10$demo', 'active', false),
  ('44444444-4444-4444-4444-444444444444', 'amit@workmate.ai', 'Amit', '$2a$10$demo', 'active', false)
on conflict (id) do nothing;

insert into organisations (id, org_name, email, phone, city, country, about)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'WorkMate Labs', 'hello@workmate.ai', '+91-9999999999', 'Pune', 'India', 'AI-first project management organisation')
on conflict (id) do nothing;

insert into org_members (org_id, user_id, department, is_admin)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Management', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Engineering', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Design', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'Engineering', false)
on conflict (org_id, user_id) do nothing;

insert into projects (id, org_id, name, description, status, priority, created_by, start_date)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Workmate Core', 'Main product backlog and delivery', 'active', 'high', '11111111-1111-1111-1111-111111111111', current_date),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AI Benchmark', 'Research experiments for intent parsing', 'planning', 'medium', '11111111-1111-1111-1111-111111111111', current_date)
on conflict (id) do nothing;

insert into project_members (project_id, user_id, role)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'manager'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'member'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'member')
on conflict (project_id, user_id) do nothing;

insert into tasks (id, title, description, status, priority, project_id, assignee_id, assigner_id, due_date)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Fix login bug', 'Resolve token refresh issue in auth middleware', 'in_progress', 'high', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', now() + interval '2 days'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Header alignment bug', 'Adjust responsive alignment for dashboard header', 'todo', 'medium', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() + interval '5 days')
on conflict (id) do nothing;

insert into comments (task_id, author_id, content)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Please prioritize this before tomorrow demo.'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Working on responsive fixes now.')
on conflict do nothing;

insert into notifications (org_id, project_id, task_id, sender_id, title, content, is_read)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Task Assigned', 'Fix login bug has been assigned to Tanmay', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Task Created', 'Header alignment bug task created', false)
on conflict do nothing;
