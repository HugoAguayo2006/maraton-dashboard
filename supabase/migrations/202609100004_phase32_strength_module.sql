begin;

alter table public.athlete_profiles
  add column strength_unit text not null default 'kg',
  add constraint athlete_profiles_strength_unit_allowed
    check (strength_unit in ('kg', 'lbs'));

create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_es text not null,
  category text not null,
  muscle_group text not null,
  equipment text not null,
  image_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_library_name_not_empty check (char_length(trim(name)) > 0),
  constraint exercise_library_name_es_not_empty check (char_length(trim(name_es)) > 0),
  constraint exercise_library_category_allowed check (
    category in ('upper_body', 'lower_body', 'other')
  ),
  constraint exercise_library_muscle_group_allowed check (
    muscle_group in (
      'Pecho', 'Espalda', 'Bíceps', 'Tríceps', 'Hombros', 'Trapecio',
      'Antebrazo', 'Abdominales', 'Cuádriceps', 'Isquiotibiales',
      'Glúteos', 'Pantorrillas', 'Aductores', 'Abductores', 'Cardio',
      'Full Body', 'Movilidad'
    )
  ),
  constraint exercise_library_equipment_allowed check (
    equipment in (
      'Ninguno', 'Barra', 'Mancuerna', 'Máquina', 'Polea',
      'Kettlebell', 'Banda', 'Disco'
    )
  )
);

create table public.strength_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strength_routines_owner_identity_unique unique (id, user_id),
  constraint strength_routines_name_not_empty check (char_length(trim(name)) > 0),
  constraint strength_routines_name_length check (char_length(name) <= 100),
  constraint strength_routines_description_length check (
    description is null or char_length(description) <= 500
  )
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.strength_routines(id) on delete cascade,
  exercise_id uuid not null references public.exercise_library(id) on delete restrict,
  order_number integer not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint routine_exercises_order_positive check (order_number > 0),
  constraint routine_exercises_notes_length check (
    notes is null or char_length(notes) <= 500
  ),
  constraint routine_exercises_routine_order_unique unique (routine_id, order_number),
  constraint routine_exercises_routine_exercise_unique unique (routine_id, exercise_id)
);

create table public.strength_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid,
  training_plan_item_id uuid,
  date date not null,
  duration_minutes integer,
  unit text not null default 'kg',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strength_sessions_routine_owner_fk
    foreign key (routine_id, user_id)
    references public.strength_routines(id, user_id)
    on delete set null (routine_id),
  constraint strength_sessions_plan_owner_fk
    foreign key (training_plan_item_id, user_id)
    references public.training_plan_items(id, user_id)
    on delete set null (training_plan_item_id),
  constraint strength_sessions_duration_positive check (
    duration_minutes is null or duration_minutes > 0
  ),
  constraint strength_sessions_unit_allowed check (unit in ('kg', 'lbs')),
  constraint strength_sessions_notes_length check (
    notes is null or char_length(notes) <= 2000
  )
);

create table public.strength_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.strength_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercise_library(id) on delete restrict,
  order_number integer not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint strength_session_exercises_order_positive check (order_number > 0),
  constraint strength_session_exercises_notes_length check (
    notes is null or char_length(notes) <= 500
  ),
  constraint strength_session_exercises_session_order_unique
    unique (session_id, order_number),
  constraint strength_session_exercises_session_exercise_unique
    unique (session_id, exercise_id)
);

create table public.strength_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.strength_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercise_library(id) on delete restrict,
  set_number integer not null,
  weight_kg numeric(8, 2),
  weight_lbs numeric(8, 2),
  repetitions integer not null,
  rir integer,
  notes text,
  created_at timestamptz not null default now(),
  constraint strength_sets_session_exercise_fk
    foreign key (session_id, exercise_id)
    references public.strength_session_exercises(session_id, exercise_id)
    on delete cascade,
  constraint strength_sets_set_number_positive check (set_number > 0),
  constraint strength_sets_weight_kg_positive check (weight_kg is null or weight_kg > 0),
  constraint strength_sets_weight_lbs_positive check (weight_lbs is null or weight_lbs > 0),
  constraint strength_sets_single_weight_unit check (
    not (weight_kg is not null and weight_lbs is not null)
  ),
  constraint strength_sets_repetitions_positive check (repetitions > 0),
  constraint strength_sets_rir_range check (rir is null or rir between 0 and 10),
  constraint strength_sets_notes_length check (notes is null or char_length(notes) <= 500),
  constraint strength_sets_session_exercise_number_unique
    unique (session_id, exercise_id, set_number)
);

create index exercise_library_filters_idx
  on public.exercise_library (category, muscle_group, equipment);
create index exercise_library_name_es_idx
  on public.exercise_library (name_es);
create index strength_routines_user_created_idx
  on public.strength_routines (user_id, created_at desc);
create index routine_exercises_routine_order_idx
  on public.routine_exercises (routine_id, order_number);
create index strength_sessions_user_date_idx
  on public.strength_sessions (user_id, date desc, created_at desc);
create index strength_sessions_routine_idx
  on public.strength_sessions (routine_id)
  where routine_id is not null;
create unique index strength_sessions_plan_item_unique_idx
  on public.strength_sessions (user_id, training_plan_item_id)
  where training_plan_item_id is not null;
create index strength_session_exercises_session_order_idx
  on public.strength_session_exercises (session_id, order_number);
create index strength_sets_session_exercise_idx
  on public.strength_sets (session_id, exercise_id, set_number);
create index strength_sets_exercise_created_idx
  on public.strength_sets (exercise_id, created_at desc);

create trigger exercise_library_set_updated_at
before update on public.exercise_library
for each row execute function public.set_updated_at();

create trigger strength_routines_set_updated_at
before update on public.strength_routines
for each row execute function public.set_updated_at();

create trigger strength_sessions_set_updated_at
before update on public.strength_sessions
for each row execute function public.set_updated_at();

alter table public.exercise_library enable row level security;
alter table public.strength_routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.strength_sessions enable row level security;
alter table public.strength_session_exercises enable row level security;
alter table public.strength_sets enable row level security;

create policy "exercise_library_select_authenticated"
on public.exercise_library for select to authenticated
using (true);

create policy "strength_routines_select_own"
on public.strength_routines for select to authenticated
using ((select auth.uid()) = user_id);

create policy "strength_routines_insert_own"
on public.strength_routines for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "strength_routines_update_own"
on public.strength_routines for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "strength_routines_delete_own"
on public.strength_routines for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "routine_exercises_select_own"
on public.routine_exercises for select to authenticated
using (
  exists (
    select 1 from public.strength_routines
    where strength_routines.id = routine_exercises.routine_id
      and strength_routines.user_id = (select auth.uid())
  )
);

create policy "routine_exercises_insert_own"
on public.routine_exercises for insert to authenticated
with check (
  exists (
    select 1 from public.strength_routines
    where strength_routines.id = routine_exercises.routine_id
      and strength_routines.user_id = (select auth.uid())
  )
);

create policy "routine_exercises_update_own"
on public.routine_exercises for update to authenticated
using (
  exists (
    select 1 from public.strength_routines
    where strength_routines.id = routine_exercises.routine_id
      and strength_routines.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.strength_routines
    where strength_routines.id = routine_exercises.routine_id
      and strength_routines.user_id = (select auth.uid())
  )
);

create policy "routine_exercises_delete_own"
on public.routine_exercises for delete to authenticated
using (
  exists (
    select 1 from public.strength_routines
    where strength_routines.id = routine_exercises.routine_id
      and strength_routines.user_id = (select auth.uid())
  )
);

create policy "strength_sessions_select_own"
on public.strength_sessions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "strength_sessions_insert_own"
on public.strength_sessions for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "strength_sessions_update_own"
on public.strength_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "strength_sessions_delete_own"
on public.strength_sessions for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "strength_session_exercises_select_own"
on public.strength_session_exercises for select to authenticated
using (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_session_exercises.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
);

create policy "strength_session_exercises_insert_own"
on public.strength_session_exercises for insert to authenticated
with check (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_session_exercises.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
);

create policy "strength_session_exercises_update_own"
on public.strength_session_exercises for update to authenticated
using (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_session_exercises.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_session_exercises.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
);

create policy "strength_session_exercises_delete_own"
on public.strength_session_exercises for delete to authenticated
using (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_session_exercises.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
);

create policy "strength_sets_select_own"
on public.strength_sets for select to authenticated
using (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_sets.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
);

create policy "strength_sets_insert_own"
on public.strength_sets for insert to authenticated
with check (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_sets.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
);

create policy "strength_sets_update_own"
on public.strength_sets for update to authenticated
using (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_sets.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_sets.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
);

create policy "strength_sets_delete_own"
on public.strength_sets for delete to authenticated
using (
  exists (
    select 1 from public.strength_sessions
    where strength_sessions.id = strength_sets.session_id
      and strength_sessions.user_id = (select auth.uid())
  )
);

revoke all on public.exercise_library from anon;
revoke all on public.strength_routines from anon;
revoke all on public.routine_exercises from anon;
revoke all on public.strength_sessions from anon;
revoke all on public.strength_session_exercises from anon;
revoke all on public.strength_sets from anon;

grant select on public.exercise_library to authenticated;
grant select, insert, update, delete on public.strength_routines to authenticated;
grant select, insert, update, delete on public.routine_exercises to authenticated;
grant select, insert, update, delete on public.strength_sessions to authenticated;
grant select, insert, update, delete on public.strength_session_exercises to authenticated;
grant select, insert, update, delete on public.strength_sets to authenticated;

create or replace function public.seed_exercise_library()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  processed_count integer;
begin
  insert into public.exercise_library (
    id, name, name_es, category, muscle_group, equipment
  ) values
    ('10000000-0000-4000-8000-000000000001', 'Barbell Back Squat', 'Sentadilla con barra', 'lower_body', 'Cuádriceps', 'Barra'),
    ('10000000-0000-4000-8000-000000000002', 'Barbell Front Squat', 'Sentadilla frontal con barra', 'lower_body', 'Cuádriceps', 'Barra'),
    ('10000000-0000-4000-8000-000000000003', 'Goblet Squat', 'Sentadilla goblet', 'lower_body', 'Cuádriceps', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000004', 'Leg Press', 'Prensa de pierna', 'lower_body', 'Cuádriceps', 'Máquina'),
    ('10000000-0000-4000-8000-000000000005', 'Leg Extension', 'Extensión de pierna', 'lower_body', 'Cuádriceps', 'Máquina'),
    ('10000000-0000-4000-8000-000000000006', 'Walking Lunge', 'Zancada caminando', 'lower_body', 'Cuádriceps', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000007', 'Step Up', 'Step-up', 'lower_body', 'Cuádriceps', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000008', 'Bulgarian Split Squat', 'Sentadilla búlgara', 'lower_body', 'Cuádriceps', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000009', 'Romanian Deadlift', 'Peso muerto rumano', 'lower_body', 'Isquiotibiales', 'Barra'),
    ('10000000-0000-4000-8000-000000000010', 'Conventional Deadlift', 'Peso muerto convencional', 'other', 'Full Body', 'Barra'),
    ('10000000-0000-4000-8000-000000000011', 'Seated Leg Curl', 'Curl femoral sentado', 'lower_body', 'Isquiotibiales', 'Máquina'),
    ('10000000-0000-4000-8000-000000000012', 'Lying Leg Curl', 'Curl femoral acostado', 'lower_body', 'Isquiotibiales', 'Máquina'),
    ('10000000-0000-4000-8000-000000000013', 'Nordic Hamstring Curl', 'Curl nórdico', 'lower_body', 'Isquiotibiales', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000014', 'Barbell Good Morning', 'Buenos días con barra', 'lower_body', 'Isquiotibiales', 'Barra'),
    ('10000000-0000-4000-8000-000000000015', 'Barbell Hip Thrust', 'Hip thrust con barra', 'lower_body', 'Glúteos', 'Barra'),
    ('10000000-0000-4000-8000-000000000016', 'Glute Bridge', 'Puente de glúteo', 'lower_body', 'Glúteos', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000017', 'Cable Glute Kickback', 'Patada de glúteo en polea', 'lower_body', 'Glúteos', 'Polea'),
    ('10000000-0000-4000-8000-000000000018', 'Kettlebell Swing', 'Swing con kettlebell', 'other', 'Full Body', 'Kettlebell'),
    ('10000000-0000-4000-8000-000000000019', 'Standing Calf Raise', 'Elevación de pantorrilla de pie', 'lower_body', 'Pantorrillas', 'Máquina'),
    ('10000000-0000-4000-8000-000000000020', 'Seated Calf Raise', 'Elevación de pantorrilla sentado', 'lower_body', 'Pantorrillas', 'Máquina'),
    ('10000000-0000-4000-8000-000000000021', 'Single Leg Calf Raise', 'Elevación de pantorrilla a una pierna', 'lower_body', 'Pantorrillas', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000022', 'Adductor Machine', 'Aductores en máquina', 'lower_body', 'Aductores', 'Máquina'),
    ('10000000-0000-4000-8000-000000000023', 'Copenhagen Plank', 'Plancha Copenhagen', 'lower_body', 'Aductores', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000024', 'Abductor Machine', 'Abductores en máquina', 'lower_body', 'Abductores', 'Máquina'),
    ('10000000-0000-4000-8000-000000000025', 'Banded Lateral Walk', 'Caminata lateral con banda', 'lower_body', 'Abductores', 'Banda'),
    ('10000000-0000-4000-8000-000000000026', 'Barbell Bench Press', 'Press de banca con barra', 'upper_body', 'Pecho', 'Barra'),
    ('10000000-0000-4000-8000-000000000027', 'Dumbbell Bench Press', 'Press de banca con mancuerna', 'upper_body', 'Pecho', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000028', 'Incline Barbell Bench Press', 'Press inclinado con barra', 'upper_body', 'Pecho', 'Barra'),
    ('10000000-0000-4000-8000-000000000029', 'Incline Dumbbell Bench Press', 'Press inclinado con mancuerna', 'upper_body', 'Pecho', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000030', 'Machine Chest Press', 'Press de pecho en máquina', 'upper_body', 'Pecho', 'Máquina'),
    ('10000000-0000-4000-8000-000000000031', 'Cable Fly', 'Aperturas en polea', 'upper_body', 'Pecho', 'Polea'),
    ('10000000-0000-4000-8000-000000000032', 'Dumbbell Fly', 'Aperturas con mancuerna', 'upper_body', 'Pecho', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000033', 'Push Up', 'Flexiones', 'upper_body', 'Pecho', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000034', 'Lat Pulldown', 'Jalón al pecho', 'upper_body', 'Espalda', 'Polea'),
    ('10000000-0000-4000-8000-000000000035', 'Seated Cable Row', 'Remo sentado en polea', 'upper_body', 'Espalda', 'Polea'),
    ('10000000-0000-4000-8000-000000000036', 'One Arm Dumbbell Row', 'Remo con mancuerna a una mano', 'upper_body', 'Espalda', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000037', 'Pull Up', 'Dominadas', 'upper_body', 'Espalda', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000038', 'Chin Up', 'Dominadas supinas', 'upper_body', 'Espalda', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000039', 'Barbell Row', 'Remo con barra', 'upper_body', 'Espalda', 'Barra'),
    ('10000000-0000-4000-8000-000000000040', 'Chest Supported Dumbbell Row', 'Remo con pecho apoyado', 'upper_body', 'Espalda', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000041', 'Straight Arm Pulldown', 'Jalón con brazos rectos', 'upper_body', 'Espalda', 'Polea'),
    ('10000000-0000-4000-8000-000000000042', 'Machine Row', 'Remo en máquina', 'upper_body', 'Espalda', 'Máquina'),
    ('10000000-0000-4000-8000-000000000043', 'Barbell Overhead Press', 'Press militar con barra', 'upper_body', 'Hombros', 'Barra'),
    ('10000000-0000-4000-8000-000000000044', 'Seated Dumbbell Shoulder Press', 'Press de hombro con mancuerna', 'upper_body', 'Hombros', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000045', 'Dumbbell Lateral Raise', 'Elevaciones laterales', 'upper_body', 'Hombros', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000046', 'Dumbbell Front Raise', 'Elevaciones frontales', 'upper_body', 'Hombros', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000047', 'Face Pull', 'Face pull', 'upper_body', 'Hombros', 'Polea'),
    ('10000000-0000-4000-8000-000000000048', 'Reverse Dumbbell Fly', 'Aperturas inversas', 'upper_body', 'Hombros', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000049', 'Machine Shoulder Press', 'Press de hombro en máquina', 'upper_body', 'Hombros', 'Máquina'),
    ('10000000-0000-4000-8000-000000000050', 'Barbell Shrug', 'Encogimiento con barra', 'upper_body', 'Trapecio', 'Barra'),
    ('10000000-0000-4000-8000-000000000051', 'Dumbbell Shrug', 'Encogimiento con mancuerna', 'upper_body', 'Trapecio', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000052', 'Farmer Carry', 'Caminata del granjero', 'other', 'Full Body', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000053', 'EZ Bar Curl', 'Curl con barra EZ', 'upper_body', 'Bíceps', 'Barra'),
    ('10000000-0000-4000-8000-000000000054', 'Dumbbell Curl', 'Curl con mancuerna', 'upper_body', 'Bíceps', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000055', 'Hammer Curl', 'Curl martillo', 'upper_body', 'Bíceps', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000056', 'Cable Curl', 'Curl en polea', 'upper_body', 'Bíceps', 'Polea'),
    ('10000000-0000-4000-8000-000000000057', 'Preacher Curl', 'Curl predicador', 'upper_body', 'Bíceps', 'Máquina'),
    ('10000000-0000-4000-8000-000000000058', 'Triceps Pushdown', 'Extensión de tríceps en polea', 'upper_body', 'Tríceps', 'Polea'),
    ('10000000-0000-4000-8000-000000000059', 'Overhead Cable Triceps Extension', 'Extensión de tríceps sobre cabeza', 'upper_body', 'Tríceps', 'Polea'),
    ('10000000-0000-4000-8000-000000000060', 'EZ Bar Skull Crusher', 'Press francés con barra EZ', 'upper_body', 'Tríceps', 'Barra'),
    ('10000000-0000-4000-8000-000000000061', 'Parallel Bar Dip', 'Fondos en paralelas', 'upper_body', 'Tríceps', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000062', 'Close Grip Bench Press', 'Press de banca agarre cerrado', 'upper_body', 'Tríceps', 'Barra'),
    ('10000000-0000-4000-8000-000000000063', 'Wrist Curl', 'Curl de muñeca', 'upper_body', 'Antebrazo', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000064', 'Reverse Wrist Curl', 'Curl inverso de muñeca', 'upper_body', 'Antebrazo', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000065', 'Plank', 'Plancha', 'upper_body', 'Abdominales', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000066', 'Side Plank', 'Plancha lateral', 'upper_body', 'Abdominales', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000067', 'Dead Bug', 'Dead bug', 'upper_body', 'Abdominales', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000068', 'Bird Dog', 'Bird dog', 'upper_body', 'Abdominales', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000069', 'Cable Crunch', 'Crunch en polea', 'upper_body', 'Abdominales', 'Polea'),
    ('10000000-0000-4000-8000-000000000070', 'Pallof Press', 'Press Pallof', 'upper_body', 'Abdominales', 'Polea'),
    ('10000000-0000-4000-8000-000000000071', 'Hanging Knee Raise', 'Elevación de rodillas colgado', 'upper_body', 'Abdominales', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000072', 'Treadmill Run', 'Caminadora', 'other', 'Cardio', 'Máquina'),
    ('10000000-0000-4000-8000-000000000073', 'Stationary Bike', 'Bicicleta estacionaria', 'other', 'Cardio', 'Máquina'),
    ('10000000-0000-4000-8000-000000000074', 'Row Ergometer', 'Remo ergómetro', 'other', 'Cardio', 'Máquina'),
    ('10000000-0000-4000-8000-000000000075', 'Jump Rope', 'Saltar la cuerda', 'other', 'Cardio', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000076', 'Burpee', 'Burpee', 'other', 'Full Body', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000077', 'Dumbbell Clean and Press', 'Clean y press con mancuerna', 'other', 'Full Body', 'Mancuerna'),
    ('10000000-0000-4000-8000-000000000078', 'Turkish Get Up', 'Levantamiento turco', 'other', 'Full Body', 'Kettlebell'),
    ('10000000-0000-4000-8000-000000000079', 'Bear Crawl', 'Caminata de oso', 'other', 'Full Body', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000080', 'Hip Mobility Flow', 'Movilidad de cadera', 'other', 'Movilidad', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000081', 'Ankle Mobility Drill', 'Movilidad de tobillo', 'other', 'Movilidad', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000082', 'Thoracic Rotation', 'Rotación torácica', 'other', 'Movilidad', 'Ninguno'),
    ('10000000-0000-4000-8000-000000000083', 'Band Shoulder Mobility', 'Movilidad de hombro con banda', 'other', 'Movilidad', 'Banda')
  on conflict (name) do update set
    name_es = excluded.name_es,
    category = excluded.category,
    muscle_group = excluded.muscle_group,
    equipment = excluded.equipment,
    updated_at = now();

  get diagnostics processed_count = row_count;
  return processed_count;
end;
$$;

revoke all on function public.seed_exercise_library() from public;
revoke all on function public.seed_exercise_library() from anon;
grant execute on function public.seed_exercise_library() to authenticated;

select public.seed_exercise_library();

commit;
