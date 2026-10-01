import { sha1 } from '@noble/hashes/legacy.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

/**
 * Stable identity for a message, used for list keys and scroll anchoring.
 *
 * - A server-assigned stanza id (`sid`) is unique within a room, so it is used
 *   as-is.
 * - Other transport ids (e.g. XMPP stanza `id`s) are sender/stream scoped, so
 *   they are combined with the author. Otherwise two senders using the same id
 *   would collapse into one when `BaseChannel.addMessage` dedupes channel-wide.
 * - Older archive messages (e.g. remoteStorage IRC logs) have no id, so one is
 *   derived from the timestamp plus a hash of the author and content.
 *
 * Note: two byte-identical messages in the same timestamp tick will produce the
 * same key and are treated as duplicates when added (`BaseChannel.addMessage`).
 * That is intentional; distinguishing such messages is not a supported feature.
 */
export function messageKey (message) {
  if (message.sid) return `sid:${message.sid}`;
  if (message.id) return `${message.nickname ?? ''}\u0000${message.id}`;

  const timestamp = message.date ? new Date(message.date).getTime() : 0;
  const identity = `${message.nickname ?? ''}\u0000${message.content ?? ''}`;
  const hash = bytesToHex(sha1(utf8ToBytes(identity))).slice(0, 10);

  return `${timestamp}-${hash}`;
}

export function dateHeadlineKey (date) {
  return `date-${new Date(date).getTime()}`;
}
