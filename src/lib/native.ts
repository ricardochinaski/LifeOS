import { SpeechRecognition } from '@capacitor-community/speech-recognition';

type NativePlatform = 'android' | 'ios' | 'web';

function getPlatform(): NativePlatform {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return (window as any).Capacitor.getPlatform();
  }
  return 'web';
}

export const isNative = () => getPlatform() !== 'web';

export const nativeSpeechRecognition = async (): Promise<string> => {
  if (!isNative()) return '';

  const hasPermission = await SpeechRecognition.requestPermissions();
  if (!hasPermission) {
    throw new Error('Permiso de micrófono denegado');
  }

  const result = await SpeechRecognition.start({
    language: 'es-CL',
    maxResults: 1,
    prompt: 'Habla ahora para LifeOS...',
    partialResults: false,
  });

  return result.matches?.[0] || '';
};

export const stopNativeSpeechRecognition = async () => {
  if (!isNative()) return;
  await SpeechRecognition.stop();
};
