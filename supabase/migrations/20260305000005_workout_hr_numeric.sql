-- Change average_heart_rate to numeric to accept float values from Oura API
alter table public.workout_sessions
  alter column average_heart_rate type numeric;
