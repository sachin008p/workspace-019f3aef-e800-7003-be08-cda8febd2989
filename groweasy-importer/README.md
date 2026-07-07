# GrowEasy AI CSV Importer

An AI-powered CSV importer that intelligently extracts CRM lead information from any valid CSV format. Upload CSVs from Facebook Lead Exports, Google Ads, Excel sheets, Real Estate CRM exports, and more — the AI handles the field mapping automatically.

![GrowEasy CSV Importer](https://img.shields.io/badge/AI-CRM%20Importer-4F46E5)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **Universal CSV Support** - Works with any CSV format without configuration
- **AI-Powered Field Mapping** - Automatically identifies and extracts CRM fields
- **Batch Processing** - Processes records in batches for optimal performance
- **Progress Tracking** - Real-time progress indicators during processing
- **Responsive Design** - Beautiful, mobile-friendly interface
- **Data Validation** - Validates records and skips invalid entries
- **Export Capability** - Download processed data as CSV

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- PapaParse for CSV parsing
- Lucide React icons

### Backend
- Node.js
- Express
- OpenAI SDK (GPT-4o-mini)
- Multer for file uploads
- csv-parse for server-side parsing

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn
- OpenAI API key

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd groweasy-importer
```

### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file with your OpenAI API key
cp .env.example .env
```

Edit `.env`:
```env
OPENAI_API_KEY=your-openai-api-key-here
PORT=3001
```

Start the backend:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:3001`

### 3. Setup Frontend

```bash
cd ../frontend
npm install

# Create .env.local if you need to customize API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

Start the frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Open in Browser

Navigate to `http://localhost:3000` to use the application.

## Usage

1. **Upload CSV**: Drag & drop or click to select a CSV file
2. **Preview**: Review the parsed data in the table preview
3. **Enter API Key**: Provide your OpenAI API key (or set `OPENAI_API_KEY` in backend .env)
4. **Process**: Click "Continue to Import" to start AI processing
5. **Review Results**: View imported records, skipped records, and summary statistics
6. **Export**: Download the processed data as CSV

## API Endpoints

### Health Check
```
GET /api/health
```

### Upload CSV
```
POST /api/upload
Content-Type: multipart/form-data

Response:
{
  "preview": [...],
  "columns": [...],
  "totalRows": number
}
```

### Process CSV
```
POST /api/process
Content-Type: application/json
x-openai-key: your-api-key

Body:
{
  "records": [...]
}

Response:
{
  "imported": [...],
  "skipped": [...],
  "summary": {
    "totalImported": number,
    "totalSkipped": number,
    "byStatus": {...}
  }
}
```

## CRM Fields

The AI extracts these fields from your CSV data:

| Field | Description |
|-------|-------------|
| created_at | Lead creation date |
| name | Lead name |
| email | Primary email |
| country_code | Country code (e.g., +91) |
| mobile_without_country_code | Mobile number |
| company | Company name |
| city | City |
| state | State |
| country | Country |
| lead_owner | Lead owner |
| crm_status | Status (GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE) |
| crm_note | Notes and remarks |
| data_source | Source (leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots) |
| possession_time | Property possession time |
| description | Additional description |

## Deployment

### Backend (Railway, Render, etc.)

1. Set environment variables:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `PORT` - Port number (optional)

2. Deploy the `backend` folder

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Set environment variable:
   - `NEXT_PUBLIC_API_URL` - Your backend URL

3. Deploy the `frontend` folder

## Sample CSVs

The application works with any CSV format. Sample sources include:

- Facebook Lead Ads export
- Google Ads lead forms
- Microsoft Excel sheets
- Real Estate CRM exports
- Sales reports
- Marketing agency spreadsheets
- Manually created CSVs

## License

MIT License
