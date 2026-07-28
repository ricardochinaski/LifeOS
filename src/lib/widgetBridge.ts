import { registerPlugin } from '@capacitor/core';

interface LifeOSWidgetPlugin {
  updateWidget(options: { shiftStatus: string; shiftDay: string; isRest: boolean }): Promise<void>;
}

const WidgetBridge = registerPlugin<LifeOSWidgetPlugin>('LifeOSWidget');

export async function updateWidgetData(shiftStatus: string, shiftDay: string, isRest: boolean) {
  try {
    await WidgetBridge.updateWidget({ shiftStatus, shiftDay, isRest });
  } catch {
    // Widget plugin not available on web
  }
}
