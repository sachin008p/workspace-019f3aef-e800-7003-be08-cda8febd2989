import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// CRM Field definitions
const CRM_FIELDS = {
  created_at: 'Lead creation date in ISO format',
  name: 'Full name of the lead',
  email: 'Primary email address',
  country_code: 'Country code like +91, +1, etc.',
  mobile_without_country_code: 'Mobile number without country code',
  company: 'Company or organization name',
  city: 'City name',
  state: 'State or province',
  country: 'Country name',
  lead_owner: 'Name or email of the sales person handling this lead',
  crm_status: 'Status: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, or SALE_DONE',
  crm_note: 'Notes, remarks, extra contact info merged together',
  data_source: 'Source: leads_on_demand, meridian_tower, eden_park, varah_swamy, or sarjapur_plots',
  possession_time: 'Property possession timeline if applicable',
  description: 'Additional description or comments'
};

const ALLOWED_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const ALLOWED_SOURCES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

// System prompt for AI
const getSystemPrompt = () => `You are an expert CRM data mapper. Your job is to extract and normalize lead information from various CSV formats into GrowEasy CRM format.

## Target CRM Fields:
${Object.entries(CRM_FIELDS).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}

## Rules:
1. VALID STATUS VALUES: Only use these exact values: ${ALLOWED_STATUSES.join(', ')}
2. VALID DATA SOURCES: Only use these exact values: ${ALLOWED_SOURCES.join(', ')}
3. DATE FORMAT: created_at must be in ISO format (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
4. EMAILS: Use the first email as email field, append any additional emails to crm_note
5. MOBILE: Use first mobile number without country code, append extras to crm_note
6. SKIP INVALID: If a record has neither email nor mobile, do not include it in output
7. CSV SAFETY: Do not introduce line breaks in any field value

## Response Format:
Return a JSON array of successfully mapped CRM records. Each record must have all fields (use empty string "" for missing values except for crm_status which must be one of the allowed values).

Example response structure:
[
  {
    "created_at": "2026-05-13 14:20:48",
    "name": "John Doe",
    "email": "john@example.com",
    "country_code": "+91",
    "mobile_without_country_code": "9876543210",
    "company": "Acme Corp",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "lead_owner": "agent@company.com",
    "crm_status": "GOOD_LEAD_FOLLOW_UP",
    "crm_note": "Interested in premium plan",
    "data_source": "leads_on_demand",
    "possession_time": "",
    "description": ""
  }
]

If no records can be extracted, return an empty array [].`;

// Helper function to extract column headers from records
function extractColumnHeaders(records) {
  if (!records || records.length === 0) return [];
  const firstRecord = records[0];
  return Object.keys(firstRecord);
}

// Helper function to format records for AI
function formatRecordsForAI(records, headers) {
  if (!records || records.length === 0) return '';
  
  const formatted = records.map((record, index) => {
    const row = headers.map(h => {
      const val = record[h];
      if (val === null || val === undefined) return '';
      return String(val).replace(/"/g, '""');
    });
    return `Row ${index + 1}: ${row.join(' | ')}`;
  }).join('\n');
  
  return `Column Headers: ${headers.join(', ')}\n\n${formatted}`;
}

// Process a batch of records with AI
async function processBatchWithAI(batch, headers, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const client = new OpenAI({ apiKey });
  const inputData = formatRecordsForAI(batch, headers);
  
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: `Extract CRM data from these CSV records:\n\n${inputData}\n\nReturn ONLY a valid JSON array, no markdown code blocks, no explanations.` }
    ],
    temperature: 0.1,
    max_tokens: 4096,
  });

  let content = response.choices[0]?.message?.content || '[]';
  
  // Clean up the response - remove markdown code blocks if present
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Try to extract JSON array from the response
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // Try to find JSON array in the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error('Failed to parse AI response:', content);
        return [];
      }
    } else {
      console.error('No JSON array found in AI response:', content);
      return [];
    }
  }

  // Validate and normalize the results
  if (!Array.isArray(parsed)) return [];

  return parsed.map(record => ({
    created_at: record.created_at || '',
    name: record.name || '',
    email: record.email || '',
    country_code: record.country_code || '',
    mobile_without_country_code: record.mobile_without_country_code || '',
    company: record.company || '',
    city: record.city || '',
    state: record.state || '',
    country: record.country || '',
    lead_owner: record.lead_owner || '',
    crm_status: ALLOWED_STATUSES.includes(record.crm_status) ? record.crm_status : 'GOOD_LEAD_FOLLOW_UP',
    crm_note: record.crm_note || '',
    data_source: ALLOWED_SOURCES.includes(record.data_source) ? record.data_source : '',
    possession_time: record.possession_time || '',
    description: record.description || '',
  }));
}

// Check if a record is valid (has email or mobile)
function isValidRecord(record) {
  const email = (record.email || '').trim();
  const mobile = (record.mobile_without_country_code || '').trim();
  return email.length > 0 || mobile.length > 0;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload and preview CSV
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    
    let records;
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (parseError) {
      // Try with auto-detect columns
      try {
        records = parse(csvContent, {
          columns: (headers) => headers.map((h, i) => h || `column_${i + 1}`),
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        });
      } catch (retryError) {
        return res.status(400).json({ error: 'Invalid CSV format' });
      }
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    const columns = extractColumnHeaders(records);

    res.json({
      preview: records.slice(0, 100), // First 100 for preview
      columns,
      totalRows: records.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to parse CSV file' });
  }
});

// Process CSV with AI
app.post('/api/process', async (req, res) => {
  try {
    const { records } = req.body;
    const apiKey = req.headers['x-openai-key'] || process.env.OPENAI_API_KEY;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is required' });
    }

    const headers = extractColumnHeaders(records);
    const BATCH_SIZE = 10;
    const imported = [];
    const skipped = [];

    // Process in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(records.length / BATCH_SIZE);

      console.log(`Processing batch ${batchNumber}/${totalBatches}`);

      try {
        const results = await processBatchWithAI(batch, headers, apiKey);
        
        // Track results by original row index
        results.forEach((result, idx) => {
          const originalIndex = i + idx;
          if (isValidRecord(result)) {
            imported.push({
              ...result,
              _originalIndex: originalIndex,
            });
          } else {
            skipped.push({
              original: batch[idx],
              reason: 'Missing both email and mobile number',
              rowIndex: originalIndex,
            });
          }
        });
      } catch (batchError) {
        console.error(`Batch ${batchNumber} failed:`, batchError.message);
        // Mark batch records as skipped
        batch.forEach((record, idx) => {
          skipped.push({
            original: record,
            reason: `AI processing failed: ${batchError.message}`,
            rowIndex: i + idx,
          });
        });
      }
    }

    // Calculate summary
    const summary = {
      totalImported: imported.length,
      totalSkipped: skipped.length,
      byStatus: {},
    };

    imported.forEach(record => {
      const status = record.crm_status || 'UNKNOWN';
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
    });

    res.json({
      imported: imported.map(r => {
        const { _originalIndex, ...rest } = r;
        return rest;
      }),
      skipped,
      summary,
    });
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'Failed to process records' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  console.error('Server error:', error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`GrowEasy CSV Importer Backend running on port ${PORT}`);
});

export default app;
