export default {
  baseURL: 'http://127.0.0.1:4173',
  webServer: {
    command: 'pnpm run dev -- --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: true,
  },
  features: ['../../features/ui/**/*.feature'],
  steps: ['bdui/steps/**/*.{ts,js}'],
};
