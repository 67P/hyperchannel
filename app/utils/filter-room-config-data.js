export const HIDDEN_ROOM_CONFIG_KEYS = ['roomname'];

/**
 * Removes configuration keys that shouldn't be user-editable from an XMPP room
 * configuration object. Returns `null` if there is nothing left to show.
 *
 * @param {object|undefined} configData
 * @param {string[]} hiddenKeys
 * @returns {object|null}
 */
export default function filterRoomConfigData (configData, hiddenKeys = HIDDEN_ROOM_CONFIG_KEYS) {
  if (!configData) {
    return null;
  }

  const filtered = {};
  let hasKeys = false;
  for (const [key, value] of Object.entries(configData)) {
    if (!hiddenKeys.includes(key)) {
      filtered[key] = value;
      hasKeys = true;
    }
  }
  return hasKeys ? filtered : null;
}
