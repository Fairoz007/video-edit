/** API / static asset base — same-origin when UI is served by the backend (Electron production). */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return '';
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (protocol.startsWith('http') && (hostname === '127.0.0.1' || hostname === 'localhost')) {
      return '';
    }
  }
  return 'http://127.0.0.1:3847';
}

export function formatBackendUnreachableMessage(): string {
  if (typeof window !== 'undefined' && window.docuforge) {
    return 'Backend not reachable. Restart DocuForge or check logs in AppData\\DocuForge\\DocuForge\\logs\\backend.log';
  }
  return 'Backend not reachable. Run npm run dev from the project folder.';
}
