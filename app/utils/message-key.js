import { sha1 } from '@noble/hashes/legacy.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

/**
 * Stable identity for a message, used for list keys and scroll anchoring.
 *
 * Messages that come from a transport with real ids use them. Older archive
 * messages (e.g. remoteStorage IRC logs) have no id, so we derive one from the
 * timestamp plus a hash of the author and content.
 *
 * Note: two byte-identical messages in the same timestamp tick will produce the
 * same key and are treated as duplicates when added (`BaseChannel.addMessage`).
 * That is intentional; distinguishing such messages is not a supported feature.
 */
export function messageKey (message) {
  if (message.id) return String(message.id);

  const timestamp = message.date ? new Date(message.date).getTime() : 0;
  const identity = `${message.nickname ?? ''}\u0000${message.content ?? ''}`;
  const hash = bytesToHex(sha1(utf8ToBytes(identity))).slice(0, 10);

  return `${timestamp}-${hash}`;
}

export function dateHeadlineKey (date) {
  return `date-${new Date(date).getTime()}`;
}
