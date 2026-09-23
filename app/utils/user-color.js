import { sha1 } from '@noble/hashes/legacy.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import hsluv from 'hsluv';

const { hsluvToRgb } = hsluv;

/**
 * Generates a consistent color for an identifier (e.g. a nickname) according
 * to XEP-0392. The identifier's SHA-1 hash is used to derive a hue angle in the
 * HSLuv color space, which is then converted to an sRGB color.
 *
 * @param {string} identifier
 * @returns {string} CSS `rgb()` color
 */
export default function userColor (identifier) {
  const hash = bytesToHex(sha1(utf8ToBytes(identifier)));
  const first16Bits = hash.slice(0, 4);
  const littleEndian = first16Bits.slice(2) + first16Bits.slice(0, 2);
  const angle = parseInt(littleEndian, 16) / 65536 * 360;
  const [r, g, b] = hsluvToRgb([angle, 100, 50]);

  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}
