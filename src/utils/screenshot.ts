import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export async function captureScreenshot(viewRef: React.RefObject<any>, filename: string) {
  try {
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 0.9,
    });
    const dest = `${FileSystem.documentDirectory}${filename}.png`;
    await FileSystem.moveAsync({ from: uri, to: dest });
    console.log('Screenshot saved to', dest);
    return dest;
  } catch (e) {
    console.error('Screenshot capture failed', e);
    return null;
  }
}
