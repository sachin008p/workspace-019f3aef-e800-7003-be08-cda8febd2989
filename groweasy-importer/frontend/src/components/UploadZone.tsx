'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export default function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setIsDragging(true);
    }
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return false;
    }
    
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isLoading) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [isLoading, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200',
          isDragging && !isLoading
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 bg-white',
          isLoading && 'opacity-50 cursor-not-allowed',
          error && 'border-red-400 bg-red-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={isLoading}
        />
        
        <div className={cn(
          'w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors',
          isDragging ? 'bg-indigo-100' : 'bg-gray-100'
        )}>
          {isDragging ? (
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {isDragging ? 'Drop your CSV here' : 'Upload your CSV file'}
        </h3>
        
        <p className="text-gray-500 mb-6">
          Drag and drop your CSV file here, or click to browse
        </p>
        
        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4" />
            CSV only
          </span>
          <span>•</span>
          <span>Max 10MB</span>
        </div>
        
        {error && (
          <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
            <X className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
      
      <p className="text-center text-sm text-gray-500 mt-6">
        Works with Facebook Lead Exports, Google Ads, Excel sheets, Real Estate CRM exports, and more
      </p>
    </div>
  );
}
