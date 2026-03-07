-- ============================================================
-- Imported Conversations Schema
-- Stores conversations imported from external AI providers
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Provider enum for type safety
create type imported_provider as enum (
  'chatgpt',
  'claude',
  'gemini',
  'perplexity',
  'grok'
);

-- ============================================================
-- imported_conversations
-- One row per imported conversation from an external provider
-- ============================================================
create table imported_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Provider metadata
  provider imported_provider not null,
  provider_name text not null,
  external_id text,  -- original ID from the provider export

  -- Conversation content
  title text not null default 'Untitled Conversation',

  -- State flags
  is_starred boolean not null default false,
  is_archived boolean not null default false,

  -- Timestamps
  original_created_at timestamptz not null default now(),
  original_updated_at timestamptz not null default now(),
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Prevent duplicate imports of the same conversation
  unique (user_id, provider, external_id)
);

-- ============================================================
-- imported_messages
-- Individual messages within an imported conversation
-- ============================================================
create table imported_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references imported_conversations(id) on delete cascade,

  -- Message content
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,

  -- Ordering
  sort_order integer not null default 0,

  -- Original timestamp from the provider
  original_created_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- ============================================================
-- imported_provider_settings
-- Per-provider context settings for each user
-- Controls whether a provider's imported chats are included
-- as context when the user prompts Araviel
-- ============================================================
create table imported_provider_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider imported_provider not null,

  -- Whether to include this provider's chats as context
  use_for_context boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, provider)
);

-- ============================================================
-- Indexes for query performance
-- ============================================================

-- Fast lookup: all imported conversations for a user
create index idx_imported_conversations_user
  on imported_conversations(user_id);

-- Fast lookup: filter by provider for a user
create index idx_imported_conversations_user_provider
  on imported_conversations(user_id, provider);

-- Fast lookup: non-archived conversations (most common view)
create index idx_imported_conversations_active
  on imported_conversations(user_id, is_archived, original_updated_at desc);

-- Fast lookup: starred conversations
create index idx_imported_conversations_starred
  on imported_conversations(user_id, is_starred)
  where is_starred = true;

-- Fast lookup: messages by conversation (ordered)
create index idx_imported_messages_conversation
  on imported_messages(conversation_id, sort_order);

-- Fast lookup: provider settings per user
create index idx_imported_provider_settings_user
  on imported_provider_settings(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- Users can only access their own imported data
-- ============================================================

alter table imported_conversations enable row level security;
alter table imported_messages enable row level security;
alter table imported_provider_settings enable row level security;

-- Conversations: users can CRUD their own rows
create policy "Users can view own imported conversations"
  on imported_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own imported conversations"
  on imported_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own imported conversations"
  on imported_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own imported conversations"
  on imported_conversations for delete
  using (auth.uid() = user_id);

-- Messages: access via conversation ownership
create policy "Users can view own imported messages"
  on imported_messages for select
  using (
    exists (
      select 1 from imported_conversations
      where imported_conversations.id = imported_messages.conversation_id
        and imported_conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert own imported messages"
  on imported_messages for insert
  with check (
    exists (
      select 1 from imported_conversations
      where imported_conversations.id = imported_messages.conversation_id
        and imported_conversations.user_id = auth.uid()
    )
  );

create policy "Users can delete own imported messages"
  on imported_messages for delete
  using (
    exists (
      select 1 from imported_conversations
      where imported_conversations.id = imported_messages.conversation_id
        and imported_conversations.user_id = auth.uid()
    )
  );

-- Provider settings: users can CRUD their own rows
create policy "Users can view own provider settings"
  on imported_provider_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own provider settings"
  on imported_provider_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own provider settings"
  on imported_provider_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own provider settings"
  on imported_provider_settings for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_imported_conversations_updated_at
  before update on imported_conversations
  for each row execute function update_updated_at_column();

create trigger set_imported_provider_settings_updated_at
  before update on imported_provider_settings
  for each row execute function update_updated_at_column();
