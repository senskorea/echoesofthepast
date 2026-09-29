-- Keep anonymous service records and public-by-link generated media for no
-- more than 30 days, as stated in the public Privacy notice. The media path
-- is always <anonymous-owner-id>/<generation-job-id>.<extension>.
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'eop-purge-expired-generated-media',
  '15 3 * * *',
  $cleanup$
    with expired_jobs as (
      select id from public.generation_jobs
      where created_at < now() - interval '30 days'
    ), removed_media as (
      delete from storage.objects as object
      using expired_jobs as job
      where object.bucket_id = 'postcards'
        and object.name like '%/' || job.id::text || '.%'
    )
    delete from public.generation_jobs
    where created_at < now() - interval '30 days';
  $cleanup$
);
