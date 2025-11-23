const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_URL}/api/health`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('API health check failed');
  }
  return response.json();
}
