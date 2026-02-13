/**
 * Supabase Storage Operations for LoopMagic
 * Handles Excel file uploads and downloads
 */

import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'excel-files';
const SIGNED_URL_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

// ============================================================================
// Upload Operations
// ============================================================================

/**
 * Uploads an Excel file to Supabase Storage
 * Files are organized by user_id/analysis_id/filename
 */
export async function uploadExcelFile(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string,
  buffer: Buffer,
  filename: string
): Promise<{ path: string; publicUrl: string }> {
  const path = `${userId}/${analysisId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true, // Allow overwriting
    });

  if (error) {
    console.error('Error uploading Excel file:', error);
    throw error;
  }

  // Get public URL (for buckets with public access)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: urlData.publicUrl,
  };
}

// ============================================================================
// Download Operations
// ============================================================================

/**
 * Gets a signed URL for downloading an Excel file
 * Signed URLs expire after 24 hours
 */
export async function getSignedDownloadUrl(
  supabase: SupabaseClient,
  filePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }

  return data.signedUrl;
}

/**
 * Downloads an Excel file directly (returns buffer)
 */
export async function downloadExcelFile(
  supabase: SupabaseClient,
  filePath: string
): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error) {
    console.error('Error downloading Excel file:', error);
    throw error;
  }

  // Convert Blob to Buffer
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Deletes an Excel file from storage
 */
export async function deleteExcelFile(
  supabase: SupabaseClient,
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting Excel file:', error);
    throw error;
  }
}

/**
 * Deletes all files for a specific analysis
 */
export async function deleteAnalysisFiles(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string
): Promise<void> {
  const folderPath = `${userId}/${analysisId}`;

  // List all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath);

  if (listError) {
    console.error('Error listing files for deletion:', listError);
    throw listError;
  }

  if (!files || files.length === 0) {
    return; // No files to delete
  }

  // Delete all files
  const filePaths = files.map((f) => `${folderPath}/${f.name}`);
  const { error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (deleteError) {
    console.error('Error deleting analysis files:', deleteError);
    throw deleteError;
  }
}

// ============================================================================
// Utility Operations
// ============================================================================

/**
 * Checks if a file exists in storage
 */
export async function fileExists(
  supabase: SupabaseClient,
  filePath: string
): Promise<boolean> {
  const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath, {
      search: fileName,
    });

  if (error) {
    console.error('Error checking file existence:', error);
    return false;
  }

  return data.some((f) => f.name === fileName);
}

/**
 * Gets file metadata
 */
export async function getFileMetadata(
  supabase: SupabaseClient,
  filePath: string
): Promise<{
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
} | null> {
  const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath, {
      search: fileName,
    });

  if (error || !data || data.length === 0) {
    return null;
  }

  const file = data.find((f) => f.name === fileName);
  if (!file) return null;

  return {
    name: file.name,
    size: file.metadata?.size || 0,
    createdAt: file.created_at,
    updatedAt: file.updated_at,
  };
}
