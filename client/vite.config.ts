import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API base URL is read at runtime from VITE_API_URL (see src/api/httpClient.ts),
// defaulting to http://localhost:3000 — no dev-server proxy needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
