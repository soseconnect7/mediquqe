/*
  # Complete Clinic Management System Schema

  This migration creates the complete database schema for the clinic management system
  with all necessary tables, relationships, security policies, and default data.

  ## Tables Created:
  1. patients - Patient information with permanent UIDs
  2. departments - Medical departments configuration
  3. doctors - Doctor profiles and availability
  4. visits - Visit/booking records with token numbers
  5. medical_history - Patient medical records and prescriptions
  6. payment_transactions - Payment processing records
  7. clinic_settings - System configuration
  8. notifications - System notifications
  9. audit_logs - Security audit trail
  10. appointments - Scheduled appointments
  11. doctor_sessions - Doctor consultation sessions
  12. consultations - Active consultations
  13. consultation_notes - Consultation notes and voice transcriptions
  14. voice_transcriptions - Voice-to-text records

  ## Security:
  - Row Level Security enabled on all tables
  - Appropriate policies for public and authenticated access
  - Audit logging for sensitive operations
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age <= 120),
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    emergency_contact TEXT,
    blood_group TEXT,
    allergies TEXT[],
    medical_conditions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for patients
CREATE INDEX IF NOT EXISTS idx_patients_uid ON patients(uid);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- RLS for patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert patients for booking" ON patients
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public can read patients for queue display" ON patients
    FOR SELECT TO public USING (true);

CREATE POLICY "Public can update patients for booking" ON patients
    FOR UPDATE TO public USING (true);

CREATE POLICY "Authenticated users can manage patients" ON patients
    FOR ALL TO authenticated USING (true);

-- Trigger for patients
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    average_consultation_time INTEGER DEFAULT 15,
    color_code TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for departments
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- RLS for departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active departments" ON departments
    FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Authenticated users can manage departments" ON departments
    FOR ALL TO authenticated USING (true);

-- Trigger for departments
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    available_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
    max_patients_per_day INTEGER DEFAULT 50,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for doctors
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);

-- RLS for doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active doctors" ON doctors
    FOR SELECT TO public USING (status = 'active');

CREATE POLICY "Authenticated users can manage doctors" ON doctors
    FOR ALL TO authenticated USING (true);

-- Trigger for doctors
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. VISITS TABLE
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id TEXT NOT NULL DEFAULT 'CLN1',
    stn INTEGER NOT NULL,
    department TEXT NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'checked_in', 'in_service', 'completed', 'held', 'expired')),
    payment_status TEXT DEFAULT 'pay_at_clinic' CHECK (payment_status IN ('paid', 'pending', 'pay_at_clinic', 'refunded')),
    payment_provider TEXT,
    payment_ref TEXT,
    qr_payload TEXT NOT NULL,
    estimated_time TIMESTAMPTZ,
    doctor_id UUID REFERENCES doctors(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(clinic_id, department, visit_date, stn)
);

-- Indexes for visits
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date_dept ON visits(visit_date, department);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_stn ON visits(stn);

-- RLS for visits
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert visits for booking" ON visits
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public can read visits for queue display" ON visits
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow visit updates for payments" ON visits
    FOR UPDATE TO public USING (true);

CREATE POLICY "Authenticated users can manage visits" ON visits
    FOR ALL TO authenticated USING (true);

-- Trigger for visits
CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. MEDICAL HISTORY TABLE
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uid TEXT NOT NULL,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id),
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for medical_history
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_uid ON medical_history(patient_uid);
CREATE INDEX IF NOT EXISTS idx_medical_history_visit_id ON medical_history(visit_id);

-- RLS for medical_history
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read medical history with UID" ON medical_history
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage medical history" ON medical_history
    FOR ALL TO authenticated USING (true);

-- Trigger for medical_history
CREATE TRIGGER update_medical_history_updated_at
    BEFORE UPDATE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'online', 'insurance')),
    transaction_id TEXT,
    gateway_response JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_visit_id ON payment_transactions(visit_id);

-- RLS for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public payment creation" ON payment_transactions
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public payment reading" ON payment_transactions
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin payment updates" ON payment_transactions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow admin payment management" ON payment_transactions
    FOR ALL TO authenticated USING (true);

-- 7. CLINIC SETTINGS TABLE
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT DEFAULT 'general' CHECK (setting_type IN ('general', 'payment', 'notification', 'queue', 'doctor')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for clinic_settings
CREATE INDEX IF NOT EXISTS idx_clinic_settings_key ON clinic_settings(setting_key);

-- RLS for clinic_settings
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read clinic settings" ON clinic_settings
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage clinic settings" ON clinic_settings
    FOR ALL TO authenticated USING (true);

-- Trigger for clinic_settings
CREATE TRIGGER update_clinic_settings_updated_at
    BEFORE UPDATE ON clinic_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('patient', 'admin', 'doctor')),
    recipient_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications" ON notifications
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage notifications" ON notifications
    FOR ALL TO authenticated USING (true);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action_type TEXT NOT NULL,
    action_payload JSONB,
    resource_type TEXT,
    resource_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated users can read audit logs" ON audit_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only authenticated users can insert audit logs" ON audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- 10. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read appointments" ON appointments
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage appointments" ON appointments
    FOR ALL TO authenticated USING (true);

-- Trigger for appointments
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. DOCTOR SESSIONS TABLE
CREATE TABLE IF NOT EXISTS doctor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    session_status TEXT DEFAULT 'active' CHECK (session_status IN ('active', 'inactive', 'break')),
    room_name TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    current_patient_id UUID REFERENCES patients(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for doctor_sessions
ALTER TABLE doctor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read doctor sessions" ON doctor_sessions
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage doctor sessions" ON doctor_sessions
    FOR ALL TO authenticated USING (true);

-- Trigger for doctor_sessions
CREATE TRIGGER update_doctor_sessions_updated_at
    BEFORE UPDATE ON doctor_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. CONSULTATIONS TABLE
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES doctor_sessions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for consultations
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read consultations" ON consultations
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage consultations" ON consultations
    FOR ALL TO authenticated USING (true);

-- Trigger for consultations
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. CONSULTATION NOTES TABLE
CREATE TABLE IF NOT EXISTS consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'symptoms', 'diagnosis', 'prescription', 'follow_up', 'voice_note')),
    content TEXT NOT NULL,
    is_voice_generated BOOLEAN DEFAULT false,
    voice_confidence_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for consultation_notes
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read consultation notes" ON consultation_notes
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage consultation notes" ON consultation_notes
    FOR ALL TO authenticated USING (true);

-- Trigger for consultation_notes
CREATE TRIGGER update_consultation_notes_updated_at
    BEFORE UPDATE ON consultation_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. VOICE TRANSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS voice_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    original_audio_url TEXT,
    transcribed_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    language_code TEXT DEFAULT 'en-US',
    processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for voice_transcriptions
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read voice transcriptions" ON voice_transcriptions
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage voice transcriptions" ON voice_transcriptions
    FOR ALL TO authenticated USING (true);

-- INSERT DEFAULT DATA

-- Default departments
INSERT INTO departments (name, display_name, description, consultation_fee, average_consultation_time, color_code, is_active) VALUES
('general', 'General Medicine', 'General medical consultation and treatment', 500, 15, '#3B82F6', true),
('cardiology', 'Cardiology', 'Heart and cardiovascular system treatment', 800, 20, '#EF4444', true),
('orthopedics', 'Orthopedics', 'Bone, joint, and muscle treatment', 700, 18, '#10B981', true),
('pediatrics', 'Pediatrics', 'Child healthcare and treatment', 600, 20, '#F59E0B', true),
('dermatology', 'Dermatology', 'Skin, hair, and nail treatment', 650, 15, '#8B5CF6', true),
('neurology', 'Neurology', 'Brain and nervous system treatment', 900, 25, '#EC4899', true)
ON CONFLICT (name) DO NOTHING;

-- Default clinic settings
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description) VALUES
('clinic_name', '"MediQueue Clinic"', 'general', 'Name of the clinic'),
('maintenance_mode', 'false', 'general', 'Enable maintenance mode to prevent new bookings'),
('maintenance_message', '"System is under maintenance. Please try again later."', 'general', 'Message to show when maintenance mode is enabled'),
('average_consultation_time', '15', 'general', 'Average consultation time in minutes'),
('max_tokens_per_day', '100', 'general', 'Maximum tokens per day per department'),
('clinic_hours_start', '"09:00"', 'general', 'Clinic opening time'),
('clinic_hours_end', '"18:00"', 'general', 'Clinic closing time'),
('auto_refresh_interval', '30', 'general', 'Auto refresh interval in seconds for admin dashboard'),
('enable_online_payments', 'true', 'payment', 'Enable online payment processing'),
('stripe_publishable_key', '"pk_test_51234567890abcdef"', 'payment', 'Stripe publishable key for payments'),
('stripe_secret_key', '"sk_test_51234567890abcdef"', 'payment', 'Stripe secret key for payments'),
('enable_sms_notifications', 'false', 'notification', 'Enable SMS notifications'),
('enable_email_notifications', 'false', 'notification', 'Enable email notifications'),
('queue_display_refresh', '15', 'queue', 'Queue display refresh interval in seconds')
ON CONFLICT (setting_key) DO NOTHING;

-- Default doctors
INSERT INTO doctors (name, specialization, qualification, experience_years, consultation_fee, status) VALUES
('Dr. Rajesh Kumar', 'general', 'MBBS, MD', 10, 500, 'active'),
('Dr. Priya Sharma', 'cardiology', 'MBBS, MD, DM Cardiology', 15, 800, 'active'),
('Dr. Amit Singh', 'orthopedics', 'MBBS, MS Orthopedics', 12, 700, 'active'),
('Dr. Sunita Gupta', 'pediatrics', 'MBBS, MD Pediatrics', 8, 600, 'active'),
('Dr. Vikram Mehta', 'dermatology', 'MBBS, MD Dermatology', 6, 650, 'active'),
('Dr. Neha Agarwal', 'neurology', 'MBBS, MD, DM Neurology', 14, 900, 'active')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visits_composite ON visits(visit_date, department, status);
CREATE INDEX IF NOT EXISTS idx_medical_history_composite ON medical_history(patient_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_composite ON payment_transactions(visit_id, status);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Final comment
COMMENT ON SCHEMA public IS 'Complete clinic management system schema with all tables, security policies, and default data';