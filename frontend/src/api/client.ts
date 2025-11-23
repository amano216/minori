// Auto-detect API URL for Codespaces or local development
function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Codespaces: replace frontend port with backend port
  if (window.location.hostname.includes('.app.github.dev')) {
    return window.location.origin.replace('-5173.', '-3000.');
  }

  return 'http://localhost:3000';
}

const API_URL = getApiUrl();

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) {
    throw new Error('API health check failed');
  }
  return response.json();
}
