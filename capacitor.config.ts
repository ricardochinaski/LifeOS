import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aselec.lifeos',
  appName: 'LifeOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_lifeos',
      iconColor: '#10B981',
    },
    SpeechRecognition: {
      language: 'es-CL',
    },
  },
  android: {
    buildOptions: {
      keystoreAlias: 'lifeos',
    },
  },
};

export default config;
