/**
 * Database Operations for LoopMagic
 * CRUD operations for properties and analyses with Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { PropertyData, FinalAssumptions, ExcelMetrics, DealAnalysis } from '../types';

// ============================================================================
// Database Types (matching schema)
// ============================================================================

export interface DbProperty {
  id: string;
  user_id: string;
  loopnet_url: string;
  listing_id: string | null;
  property_name: string | null;
  address: PropertyData['address'];
  price: number | null;
  price_per_unit: number | null;
  price_per_sf: number | null;
  cap_rate: string | null;
  noi: number | null;
  gross_income: number | null;
  property_type: string | null;
  property_subtype: string | null;
  building_size: number | null;
  units: number | null;
  year_built: number | null;
  year_renovated: number | null;
  building_class: string | null;
  raw_data: PropertyData;
  created_at: string;
  updated_at: string;
}

export interface DbAnalysis {
  id: string;
  property_id: string | null;
  user_id: string;
  assumptions: FinalAssumptions;
  excel_metrics: ExcelMetrics | null;
  deal_analysis: DealAnalysis | null;
  excel_file_path: string | null;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  error_message: string | null;
  scrape_duration_ms: number | null;
  cleaner_duration_ms: number | null;
  analysis_duration_ms: number | null;
  total_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Profile Operations
// ============================================================================

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Pick<DbProfile, 'full_name' | 'company' | 'avatar_url'>>
): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  return data;
}

// ============================================================================
// Property Operations
// ============================================================================

export async function createProperty(
  supabase: SupabaseClient,
  userId: string,
  property: PropertyData
): Promise<DbProperty> {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      user_id: userId,
      loopnet_url: property.url,
      listing_id: property.listingId,
      property_name: property.propertyName,
      address: property.address,
      price: property.price,
      price_per_unit: property.pricePerUnit,
      price_per_sf: property.pricePerSF,
      cap_rate: property.capRate,
      noi: property.noi,
      gross_income: property.grossIncome,
      property_type: property.propertyType,
      property_subtype: property.propertySubtype,
      building_size: property.buildingSize,
      units: property.units,
      year_built: property.yearBuilt,
      year_renovated: property.yearRenovated,
      building_class: property.buildingClass,
      raw_data: property,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    throw error;
  }
  return data;
}

export async function getProperty(
  supabase: SupabaseClient,
  propertyId: string
): Promise<DbProperty | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    return null;
  }
  return data;
}

export async function getPropertyByUrl(
  supabase: SupabaseClient,
  userId: string,
  loopnetUrl: string
): Promise<DbProperty | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .eq('loopnet_url', loopnetUrl)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching property by URL:', error);
    return null;
  }
  return data || null;
}

export async function listUserProperties(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<DbProperty[]> {
  const { limit = 50, offset = 0 } = options;

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error listing properties:', error);
    throw error;
  }
  return data || [];
}

export async function deleteProperty(
  supabase: SupabaseClient,
  propertyId: string
): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId);

  if (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

// ============================================================================
// Analysis Operations
// ============================================================================

export interface CreateAnalysisInput {
  propertyId?: string;
  assumptions: FinalAssumptions;
  status?: 'pending' | 'processing';
}

export async function createAnalysis(
  supabase: SupabaseClient,
  userId: string,
  input: CreateAnalysisInput
): Promise<DbAnalysis> {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      property_id: input.propertyId || null,
      assumptions: input.assumptions,
      status: input.status || 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating analysis:', error);
    throw error;
  }
  return data;
}

export async function getAnalysis(
  supabase: SupabaseClient,
  analysisId: string
): Promise<DbAnalysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
  return data;
}

export interface UpdateAnalysisInput {
  excelMetrics?: ExcelMetrics;
  dealAnalysis?: DealAnalysis;
  excelFilePath?: string;
  status?: 'pending' | 'processing' | 'complete' | 'failed';
  errorMessage?: string;
  scrapeDurationMs?: number;
  cleanerDurationMs?: number;
  analysisDurationMs?: number;
  totalDurationMs?: number;
}

export async function updateAnalysis(
  supabase: SupabaseClient,
  analysisId: string,
  updates: UpdateAnalysisInput
): Promise<DbAnalysis> {
  const updateData: Record<string, unknown> = {};

  if (updates.excelMetrics !== undefined) updateData.excel_metrics = updates.excelMetrics;
  if (updates.dealAnalysis !== undefined) updateData.deal_analysis = updates.dealAnalysis;
  if (updates.excelFilePath !== undefined) updateData.excel_file_path = updates.excelFilePath;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
  if (updates.scrapeDurationMs !== undefined) updateData.scrape_duration_ms = updates.scrapeDurationMs;
  if (updates.cleanerDurationMs !== undefined) updateData.cleaner_duration_ms = updates.cleanerDurationMs;
  if (updates.analysisDurationMs !== undefined) updateData.analysis_duration_ms = updates.analysisDurationMs;
  if (updates.totalDurationMs !== undefined) updateData.total_duration_ms = updates.totalDurationMs;

  const { data, error } = await supabase
    .from('analyses')
    .update(updateData)
    .eq('id', analysisId)
    .select()
    .single();

  if (error) {
    console.error('Error updating analysis:', error);
    throw error;
  }
  return data;
}

export interface ListAnalysesOptions {
  limit?: number;
  offset?: number;
  status?: 'pending' | 'processing' | 'complete' | 'failed';
  propertyId?: string;
}

export async function listUserAnalyses(
  supabase: SupabaseClient,
  userId: string,
  options: ListAnalysesOptions = {}
): Promise<DbAnalysis[]> {
  const { limit = 50, offset = 0, status, propertyId } = options;

  let query = supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }
  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing analyses:', error);
    throw error;
  }
  return data || [];
}

export interface AnalysisWithProperty extends DbAnalysis {
  property: DbProperty | null;
}

export async function listUserAnalysesWithProperties(
  supabase: SupabaseClient,
  userId: string,
  options: ListAnalysesOptions = {}
): Promise<AnalysisWithProperty[]> {
  const { limit = 50, offset = 0, status } = options;

  let query = supabase
    .from('analyses')
    .select(`
      *,
      property:properties(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing analyses with properties:', error);
    throw error;
  }
  return data || [];
}

export async function deleteAnalysis(
  supabase: SupabaseClient,
  analysisId: string
): Promise<void> {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', analysisId);

  if (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
}

// ============================================================================
// Statistics / Dashboard
// ============================================================================

export interface UserStats {
  totalAnalyses: number;
  completedAnalyses: number;
  totalProperties: number;
  recentAnalyses: AnalysisWithProperty[];
}

export async function getUserStats(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStats> {
  // Get counts
  const [analysesResult, propertiesResult, recentResult] = await Promise.all([
    supabase
      .from('analyses')
      .select('status', { count: 'exact' })
      .eq('user_id', userId),
    supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('user_id', userId),
    supabase
      .from('analyses')
      .select('*, property:properties(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalAnalyses = analysesResult.count || 0;
  const totalProperties = propertiesResult.count || 0;

  // Count completed
  const completedResult = await supabase
    .from('analyses')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'complete');

  const completedAnalyses = completedResult.count || 0;

  return {
    totalAnalyses,
    completedAnalyses,
    totalProperties,
    recentAnalyses: recentResult.data || [],
  };
}
