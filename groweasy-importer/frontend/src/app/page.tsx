'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { UploadResponse, ProcessResponse, AppStep, CSVRecord } from '@/types';
import { api } from '@/lib/api';
import UploadZone from '@/components/UploadZone';
import CSVPreview from '@/components/CSVPreview';
import APIKeyModal from '@/components/APIKeyModal';
import ResultsTable from '@/components/ResultsTable';
import { CheckCircle, Loader2, Database, Sparkles, Upload } from 'lucide-react';

export default function Home() {
  const [step, setStep] = useState<AppStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [fullRecords, setFullRecords] = useState<CSVRecord[]>([]);
  const [processResult, setProcessResult] = useState<ProcessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError(null);
    setIsLoading(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const records = results.data as CSVRecord[];
        
        if (records.length === 0) {
          setError('The CSV file appears to be empty');
          setIsLoading(false);
          return;
        }

        const columns = results.meta.fields || [];
        
        try {
          const serverResponse = await api.uploadCSV(selectedFile);
          setUploadData(serverResponse);
          setFullRecords(records);
          setStep('preview');
        } catch (serverError) {
          // Use client-side parsed data if server is not available
          setUploadData({
            preview: records.slice(0, 100),
            columns,
            totalRows: records.length,
          });
          setFullRecords(records);
          setStep('preview');
        }
        
        setIsLoading(false);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setIsLoading(false);
      },
    });
  }, []);

  const handleContinueToImport = useCallback(() => {
    setShowAPIKeyModal(true);
  }, []);

  const handleStartProcessing = useCallback(async (key: string) => {
    setApiKey(key);
    setShowAPIKeyModal(false);
    setIsLoading(true);
    setStep('processing');
    setError(null);

    try {
      const result = await api.processCSV(fullRecords, key);
      setProcessResult(result);
      setStep('results');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process CSV. Please check your API key and try again.';
      setError(errorMessage);
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  }, [fullRecords]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setFileName('');
    setUploadData(null);
    setFullRecords([]);
    setProcessResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GrowEasy</h1>
                <p className="text-xs text-gray-500">AI CSV Importer</p>
              </div>
            </div>
            
            {step !== 'upload' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Upload New File
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {['Upload', 'Preview', 'Process', 'Results'].map((label, idx) => {
              const stepKeys: AppStep[] = ['upload', 'preview', 'processing', 'results'];
              const currentIndex = stepKeys.indexOf(step);
              const isActive = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              
              return (
                <div key={label} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isActive && step !== 'processing' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isCurrent ? 'text-indigo-600' : isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`w-12 h-0.5 ${
                      isActive ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        {step === 'upload' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Import Leads with AI Intelligence
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload any CSV file — Facebook leads, Google Ads, Excel sheets, or any CRM export — 
                and let our AI transform it into clean, structured CRM data.
              </p>
            </div>
            
            <UploadZone
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
            />

            {/* Features */}
            <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <FeatureCard
                icon={<Upload className="w-6 h-6" />}
                title="Universal CSV Support"
                description="Works with any CSV format from any source without configuration"
              />
              <FeatureCard
                icon={<Sparkles className="w-6 h-6" />}
                title="AI-Powered Mapping"
                description="Automatically identifies and extracts CRM fields using intelligent AI"
              />
              <FeatureCard
                icon={<CheckCircle className="w-6 h-6" />}
                title="Clean Output"
                description="Get standardized CRM-ready data with proper formatting"
              />
            </div>
          </div>
        )}

        {step === 'preview' && uploadData && (
          <CSVPreview
            records={uploadData.preview}
            columns={uploadData.columns}
            totalRows={uploadData.totalRows}
            fileName={fileName}
            onContinue={handleContinueToImport}
            onBack={handleReset}
          />
        )}

        {step === 'processing' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Processing with AI...
            </h2>
            <p className="text-gray-600 mb-8">
              Our AI is analyzing {fullRecords.length.toLocaleString()} records and mapping them to CRM fields.
            </p>
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}

        {step === 'results' && processResult && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Import Complete!
              </h2>
              <p className="text-gray-600 mt-2">
                Your data has been processed and is ready to use.
              </p>
            </div>
            
            <ResultsTable
              imported={processResult.imported}
              skipped={processResult.skipped}
              summary={processResult.summary}
            />

            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Import Another File
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            GrowEasy AI CSV Importer • Transform any CSV into CRM-ready data
          </p>
        </div>
      </footer>

      {/* API Key Modal */}
      {showAPIKeyModal && (
        <APIKeyModal
          onSubmit={handleStartProcessing}
          onClose={() => setShowAPIKeyModal(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-6">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
