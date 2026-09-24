/**
 * Builds the slug used to open a direct message (user channel) with `username`
 * from within `channel`.
 *
 * For IRC the username and network hostname are combined into a
 * `nickname@hostname` id; for XMPP the resource (username) is appended to the
 * room JID with a literal slash, which the router encodes for the URL.
 *
 * @param {Object} channel
 * @param {string} username
 * @returns {string}
 */
export default function userChannelId (channel, username) {
  switch (channel.protocol) {
    case 'IRC':
      return `${username}@${channel.domain}`;
    case 'XMPP':
      return `${channel.id}/${username}`;
  }
}
