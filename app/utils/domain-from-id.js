export default function domainFromId (id) {
  const str = String(id ?? '');
  const at = str.lastIndexOf('@');
  if (at < 0) { return undefined; }
  // Take the part after the final '@' first: for IRC, slashes belong to the
  // channel name (e.g. '#foo/bar@irc.libera.chat'), while an XMPP resource
  // suffix follows the domain (e.g. 'kosmos-dev@kosmos.chat/jimmy').
  return str.slice(at + 1).split('/')[0];
}