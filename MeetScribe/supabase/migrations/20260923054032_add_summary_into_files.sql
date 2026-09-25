-- Stores the AI-generated summary alongside the transcript
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'files' and column_name = 'summary'
  ) then
    alter table files add column summary jsonb;
  elsif (
    select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'files' and column_name = 'summary'
  ) != 'jsonb' then
    alter table files alter column summary type jsonb using summary::jsonb;
  end if;
end $$;
