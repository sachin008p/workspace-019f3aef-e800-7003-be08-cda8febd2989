import axios from 'axios';
import { UploadResponse, ProcessResponse, CSVRecord } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  uploadCSV: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadResponse>(
      `${API_BASE_URL}/api/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  processCSV: async (
    records: CSVRecord[],
    apiKey: string
  ): Promise<ProcessResponse> => {
    const response = await axios.post<ProcessResponse>(
      `${API_BASE_URL}/api/process`,
      { records },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-openai-key': apiKey,
        },
      }
    );

    return response.data;
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      await axios.get(`${API_BASE_URL}/api/health`);
      return true;
    } catch {
      return false;
    }
  },
};
