const DB_NAME = 'cartima-e2ee';
const DB_VERSION = 1;
const STORE_NAME = 'device_keys';

type Platform = 'web';

export interface SerializedDeviceKeyPair {
  deviceId: string;
  platform: Platform;
  keyVersion: 'e2ee_v1';
  algorithm: 'ECDH-P256';
  publicKey: string;
  privateKey: string;
  createdAt: string;
}

const ensureSubtle = (): SubtleCrypto => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto SubtleCrypto no disponible en este navegador');
  }
  return subtle;
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const openDb = async (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'deviceId' });
    }
  };
});

const putRecord = async (record: SerializedDeviceKeyPair): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

const getRecord = async (deviceId: string): Promise<SerializedDeviceKeyPair | null> => {
  const db = await openDb();
  const result = await new Promise<SerializedDeviceKeyPair | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(deviceId);
    request.onsuccess = () => resolve((request.result as SerializedDeviceKeyPair | undefined) || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
};

const deleteRecord = async (deviceId: string): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(deviceId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

const clearStore = async (): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

export const webKeyManager = {
  async generateSerializedDeviceKeyPair(deviceId: string): Promise<SerializedDeviceKeyPair> {
    const subtle = ensureSubtle();

    const keyPair = await subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveBits', 'deriveKey']
    );

    const [publicKeyBuffer, privateKeyBuffer] = await Promise.all([
      subtle.exportKey('spki', keyPair.publicKey),
      subtle.exportKey('pkcs8', keyPair.privateKey)
    ]);

    return {
      deviceId,
      platform: 'web',
      keyVersion: 'e2ee_v1',
      algorithm: 'ECDH-P256',
      publicKey: bufferToBase64(publicKeyBuffer),
      privateKey: bufferToBase64(privateKeyBuffer),
      createdAt: new Date().toISOString()
    };
  },

  async saveDeviceKeyPair(record: SerializedDeviceKeyPair): Promise<void> {
    await putRecord(record);
  },

  async getDeviceKeyPair(deviceId: string): Promise<SerializedDeviceKeyPair | null> {
    return getRecord(deviceId);
  },

  async removeDeviceKeyPair(deviceId: string): Promise<void> {
    await deleteRecord(deviceId);
  },

  async clearAllDeviceKeys(): Promise<void> {
    await clearStore();
  }
};
