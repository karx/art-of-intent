import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.artofintent',
  appName: 'Art of Intent',
  webDir: 'frontend/build',
  server: {
    // Set to your Netlify URL for live reload during dev; remove for production builds
    // url: 'https://art-of-intent.netlify.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
