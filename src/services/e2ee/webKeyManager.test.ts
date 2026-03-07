import { beforeEach, describe, expect, it, vi } from 'vitest';

import { webKeyManager } from './webKeyManager';

describe('webKeyManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates serialized key pair with expected metadata and base64 payloads', async () => {
    const generateKey = vi.fn(async () => ({
      publicKey: { kind: 'public' },
      privateKey: { kind: 'private' },
    }));

    const exportKey = vi
      .fn()
      .mockResolvedValueOnce(new Uint8Array([65, 66, 67]).buffer)
      .mockResolvedValueOnce(new Uint8Array([68, 69, 70]).buffer);

    vi.stubGlobal('crypto', {
      subtle: {
        generateKey,
        exportKey,
      },
    });

    const record = await webKeyManager.generateSerializedDeviceKeyPair('web-device-1');

    expect(generateKey).toHaveBeenCalledWith(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits', 'deriveKey']
    );
    expect(exportKey).toHaveBeenNthCalledWith(1, 'spki', { kind: 'public' });
    expect(exportKey).toHaveBeenNthCalledWith(2, 'pkcs8', { kind: 'private' });

    expect(record).toMatchObject({
      deviceId: 'web-device-1',
      platform: 'web',
      keyVersion: 'e2ee_v1',
      algorithm: 'ECDH-P256',
      publicKey: 'QUJD',
      privateKey: 'REVG',
    });
    expect(new Date(record.createdAt).toString()).not.toBe('Invalid Date');
  });

  it('throws a clear error when SubtleCrypto is unavailable', async () => {
    vi.stubGlobal('crypto', undefined);

    await expect(
      webKeyManager.generateSerializedDeviceKeyPair('web-device-2')
    ).rejects.toThrow('WebCrypto SubtleCrypto no disponible en este navegador');
  });
});
