import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  input: ['index.html', 'countryjellies/index.html'],
});
