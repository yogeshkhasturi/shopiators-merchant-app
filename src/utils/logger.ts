import * as FileSystem from 'expo-file-system';

const LOG_FILE_URI = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}app.log` : '';

export async function logInfo(message: string) {
  const timestamp = new Date().toISOString();
  const log = `[INFO] ${timestamp} - ${message}\n`;
  console.log(log);
  if (LOG_FILE_URI && typeof FileSystem.appendStringAsync === 'function') {
    try {
      await FileSystem.appendStringAsync(LOG_FILE_URI, log);
    } catch (e) {
      console.warn('Failed to write logInfo to file', e);
    }
  }
}

export async function logError(message: string) {
  const timestamp = new Date().toISOString();
  const log = `[ERROR] ${timestamp} - ${message}\n`;
  console.error(log);
  if (LOG_FILE_URI && typeof FileSystem.appendStringAsync === 'function') {
    try {
      await FileSystem.appendStringAsync(LOG_FILE_URI, log);
    } catch (e) {
      console.warn('Failed to write logError to file', e);
    }
  }
}

export async function logDebug(message: string) {
  const timestamp = new Date().toISOString();
  const log = `[DEBUG] ${timestamp} - ${message}\n`;
  console.debug(log);
  if (LOG_FILE_URI && typeof FileSystem.appendStringAsync === 'function') {
    try {
      await FileSystem.appendStringAsync(LOG_FILE_URI, log);
    } catch (e) {
      console.warn('Failed to write logDebug to file', e);
    }
  }
}

