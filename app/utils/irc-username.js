const IRC_ROLES = {
  '@': 'op',
  '%': 'half-op',
  '+': 'voice',
};

export function ircRole (username) {
  if (!username) return 'normal';
  return IRC_ROLES[username[0]] || 'normal';
}

export function stripIrcRolePrefix (username) {
  if (!username) return null;
  if (IRC_ROLES[username[0]]) {
    return username.slice(1);
  }
  return username;
}
