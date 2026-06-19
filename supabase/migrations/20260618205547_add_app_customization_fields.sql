ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accent_color text DEFAULT 'green';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tts_voice text;
