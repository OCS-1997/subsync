import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.subsync.app',
  appName: 'subsync',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
    hostname: 'localhost'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
  