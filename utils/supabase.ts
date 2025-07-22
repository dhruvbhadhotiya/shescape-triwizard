import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrguygvgryfugpllkbjy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZ3V5Z3ZncnlmdWdwbGxrYmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MTE3NDEsImV4cCI6MjA1Njk4Nzc0MX0.fNMoD5m8xF7I0YH9GUktuHN1qNpl-CWC1DTSFn8qgFQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})