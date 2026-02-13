/**
 * Supabase Module Exports
 */

// Client creators
export { createClient as createBrowserClient, getSupabaseClient } from './client';
export { createClient as createServerClient, createAdminClient } from './server';

// Database operations
export * from './database';

// Storage operations
export * from './storage';

// Re-export types
export type { User, Session } from '@supabase/supabase-js';
