create type file_type as enum ('video', 'audio', 'transcript');
create type file_status as enum ('ready', 'processing');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz default now()
);

create table files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type file_type not null,
  status file_status not null default 'processing',
  duration text,
  media_url text,
  transcript text,
  notes text,
  created_at timestamptz default now()
);


create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table files enable row level security;
alter table profiles enable row level security;

create policy "Users manage their own files"
  on files for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);