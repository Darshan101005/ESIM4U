import { API_BASE_URL, API_VERSION } from '@/constants';

const apiUrl = `${API_BASE_URL}/${API_VERSION}`;

export const apiService = {
  async get(endpoint: string) {
    const response = await fetch(`${apiUrl}${endpoint}`);
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },
};
