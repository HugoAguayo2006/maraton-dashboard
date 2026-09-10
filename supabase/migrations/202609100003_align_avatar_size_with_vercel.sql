begin;

update storage.buckets
set file_size_limit = 4194304
where id = 'profile-images';

commit;
