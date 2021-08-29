import IrcAccount from 'hyperchannel/models/account/irc';
import XmppAccount from 'hyperchannel/models/account/xmpp';

export const ircAccount = new IrcAccount({
  nickname: 'jimmy',
  server: { hostname: 'irc.libera.chat' }
});

export const xmppAccount = new XmppAccount({
  nickname: 'jimmy',
  username: 'jimmy@kosmos.org'
});
