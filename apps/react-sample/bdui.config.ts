export default {
  webServer: {
    command: 'pnpm run dev -- --host 127.0.0.1 --port 5173',
    port: 5173,
    baseURL: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
  features: ['../../features/ui/**/*.feature'],
  steps: ['bdui/steps/**/*.{ts,js}'],
};
