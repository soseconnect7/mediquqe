import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
const hasValidConfig = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-project-url' && 
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  supabaseUrl.includes('supabase.co');

// Create Supabase client with proper error handling
export const supabase = hasValidConfig ? createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'clinic-queue-system',
    },
  },
}) : null;

export const isSupabaseConfigured = hasValidConfig;

// Safe database operations with error handling
export const safeQuery = async (queryFn: () => Promise<any>) => {
  if (!supabase) {
    return { data: null, error: { message: 'Database not configured' } };
  }
  
  try {
    const result = await queryFn();
    return result;
  } catch (error: any) {
    console.error('Database query error:', error);
    return { data: null, error: { message: error.message || 'Database operation failed' } };
  }
};

// Initialize database with default data
export const initializeDatabase = async () => {
  if (!supabase) return false;
  
  try {
    // Check if departments exist
    const { data: departments } = await supabase
      .from('departments')
      .select('id')
      .limit(1);
    
    // If no departments, create default ones
    if (!departments || departments.length === 0) {
      const defaultDepartments = [
        {
          name: 'general',
          display_name: 'General Medicine',
          description: 'General medical consultation and treatment',
          consultation_fee: 500,
          average_consultation_time: 15,
          color_code: '#3B82F6',
          is_active: true
        },
        {
          name: 'cardiology',
          display_name: 'Cardiology',
          description: 'Heart and cardiovascular system treatment',
          consultation_fee: 800,
          average_consultation_time: 20,
          color_code: '#EF4444',
          is_active: true
        },
        {
          name: 'orthopedics',
          display_name: 'Orthopedics',
          description: 'Bone, joint, and muscle treatment',
          consultation_fee: 700,
          average_consultation_time: 18,
          color_code: '#10B981',
          is_active: true
        }
      ];
      
      await supabase.from('departments').insert(defaultDepartments);
    }
    
    // Check if settings exist
    const { data: settings } = await supabase
      .from('clinic_settings')
      .select('id')
      .limit(1);
    
    // If no settings, create default ones
    if (!settings || settings.length === 0) {
      const defaultSettings = [
        {
          setting_key: 'clinic_name',
          setting_value: 'MediQueue Clinic',
          setting_type: 'general',
          description: 'Name of the clinic'
        },
        {
          setting_key: 'maintenance_mode',
          setting_value: false,
          setting_type: 'general',
          description: 'Enable maintenance mode'
        },
        {
          setting_key: 'auto_refresh_interval',
          setting_value: 30,
          setting_type: 'general',
          description: 'Auto refresh interval in seconds'
        }
      ];
      
      await supabase.from('clinic_settings').insert(defaultSettings);
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
};

// Test connection with retry logic
export const testConnection = async (retries = 3): Promise<boolean> => {
  if (!supabase) return false;
  
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('count')
        .limit(1);
      
      if (!error) {
        await initializeDatabase();
        return true;
      }
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  return false;
};

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          uid: string;
          name: string;
          age: number;
          phone: string;
          email?: string;
          address?: string;
          emergency_contact?: string;
          blood_group?: string;
          allergies?: string[];
          medical_conditions?: string[];
          created_at: string;
          updated_at: string;
        };
      };
      visits: {
        Row: {
          id: string;
          patient_id: string;
          clinic_id: string;
          stn: number;
          department: string;
          visit_date: string;
          status: string;
          payment_status: string;
          qr_payload: string;
          doctor_id?: string;
          created_at: string;
          updated_at: string;
        };
      };
      medical_history: {
        Row: {
          id: string;
          patient_uid: string;
          visit_id?: string;
          doctor_id?: string;
          diagnosis?: string;
          prescription?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description?: string;
          consultation_fee: number;
          average_consultation_time: number;
          color_code: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      doctors: {
        Row: {
          id: string;
          name: string;
          specialization: string;
          qualification?: string;
          experience_years: number;
          consultation_fee: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      clinic_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: any;
          setting_type: string;
          description?: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}