import { supabase } from './client';

export async function uploadExcel(
  analysisId: string,
  buffer: Buffer,
  filename: string
): Promise<string> {
  const path = `${analysisId}/${filename}`;

  const { error } = await supabase.storage
    .from('excel-files')
    .upload(path, buffer, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  if (error) throw error;

  const { data } = supabase.storage.from('excel-files').getPublicUrl(path);
  return data.publicUrl;
}

export async function saveAnalysis(record: {
  loopnet_url: string;
  address: string;
  city: string;
  property_type: string;
  units: number;
  rentable_sf: number;
  purchase_price: number;
  extracted_assumptions: object;
  final_assumptions: object;
  excel_file_path: string;
  scrape_duration_ms: number;
  cleaner_duration_ms: number;
  total_duration_ms: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from('analyses')
    .insert(record)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
