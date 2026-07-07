export interface CSVRecord {
  [key: string]: string | number | null | undefined;
}

export interface UploadResponse {
  preview: CSVRecord[];
  columns: string[];
  totalRows: number;
}

export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE';
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  original: CSVRecord;
  reason: string;
  rowIndex: number;
}

export interface Summary {
  totalImported: number;
  totalSkipped: number;
  byStatus: Record<string, number>;
}

export interface ProcessResponse {
  imported: CRMRecord[];
  skipped: SkippedRecord[];
  summary: Summary;
}

export type AppStep = 'upload' | 'preview' | 'processing' | 'results';
