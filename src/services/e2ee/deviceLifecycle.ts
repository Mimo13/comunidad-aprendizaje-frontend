import { e2eeService } from '@/services/api';
import { webKeyManager } from './webKeyManager';

const DEVICE_ID_KEY = 'e2ee.device_id';

const getOrCreateDeviceId = (): string => {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated = globalThis.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
};

export const e2eeDeviceLifecycle = {
  getOrCreateDeviceId,

  async registerCurrentDevice(deviceName = 'Web Browser'): Promise<string> {
    const deviceId = getOrCreateDeviceId();

    let keys = await webKeyManager.getDeviceKeyPair(deviceId);
    if (!keys) {
      keys = await webKeyManager.generateSerializedDeviceKeyPair(deviceId);
      await webKeyManager.saveDeviceKeyPair(keys);
    }

    await e2eeService.registerDevice({
      deviceId,
      platform: 'web',
      deviceName,
      publicKey: keys.publicKey,
      keyVersion: keys.keyVersion,
    });

    return deviceId;
  },

  async revokeDeviceAndClearLocalMaterial(deviceId?: string): Promise<void> {
    const resolvedDeviceId = deviceId || localStorage.getItem(DEVICE_ID_KEY);
    if (!resolvedDeviceId) {
      return;
    }

    await e2eeService.revokeDevice(resolvedDeviceId);
    await webKeyManager.removeDeviceKeyPair(resolvedDeviceId);
    localStorage.removeItem(DEVICE_ID_KEY);
  },
};
