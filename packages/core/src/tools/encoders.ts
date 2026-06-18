import type { TransformTool } from '../types';

/** UTF-8 safe base64 encode (btoa only handles latin1, so go via bytes). */
function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(input: string): string {
  const binary = atob(input.trim());
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const base64Encode: TransformTool = {
  id: 'base64-encode',
  name: 'Base64 Encode',
  category: 'encode',
  description: 'Encode text to Base64 (UTF-8 safe).',
  keywords: ['base64', 'b64', 'encode', 'btoa'],
  sample: 'Hello, Bytesmith — 🔨',
  run(input) {
    if (!input) return { output: '' };
    try {
      return { output: toBase64(input) };
    } catch (e) {
      return { output: '', error: (e as Error).message };
    }
  },
};

export const base64Decode: TransformTool = {
  id: 'base64-decode',
  name: 'Base64 Decode',
  category: 'encode',
  description: 'Decode Base64 back to UTF-8 text.',
  keywords: ['base64', 'b64', 'decode', 'atob'],
  sample: 'SGVsbG8sIEJ5dGVzbWl0aCDigJQg8J+UqA==',
  run(input) {
    if (!input.trim()) return { output: '' };
    try {
      return { output: fromBase64(input) };
    } catch {
      return { output: '', error: 'Input is not valid Base64.' };
    }
  },
};

export const urlEncode: TransformTool = {
  id: 'url-encode',
  name: 'URL Encode',
  category: 'encode',
  description: 'Percent-encode text for safe use in URLs.',
  keywords: ['url', 'uri', 'encode', 'percent', 'escape', 'encodeuricomponent'],
  sample: 'name=byte smith&tag=a/b?c',
  run(input) {
    if (!input) return { output: '' };
    return { output: encodeURIComponent(input) };
  },
};

export const urlDecode: TransformTool = {
  id: 'url-decode',
  name: 'URL Decode',
  category: 'encode',
  description: 'Decode percent-encoded URL text.',
  keywords: ['url', 'uri', 'decode', 'percent', 'unescape', 'decodeuricomponent'],
  sample: 'name%3Dbyte%20smith%26tag%3Da%2Fb%3Fc',
  run(input) {
    if (!input) return { output: '' };
    try {
      return { output: decodeURIComponent(input) };
    } catch {
      return { output: '', error: 'Input contains invalid percent-encoding.' };
    }
  },
};
