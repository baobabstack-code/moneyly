ALTER TABLE profiles
ADD COLUMN phone_number text,
ADD COLUMN reminder_sms_enabled boolean DEFAULT false;
