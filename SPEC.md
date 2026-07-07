# GrowEasy AI CSV Importer - Specification

## Concept & Vision

A sleek, professional CSV importer that transforms messy, inconsistent spreadsheet exports into clean CRM-ready data using AI intelligence. The experience should feel like having a smart assistant that understands your data — upload any format, get professional results. The interface conveys trust and efficiency with a clean, modern aesthetic.

## Design Language

### Aesthetic Direction
Modern SaaS dashboard with subtle gradients, clean lines, and professional polish. Inspired by Linear and Notion's clean aesthetic with purposeful use of color for status indicators.

### Color Palette
- **Primary**: #4F46E5 (Indigo-600) - Actions, buttons, progress
- **Primary Light**: #818CF8 (Indigo-400) - Hover states
- **Success**: #10B981 (Emerald-500) - SALE_DONE, success states
- **Warning**: #F59E0B (Amber-500) - GOOD_LEAD_FOLLOW_UP, pending
- **Error**: #EF4444 (Red-500) - BAD_LEAD, skipped records
- **Neutral**: #6B7280 (Gray-500) - DID_NOT_CONNECT, secondary text
- **Background**: #F9FAFB (Gray-50) - Page background
- **Card**: #FFFFFF - Cards and tables
- **Text Primary**: #111827 (Gray-900)
- **Text Secondary**: #6B7280 (Gray-500)
- **Border**: #E5E7EB (Gray-200)

### Typography
- **Headings**: Inter (700 weight)
- **Body**: Inter (400, 500 weight)
- **Monospace**: JetBrains Mono for CSV data display
- **Scale**: 14px base, 1.5 line-height for readability

### Spatial System
- Base unit: 4px
- Card padding: 24px
- Section spacing: 32px
- Component gap: 16px

### Motion Philosophy
- Smooth transitions (200-300ms ease-out)
- Upload zone pulse animation on drag
- Progress bar animation during AI processing
- Fade-in for results
- Subtle scale on button hover

## Layout & Structure

### Page Flow
1. **Header** - Logo, title, minimal navigation
2. **Upload Section** - Hero area with drag-drop zone
3. **Preview Section** - Appears after upload, shows raw data
4. **Results Section** - Appears after processing, shows parsed data
5. **Footer** - Minimal branding

### Responsive Strategy
- Desktop: Full table view, side-by-side stats
- Tablet: Horizontal scroll for tables
- Mobile: Stacked cards, simplified table view

## Features & Interactions

### Step 1: Upload CSV
- Drag & drop zone with dashed border
- File picker button as alternative
- Accept only .csv files
- Visual feedback on drag-over (border color change, background tint)
- Error state for invalid files

### Step 2: Preview
- Parse CSV client-side using Papa Parse
- Display in responsive table with sticky headers
- Horizontal scroll for wide datasets
- Row count indicator
- Column count display
- "Continue to Import" button

### Step 3: Processing
- "Confirm Import" triggers backend call
- Progress indicator with batch processing status
- Estimated time display
- Cancel option

### Step 4: Results
- Summary cards (total imported, skipped, by status)
- Tabbed or filtered view of results
- Export option for parsed data
- Start over option

## Component Inventory

### Upload Zone
- Default: Dashed border, icon, "Drag & drop or click"
- Drag-over: Solid border, highlighted background
- Processing: Disabled state
- Error: Red border, error message

### Data Table
- Sticky header row
- Alternating row colors (subtle)
- Horizontal scroll container
- Max height with vertical scroll
- Empty state message
- Loading skeleton

### Status Badge
- GOOD_LEAD_FOLLOW_UP: Amber background
- SALE_DONE: Green background
- BAD_LEAD: Red background
- DID_NOT_CONNECT: Gray background

### Progress Bar
- Animated fill
- Percentage display
- Batch counter (e.g., "Processing batch 2/5")

### Summary Cards
- Icon, large number, label
- Subtle shadow
- Hover lift effect

## Technical Approach

### Frontend (Next.js)
- App Router with TypeScript
- Tailwind CSS for styling
- Papa Parse for CSV parsing
- Axios for API calls
- Client-side state management with React hooks

### Backend (Node.js + Express)
- Express server with TypeScript
- Multer for file upload handling
- csv-parse for CSV parsing
- OpenAI SDK for AI field extraction
- Batch processing (10 records per batch)

### API Design

#### POST /api/upload
- Accepts: multipart/form-data with CSV file
- Returns: { preview: Record[], columns: string[], totalRows: number }

#### POST /api/process
- Accepts: JSON { records: Record[] }
- Returns: Stream of results or full response
- Response: { imported: CRMRecord[], skipped: SkippedRecord[], summary: Summary }

### Data Model

```typescript
interface CRMRecord {
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

interface SkippedRecord {
  original: Record;
  reason: string;
  rowIndex: number;
}

interface Summary {
  totalImported: number;
  totalSkipped: number;
  byStatus: Record<string, number>;
}
```

### AI Prompt Strategy
- System prompt defines CRM schema and rules
- User prompt includes batch of records with column headers
- Response parsed as JSON array of mapped records
- Validation and fallback handling for malformed responses

## CRM Field Rules

### Allowed Values
- **crm_status**: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE
- **data_source**: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots

### Extraction Rules
1. created_at: Must be valid date, prefer ISO format
2. email: Extract first, append extras to crm_note
3. mobile: Extract first (without country code), append extras to crm_note
4. country_code: Detect from mobile number or explicit column
5. Skip records with neither email nor mobile
