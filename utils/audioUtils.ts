// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

/**
 * Encodes a Uint8Array into a Base64 string.
 * This implementation avoids external libraries and is required for Gemini Live API.
 * @param bytes The byte array to encode.
 * @returns The Base64 encoded string.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string into a Uint8Array.
 * This implementation avoids external libraries and is required for Gemini Live API.
 * @param base64 The Base64 string to decode.
 * @returns The decoded byte array.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 * The browser's native `decodeAudioData` is for file formats (like MP3), not raw streams.
 * This manual implementation is required for Gemini Live API.
 * @param data The raw PCM audio data as a Uint8Array.
 * @param ctx The AudioContext for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for Gemini output).
 * @param numChannels The number of audio channels (typically 1).
 * @returns A promise that resolves with the decoded AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The data from Gemini is 16-bit PCM, so we need to interpret it as Int16Array.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert the 16-bit integer sample back to a floating-point value between -1.0 and 1.0.
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
