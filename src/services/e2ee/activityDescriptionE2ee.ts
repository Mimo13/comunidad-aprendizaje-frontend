import { ActivityWithEnrollments } from '@/types';
import { e2eeService } from '@/services/api';
import { e2eeDeviceLifecycle } from './deviceLifecycle';
import { webKeyManager } from './webKeyManager';

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();
const ENVELOPE_PREFIX = 'e2ee_v1:';
const CONTENT_TYPE = 'activity_description';
const WRAP_ALG = 'ecdh_aesgcm_v1';

type EncryptedDescriptionEnvelope = {
  v: 'e2ee_v1';
  alg: 'AES-GCM';
  iv: string;
  ciphertext: string;
};

type WrappedDekPayload = {
  v: 'e2ee_v1';
  senderDeviceId: string;
  senderPublicKey: string;
  iv: string;
  ciphertext: string;
};

type WrappedKeyToUpload = {
  deviceId: string;
  wrappedDek: string;
  wrapAlg: string;
};

type PreparedEncryptedDescription = {
  encryptedDescription: string;
  wrappedKeys: WrappedKeyToUpload[];
};

const plaintextCache = new Map<string, string>();

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const importPublicEcdhKey = async (publicKeyBase64: string): Promise<CryptoKey> => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto no disponible');
  }

  return subtle.importKey(
    'spki',
    toArrayBuffer(base64ToBytes(publicKeyBase64)),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
};

const importPrivateEcdhKey = async (privateKeyBase64: string): Promise<CryptoKey> => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto no disponible');
  }

  return subtle.importKey(
    'pkcs8',
    toArrayBuffer(base64ToBytes(privateKeyBase64)),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );
};

const deriveWrapKey = async (privateKeyBase64: string, publicKeyBase64: string): Promise<CryptoKey> => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto no disponible');
  }

  const [privateKey, publicKey] = await Promise.all([
    importPrivateEcdhKey(privateKeyBase64),
    importPublicEcdhKey(publicKeyBase64),
  ]);

  const sharedBits = await subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    256
  );

  const digest = await subtle.digest('SHA-256', sharedBits);
  return subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

const encryptWithAesGcm = async (key: CryptoKey, plaintext: Uint8Array): Promise<{ iv: string; ciphertext: string }> => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto no disponible');
  }

  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    toArrayBuffer(plaintext)
  );

  return {
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(encrypted),
  };
};

const decryptWithAesGcm = async (key: CryptoKey, ivBase64: string, ciphertextBase64: string): Promise<Uint8Array> => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto no disponible');
  }

  const decrypted = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(base64ToBytes(ivBase64)),
    },
    key,
    toArrayBuffer(base64ToBytes(ciphertextBase64))
  );

  return new Uint8Array(decrypted);
};

const isEncryptedEnvelope = (value?: string): boolean => typeof value === 'string' && value.startsWith(ENVELOPE_PREFIX);

const parseEnvelope = (value: string): EncryptedDescriptionEnvelope | null => {
  if (!isEncryptedEnvelope(value)) {
    return null;
  }

  try {
    return JSON.parse(value.slice(ENVELOPE_PREFIX.length)) as EncryptedDescriptionEnvelope;
  } catch {
    return null;
  }
};

const wrapDekForDevice = async (
  senderDeviceId: string,
  senderPublicKey: string,
  senderPrivateKey: string,
  targetDeviceId: string,
  targetPublicKey: string,
  dekRaw: ArrayBuffer
): Promise<WrappedKeyToUpload> => {
  const wrapKey = await deriveWrapKey(senderPrivateKey, targetPublicKey);
  const encryptedDek = await encryptWithAesGcm(wrapKey, new Uint8Array(dekRaw));

  const payload: WrappedDekPayload = {
    v: 'e2ee_v1',
    senderDeviceId,
    senderPublicKey,
    iv: encryptedDek.iv,
    ciphertext: encryptedDek.ciphertext,
  };

  return {
    deviceId: targetDeviceId,
    wrappedDek: bufferToBase64(TEXT_ENCODER.encode(JSON.stringify(payload)).buffer),
    wrapAlg: WRAP_ALG,
  };
};

const unwrapDekForCurrentDevice = async (
  wrappedDek: string,
  currentDevicePrivateKey: string
): Promise<ArrayBuffer> => {
  const payloadText = TEXT_DECODER.decode(base64ToBytes(wrappedDek));
  const payload = JSON.parse(payloadText) as WrappedDekPayload;

  if (payload.v !== 'e2ee_v1') {
    throw new Error('Version de wrapped key no soportada');
  }

  const wrapKey = await deriveWrapKey(currentDevicePrivateKey, payload.senderPublicKey);
  const dekRaw = await decryptWithAesGcm(wrapKey, payload.iv, payload.ciphertext);
  return toArrayBuffer(dekRaw);
};

export const activityDescriptionE2ee = {
  isEncryptedEnvelope,

  async prepareEncryptedDescription(plaintext?: string): Promise<PreparedEncryptedDescription | null> {
    const trimmed = plaintext?.trim();
    if (!trimmed) {
      return null;
    }

    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      throw new Error('WebCrypto no disponible');
    }

    const currentDeviceId = await e2eeDeviceLifecycle.registerCurrentDevice('Web Browser');
    const currentKeys = await webKeyManager.getDeviceKeyPair(currentDeviceId);
    if (!currentKeys) {
      throw new Error('No se encontraron claves del dispositivo actual');
    }

    const publicKeysResponse = await e2eeService.getPublicKeys();
    const recipientDevices = publicKeysResponse.data || [];
    if (recipientDevices.length === 0) {
      throw new Error('No hay dispositivos activos para envolver la clave de contenido');
    }

    const contentKey = await subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    const [dekRaw, encryptedPayload] = await Promise.all([
      subtle.exportKey('raw', contentKey),
      encryptWithAesGcm(contentKey, TEXT_ENCODER.encode(trimmed)),
    ]);

    const envelope: EncryptedDescriptionEnvelope = {
      v: 'e2ee_v1',
      alg: 'AES-GCM',
      iv: encryptedPayload.iv,
      ciphertext: encryptedPayload.ciphertext,
    };

    const wrappedKeys = await Promise.all(
      recipientDevices.map((device) =>
        wrapDekForDevice(
          currentDeviceId,
          currentKeys.publicKey,
          currentKeys.privateKey,
          device.deviceId,
          device.publicKey,
          dekRaw
        )
      )
    );

    return {
      encryptedDescription: `${ENVELOPE_PREFIX}${JSON.stringify(envelope)}`,
      wrappedKeys,
    };
  },

  async syncWrappedKeys(contentId: string, wrappedKeys: WrappedKeyToUpload[]): Promise<void> {
    if (!wrappedKeys.length) {
      return;
    }

    await e2eeService.upsertContentKeys({
      contentType: CONTENT_TYPE,
      contentId,
      keyVersion: 'e2ee_v1',
      wrappedKeys,
    });
  },

  async decryptDescriptionForActivity(activity: ActivityWithEnrollments): Promise<string | undefined> {
    const rawDescription = activity.description;
    if (!rawDescription) {
      return rawDescription;
    }

    if (!isEncryptedEnvelope(rawDescription)) {
      return rawDescription;
    }

    const cacheKey = `${activity.id}:${activity.updatedAt}`;
    const cached = plaintextCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const envelope = parseEnvelope(rawDescription);
    if (!envelope || envelope.v !== 'e2ee_v1') {
      return '[Contenido cifrado no disponible]';
    }

    try {
      const currentDeviceId = e2eeDeviceLifecycle.getOrCreateDeviceId();
      const currentKeys = await webKeyManager.getDeviceKeyPair(currentDeviceId);
      if (!currentKeys) {
        return '[Contenido cifrado: registra este dispositivo para descifrar]';
      }

      const wrappedResponse = await e2eeService.getWrappedKey(CONTENT_TYPE, activity.id, currentDeviceId);
      const wrapped = wrappedResponse.data;
      if (!wrapped?.wrappedDek) {
        return '[Contenido cifrado no disponible en este dispositivo]';
      }

      const dekRaw = await unwrapDekForCurrentDevice(wrapped.wrappedDek, currentKeys.privateKey);
      const subtle = globalThis.crypto?.subtle;
      if (!subtle) {
        return '[WebCrypto no disponible para descifrado]';
      }

      const contentKey = await subtle.importKey('raw', dekRaw, { name: 'AES-GCM' }, false, ['decrypt']);
      const clearBytes = await decryptWithAesGcm(contentKey, envelope.iv, envelope.ciphertext);
      const plaintext = TEXT_DECODER.decode(clearBytes);
      plaintextCache.set(cacheKey, plaintext);
      return plaintext;
    } catch {
      return '[Contenido cifrado no disponible en este dispositivo]';
    }
  },

  async decryptActivities(activities: ActivityWithEnrollments[]): Promise<ActivityWithEnrollments[]> {
    const decrypted = await Promise.all(
      activities.map(async (activity) => ({
        ...activity,
        description: await this.decryptDescriptionForActivity(activity),
      }))
    );

    return decrypted;
  },
};
